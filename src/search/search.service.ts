import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(userId: string, q: string) {
    if (!q || q.trim().length < 1) {
      return { projects: [], pages: [], members: [], requests: [] };
    }

    const query = q.trim();
    const words = query.split(/\s+/).filter(Boolean);
    const like = `%${query}%`;

    const [projects, pages, members, requests] = await Promise.all([
      this.searchProjects(userId, query, words, like),
      this.searchPages(userId, query, like),
      this.searchMembers(userId, query, like),
      this.searchRequests(userId, query, like),
    ]);

    return { projects, pages, members, requests };
  }

  private async searchProjects(userId: string, query: string, words: string[], like: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
        AND: words.map((w) => ({
          OR: [
            { name: { contains: w, mode: 'insensitive' as const } },
            { description: { contains: w, mode: 'insensitive' as const } },
          ],
        })),
      },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        visibility: true,
        ownerId: true,
        createdAt: true,
      },
      take: 8,
    });

    return this.rank(projects, query, ['name', 'description']);
  }

  private async searchPages(userId: string, query: string, like: string) {
    const pages = await this.prisma.page.findMany({
      where: {
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
        name: { contains: query, mode: 'insensitive' as const },
      },
      select: {
        id: true,
        name: true,
        projectId: true,
        project: { select: { id: true, name: true } },
      },
      take: 8,
    });

    return this.rank(pages, query, ['name']);
  }

  private async searchMembers(userId: string, query: string, like: string) {
    const memberRecords = await this.prisma.projectMember.findMany({
      where: {
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
        user: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' as const } },
            { lastName: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } },
          ],
        },
      },
      select: {
        id: true,
        role: true,
        userId: true,
        projectId: true,
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
      take: 8,
    });

    return this.deduplicateMembers(memberRecords, query);
  }

  private async searchRequests(userId: string, query: string, like: string) {
    const requests = await this.prisma.accessRequest.findMany({
      where: {
        project: { ownerId: userId },
        OR: [
          { user: { firstName: { contains: query, mode: 'insensitive' as const } } },
          { user: { lastName: { contains: query, mode: 'insensitive' as const } } },
          { user: { email: { contains: query, mode: 'insensitive' as const } } },
          { project: { name: { contains: query, mode: 'insensitive' as const } } },
          { message: { contains: query, mode: 'insensitive' as const } },
        ],
      },
      select: {
        id: true,
        status: true,
        message: true,
        createdAt: true,
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
      take: 8,
    });

    return this.rank(requests, query, ['message', 'user.email', 'project.name']);
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

  private deduplicateMembers(members: any[], query: string) {
    const seen = new Set<string>();
    const ranked = this.rank(members, query, ['user.firstName', 'user.lastName', 'user.email']);
    return ranked.filter((m) => {
      if (seen.has(m.userId)) return false;
      seen.add(m.userId);
      return true;
    });
  }
}
