import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppGateway } from 'src/gateway/app.gateway';

@Module({
  providers: [UsersService, PrismaService, AppGateway],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
