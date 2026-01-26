import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateDataProviderDto,
  UpdateDataProviderDto,
  QueryDataProviderDto,
  DataProviderType,
} from './dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });
    return setting?.value ?? null;
  }

  async set(key: string, value: any, updatedBy?: string) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value, updatedBy },
      create: { key, value, updatedBy },
    });
  }

  async getAll(category?: string) {
    return this.prisma.setting.findMany({
      where: category ? { category } : undefined,
      orderBy: { key: 'asc' },
    });
  }

  async getPublicSettings() {
    return this.prisma.setting.findMany({
      where: { isPublic: true },
      orderBy: { key: 'asc' },
    });
  }

  async isRegistrationEnabled(): Promise<boolean> {
    const setting = await this.get('auth.registration_enabled');
    return setting !== false;
  }

  async toggleRegistration(enabled: boolean, updatedBy?: string) {
    return this.set('auth.registration_enabled', enabled, updatedBy);
  }

  async createDataProvider(dto: CreateDataProviderDto) {
    const existing = await this.prisma.dataProvider.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Provider with code '${dto.code}' already exists`);
    }

    return this.prisma.dataProvider.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        types: dto.types,
        baseUrl: dto.baseUrl,
        apiKey: dto.apiKey,
        apiSecret: dto.apiSecret,
        headers: (dto.headers ?? {}) as Prisma.InputJsonValue,
        config: (dto.config ?? {}) as Prisma.InputJsonValue,
        status: dto.status ?? 'inactive',
        priority: dto.priority ?? 0,
        dailyLimit: dto.dailyLimit,
        monthlyLimit: dto.monthlyLimit,
      },
    });
  }

  async updateDataProvider(id: string, dto: UpdateDataProviderDto) {
    const provider = await this.prisma.dataProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with id '${id}' not found`);
    }

    return this.prisma.dataProvider.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.types !== undefined && { types: dto.types }),
        ...(dto.baseUrl !== undefined && { baseUrl: dto.baseUrl }),
        ...(dto.apiKey !== undefined && { apiKey: dto.apiKey }),
        ...(dto.apiSecret !== undefined && { apiSecret: dto.apiSecret }),
        ...(dto.headers !== undefined && { headers: dto.headers as Prisma.InputJsonValue }),
        ...(dto.config !== undefined && { config: dto.config as Prisma.InputJsonValue }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.dailyLimit !== undefined && { dailyLimit: dto.dailyLimit }),
        ...(dto.monthlyLimit !== undefined && { monthlyLimit: dto.monthlyLimit }),
      },
    });
  }

  async getDataProviders(query: QueryDataProviderDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.types = { has: query.type as DataProviderType };
    }

    return this.prisma.dataProvider.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        types: true,
        baseUrl: true,
        status: true,
        priority: true,
        healthScore: true,
        dailyLimit: true,
        dailyUsage: true,
        monthlyLimit: true,
        monthlyUsage: true,
        lastSyncAt: true,
        lastErrorAt: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getDataProvider(id: string) {
    const provider = await this.prisma.dataProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with id '${id}' not found`);
    }

    return provider;
  }

  async getDataProviderByCode(code: string) {
    const provider = await this.prisma.dataProvider.findUnique({
      where: { code },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with code '${code}' not found`);
    }

    return provider;
  }

  async deleteDataProvider(id: string) {
    const provider = await this.prisma.dataProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with id '${id}' not found`);
    }

    return this.prisma.dataProvider.delete({
      where: { id },
    });
  }

  async toggleDataProviderStatus(id: string, status: 'active' | 'inactive') {
    const provider = await this.prisma.dataProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with id '${id}' not found`);
    }

    return this.prisma.dataProvider.update({
      where: { id },
      data: { status },
    });
  }

  async resetProviderUsage(id: string, type: 'daily' | 'monthly' | 'both') {
    const provider = await this.prisma.dataProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with id '${id}' not found`);
    }

    const updateData: any = {};

    if (type === 'daily' || type === 'both') {
      updateData.dailyUsage = 0;
      updateData.dailyResetAt = new Date();
    }

    if (type === 'monthly' || type === 'both') {
      updateData.monthlyUsage = 0;
      updateData.monthlyResetAt = new Date();
    }

    return this.prisma.dataProvider.update({
      where: { id },
      data: updateData,
    });
  }

  async resetProviderHealth(id: string) {
    const provider = await this.prisma.dataProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with id '${id}' not found`);
    }

    return this.prisma.dataProvider.update({
      where: { id },
      data: {
        healthScore: 100,
        lastError: null,
        lastErrorAt: null,
      },
    });
  }
}
