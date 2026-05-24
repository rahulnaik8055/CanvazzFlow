import {
  Controller,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { Liveblocks } from '@liveblocks/node';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';

@Controller('liveblocks-auth')
@UseGuards(ClerkAuthGuard)
export class LiveblocksAuthController {
  private liveblocks: Liveblocks;

  constructor(private prisma: PrismaService) {
    this.liveblocks = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY!,
    });
  }

  @Post()
  async auth(@Body() body: { room: string }, @Req() req: Request) {
    const { room } = body;

    const pageIdMatch = room.match(/^page-(.+)$/);
    if (!pageIdMatch) throw new ForbiddenException('Invalid room format');
    const pageId = pageIdMatch[1];

    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      select: { projectId: true },
    });
    if (!page) throw new ForbiddenException('Page not found');

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: page.projectId,
          userId: req['userId'],
        },
      },
    });
    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this project. Request access from the owner.',
      );
    }

    // Step 4: issue a Liveblocks session token
    // userInfo is what appears in useOthers() presence on other clients
    // — name, color, role all become visible to collaborators
    const COLORS = ['#E85D75', '#4B9CF5', '#F5A623', '#7ED321', '#9B59B6'];
    const color = COLORS[req['userId'].charCodeAt(0) % COLORS.length];

    const session = this.liveblocks.prepareSession(req['userId'], {
      userInfo: {
        color,
        role: membership.role,
      },
    });

    // Grant access to this specific room only
    session.allow(room, session.FULL_ACCESS);

    // ✅ REPLACE with this:
    const { status, body: responseBody } = await session.authorize();

    if (status !== 200) {
      throw new ForbiddenException('Liveblocks authorization failed');
    }

    return JSON.parse(responseBody);
  }
}
