import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';

import { ClerkAuthGuard } from 'src/auth/clerk.guard';
import { ProjectRoleGuard } from '../common/guards/project-role.guard';
import { ProjectRoles } from '../common/decorators/project-role.decorator';
import { ProjectsService } from './project.service';

@Controller('project')
@UseGuards(ClerkAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  findAll(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('filter') filter?: string,
    @Query('favoriteIds') favoriteIds?: string,
  ) {
    return this.projectsService.findAll(req['userId'], {
      search,
      sort,
      filter,
      favoriteIds: favoriteIds?.split(',').filter(Boolean),
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 12,
    });
  }

  @Get('search')
  searchProjects(@Req() req: Request, @Query('q') query: string = '') {
    return this.projectsService.searchProjects(req['userId'], query);
  }

  @Get(':id')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles('viewer', 'editor', 'owner')
  getProject(@Param('id') id: string, @Req() req: Request) {
    return this.projectsService.getProject(id, req['userId']);
  }

  @Post()
  createProject(
    @Req() req: Request,
    @Body()
    body: {
      name: string;
      description?: string;
      visibility?: 'public' | 'private';
    },
  ) {
    return this.projectsService.createProject(req['userId'], body);
  }

  @Patch(':id')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles('owner')
  updateProject(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; visibility?: 'public' | 'private'; thumbnail?: string },
    @Req() req,
  ) {
    return this.projectsService.updateProject(id, req['userId'], body);
  }

  @Delete(':id')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles('owner')
  deleteProject(@Param('id') id: string, @Req() req: Request) {
    return this.projectsService.deleteProject(id, req['userId']);
  }

  @Post('membership/:membershipId/toggle-favorite')
  toggleFavorite(@Param('membershipId') membershipId: string, @Req() req: Request) {
    return this.projectsService.toggleFavorite(membershipId, req['userId']);
  }

  @Post('membership/:membershipId/toggle-archive')
  toggleArchive(@Param('membershipId') membershipId: string, @Req() req: Request) {
    return this.projectsService.toggleArchive(membershipId, req['userId']);
  }

  @Post(':id/record-open')
  recordOpen(@Param('id') id: string, @Req() req: Request) {
    return this.projectsService.recordOpen(id, req['userId']);
  }

  @Get(':id/settings')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles('viewer', 'editor', 'owner')
  getSettings(@Param('id') id: string, @Req() req: Request) {
    return this.projectsService.getSettings(id, req['userId']);
  }

  @Post(':id/toggle-archive')
  toggleArchiveByProject(@Param('id') id: string, @Req() req: Request) {
    return this.projectsService.toggleArchiveByProject(id, req['userId']);
  }

  @Post(':id/transfer-ownership')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles('owner')
  transferOwnership(
    @Param('id') id: string,
    @Body() body: { userId: string },
    @Req() req,
  ) {
    return this.projectsService.transferOwnership(id, body.userId, req['userId']);
  }
}
