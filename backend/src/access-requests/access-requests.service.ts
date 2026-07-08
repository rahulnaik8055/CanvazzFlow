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

type ReqStatus = 'pending' | 'approved' | 'denied' | 'cancelled';

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

    await this.logEvent(request.id, null, 'pending', userId);

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
      actorId: userId,
      type: 'access_request',
      title: 'New Access Request',
      message: `${requestorName} requested access to "${project.name}"`,
      projectId: project.id,
      metadata: { requestId: request.id, requestorName },
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

    const toStatus: ReqStatus = approved ? 'approved' : 'denied';

    await this.prisma.$transaction(async (tx) => {
      await tx.accessRequest.update({
        where: { id: requestId },
        data: { status: toStatus },
      });
      await tx.accessRequestEvent.create({
        data: {
          accessRequestId: requestId,
          fromStatus: 'pending',
          toStatus,
          changedById: ownerId,
        },
      });
      if (approved) {
        const existing = await tx.projectMember.findUnique({
          where: { projectId_userId: { projectId: request.projectId, userId: request.userId } },
        });
        if (!existing) {
          await tx.projectMember.create({
            data: {
              projectId: request.projectId,
              userId: request.userId,
              role: 'editor',
            },
          });
        }
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
      actorId: ownerId,
      type: approved ? 'access_request_approved' : 'access_request_denied',
      title: approved ? 'Access Approved' : 'Access Denied',
      message: `Your request to join "${request.project.name}" was ${approved ? 'approved' : 'denied'}`,
      projectId: request.projectId,
      metadata: { requestId: request.id, approved },
    });

    return { ok: true };
  }

  async respondWithReason(
    requestId: string,
    ownerId: string,
    approved: boolean,
    reason?: string,
  ) {
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

    const toStatus: ReqStatus = approved ? 'approved' : 'denied';

    await this.prisma.$transaction(async (tx) => {
      await tx.accessRequest.update({
        where: { id: requestId },
        data: { status: toStatus },
      });
      await tx.accessRequestEvent.create({
        data: {
          accessRequestId: requestId,
          fromStatus: 'pending',
          toStatus,
          changedById: ownerId,
          reason,
        },
      });
      if (approved) {
        const existing = await tx.projectMember.findUnique({
          where: { projectId_userId: { projectId: request.projectId, userId: request.userId } },
        });
        if (!existing) {
          await tx.projectMember.create({
            data: {
              projectId: request.projectId,
              userId: request.userId,
              role: 'editor',
            },
          });
        }
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

  async cancel(userId: string, requestId: string) {
    const request = await this.prisma.accessRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.userId !== userId) throw new ForbiddenException('Not your request');
    if (request.status !== 'pending') throw new BadRequestException('Request already resolved');

    await this.prisma.$transaction(async (tx) => {
      await tx.accessRequest.update({
        where: { id: requestId },
        data: { status: 'cancelled' },
      });
      await tx.accessRequestEvent.create({
        data: {
          accessRequestId: requestId,
          fromStatus: 'pending',
          toStatus: 'cancelled',
          changedById: userId,
        },
      });
    });

    return { ok: true };
  }

  async bulkRespond(ownerId: string, ids: string[], approved: boolean) {
    const requests = await this.prisma.accessRequest.findMany({
      where: { id: { in: ids } },
      include: { project: { select: { id: true, ownerId: true } } },
    });

    if (requests.some((r) => r.project.ownerId !== ownerId)) {
      throw new ForbiddenException('Not authorized to respond to some requests');
    }
    if (requests.some((r) => r.status !== 'pending')) {
      throw new BadRequestException('Some requests are already resolved');
    }

    const toStatus: ReqStatus = approved ? 'approved' : 'denied';

    await this.prisma.$transaction(async (tx) => {
      await tx.accessRequest.updateMany({
        where: { id: { in: ids } },
        data: { status: toStatus },
      });
      await tx.accessRequestEvent.createMany({
        data: requests.map((r) => ({
          accessRequestId: r.id,
          fromStatus: 'pending' as const,
          toStatus,
          changedById: ownerId,
        })),
      });
      if (approved) {
        for (const r of requests) {
          const existing = await tx.projectMember.findUnique({
            where: { projectId_userId: { projectId: r.projectId, userId: r.userId } },
          });
          if (!existing) {
            await tx.projectMember.create({
              data: {
                projectId: r.projectId,
                userId: r.userId,
                role: 'editor',
              },
            });
          }
        }
      }
    });

    return { ok: true, count: ids.length };
  }

  async findAll(
    ownerId: string,
    params: {
      status?: string;
      search?: string;
      sort?: string;
      order?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    },
  ) {
    const { status, search, sort = 'createdAt', order = 'desc', page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      project: { ownerId },
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { project: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = {};
    if (sort === 'project') orderBy.project = { name: order };
    else if (sort === 'user') orderBy.user = { firstName: order };
    else orderBy[sort] = order;

    const [items, total] = await Promise.all([
      this.prisma.accessRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
              createdAt: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              visibility: true,
              _count: { select: { members: true } },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.accessRequest.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(requestId: string, userId: string) {
    const request = await this.prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
            createdAt: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            thumbnail: true,
            visibility: true,
            ownerId: true,
            createdAt: true,
            _count: { select: { members: true, pages: true } },
            User: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          },
        },
        events: {
          orderBy: { createdAt: 'asc' },
          include: {
            changedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!request) throw new NotFoundException('Request not found');
    const isOwner = request.project.ownerId === userId;
    const isRequester = request.userId === userId;
    if (!isOwner && !isRequester) throw new ForbiddenException('Access denied');

    return request;
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
      where: { userId, status: { not: 'cancelled' } },
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

  private async logEvent(
    accessRequestId: string,
    fromStatus: ReqStatus | null,
    toStatus: ReqStatus,
    changedById: string,
    reason?: string,
  ) {
    await this.prisma.accessRequestEvent.create({
      data: { accessRequestId, fromStatus, toStatus, changedById, reason },
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
