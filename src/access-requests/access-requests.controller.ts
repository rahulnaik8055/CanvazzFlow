import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';
import { ProjectRoleGuard } from '../common/guards/project-role.guard';
import { ProjectRoles } from '../common/decorators/project-role.decorator';
import { AccessRequestsService } from './access-requests.service';

class CreateRequestDto {
  projectId!: string;
  message?: string;
}

class RespondDto {
  approved!: boolean;
}

@Controller('access-requests')
@UseGuards(ClerkAuthGuard)
export class AccessRequestsController {
  constructor(private svc: AccessRequestsService) {}

  @Post()
  create(@Req() req, @Body() body: CreateRequestDto) {
    return this.svc.create(req['userId'], body.projectId, body.message);
  }

  @Patch(':id/respond')
  respond(@Param('id') id: string, @Req() req, @Body() body: RespondDto) {
    return this.svc.respond(id, req['userId'], body.approved);
  }

  @Get('pending')
  pendingForOwner(@Req() req) {
    return this.svc.getAllPendingForOwner(req['userId']);
  }

  @Get('project/:projectId/pending')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles('owner')
  pendingForProject(@Param('projectId') projectId: string) {
    return this.svc.getPendingForProject(projectId);
  }

  @Get('mine')
  mine(@Req() req) {
    return this.svc.myRequests(req['userId']);
  }
}
