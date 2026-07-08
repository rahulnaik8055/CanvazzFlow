import { Controller, Get, Req, Query, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';
import { AccessService } from './access.service';

@Controller('access')
@UseGuards(ClerkAuthGuard)
export class AccessController {
  constructor(private svc: AccessService) {}

  @Get('incoming')
  incoming(@Req() req) {
    return this.svc.getIncoming(req['userId']);
  }

  @Get('outgoing')
  outgoing(@Req() req) {
    return this.svc.getOutgoing(req['userId']);
  }

  @Get('history')
  history(@Req() req, @Query('filter') filter?: string) {
    return this.svc.getHistory(req['userId'], filter);
  }

  @Get('count')
  count(@Req() req) {
    return this.svc.getBadgeCount(req['userId']);
  }
}
