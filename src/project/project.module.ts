import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectsController } from './project.controller';
import { ProjectsService } from './project.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, PrismaService],
  exports: [ProjectsService],
})
export class ProjectModule {}
