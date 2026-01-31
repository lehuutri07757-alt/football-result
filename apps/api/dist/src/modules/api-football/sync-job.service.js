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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SyncJobService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncJobService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../prisma/prisma.service");
const interfaces_1 = require("./interfaces");
let SyncJobService = SyncJobService_1 = class SyncJobService {
    constructor(prisma, syncQueue) {
        this.prisma = prisma;
        this.syncQueue = syncQueue;
        this.logger = new common_1.Logger(SyncJobService_1.name);
    }
    async createJob(dto) {
        const existingPendingJob = await this.prisma.syncJob.findFirst({
            where: {
                type: dto.type,
                status: { in: ['pending', 'processing'] },
            },
        });
        if (existingPendingJob) {
            this.logger.warn(`Job type ${dto.type} already pending/processing, skipping creation`);
            return existingPendingJob.id;
        }
        const syncJob = await this.prisma.syncJob.create({
            data: {
                type: dto.type,
                params: (dto.params || {}),
                priority: (dto.priority || interfaces_1.SyncJobPriority.normal),
                scheduledAt: dto.scheduledAt,
                parentJobId: dto.parentJobId,
                triggeredBy: dto.triggeredBy || 'api',
            },
        });
        const jobOptions = interfaces_1.SYNC_JOB_OPTIONS[dto.type];
        const bullJob = await this.syncQueue.add(dto.type, { syncJobId: syncJob.id, type: dto.type, params: dto.params || {} }, {
            ...jobOptions,
            delay: dto.scheduledAt ? new Date(dto.scheduledAt).getTime() - Date.now() : undefined,
            jobId: syncJob.id,
        });
        await this.prisma.syncJob.update({
            where: { id: syncJob.id },
            data: { bullJobId: bullJob.id.toString() },
        });
        this.logger.log(`Created sync job: ${syncJob.id} (${dto.type})`);
        return syncJob.id;
    }
    async updateJob(id, dto) {
        await this.prisma.syncJob.update({
            where: { id },
            data: {
                status: dto.status,
                progress: dto.progress,
                totalItems: dto.totalItems,
                processedItems: dto.processedItems,
                result: dto.result,
                errorMessage: dto.errorMessage,
                errorStack: dto.errorStack,
                startedAt: dto.startedAt,
                completedAt: dto.completedAt,
                bullJobId: dto.bullJobId,
            },
        });
    }
    async markAsProcessing(id) {
        await this.updateJob(id, {
            status: interfaces_1.SyncJobStatus.processing,
            startedAt: new Date(),
        });
    }
    async markAsCompleted(id, result) {
        await this.updateJob(id, {
            status: interfaces_1.SyncJobStatus.completed,
            completedAt: new Date(),
            progress: 100,
            result,
        });
    }
    async markAsFailed(id, error) {
        const job = await this.prisma.syncJob.findUnique({ where: { id } });
        const newRetryCount = (job?.retryCount || 0) + 1;
        await this.prisma.syncJob.update({
            where: { id },
            data: {
                status: 'failed',
                completedAt: new Date(),
                errorMessage: error.message,
                errorStack: error.stack,
                retryCount: newRetryCount,
            },
        });
    }
    async getJob(id) {
        return this.prisma.syncJob.findUnique({ where: { id } });
    }
    async getJobs(filter = {}) {
        const where = {};
        if (filter.type)
            where.type = filter.type;
        if (filter.status) {
            where.status = Array.isArray(filter.status)
                ? { in: filter.status }
                : filter.status;
        }
        if (filter.priority)
            where.priority = filter.priority;
        if (filter.triggeredBy)
            where.triggeredBy = filter.triggeredBy;
        if (filter.dateFrom || filter.dateTo) {
            where.createdAt = {};
            if (filter.dateFrom)
                where.createdAt.gte = filter.dateFrom;
            if (filter.dateTo)
                where.createdAt.lte = filter.dateTo;
        }
        return this.prisma.syncJob.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: filter.limit || 50,
            skip: filter.offset || 0,
        });
    }
    async getStats() {
        const [total, byStatusRaw, byTypeRaw, completedJobs, recentErrors] = await Promise.all([
            this.prisma.syncJob.count(),
            this.prisma.syncJob.groupBy({
                by: ['status'],
                _count: { id: true },
            }),
            this.prisma.syncJob.groupBy({
                by: ['type'],
                _count: { id: true },
            }),
            this.prisma.syncJob.findMany({
                where: { status: 'completed', completedAt: { not: null }, startedAt: { not: null } },
                select: { startedAt: true, completedAt: true },
                take: 100,
            }),
            this.prisma.syncJob.findMany({
                where: { status: 'failed', errorMessage: { not: null } },
                select: { id: true, type: true, errorMessage: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);
        const byStatus = byStatusRaw.reduce((acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
        }, {});
        const byType = byTypeRaw.reduce((acc, item) => {
            acc[item.type] = item._count.id;
            return acc;
        }, {});
        const durations = completedJobs
            .filter(j => j.startedAt && j.completedAt)
            .map(j => new Date(j.completedAt).getTime() - new Date(j.startedAt).getTime());
        const avgDurationMs = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;
        const successRate = total > 0
            ? ((byStatus['completed'] || 0) / total) * 100
            : 0;
        return {
            total,
            byStatus,
            byType,
            avgDurationMs,
            successRate,
            recentErrors: recentErrors.map(e => ({
                id: e.id,
                type: e.type,
                errorMessage: e.errorMessage || '',
                createdAt: e.createdAt,
            })),
        };
    }
    async cancelJob(id) {
        const job = await this.prisma.syncJob.findUnique({ where: { id } });
        if (!job || job.status !== 'pending') {
            return false;
        }
        if (job.bullJobId) {
            const bullJob = await this.syncQueue.getJob(job.bullJobId);
            if (bullJob) {
                await bullJob.remove();
            }
        }
        await this.prisma.syncJob.update({
            where: { id },
            data: { status: 'cancelled' },
        });
        return true;
    }
    async forceReleaseJob(id) {
        const job = await this.prisma.syncJob.findUnique({ where: { id } });
        if (!job) {
            return false;
        }
        const isStuckJob = ['pending', 'processing'].includes(job.status);
        if (!isStuckJob) {
            return false;
        }
        if (job.bullJobId) {
            try {
                const bullJob = await this.syncQueue.getJob(job.bullJobId);
                if (bullJob) {
                    await bullJob.remove();
                    this.logger.log(`Removed Bull job ${job.bullJobId} from queue`);
                }
            }
            catch (error) {
                this.logger.warn(`Failed to remove Bull job ${job.bullJobId}: ${error}`);
            }
        }
        await this.prisma.syncJob.update({
            where: { id },
            data: {
                status: 'cancelled',
                completedAt: new Date(),
                errorMessage: 'Force released by admin',
            },
        });
        this.logger.log(`Force released job: ${id} (${job.type})`);
        return true;
    }
    async forceReleaseByType(type) {
        const stuckJobs = await this.prisma.syncJob.findMany({
            where: {
                type: type,
                status: { in: ['pending', 'processing'] },
            },
        });
        let releasedCount = 0;
        for (const job of stuckJobs) {
            const success = await this.forceReleaseJob(job.id);
            if (success)
                releasedCount++;
        }
        this.logger.log(`Force released ${releasedCount} ${type} jobs`);
        return releasedCount;
    }
    async retryJob(id) {
        const job = await this.prisma.syncJob.findUnique({ where: { id } });
        if (!job || job.status !== 'failed') {
            return null;
        }
        return this.createJob({
            type: job.type,
            params: job.params,
            priority: job.priority,
            triggeredBy: 'manual',
        });
    }
    async cleanupOldJobs(olderThanDays = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const result = await this.prisma.syncJob.deleteMany({
            where: {
                status: { in: ['completed', 'cancelled', 'failed'] },
                createdAt: { lt: cutoffDate },
            },
        });
        this.logger.log(`Cleaned up ${result.count} old sync jobs`);
        return result.count;
    }
    async getQueueStatus() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.syncQueue.getWaitingCount(),
            this.syncQueue.getActiveCount(),
            this.syncQueue.getCompletedCount(),
            this.syncQueue.getFailedCount(),
            this.syncQueue.getDelayedCount(),
        ]);
        return { waiting, active, completed, failed, delayed };
    }
};
exports.SyncJobService = SyncJobService;
exports.SyncJobService = SyncJobService = SyncJobService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)(interfaces_1.SYNC_QUEUE_NAME)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], SyncJobService);
//# sourceMappingURL=sync-job.service.js.map