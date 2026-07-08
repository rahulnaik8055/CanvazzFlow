import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(userId: string, q: string) {
    if (!q || q.trim().length < 1) {
      return { projects: [], users: [] };
    }

    const query = q.trim();
    const words = query.split(/\s+/).filter(Boolean);

    const [projects, users] = await Promise.all([
      this.searchProjects(userId, query, words),
      this.searchUsers(userId, query),
    ]);

    return { projects, users };
  }

  private async searchProjects(userId: string, query: string, words: string[]) {
    const [myProjects, publicProjects] = await Promise.all([
      // User's own + member projects
      this.prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
          AND: words.map((w) => ({
            OR: [
              { name: { contains: w, mode: 'insensitive' as const } },
              { description: { contains: w, mode: 'insensitive' as const } },
              { User: { firstName: { contains: w, mode: 'insensitive' as const } } },
              { User: { lastName: { contains: w, mode: 'insensitive' as const } } },
            ],
          })),
        },
        include: {
          User: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          _count: { select: { members: true } },
          members: {
            where: { userId },
            select: { role: true },
            take: 1,
          },
        },
        take: 8,
      }),
      // Public projects from all users (excluding ones already covered above)
      this.prisma.project.findMany({
        where: {
          visibility: 'public',
          NOT: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
          AND: words.map((w) => ({
            OR: [
              { name: { contains: w, mode: 'insensitive' as const } },
              { description: { contains: w, mode: 'insensitive' as const } },
              { User: { firstName: { contains: w, mode: 'insensitive' as const } } },
              { User: { lastName: { contains: w, mode: 'insensitive' as const } } },
            ],
          })),
        },
        include: {
          User: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          _count: { select: { members: true } },
          members: false,
        },
        take: 8,
      }),
    ]);

    const seen = new Set<string>();
    const all = [...myProjects, ...publicProjects].filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).map((p) => {
      const myMembership = (p as any).members?.[0];
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        thumbnail: p.thumbnail,
        visibility: p.visibility,
        ownerId: p.ownerId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        owner: p.User,
        memberCount: p._count.members,
        myRole: myMembership?.role ?? null,
      };
    });

    const ranked = this.rank(all, query, ['name', 'description']);
    return ranked.slice(0, 8);
  }

  private async searchUsers(userId: string, query: string) {
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
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
      take: 8,
    });

    const myProjectIds = await this.prisma.projectMember
      .findMany({
        where: { userId },
        select: { projectId: true },
      })
      .then((ms) => ms.map((m) => m.projectId));

    const results = await Promise.all(
      users.map(async (user) => {
        const [mutualCount, isCollaborator] = await Promise.all([
          this.prisma.projectMember.count({
            where: {
              userId: user.id,
              projectId: { in: myProjectIds },
            },
          }),
          this.prisma.projectMember
            .findFirst({
              where: {
                userId: user.id,
                project: { ownerId: userId },
              },
            })
            .then((m) => !!m),
        ]);

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          imageUrl: user.imageUrl,
          mutualProjectsCount: mutualCount,
          isCollaborator,
        };
      }),
    );

    return this.rank(results, query, ['firstName', 'lastName', 'email']);
  }

  private rank<T extends Record<string, any>>(items: T[], query: string, fields: string[]): T[] {
    const lower = query.toLowerCase();
    return items
      .map((item) => {
        let score = 0;
        for (const field of fields) {
          const val = this.resolveField(item, field)?.toLowerCase() ?? '';
          if (val === lower) score += 100;
          else if (val.startsWith(lower)) score += 50;
          else if (val.includes(lower)) score += 10;
          else if (lower.split(/\s+/).some((w) => val.includes(w))) score += 3;
        }
        return { item, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((r) => r.item);
  }

  private resolveField(obj: any, path: string): string | null {
    return path.split('.').reduce((acc, key) => (acc ? acc[key] ?? null : null), obj);
  }
}
