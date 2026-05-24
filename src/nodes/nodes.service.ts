/**
 * nodes.service.ts
 *
 * What changed:
 *   - patchNodes() removed — no more delta PATCH from frontend
 *   - saveNodesFromWebhook() added — called by the Liveblocks webhook
 *     when it delivers the final room state to write back to Postgres
 *
 * The flow is now:
 *   Frontend → Liveblocks (live session)
 *   Liveblocks webhook → saveNodesFromWebhook() → Postgres (persistence)
 */

import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NodesService {
  constructor(private prisma: PrismaService) {}

  // ─── Auth guard ──────────────────────────────────────────────────────────────

  // nodes.service.ts

  private async verifyPageOwnership(pageId: string, userId: string) {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: {
        project: {
          select: {
            ownerId: true,
            members: {
              where: { userId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!page) throw new ForbiddenException('Page not found');

    const isOwner = page.project.ownerId === userId;
    const isMember = page.project.members.length > 0;

    if (!isOwner && !isMember) {
      throw new ForbiddenException('Access denied');
    }

    return page;
  }

  // ─── Read ────────────────────────────────────────────────────────────────────
  // Called once on canvas open to seed the Liveblocks room

  async getNodes(pageId: string, userId: string) {
    await this.verifyPageOwnership(pageId, userId);
    return this.prisma.node.findMany({
      where: { pageId },
      orderBy: { zIndex: 'asc' },
    });
  }

  // ─── Full replace (initial page creation) ────────────────────────────────────

  async saveNodes(pageId: string, nodes: any[], userId: string) {
    await this.verifyPageOwnership(pageId, userId);
    return this.replaceNodes(pageId, nodes);
  }

  // ─── Webhook save (called by Liveblocks, no userId needed) ───────────────────
  //
  // This does NOT check page ownership — the request comes from Liveblocks,
  // not from a user. We trust it because we verified Liveblocks' webhook
  // signature in the controller before this method is ever called.
  //
  // It uses the same replaceNodes logic as saveNodes — full replace —
  // because the webhook delivers the complete current state, not a delta.

  async saveNodesFromWebhook(pageId: string, nodes: any[]) {
    return this.replaceNodes(pageId, nodes);
  }

  // ─── Shared replace logic ─────────────────────────────────────────────────────
  //
  // DELETE + createMany = always 2 SQL statements.
  // Safe here because this only runs:
  //   a) on initial page save
  //   b) when Liveblocks webhooks fire (not on every user action)
  // So frequency is low and the full replace is fine.

  private async replaceNodes(pageId: string, nodes: any[]) {
    await this.prisma.node.deleteMany({ where: { pageId } });

    if (nodes.length > 0) {
      await this.prisma.node.createMany({
        data: nodes.map((node) => ({ ...node, pageId })),
      });
    }

    return this.prisma.node.findMany({
      where: { pageId },
      orderBy: { zIndex: 'asc' },
    });
  }
}
