import { Controller, Post, Get, Param, Body, Req, UseGuards, Query } from '@nestjs/common';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';
import { ProjectRoleGuard } from '../common/guards/project-role.guard';
import { ProjectRoles } from '../common/decorators/project-role.decorator';
import { InvitationsService } from './invitations.service';

class InviteByEmailDto {
  email!: string;
  role?: string;
  message?: string;
  expiresInHours?: number;
}

class InviteByUserDto {
  userId!: string;
  role?: string;
  message?: string;
  expiresInHours?: number;
}

class GenerateLinkDto {
  role?: string;
  oneTime?: boolean;
  expiresInHours?: number;
}

@Controller()
@UseGuards(ClerkAuthGuard)
export class InvitationsController {
  constructor(private svc: InvitationsService) {}

  @Post('projects/:projectId/invite/email')
  inviteByEmail(@Param('projectId') projectId: string, @Req() req, @Body() body: InviteByEmailDto) {
    return this.svc.inviteByEmail(projectId, req['userId'], body.email, body.role || 'editor', body.message, body.expiresInHours);
  }

  @Post('projects/:projectId/invite/user')
  inviteByUser(@Param('projectId') projectId: string, @Req() req, @Body() body: InviteByUserDto) {
    return this.svc.inviteByUser(projectId, req['userId'], body.userId, body.role || 'editor', body.message, body.expiresInHours);
  }

  @Post('projects/:projectId/invite/link')
  generateLink(@Param('projectId') projectId: string, @Req() req, @Body() body: GenerateLinkDto) {
    return this.svc.generateLink(projectId, req['userId'], body.role || 'editor', body.oneTime ?? false, body.expiresInHours);
  }

  @Get('projects/:projectId/invitations')
  listForProject(@Param('projectId') projectId: string, @Req() req) {
    return this.svc.listForProject(projectId, req['userId']);
  }

  @Get('invitations/:token')
  getByToken(@Param('token') token: string) {
    return this.svc.getByToken(token);
  }

  @Post('invitations/:token/accept')
  accept(@Param('token') token: string, @Req() req) {
    return this.svc.accept(token, req['userId']);
  }

  @Post('invitations/:id/cancel')
  cancel(@Param('id') id: string, @Req() req) {
    return this.svc.cancel(id, req['userId']);
  }

  @Post('invitations/:id/resend')
  resend(@Param('id') id: string, @Req() req) {
    return this.svc.resend(id, req['userId']);
  }

  @Get('me/invitations')
  myInvitations(@Req() req) {
    return this.svc.listMyPending(req['userId']);
  }
}
