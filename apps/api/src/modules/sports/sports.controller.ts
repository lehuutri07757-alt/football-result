import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SportsService } from './sports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSportDto, UpdateSportDto, QuerySportDto } from './dto';

@ApiTags('Sports')
@Controller('sports')
export class SportsController {
  constructor(private sportsService: SportsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all sports with pagination' })
  @ApiResponse({ status: 200, description: 'List of sports' })
  async findAll(@Query() query: QuerySportDto) {
    return this.sportsService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active sports' })
  @ApiResponse({ status: 200, description: 'List of active sports' })
  async findAllActive() {
    return this.sportsService.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sport by ID' })
  @ApiResponse({ status: 200, description: 'Sport details' })
  async findOne(@Param('id') id: string) {
    return this.sportsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get sport by slug' })
  @ApiResponse({ status: 200, description: 'Sport details' })
  async findBySlug(@Param('slug') slug: string) {
    return this.sportsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new sport (Admin only)' })
  @ApiResponse({ status: 201, description: 'Sport created successfully' })
  async create(@Body() createSportDto: CreateSportDto) {
    return this.sportsService.create(createSportDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update sport' })
  @ApiResponse({ status: 200, description: 'Sport updated successfully' })
  async update(@Param('id') id: string, @Body() updateSportDto: UpdateSportDto) {
    return this.sportsService.update(id, updateSportDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete sport' })
  @ApiResponse({ status: 200, description: 'Sport deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.sportsService.remove(id);
  }

  @Post(':id/toggle-active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle sport active status' })
  @ApiResponse({ status: 200, description: 'Sport status toggled' })
  async toggleActive(@Param('id') id: string) {
    return this.sportsService.toggleActive(id);
  }
}
