import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(ClerkAuthGuard)
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get()
  getDashboard(@Req() req) {
    return this.svc.getDashboard(req['userId']);
  }
}
