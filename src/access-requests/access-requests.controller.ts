// src/access-requests/access-requests.controller.ts
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
import { ProjectRoleGuard } from '../common/guards/project-role.guard';
import { ProjectRoles } from '../common/decorators/project-role.decorator';
import { AccessRequestsService } from './access-requests.service';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';

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

  // Only owners/editors can list pending requests
  @Get('pending')
  pending(@Req() req) {
    return this.svc.getAllPendingForOwner(req['userId']);
  }
}
