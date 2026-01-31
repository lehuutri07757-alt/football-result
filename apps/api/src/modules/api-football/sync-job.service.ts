import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { PrismaService } from '@/prisma/prisma.service';
import {
  SyncJobType,
  SyncJobStatus,
  SyncJobPriority,
  CreateSyncJobDto,
  UpdateSyncJobDto,
  SyncJobFilter,
  SyncJobStats,
  SyncJobResult,
  SYNC_QUEUE_NAME,
  SYNC_JOB_OPTIONS,
} from './interfaces';

@Injectable()
export class SyncJobService {
  private readonly logger = new Logger(SyncJobService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(SYNC_QUEUE_NAME) private readonly syncQueue: Queue,
  ) {}

  async createJob(dto: CreateSyncJobDto): Promise<string> {
    const existingPendingJob = await this.prisma.syncJob.findFirst({
      where: {
        type: dto.type as any,
        status: { in: ['pending', 'processing'] },
      },
    });

    if (existingPendingJob) {
      this.logger.warn(`Job type ${dto.type} already pending/processing, skipping creation`);
      return existingPendingJob.id;
    }

    const syncJob = await this.prisma.syncJob.create({
      data: {
        type: dto.type as any,
        params: (dto.params || {}) as object,
        priority: (dto.priority || SyncJobPriority.normal) as any,
        scheduledAt: dto.scheduledAt,
        parentJobId: dto.parentJobId,
        triggeredBy: dto.triggeredBy || 'api',
      },
    });

    const jobOptions = SYNC_JOB_OPTIONS[dto.type];
    const bullJob = await this.syncQueue.add(
      dto.type,
      { syncJobId: syncJob.id, type: dto.type, params: dto.params || {} },
      {
        ...jobOptions,
        delay: dto.scheduledAt ? new Date(dto.scheduledAt).getTime() - Date.now() : undefined,
        jobId: syncJob.id,
      },
    );

    await this.prisma.syncJob.update({
      where: { id: syncJob.id },
      data: { bullJobId: bullJob.id.toString() },
    });

    this.logger.log(`Created sync job: ${syncJob.id} (${dto.type})`);
    return syncJob.id;
  }

  async updateJob(id: string, dto: UpdateSyncJobDto): Promise<void> {
    await this.prisma.syncJob.update({
      where: { id },
      data: {
        status: dto.status as any,
        progress: dto.progress,
        totalItems: dto.totalItems,
        processedItems: dto.processedItems,
        result: dto.result as any,
        errorMessage: dto.errorMessage,
        errorStack: dto.errorStack,
        startedAt: dto.startedAt,
        completedAt: dto.completedAt,
        bullJobId: dto.bullJobId,
      },
    });
  }

  async markAsProcessing(id: string): Promise<void> {
    await this.updateJob(id, {
      status: SyncJobStatus.processing,
      startedAt: new Date(),
    });
  }

  async markAsCompleted(id: string, result: SyncJobResult): Promise<void> {
    await this.updateJob(id, {
      status: SyncJobStatus.completed,
      completedAt: new Date(),
      progress: 100,
      result,
    });
  }

  async markAsFailed(id: string, error: Error): Promise<void> {
    const job = await this.prisma.syncJob.findUnique({ where: { id } });
    const newRetryCount = (job?.retryCount || 0) + 1;

    await this.prisma.syncJob.update({
      where: { id },
      data: {
        status: 'failed' as any,
        completedAt: new Date(),
        errorMessage: error.message,
        errorStack: error.stack,
        retryCount: newRetryCount,
      },
    });
  }

  async getJob(id: string) {
    return this.prisma.syncJob.findUnique({ where: { id } });
  }

  async getJobs(filter: SyncJobFilter = {}) {
    const where: any = {};

    if (filter.type) where.type = filter.type;
    if (filter.status) {
      where.status = Array.isArray(filter.status) 
        ? { in: filter.status } 
        : filter.status;
    }
    if (filter.priority) where.priority = filter.priority;
    if (filter.triggeredBy) where.triggeredBy = filter.triggeredBy;
    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) where.createdAt.gte = filter.dateFrom;
      if (filter.dateTo) where.createdAt.lte = filter.dateTo;
    }

    return this.prisma.syncJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter.limit || 50,
      skip: filter.offset || 0,
    });
  }

  async getStats(): Promise<SyncJobStats> {
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
    }, {} as Record<string, number>);

    const byType = byTypeRaw.reduce((acc, item) => {
      acc[item.type] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const durations = completedJobs
      .filter(j => j.startedAt && j.completedAt)
      .map(j => new Date(j.completedAt!).getTime() - new Date(j.startedAt!).getTime());
    
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
        type: e.type as SyncJobType,
        errorMessage: e.errorMessage || '',
        createdAt: e.createdAt,
      })),
    };
  }

  async cancelJob(id: string): Promise<boolean> {
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
      data: { status: 'cancelled' as any },
    });

    return true;
  }

  async forceReleaseJob(id: string): Promise<boolean> {
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
      } catch (error) {
        this.logger.warn(`Failed to remove Bull job ${job.bullJobId}: ${error}`);
      }
    }

    await this.prisma.syncJob.update({
      where: { id },
      data: { 
        status: 'cancelled' as any,
        completedAt: new Date(),
        errorMessage: 'Force released by admin',
      },
    });

    this.logger.log(`Force released job: ${id} (${job.type})`);
    return true;
  }

  async forceReleaseByType(type: SyncJobType): Promise<number> {
    const stuckJobs = await this.prisma.syncJob.findMany({
      where: {
        type: type as any,
        status: { in: ['pending', 'processing'] },
      },
    });

    let releasedCount = 0;
    for (const job of stuckJobs) {
      const success = await this.forceReleaseJob(job.id);
      if (success) releasedCount++;
    }

    this.logger.log(`Force released ${releasedCount} ${type} jobs`);
    return releasedCount;
  }

  async retryJob(id: string): Promise<string | null> {
    const job = await this.prisma.syncJob.findUnique({ where: { id } });
    if (!job || job.status !== 'failed') {
      return null;
    }

    return this.createJob({
      type: job.type as SyncJobType,
      params: job.params as any,
      priority: job.priority as SyncJobPriority,
      triggeredBy: 'manual',
    });
  }

  async cleanupOldJobs(olderThanDays = 7): Promise<number> {
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

  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.syncQueue.getWaitingCount(),
      this.syncQueue.getActiveCount(),
      this.syncQueue.getCompletedCount(),
      this.syncQueue.getFailedCount(),
      this.syncQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }
}
