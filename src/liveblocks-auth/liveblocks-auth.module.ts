import { Module } from '@nestjs/common';
import { LiveblocksAuthController } from './liveblocks-auth.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [LiveblocksAuthController],
  providers: [PrismaService],
})
export class LiveblocksAuthModule {}
