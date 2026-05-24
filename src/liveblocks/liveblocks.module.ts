// liveblocks.module.ts
import { Module } from '@nestjs/common';
import { LiveblocksController } from './liveblocks.controller';
import { LiveblocksService } from './liveblocks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LiveblocksController],
  providers: [LiveblocksService],
})
export class LiveblocksModule {}
