import { Module } from '@nestjs/common';
import { NodesController } from './nodes.controller';
import { NodesService } from './nodes.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { LiveblocksModule } from 'src/liveblocks/liveblocks.module';

@Module({
  imports: [LiveblocksModule],
  controllers: [NodesController],
  providers: [NodesService, PrismaService],
})
export class NodesModule {}
