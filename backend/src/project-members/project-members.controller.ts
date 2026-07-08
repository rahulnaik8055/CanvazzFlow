// src/project-members/project-members.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProjectRoleGuard } from '../common/guards/project-role.guard';
import { ProjectRoles } from '../common/decorators/project-role.decorator';
import { ProjectMembersService } from './project-members.service';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';
import { MemberRole } from 'generated/prisma/browser';

@Controller('projects/:projectId/members')
@UseGuards(ClerkAuthGuard, ProjectRoleGuard)
export class ProjectMembersController {
  constructor(private svc: ProjectMembersService) {}

  @Get()
  @ProjectRoles('viewer', 'editor', 'owner')
  list(@Param('projectId') projectId: string) {
    return this.svc.list(projectId);
  }

  @Get('my-role')
  @ProjectRoles('viewer', 'editor', 'owner')
  myRole(@Param('projectId') projectId: string, @Req() req) {
    return this.svc.getMyRole(projectId, req['userId']);
  }

  @Patch(':userId/role')
  @ProjectRoles('owner')
  updateRole(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Body() body: { role: MemberRole },
    @Req() req,
  ) {
    return this.svc.updateRole(projectId, userId, body.role, req['userId']);
  }

  @Delete(':userId')
  @ProjectRoles('viewer', 'editor', 'owner')
  remove(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Req() req,
  ) {
    return this.svc.remove(projectId, userId, req['userId']);
  }
}
