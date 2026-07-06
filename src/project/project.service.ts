import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectVisibility } from 'generated/prisma/enums';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async createProject(
    userId: string,
    dto: { name: string; description?: string; visibility?: ProjectVisibility },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: dto.name,
          description: dto.description,
          visibility: dto.visibility ?? 'public',
          ownerId: userId,
        },
      });

      await tx.projectMember.create({
        data: { projectId: project.id, userId, role: 'owner' },
      });

      return project;
    });
  }

  async findAll(
    userId: string,
    params: {
      search?: string;
      sort?: string;
      filter?: string;
      favoriteIds?: string[];
      page?: number;
      limit?: number;
    },
  ) {
    const {
      search = '',
      sort = 'recentlyEdited',
      filter = 'all',
      favoriteIds = [],
      page = 1,
      limit = 12,
    } = params;

    const where: any = { userId };

    if (filter === 'archived') {
      where.archivedAt = { not: null };
    } else {
      where.archivedAt = null;
      if (filter === 'owned') {
        where.role = 'owner';
      } else if (filter === 'shared') {
        where.role = { not: 'owner' };
      } else if (filter === 'favorites') {
        where.favoritedAt = { not: null };
      }
    }

    let orderBy: any;
    switch (sort) {
      case 'newest':
        orderBy = { project: { createdAt: 'desc' } };
        break;
      case 'oldest':
        orderBy = { project: { createdAt: 'asc' } };
        break;
      case 'mostCollaborators':
        orderBy = { project: { members: { _count: 'desc' } } };
        break;
      case 'name':
        orderBy = { project: { name: 'asc' } };
        break;
      case 'recentlyEdited':
      default:
        orderBy = { project: { updatedAt: 'desc' } };
        break;
    }

    const membershipWhere: any = {
      ...where,
      project: search
        ? { name: { contains: search, mode: 'insensitive' as const } }
        : undefined,
    };

    const [memberships, total] = await Promise.all([
      this.prisma.projectMember.findMany({
        where: membershipWhere,
        include: {
          project: {
            include: {
              User: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
              _count: { select: { members: true, pages: true } },
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.projectMember.count({ where: membershipWhere }),
    ]);

    const items = memberships.map((m) => ({
      ...m.project,
      owner: m.project.User,
      myRole: m.role,
      memberCount: m.project._count.members,
      pagesCount: m.project._count.pages,
      isFavorited: !!m.favoritedAt,
      isArchived: !!m.archivedAt,
      lastOpenedAt: m.lastOpenedAt,
      joinedAt: m.joinedAt,
      membershipId: m.id,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  async toggleFavorite(membershipId: string, userId: string) {
    const m = await this.prisma.projectMember.findUnique({
      where: { id: membershipId },
    });
    if (!m || m.userId !== userId) throw new ForbiddenException('Access denied');

    const updated = await this.prisma.projectMember.update({
      where: { id: membershipId },
      data: { favoritedAt: m.favoritedAt ? null : new Date() },
    });

    return { isFavorited: !!updated.favoritedAt };
  }

  async toggleArchive(membershipId: string, userId: string) {
    const m = await this.prisma.projectMember.findUnique({
      where: { id: membershipId },
    });
    if (!m || m.userId !== userId) throw new ForbiddenException('Access denied');

    const updated = await this.prisma.projectMember.update({
      where: { id: membershipId },
      data: { archivedAt: m.archivedAt ? null : new Date() },
    });

    return { isArchived: !!updated.archivedAt };
  }

  async toggleArchiveByProject(projectId: string, userId: string) {
    const m = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!m) throw new ForbiddenException('Access denied');

    const updated = await this.prisma.projectMember.update({
      where: { id: m.id },
      data: { archivedAt: m.archivedAt ? null : new Date() },
    });

    return { isArchived: !!updated.archivedAt };
  }

  async recordOpen(projectId: string, userId: string) {
    await this.prisma.projectMember.updateMany({
      where: { projectId, userId },
      data: { lastOpenedAt: new Date() },
    });
  }

  async searchProjects(userId: string, query: string) {
    const existingMembershipIds = await this.prisma.projectMember
      .findMany({ where: { userId }, select: { projectId: true } })
      .then((ms) => ms.map((m) => m.projectId));

    const pendingRequestIds = await this.prisma.accessRequest
      .findMany({
        where: { userId, status: 'pending' },
        select: { projectId: true },
      })
      .then((rs) => rs.map((r) => r.projectId));

    const projects = await this.prisma.project.findMany({
      where: {
        visibility: 'public',
        id: { notIn: existingMembershipIds },
        name: { contains: query, mode: 'insensitive' },
      },
      include: {
        User: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { members: true } },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((p) => ({
      ...p,
      memberCount: p._count.members,
      requestPending: pendingRequestIds.includes(p.id),
    }));
  }

  async getProject(projectId: string, userId: string) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) throw new ForbiddenException('Access denied');

    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        User: { select: { id: true, firstName: true, lastName: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        pages: true,
        _count: { select: { members: true } },
      },
    });
  }

  async deleteProject(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId)
      throw new ForbiddenException('Only the owner can delete this project');

    return this.prisma.project.delete({ where: { id: projectId } });
  }

  async renameProject(projectId: string, name: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, ownerId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId)
      throw new ForbiddenException('Only the owner can rename this project');

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: { name },
    });

    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true },
    });

    for (const m of members) {
      if (m.userId !== userId) {
        this.notifications.create({
          userId: m.userId,
          type: 'project_renamed',
          title: 'Project Renamed',
          message: `"${project.name}" was renamed to "${name}"`,
          projectId,
        });
      }
    }

    return updated;
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    return !!membership;
  }

  async updateProject(
    projectId: string,
    userId: string,
    dto: { name?: string; description?: string; visibility?: ProjectVisibility; thumbnail?: string },
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, ownerId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== userId)
      throw new ForbiddenException('Only the owner can update this project');

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });

    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true },
    });

    for (const m of members) {
      if (m.userId !== userId) {
        const changes = Object.keys(dto).join(', ');
        this.notifications.create({
          userId: m.userId,
          type: 'project_updated',
          title: 'Project Updated',
          message: `Project "${project.name}" was updated (${changes})`,
          projectId,
        });
      }
    }

    return updated;
  }

  async transferOwnership(projectId: string, newOwnerId: string, requesterId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        User: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== requesterId)
      throw new ForbiddenException('Only the owner can transfer ownership');

    const newOwnerMembership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: newOwnerId } },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!newOwnerMembership)
      throw new BadRequestException('Target user is not a member of this project');

    const [updatedProject] = await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: projectId },
        data: { ownerId: newOwnerId },
      }),
      this.prisma.projectMember.update({
        where: { projectId_userId: { projectId, userId: requesterId } },
        data: { role: 'editor' },
      }),
      this.prisma.projectMember.update({
        where: { projectId_userId: { projectId, userId: newOwnerId } },
        data: { role: 'owner' },
      }),
    ]);

    const newOwnerName = [newOwnerMembership.user?.firstName, newOwnerMembership.user?.lastName]
      .filter(Boolean)
      .join(' ') || 'A user';

    const allMembers = await this.prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true },
    });

    for (const m of allMembers) {
      if (m.userId === requesterId) {
        this.notifications.create({
          userId: m.userId,
          type: 'ownership_transferred',
          title: 'Ownership Transferred',
          message: `You transferred ownership of "${project.name}" to ${newOwnerName}`,
          projectId,
        });
      } else if (m.userId === newOwnerId) {
        this.notifications.create({
          userId: m.userId,
          type: 'ownership_received',
          title: 'You Are Now the Owner',
          message: `You are now the owner of "${project.name}"`,
          projectId,
        });
      } else {
        this.notifications.create({
          userId: m.userId,
          type: 'ownership_changed',
          title: 'Project Ownership Changed',
          message: `Ownership of "${project.name}" was transferred to ${newOwnerName}`,
          projectId,
        });
      }
    }

    return updatedProject;
  }

  async getSettings(projectId: string, userId: string) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) throw new ForbiddenException('Access denied');

    const [owner, allMembers] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: {
          User: {
            select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true },
          },
        },
      }),
      this.prisma.projectMember.findMany({
        where: { projectId },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true },
          },
        },
        orderBy: { joinedAt: 'asc' },
      }),
    ]);

    return {
      myRole: membership.role,
      owner: owner!.User,
      members: allMembers.map((m) => ({
        ...m.user,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    };
  }
}
