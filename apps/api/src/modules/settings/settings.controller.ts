import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateDataProviderDto,
  UpdateDataProviderDto,
  QueryDataProviderDto,
} from './dto';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('public')
  @ApiOperation({ summary: 'Get public settings' })
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @Get('registration-status')
  @ApiOperation({ summary: 'Check if registration is enabled' })
  async getRegistrationStatus() {
    const enabled = await this.settingsService.isRegistrationEnabled();
    return { registrationEnabled: enabled };
  }

  @UseGuards(JwtAuthGuard)
  @Post('toggle-registration')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle registration on/off (Admin only)' })
  async toggleRegistration(@Request() req: any, @Body() body: { enabled: boolean }) {
    return this.settingsService.toggleRegistration(body.enabled, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all settings (Admin only)' })
  async getAllSettings() {
    return this.settingsService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('data-providers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all data providers' })
  async getDataProviders(@Query() query: QueryDataProviderDto) {
    return this.settingsService.getDataProviders(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('data-providers/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get data provider by ID' })
  async getDataProvider(@Param('id') id: string) {
    return this.settingsService.getDataProvider(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('data-providers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new data provider' })
  async createDataProvider(@Body() dto: CreateDataProviderDto) {
    return this.settingsService.createDataProvider(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('data-providers/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a data provider' })
  async updateDataProvider(@Param('id') id: string, @Body() dto: UpdateDataProviderDto) {
    return this.settingsService.updateDataProvider(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('data-providers/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a data provider' })
  async deleteDataProvider(@Param('id') id: string) {
    return this.settingsService.deleteDataProvider(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('data-providers/:id/toggle')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle data provider status (active/inactive)' })
  async toggleDataProviderStatus(
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'inactive' },
  ) {
    return this.settingsService.toggleDataProviderStatus(id, body.status);
  }

  @UseGuards(JwtAuthGuard)
  @Post('data-providers/:id/reset-usage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset provider usage counters' })
  async resetProviderUsage(
    @Param('id') id: string,
    @Body() body: { type: 'daily' | 'monthly' | 'both' },
  ) {
    return this.settingsService.resetProviderUsage(id, body.type);
  }

  @UseGuards(JwtAuthGuard)
  @Post('data-providers/:id/reset-health')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset provider health score' })
  async resetProviderHealth(@Param('id') id: string) {
    return this.settingsService.resetProviderHealth(id);
  }
}
