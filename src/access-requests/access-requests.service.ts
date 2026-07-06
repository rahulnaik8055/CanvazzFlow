import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../gateway/app.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { MemberRole } from 'generated/prisma/enums';

@Injectable()
export class AccessRequestsService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
    private notifications: NotificationsService,
  ) {}

  async create(userId: string, projectId: string, message?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, ownerId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId === userId)
      throw new ConflictException('You own this project');

    const alreadyMember = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (alreadyMember) throw new ConflictException('Already a member');

    const request = await this.prisma.accessRequest.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: { status: 'pending', message, updatedAt: new Date() },
      create: { projectId, userId, message, status: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        project: { select: { id: true, name: true } },
      },
    });

    const requestorName = this.displayName(request.user);
    this.gateway.notifyUser(project.ownerId, 'access-request', {
      requestId: request.id,
      projectId: project.id,
      projectName: project.name,
      userId: request.user.id,
      userName: requestorName,
      userImage: request.user.imageUrl,
      message: request.message,
    });
    this.notifications.create({
      userId: project.ownerId,
      type: 'access_request',
      title: 'New Access Request',
      message: `${requestorName} requested access to "${project.name}"`,
      projectId: project.id,
    });

    return request;
  }

  async respond(requestId: string, ownerId: string, approved: boolean) {
    const request = await this.prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: {
        project: { select: { id: true, name: true, ownerId: true } },
        user: { select: { id: true } },
      },
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.project.ownerId !== ownerId) {
      throw new ForbiddenException('Only the project owner can respond');
    }
    if (request.status !== 'pending') {
      throw new BadRequestException('Request already resolved');
    }

    const status = approved ? 'approved' : 'denied';

    await this.prisma.$transaction(async (tx) => {
      await tx.accessRequest.update({
        where: { id: requestId },
        data: { status },
      });
      if (approved) {
        await tx.projectMember.create({
          data: {
            projectId: request.projectId,
            userId: request.userId,
            role: MemberRole.editor,
          },
        });
      }
    });

    this.gateway.notifyUser(request.userId, 'access-request-response', {
      requestId,
      projectId: request.projectId,
      projectName: request.project.name,
      approved,
    });
    this.notifications.create({
      userId: request.userId,
      type: approved ? 'access_request_approved' : 'access_request_denied',
      title: approved ? 'Access Approved' : 'Access Denied',
      message: `Your request to join "${request.project.name}" was ${approved ? 'approved' : 'denied'}`,
      projectId: request.projectId,
    });

    return { ok: true };
  }

  async getAllPendingForOwner(ownerId: string) {
    return this.prisma.accessRequest.findMany({
      where: { status: 'pending', project: { ownerId } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingForProject(projectId: string) {
    return this.prisma.accessRequest.findMany({
      where: { projectId, status: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async myRequests(userId: string) {
    return this.prisma.accessRequest.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
            pages: {
              select: { id: true },
              orderBy: { order: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private displayName(u: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  }) {
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
  }
}
