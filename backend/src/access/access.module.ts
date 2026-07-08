import { Module } from '@nestjs/common';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InvitationsModule } from 'src/invitations/invitations.module';
import { AccessRequestsModule } from 'src/access-requests/access-requests.module';

@Module({
  imports: [PrismaModule, InvitationsModule, AccessRequestsModule],
  controllers: [AccessController],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
