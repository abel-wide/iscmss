import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PaymentStatus } from '@prisma/client';

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('q') q?: string,
    @Query('classId') classId?: string,
    @Query('date') date?: string,
    @Query('subjectId') subjectId?: string,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
  ) {
    return this.searchService.globalSearch({ q, classId, date, subjectId, paymentStatus });
  }
}
