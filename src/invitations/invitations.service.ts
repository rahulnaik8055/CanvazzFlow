import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../gateway/app.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
    private notifications: NotificationsService,
  ) {}

  async inviteByEmail(projectId: string, invitedById: string, email: string, role: string, message?: string, expiresInHours = 48) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, ownerId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== invitedById) {
      const membership = await this.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: invitedById } },
      });
      if (!membership || membership.role !== 'owner') {
        throw new ForbiddenException('Only the project owner can invite');
      }
    }

    const existingMember = await this.prisma.projectMember.findFirst({
      where: { projectId, user: { email } },
    });
    if (existingMember) throw new ConflictException('User is already a member');

    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    const existing = await this.prisma.projectInvitation.findFirst({
      where: { projectId, email, status: 'pending' },
    });
    if (existing) throw new ConflictException('An active invitation already exists for this email');

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const token = crypto.randomBytes(32).toString('hex');

    const invitation = await this.prisma.projectInvitation.create({
      data: {
        projectId,
        invitedById,
        email,
        userId: existingUser?.id,
        token,
        status: 'pending',
        expiresAt,
        message,
        role: role as any,
      },
      include: {
        project: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return invitation;
  }

  async inviteByUser(projectId: string, invitedById: string, userId: string, role: string, message?: string, expiresInHours = 48) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, ownerId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== invitedById) {
      const membership = await this.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: invitedById } },
      });
      if (!membership || membership.role !== 'owner') {
        throw new ForbiddenException('Only the project owner can invite');
      }
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existingMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existingMember) throw new ConflictException('User is already a member');

    const existing = await this.prisma.projectInvitation.findFirst({
      where: { projectId, userId, status: 'pending' },
    });
    if (existing) throw new ConflictException('An active invitation already exists for this user');

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const token = crypto.randomBytes(32).toString('hex');

    const invitation = await this.prisma.projectInvitation.create({
      data: {
        projectId,
        invitedById,
        userId,
        email: user.email,
        token,
        status: 'pending',
        expiresAt,
        message,
        role: role as any,
      },
      include: {
        project: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
      },
    });

    this.gateway.notifyUser(userId, 'project-invitation', {
      invitationId: invitation.id,
      projectId: project.id,
      projectName: project.name,
      token,
    });
    this.notifications.create({
      userId,
      type: 'project_invitation',
      title: 'Project Invitation',
      message: `You've been invited to join "${project.name}"`,
      projectId: project.id,
    });

    return invitation;
  }

  async generateLink(projectId: string, userId: string, role: string, oneTime: boolean, expiresInHours = 48) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, ownerId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can generate invite links');
    }

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const token = crypto.randomBytes(32).toString('hex');

    const invitation = await this.prisma.projectInvitation.create({
      data: {
        projectId,
        invitedById: userId,
        token,
        status: 'pending',
        expiresAt,
        role: role as any,
        oneTime,
      },
    });

    return invitation;
  }

  async getByToken(token: string) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { token },
      include: {
        project: { select: { id: true, name: true, description: true, thumbnail: true, visibility: true } },
        invitedBy: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
      },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    if (invitation.status === 'expired' || (invitation.expiresAt < new Date() && invitation.status === 'pending')) {
      if (invitation.status === 'pending') {
        await this.prisma.projectInvitation.update({
          where: { id: invitation.id },
          data: { status: 'expired' },
        });
      }
      throw new BadRequestException('Invitation has expired');
    }
    if (invitation.status === 'cancelled') throw new BadRequestException('Invitation was cancelled');
    if (invitation.status === 'accepted') throw new BadRequestException('Invitation already accepted');

    return invitation;
  }

  async accept(token: string, currentUserId: string) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { token },
      include: { project: { select: { id: true, name: true, ownerId: true } } },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== 'pending') throw new BadRequestException('Invitation is no longer valid');
    if (invitation.expiresAt < new Date()) {
      await this.prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    if (invitation.email) {
      const user = await this.prisma.user.findUnique({ where: { id: currentUserId } });
      if (user?.email !== invitation.email) {
        throw new ForbiddenException('This invitation was sent to a different email address');
      }
    }

    const existingMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: invitation.projectId, userId: currentUserId } },
    });
    if (existingMember) throw new ConflictException('You are already a member of this project');

    await this.prisma.$transaction(async (tx) => {
      await tx.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId: currentUserId,
          role: invitation.role,
        },
      });
      await tx.projectInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'accepted',
          userId: currentUserId,
        },
      });
    });

    this.gateway.notifyUser(invitation.project.ownerId, 'invitation-accepted', {
      projectId: invitation.projectId,
      projectName: invitation.project.name,
      userId: currentUserId,
    });

    return { ok: true, projectId: invitation.projectId, projectName: invitation.project.name };
  }

  async cancel(invitationId: string, userId: string) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      include: { project: { select: { ownerId: true } } },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.project.ownerId !== userId) throw new ForbiddenException('Only the project owner can cancel invitations');
    if (invitation.status !== 'pending') throw new BadRequestException('Invitation is no longer pending');

    await this.prisma.projectInvitation.update({
      where: { id: invitationId },
      data: { status: 'cancelled' },
    });

    return { ok: true };
  }

  async resend(invitationId: string, userId: string) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      include: { project: { select: { id: true, name: true, ownerId: true } } },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.project.ownerId !== userId) throw new ForbiddenException('Only the project owner can resend invitations');
    if (invitation.status !== 'pending') throw new BadRequestException('Invitation is no longer pending');

    if (invitation.expiresAt < new Date()) {
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await this.prisma.projectInvitation.update({
        where: { id: invitationId },
        data: { expiresAt },
      });
    }

    if (invitation.userId) {
      this.gateway.notifyUser(invitation.userId, 'project-invitation', {
        invitationId: invitation.id,
        projectId: invitation.project.id,
        projectName: invitation.project.name,
        token: invitation.token,
      });
      this.notifications.create({
        userId: invitation.userId,
        type: 'project_invitation',
        title: 'Project Invitation',
        message: `You've been re-invited to join "${invitation.project.name}"`,
        projectId: invitation.project.id,
      });
    }

    return { ok: true };
  }

  async listForProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can view invitations');
    }

    return this.prisma.projectInvitation.findMany({
      where: { projectId },
      include: {
        invitedBy: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMyPending(userId: string) {
    return this.prisma.projectInvitation.findMany({
      where: {
        userId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      include: {
        project: { select: { id: true, name: true, description: true, thumbnail: true } },
        invitedBy: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listByEmail(email: string) {
    return this.prisma.projectInvitation.findMany({
      where: {
        email,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      include: {
        project: { select: { id: true, name: true, description: true, thumbnail: true } },
        invitedBy: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
