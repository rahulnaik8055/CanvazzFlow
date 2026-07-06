import {
  Controller,
  Post,
  Req,
  Res,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LiveblocksService } from './liveblocks.service';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';

@Controller('liveblocks')
export class LiveblocksController {
  constructor(
    private readonly liveblocksService: LiveblocksService,
  ) {}

  @Post('auth')
  @UseGuards(ClerkAuthGuard)
  async auth(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { room: string },
  ) {
    const { status, body: responseBody } =
      await this.liveblocksService.authorizeUser(req['userId'], body.room);
    res.status(status).json(responseBody);
  }
}
