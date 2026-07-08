import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectsController } from './project.controller';
import { ProjectsService } from './project.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, PrismaService],
  exports: [ProjectsService],
})
export class ProjectModule {}
