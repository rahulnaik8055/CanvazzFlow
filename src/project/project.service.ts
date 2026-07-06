import {
  Injectable,
  ForbiddenException,
  NotFoundException,
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

  async getMyProjects(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            User: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.project,
      myRole: m.role,
      memberCount: m.project._count.members,
    }));
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
}
