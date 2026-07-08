import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';
import { ProjectRoleGuard } from '../common/guards/project-role.guard';
import { ProjectRoles } from '../common/decorators/project-role.decorator';
import { PageService } from './page.service';

@Controller('project/:projectId/pages')
@UseGuards(ClerkAuthGuard)
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Get()
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles('viewer', 'editor', 'owner')
  getPages(
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '12',
    @Query('search') search = '',
  ) {
    return this.pageService.getPages(projectId, req['userId'], {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });
  }

  @Post()
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles('editor', 'owner')
  createPage(@Param('projectId') projectId: string, @Req() req: any) {
    return this.pageService.createPage(projectId, req['userId']);
  }

  @Patch(':pageId')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles('editor', 'owner')
  updatePage(
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Body() data: { name: string },
    @Req() req: any,
  ) {
    return this.pageService.updatePage(projectId, pageId, data, req['userId']);
  }

  @Delete(':pageId')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles('editor', 'owner')
  deletePage(
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Req() req: any,
  ) {
    return this.pageService.deletePage(projectId, pageId, req['userId']);
  }

  @Get(':pageId/my-role')
  @UseGuards(ProjectRoleGuard)
  @ProjectRoles('viewer', 'editor', 'owner')
  getMyRole(@Param('pageId') pageId: string, @Req() req) {
    return this.pageService.getMyRole(pageId, req['userId']);
  }
}
