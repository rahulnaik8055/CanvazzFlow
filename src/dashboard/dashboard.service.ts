import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        User: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
        _count: { select: { members: true, pages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const pendingRequests = await this.prisma.accessRequest.findMany({
      where: {
        status: 'pending',
        project: { ownerId: userId },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPages = projects.reduce((sum, p) => sum + p._count.pages, 0);
    const totalMembers = projects.reduce((sum, p) => sum + p._count.members, 0);

    const memberIds = new Set<string>();
    projects.forEach((p) => memberIds.add(p.ownerId));

    const otherMembers = await this.prisma.projectMember.findMany({
      where: { projectId: { in: projects.map((p) => p.id) } },
      select: { userId: true },
    });
    otherMembers.forEach((m) => memberIds.add(m.userId));

    const collaboratorIds = [...memberIds].filter((id) => id !== userId);
    const collaborators = await this.prisma.user.findMany({
      where: { id: { in: collaboratorIds } },
      select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true },
    });

    const projectsData = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      thumbnail: p.thumbnail,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      ownerId: p.ownerId,
      visibility: p.visibility,
      owner: p.User,
      memberCount: p._count.members,
      pagesCount: p._count.pages,
    }));

    const recentActivity = projects.slice(0, 10).map((p) => ({
      type: 'project_updated' as const,
      projectId: p.id,
      projectName: p.name,
      timestamp: p.updatedAt,
      userId: p.ownerId,
      userName: [p.User.firstName, p.User.lastName].filter(Boolean).join(' ') || 'Unknown',
    }));

    return {
      stats: {
        totalProjects: projects.length,
        totalPages,
        totalMembers: totalMembers - projects.length,
        pendingRequests: pendingRequests.length,
      },
      projects: projectsData,
      recentProjects: projectsData.slice(0, 6),
      pendingRequests: pendingRequests.map((r) => ({
        id: r.id,
        message: r.message,
        createdAt: r.createdAt,
        user: r.user,
        project: r.project,
      })),
      recentActivity,
      collaborators,
    };
  }
}
