import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Liveblocks, WebhookHandler, WebhookEvent } from '@liveblocks/node';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LiveblocksService {
  private liveblocks: Liveblocks;
  private webhookHandler: WebhookHandler;

  constructor(private prisma: PrismaService) {
    this.liveblocks = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY!,
    });
    this.webhookHandler = new WebhookHandler(
      process.env.LIVEBLOCKS_WEBHOOK_SECRET!,
    );
  }

  verifyWebhook(
    rawBody: Buffer,
    headers: Record<string, string>,
  ): WebhookEvent {
    try {
      return this.webhookHandler.verifyRequest({
        headers,
        rawBody: rawBody.toString(),
      });
    } catch {
      throw new UnauthorizedException('Invalid Liveblocks webhook signature');
    }
  }

  extractPageId(roomId: string): string | null {
    const match = roomId.match(/^page-(.+)$/);
    return match ? match[1] : null;
  }

  async authorizeUser(userId: string, roomId: string) {
    const pageId = this.extractPageId(roomId);
    if (!pageId) throw new ForbiddenException('Invalid room id format');

    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      include: { project: true },
    });
    if (!page) throw new ForbiddenException('Page not found');

    const { project } = page;
    const isOwner = project.ownerId === userId;

    const member = isOwner
      ? null
      : await this.prisma.projectMember.findUnique({
          where: { projectId_userId: { projectId: project.id, userId } },
        });

    const isPublicViewer = project.visibility === 'public';
    const hasAccess = isOwner || !!member || isPublicViewer;

    if (!hasAccess) throw new ForbiddenException('No access to this room');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true, imageUrl: true },
    });

    const role = isOwner ? 'owner' : (member?.role ?? 'viewer');

    const session = this.liveblocks.prepareSession(userId, {
      userInfo: {
        name:
          [user!.firstName, user!.lastName].filter(Boolean).join(' ') ||
          user!.email,
        imageUrl: user!.imageUrl,
        role,
        color: this.colorFor(userId),
      },
    });

    if (role === 'viewer') {
      session.allow(roomId, session.READ_ACCESS);
    } else {
      session.allow(roomId, session.FULL_ACCESS);
    }

    return session.authorize();
  }

  private colorFor(userId: string): string {
    const palette = [
      '#7F77DD',
      '#1D9E75',
      '#D85A30',
      '#D4537E',
      '#378ADD',
      '#BA7517',
    ];
    let hash = 0;
    for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
    return palette[hash % palette.length];
  }
}
