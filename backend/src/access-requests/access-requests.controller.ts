import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  Query,
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
  reason?: string;
}

class BulkRespondDto {
  ids!: string[];
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
    return this.svc.respondWithReason(id, req['userId'], body.approved, body.reason);
  }

  @Post('bulk-respond')
  bulkRespond(@Req() req, @Body() body: BulkRespondDto) {
    return this.svc.bulkRespond(req['userId'], body.ids, body.approved);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Req() req) {
    return this.svc.cancel(req['userId'], id);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findAll(req['userId'], {
      status,
      search,
      sort,
      order,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
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

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.svc.findOne(id, req['userId']);
  }
}
