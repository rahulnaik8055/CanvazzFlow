/**
 * projects.controller.ts
 *
 * GET    /projects          → my projects
 * GET    /projects/search   → search public projects
 * GET    /projects/:id      → single project (members only)
 * POST   /projects          → create project
 * DELETE /projects/:id      → delete project (owner only)
 */

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
  getMyProjects(@Req() req: Request) {
    return this.projectsService.getMyProjects(req['userId']);
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
  renameProject(
    @Param('id') id: string,
    @Body() body: { name: string },
    @Req() req,
  ) {
    return this.projectsService.renameProject(id, body.name, req['userId']);
  }

  @Delete(':id')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles('owner')
  deleteProject(@Param('id') id: string, @Req() req: Request) {
    return this.projectsService.deleteProject(id, req['userId']);
  }
}
