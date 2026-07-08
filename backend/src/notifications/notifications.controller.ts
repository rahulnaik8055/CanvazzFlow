import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(ClerkAuthGuard)
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get()
  list(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('filter') filter?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
  ) {
    return this.svc.findByUser(req['userId'], {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      filter,
      search,
      type,
    });
  }

  @Get('unread-count')
  unreadCount(@Req() req) {
    return this.svc.unreadCount(req['userId']);
  }

  @Patch(':id/read')
  markAsRead(@Req() req, @Param('id') id: string) {
    return this.svc.markAsRead(req['userId'], id);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req) {
    return this.svc.markAllAsRead(req['userId']);
  }

  @Delete(':id')
  delete(@Req() req, @Param('id') id: string) {
    return this.svc.delete(req['userId'], id);
  }
}
