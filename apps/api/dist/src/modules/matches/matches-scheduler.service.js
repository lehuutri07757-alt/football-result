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
var MatchesSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchesSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const MAX_LIVE_DURATION_HOURS = 4;
let MatchesSchedulerService = MatchesSchedulerService_1 = class MatchesSchedulerService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MatchesSchedulerService_1.name);
    }
    async autoEndStaleLiveMatches() {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - MAX_LIVE_DURATION_HOURS);
        const staleMatches = await this.prisma.match.findMany({
            where: {
                status: client_1.MatchStatus.live,
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
                status: client_1.MatchStatus.finished,
                isLive: false,
                bettingEnabled: false,
            },
        });
        this.logger.log(`Auto-ended ${result.count} stale live matches`);
        for (const match of staleMatches) {
            this.logger.log(`  - ${match.homeTeam.name} vs ${match.awayTeam.name} (started: ${match.startTime.toISOString()})`);
        }
    }
};
exports.MatchesSchedulerService = MatchesSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MatchesSchedulerService.prototype, "autoEndStaleLiveMatches", null);
exports.MatchesSchedulerService = MatchesSchedulerService = MatchesSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MatchesSchedulerService);
//# sourceMappingURL=matches-scheduler.service.js.map