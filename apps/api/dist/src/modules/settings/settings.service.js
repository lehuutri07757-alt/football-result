"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SettingsService = class SettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async get(key) {
        const setting = await this.prisma.setting.findUnique({
            where: { key },
        });
        return setting?.value ?? null;
    }
    async set(key, value, updatedBy) {
        return this.prisma.setting.upsert({
            where: { key },
            update: { value, updatedBy },
            create: { key, value, updatedBy },
        });
    }
    async getAll(category) {
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
    async isRegistrationEnabled() {
        const setting = await this.get('auth.registration_enabled');
        return setting !== false;
    }
    async toggleRegistration(enabled, updatedBy) {
        return this.set('auth.registration_enabled', enabled, updatedBy);
    }
    async createDataProvider(dto) {
        const existing = await this.prisma.dataProvider.findUnique({
            where: { code: dto.code },
        });
        if (existing) {
            throw new common_1.ConflictException(`Provider with code '${dto.code}' already exists`);
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
                headers: (dto.headers ?? {}),
                config: (dto.config ?? {}),
                status: dto.status ?? 'inactive',
                priority: dto.priority ?? 0,
                dailyLimit: dto.dailyLimit,
                monthlyLimit: dto.monthlyLimit,
            },
        });
    }
    async updateDataProvider(id, dto) {
        const provider = await this.prisma.dataProvider.findUnique({
            where: { id },
        });
        if (!provider) {
            throw new common_1.NotFoundException(`Provider with id '${id}' not found`);
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
                ...(dto.headers !== undefined && { headers: dto.headers }),
                ...(dto.config !== undefined && { config: dto.config }),
                ...(dto.status !== undefined && { status: dto.status }),
                ...(dto.priority !== undefined && { priority: dto.priority }),
                ...(dto.dailyLimit !== undefined && { dailyLimit: dto.dailyLimit }),
                ...(dto.monthlyLimit !== undefined && { monthlyLimit: dto.monthlyLimit }),
            },
        });
    }
    async getDataProviders(query) {
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        if (query.type) {
            where.types = { has: query.type };
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
    async getDataProvider(id) {
        const provider = await this.prisma.dataProvider.findUnique({
            where: { id },
        });
        if (!provider) {
            throw new common_1.NotFoundException(`Provider with id '${id}' not found`);
        }
        return provider;
    }
    async getDataProviderByCode(code) {
        const provider = await this.prisma.dataProvider.findUnique({
            where: { code },
        });
        if (!provider) {
            throw new common_1.NotFoundException(`Provider with code '${code}' not found`);
        }
        return provider;
    }
    async deleteDataProvider(id) {
        const provider = await this.prisma.dataProvider.findUnique({
            where: { id },
        });
        if (!provider) {
            throw new common_1.NotFoundException(`Provider with id '${id}' not found`);
        }
        return this.prisma.dataProvider.delete({
            where: { id },
        });
    }
    async toggleDataProviderStatus(id, status) {
        const provider = await this.prisma.dataProvider.findUnique({
            where: { id },
        });
        if (!provider) {
            throw new common_1.NotFoundException(`Provider with id '${id}' not found`);
        }
        return this.prisma.dataProvider.update({
            where: { id },
            data: { status },
        });
    }
    async resetProviderUsage(id, type) {
        const provider = await this.prisma.dataProvider.findUnique({
            where: { id },
        });
        if (!provider) {
            throw new common_1.NotFoundException(`Provider with id '${id}' not found`);
        }
        const updateData = {};
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
    async resetProviderHealth(id) {
        const provider = await this.prisma.dataProvider.findUnique({
            where: { id },
        });
        if (!provider) {
            throw new common_1.NotFoundException(`Provider with id '${id}' not found`);
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
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map