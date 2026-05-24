import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Headers,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { NodesService } from './nodes.service';
import { LiveblocksService } from '../liveblocks/liveblocks.service';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';

@Controller()
export class NodesController {
  constructor(
    private nodesService: NodesService,
    private liveblocksService: LiveblocksService,
  ) {}

  @Get('pages/:pageId/nodes')
  @UseGuards(ClerkAuthGuard)
  getNodes(@Param('pageId') pageId: string, @Req() req: Request) {
    return this.nodesService.getNodes(pageId, req['userId']);
  }

  @Post('pages/:pageId/nodes')
  @UseGuards(ClerkAuthGuard)
  saveNodes(
    @Param('pageId') pageId: string,
    @Body() body: { nodes: any[] },
    @Req() req: Request,
  ) {
    return this.nodesService.saveNodes(pageId, body.nodes, req['userId']);
  }

  @Post('webhooks/liveblocks')
  @HttpCode(200)
  async liveblocksWebhook(
    @Req() req: Request,
    @Headers() headers: Record<string, string>,
  ) {
    const event = this.liveblocksService.verifyWebhook(
      (req as any).rawBody,
      headers,
    );

    if (event.type !== 'storageUpdated') return { ok: true };

    const pageId = this.liveblocksService.extractPageId(event.data.roomId);
    if (!pageId) return { ok: true };

    const nodesMap = (event.data as any).storage?.nodes as
      | Record<string, any>
      | undefined;
    if (!nodesMap) return { ok: true };

    const nodes = Object.values(nodesMap);

    await this.nodesService.saveNodesFromWebhook(pageId, nodes);

    return { ok: true };
  }
}
