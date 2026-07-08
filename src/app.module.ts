import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectModule } from './project/project.module';
import { PageModule } from './page/page.module';
import { UsersModule } from './users/users.module';
import { NodesModule } from './nodes/nodes.module';
import { LiveblocksModule } from './liveblocks/liveblocks.module';
import { AccessRequestsModule } from './access-requests/access-requests.module';
import { ProjectMembersController } from './project-members/project-members.controller';
import { ProjectMembersService } from './project-members/project-members.service';
import { ProjectMembersModule } from './project-members/project-members.module';
import { GatewayModule } from './gateway/gateway.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InvitationsModule } from './invitations/invitations.module';
import { AccessModule } from './access/access.module';
import { SearchModule } from './search/search.module';

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
    ProjectMembersModule,
    NotificationsModule,
    DashboardModule,
    InvitationsModule,
    AccessModule,
    SearchModule,
  ],
  controllers: [AppController, ProjectMembersController],
  providers: [AppService, ProjectMembersService],
})
export class AppModule {}
