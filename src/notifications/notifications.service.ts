import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../gateway/app.gateway';

interface CreateNotificationDto {
  userId: string;
  actorId?: string;
  type: string;
  title: string;
  message?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
}

interface FindByUserOptions {
  page?: number;
  limit?: number;
  filter?: string;
  search?: string;
  type?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
  ) {}

  async create(data: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        title: data.title,
        message: data.message,
        projectId: data.projectId,
        metadata: data.metadata as any,
      },
    });

    const count = await this.unreadCount(data.userId);

    this.gateway.notifyUser(data.userId, 'notification:new', notification);
    this.gateway.notifyUser(data.userId, 'notification:count-updated', { count });

    return notification;
  }

  async findByUser(userId: string, opts: FindByUserOptions = {}) {
    const { page = 1, limit = 20, filter, search, type } = opts;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (filter === 'unread') {
      where.read = false;
    } else if (filter === 'read') {
      where.read = true;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { message: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });

    const count = await this.unreadCount(userId);

    this.gateway.notifyUser(userId, 'notification:read', {
      notificationId,
      count,
    });
    this.gateway.notifyUser(userId, 'notification:count-updated', { count });

    return result;
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    const count = await this.unreadCount(userId);

    this.gateway.notifyUser(userId, 'notification:read-all', { count });
    this.gateway.notifyUser(userId, 'notification:count-updated', { count });

    return result;
  }

  async delete(userId: string, notificationId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });

    const count = await this.unreadCount(userId);

    this.gateway.notifyUser(userId, 'notification:deleted', {
      notificationId,
      count,
    });
    this.gateway.notifyUser(userId, 'notification:count-updated', { count });

    return result;
  }
}
