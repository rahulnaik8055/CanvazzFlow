/**
 * liveblocks-auth.controller.ts
 *
 * THE SECURITY GATE.
 *
 * This replaces the public API key in your frontend config.
 * Instead of anyone being able to join any room, Liveblocks calls
 * this endpoint first and only issues a token if we say yes.
 *
 * Flow:
 *   1. User opens editor → Liveblocks client needs a token
 *   2. Liveblocks client calls POST /liveblocks-auth (your backend)
 *   3. We check: is this user a ProjectMember for this room's project?
 *   4. Yes → issue a signed session token with their name + color
 *   5. No  → 403, Liveblocks rejects the connection
 *
 * Room naming convention: "page-{pageId}"
 * We extract the pageId, look up which project it belongs to,
 * then check ProjectMember.
 */

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

    // Step 1: extract pageId from room name
    const pageIdMatch = room.match(/^page-(.+)$/);
    if (!pageIdMatch) throw new ForbiddenException('Invalid room format');
    const pageId = pageIdMatch[1];

    // Step 2: find which project this page belongs to
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      select: { projectId: true },
    });
    if (!page) throw new ForbiddenException('Page not found');

    // Step 3: check if user is a member of that project
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
