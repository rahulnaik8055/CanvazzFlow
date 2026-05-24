import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectModule } from './project/project.module';
import { PageModule } from './page/page.module';
import { UsersModule } from './users/users.module';
import { NodesModule } from './nodes/nodes.module';
import { LiveblocksService } from './liveblocks/liveblocks.service';
import { LiveblocksModule } from './liveblocks/liveblocks.module';
import { AccessRequestsModule } from './access-requests/access-requests.module';
import { LiveblocksAuthModule } from './liveblocks-auth/liveblocks-auth.module';
import { ProjectMembersService } from './project-members/project-members.service';
import { ProjectMembersController } from './project-members/project-members.controller';
import { ProjectMembersModule } from './project-members/project-members.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    GatewayModule,
    PrismaModule,
    ProjectModule,
    PageModule,
    UsersModule,
    NodesModule,
    LiveblocksModule,
    AccessRequestsModule,
    LiveblocksAuthModule,
    ProjectMembersModule,
  ],
  controllers: [AppController, ProjectMembersController],
  providers: [AppService, LiveblocksService, ProjectMembersService],
})
export class AppModule {}
