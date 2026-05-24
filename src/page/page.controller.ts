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
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';
import { PageService } from './page.service';

@Controller('project/:projectId/pages')
@UseGuards(ClerkAuthGuard)
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Get()
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
  createPage(@Param('projectId') projectId: string, @Req() req: any) {
    return this.pageService.createPage(projectId, req['userId']);
  }

  @Patch(':pageId')
  updatePage(
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Body() data: { name: string },
    @Req() req: any,
  ) {
    return this.pageService.updatePage(projectId, pageId, data, req['userId']);
  }

  @Delete(':pageId')
  deletePage(
    @Param('projectId') projectId: string,
    @Param('pageId') pageId: string,
    @Req() req: any,
  ) {
    return this.pageService.deletePage(projectId, pageId, req['userId']);
  }

  @Get(':pageId/my-role')
  getMyRole(@Param('pageId') pageId: string, @Req() req) {
    return this.pageService.getMyRole(pageId, req['userId']);
  }
}
