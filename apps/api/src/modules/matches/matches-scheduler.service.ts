import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchStatus } from '@prisma/client';

const MAX_LIVE_DURATION_HOURS = 4;

@Injectable()
export class MatchesSchedulerService {
  private readonly logger = new Logger(MatchesSchedulerService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async autoEndStaleLiveMatches() {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - MAX_LIVE_DURATION_HOURS);

    const staleMatches = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.live,
        isLive: true,
        startTime: { lt: cutoffTime },
      },
      select: { id: true, startTime: true, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
    });

    if (staleMatches.length === 0) {
      return;
    }

    this.logger.warn(`Found ${staleMatches.length} stale live matches that started more than ${MAX_LIVE_DURATION_HOURS} hours ago`);

    const result = await this.prisma.match.updateMany({
      where: {
        id: { in: staleMatches.map((m) => m.id) },
      },
      data: {
        status: MatchStatus.finished,
        isLive: false,
        bettingEnabled: false,
      },
    });

    this.logger.log(`Auto-ended ${result.count} stale live matches`);

    for (const match of staleMatches) {
      this.logger.log(`  - ${match.homeTeam.name} vs ${match.awayTeam.name} (started: ${match.startTime.toISOString()})`);
    }
  }
}
