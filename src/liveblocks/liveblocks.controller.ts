// liveblocks.controller.ts
import {
  Controller,
  Post,
  Req,
  Res,
  Body,
  UseGuards,
  RawBodyRequest,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LiveblocksService } from './liveblocks.service';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';

@Controller('liveblocks')
export class LiveblocksController {
  constructor(private readonly liveblocksService: LiveblocksService) {}

  @Post('auth')
  @UseGuards(ClerkAuthGuard)
  async auth(
    @Req() req: Request & { user: { id: string } },
    @Res() res: Response,
    @Body() body: { room: string },
  ) {
    const { status, body: responseBody } =
      await this.liveblocksService.authorizeUser(req['userId'], body.room);
    res.status(status).send(responseBody);
  }

  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
    const event = this.liveblocksService.verifyWebhook(
      req.rawBody!,
      req.headers as Record<string, string>,
    );

    switch (event.type) {
      case 'storageUpdated':
        break;
      case 'userEntered':
        break;
    }

    res.status(200).json({ ok: true });
  }
}
