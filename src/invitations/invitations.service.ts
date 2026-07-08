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

  private async assertOwner(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, ownerId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (project.ownerId !== userId && (!membership || membership.role !== 'owner')) {
      throw new ForbiddenException('Only the project owner can perform this action');
    }
    return project;
  }

  async searchUsers(query: string, currentUserId: string, projectId?: string) {
    if (!query || query.trim().length < 2) return [];
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { firstName: { contains: query, mode: 'insensitive' as const } },
          { lastName: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        imageUrl: true,
      },
      take: 10,
    });

    if (projectId) {
      const enriched = await Promise.all(
        users.map(async (user) => {
          const [membership, pendingInvite] = await Promise.all([
            this.prisma.projectMember.findUnique({
              where: { projectId_userId: { projectId, userId: user.id } },
              select: { role: true },
            }),
            this.prisma.projectInvitation.findFirst({
              where: {
                projectId,
                userId: user.id,
                status: { in: ['pending', 'accepted'] },
              },
              select: { status: true },
            }),
          ]);
          return {
            ...user,
            isMember: !!membership,
            memberRole: membership?.role || null,
            hasPendingInvitation: pendingInvite?.status === 'pending' || false,
          };
        }),
      );
      return enriched;
    }

    return users;
  }

  async inviteByEmail(projectId: string, invitedById: string, email: string, role: string, message?: string, expiresInHours = 48) {
    const project = await this.assertOwner(projectId, invitedById);

    const existingMember = await this.prisma.projectMember.findFirst({
      where: { projectId, user: { email } },
    });
    if (existingMember) throw new ConflictException('User is already a member');

    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    const existing = await this.prisma.projectInvitation.findFirst({
      where: {
        projectId, email,
        status: { in: ['pending', 'accepted'] },
      },
    });
    if (existing) {
      if (existing.status === 'accepted') {
        const member = await this.prisma.projectMember.findFirst({
          where: { projectId, user: { email } },
        });
        if (member) throw new ConflictException('User is already a member');
      }
      throw new ConflictException('An active invitation already exists for this email');
    }

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
        invitedBy: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
      },
    });

    if (existingUser?.id) {
      this.gateway.notifyUser(existingUser.id, 'project-invitation', {
        invitationId: invitation.id,
        projectId: project.id,
        projectName: project.name,
        token,
        role,
      });
      this.notifications.create({
        userId: existingUser.id,
        actorId: invitedById,
        type: 'project_invitation',
        title: 'Project Invitation',
        message: `You've been invited to "${project.name}" as ${role}`,
        projectId: project.id,
        metadata: { invitationId: invitation.id, role, expiresAt: expiresAt.toISOString() },
      });
    }

    return invitation;
  }

  async inviteByUser(projectId: string, invitedById: string, userId: string, role: string, message?: string, expiresInHours = 48) {
    const project = await this.assertOwner(projectId, invitedById);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existingMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existingMember) throw new ConflictException('User is already a member');

    const existing = await this.prisma.projectInvitation.findFirst({
      where: {
        projectId, userId,
        status: { in: ['pending', 'accepted'] },
      },
    });
    if (existing) {
      if (existing.status === 'accepted') {
        const member = await this.prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId, userId } },
        });
        if (member) throw new ConflictException('User is already a member');
      }
      throw new ConflictException('An active invitation already exists for this user');
    }

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
        invitedBy: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
      },
    });

    this.gateway.notifyUser(userId, 'project-invitation', {
      invitationId: invitation.id,
      projectId: project.id,
      projectName: project.name,
      token,
      role,
    });

    this.notifications.create({
      userId,
      actorId: invitedById,
      type: 'project_invitation',
      title: 'Project Invitation',
      message: `You've been invited to "${project.name}" as ${role}`,
      projectId: project.id,
      metadata: { invitationId: invitation.id, role, expiresAt: expiresAt.toISOString() },
    });

    return invitation;
  }

  async generateLink(projectId: string, userId: string, role: string, oneTime: boolean, expiresInHours = 48) {
    await this.assertOwner(projectId, userId);

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

  async getByToken(token: string, currentUserId?: string) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { token },
      include: {
        project: {
          select: {
            id: true, name: true, description: true, thumbnail: true, visibility: true,
            ownerId: true,
            User: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
            _count: { select: { members: true } },
          },
        },
        invitedBy: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
      },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    // Auto-expire if past expiry
    if (invitation.expiresAt < new Date() && invitation.status === 'pending') {
      await this.prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      invitation.status = 'expired';
    }

    // Check one-time use
    if (invitation.oneTime && invitation.status !== 'pending') {
      throw new BadRequestException('This one-time link has already been used');
    }

    // Check if already a member
    if (currentUserId) {
      const member = await this.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: invitation.projectId, userId: currentUserId } },
      });
      if (member) {
        throw new ConflictException('You are already a member of this project');
      }
    }

    return invitation;
  }

  async accept(token: string, currentUserId: string) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { token },
      include: { project: { select: { id: true, name: true, ownerId: true } } },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status === 'accepted') throw new BadRequestException('Invitation already accepted');
    if (invitation.status === 'declined') throw new BadRequestException('Invitation was declined');
    if (invitation.status === 'cancelled') throw new BadRequestException('Invitation was cancelled');
    if (invitation.expiresAt < new Date() || invitation.status === 'expired') {
      if (invitation.status === 'pending') {
        await this.prisma.projectInvitation.update({
          where: { id: invitation.id },
          data: { status: 'expired' },
        });
      }
      throw new BadRequestException('Invitation has expired');
    }

    // For one-time links, check if already used
    if (invitation.oneTime && invitation.status !== 'pending') {
      throw new BadRequestException('This one-time link has already been used');
    }

    // Email validation
    if (invitation.email && !invitation.userId) {
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
    this.notifications.create({
      userId: invitation.project.ownerId,
      actorId: currentUserId,
      type: 'invitation_accepted',
      title: 'Invitation Accepted',
      message: `Someone accepted your invitation to "${invitation.project.name}"`,
      projectId: invitation.project.id,
      metadata: { invitationId: invitation.id },
    });

    return { ok: true, projectId: invitation.projectId, projectName: invitation.project.name };
  }

  async decline(token: string, currentUserId: string) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { token },
      include: { project: { select: { id: true, name: true, ownerId: true } } },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== 'pending') throw new BadRequestException('Invitation is no longer pending');
    if (invitation.expiresAt < new Date()) {
      await this.prisma.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    await this.prisma.projectInvitation.update({
      where: { id: invitation.id },
      data: { status: 'declined' },
    });

    this.gateway.notifyUser(invitation.project.ownerId, 'invitation-declined', {
      projectId: invitation.projectId,
      projectName: invitation.project.name,
      userId: currentUserId,
    });
    this.notifications.create({
      userId: invitation.project.ownerId,
      actorId: currentUserId,
      type: 'invitation_declined',
      title: 'Invitation Declined',
      message: `Someone declined your invitation to "${invitation.project.name}"`,
      projectId: invitation.project.id,
      metadata: { invitationId: invitation.id },
    });

    return { ok: true };
  }

  async cancel(invitationId: string, userId: string) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      include: { project: { select: { id: true, name: true, ownerId: true } } },
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
        OR: [
          { userId, status: 'pending', expiresAt: { gt: new Date() } },
          { email: (await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email ?? '', status: 'pending', expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        project: { select: { id: true, name: true, description: true, thumbnail: true } },
        invitedBy: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listSentInvitations(userId: string) {
    return this.prisma.projectInvitation.findMany({
      where: { invitedById: userId },
      include: {
        project: { select: { id: true, name: true, thumbnail: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
        invitedBy: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
