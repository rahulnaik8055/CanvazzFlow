import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from 'src/auth/clerk.guard';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(ClerkAuthGuard)
export class SearchController {
  constructor(private svc: SearchService) {}

  @Get()
  search(@Req() req, @Query('q') q: string) {
    return this.svc.search(req['userId'], q || '');
  }
}
