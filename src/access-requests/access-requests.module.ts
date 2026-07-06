import { Module } from '@nestjs/common';
import { AccessRequestsController } from './access-requests.controller';
import { AccessRequestsService } from './access-requests.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GatewayModule } from 'src/gateway/gateway.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [GatewayModule, NotificationsModule],
  controllers: [AccessRequestsController],
  providers: [AccessRequestsService, PrismaService],
})
export class AccessRequestsModule {}
