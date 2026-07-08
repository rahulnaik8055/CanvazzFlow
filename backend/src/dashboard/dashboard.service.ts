import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const membershipWhere = { userId };

    const [memberships, pendingRequests, recentPages] = await Promise.all([
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
      }),
      this.prisma.accessRequest.findMany({
        where: {
          status: 'pending',
          project: { ownerId: userId },
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.pageVisit.findMany({
        where: { userId },
        include: {
          page: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { visitedAt: 'desc' },
        take: 10,
        distinct: ['pageId'],
      }),
    ]);

    const now = new Date();
    const projects = memberships.map((m) => ({
      id: m.project.id,
      name: m.project.name,
      description: m.project.description,
      thumbnail: m.project.thumbnail,
      createdAt: m.project.createdAt,
      updatedAt: m.project.updatedAt,
      ownerId: m.project.ownerId,
      visibility: m.project.visibility,
      owner: m.project.User,
      memberCount: m.project._count.members,
      pagesCount: m.project._count.pages,
      myRole: m.role,
      isFavorited: !!m.favoritedAt,
      isArchived: !!m.archivedAt,
      isPinned: !!m.pinnedAt,
      lastOpenedAt: m.lastOpenedAt,
      membershipId: m.id,
    }));

    const totalPages = projects.reduce((sum, p) => sum + p.pagesCount, 0);
    const totalMembers = projects.reduce((sum, p) => sum + p.memberCount, 0);

    const memberIds = new Set<string>();
    memberships.forEach((m) => memberIds.add(m.project.ownerId));
    memberships.forEach((m) => memberIds.add(m.userId));
    const collaboratorIds = [...memberIds].filter((id) => id !== userId);
    const collaborators = await this.prisma.user.findMany({
      where: { id: { in: collaboratorIds } },
      select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true },
    });

    const activeProjects = projects.filter((p) => !p.isArchived);

    const pinnedProjects = projects.filter((p) => p.isPinned);
    const favoriteProjects = projects.filter((p) => p.isFavorited);
    const recentProjects = [...projects]
      .filter((p) => p.lastOpenedAt)
      .sort((a, b) => new Date(b.lastOpenedAt!).getTime() - new Date(a.lastOpenedAt!).getTime())
      .slice(0, 6);

    const recentActivity = memberships
      .sort((a, b) => new Date(b.project.updatedAt).getTime() - new Date(a.project.updatedAt).getTime())
      .slice(0, 10)
      .map((m) => ({
        type: 'project_updated' as const,
        projectId: m.project.id,
        projectName: m.project.name,
        timestamp: m.project.updatedAt,
        userId: m.project.ownerId,
        userName: [m.project.User.firstName, m.project.User.lastName].filter(Boolean).join(' ') || 'Unknown',
      }));

    return {
      stats: {
        totalProjects: projects.length,
        totalPages,
        totalMembers: totalMembers - projects.length,
        pendingRequests: pendingRequests.length,
      },
      projects: activeProjects,
      pinnedProjects,
      favoriteProjects,
      recentProjects,
      recentPages: recentPages.map((v) => ({
        pageId: v.page.id,
        pageName: v.page.name,
        projectId: v.project.id,
        projectName: v.project.name,
        visitedAt: v.visitedAt,
      })),
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
