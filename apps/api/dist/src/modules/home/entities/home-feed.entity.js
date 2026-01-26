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
exports.HomeFeedEntity = exports.HomeMatchEntity = exports.OddsSnapshotEntity = exports.HomeLeagueEntity = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class HomeTeamEntity {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HomeTeamEntity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HomeTeamEntity.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], HomeTeamEntity.prototype, "logoUrl", void 0);
class HomeLeagueEntity {
}
exports.HomeLeagueEntity = HomeLeagueEntity;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HomeLeagueEntity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HomeLeagueEntity.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HomeLeagueEntity.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], HomeLeagueEntity.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], HomeLeagueEntity.prototype, "countryCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], HomeLeagueEntity.prototype, "logoUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], HomeLeagueEntity.prototype, "liveMatchCount", void 0);
class OddsSnapshotEntity {
}
exports.OddsSnapshotEntity = OddsSnapshotEntity;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OddsSnapshotEntity.prototype, "betTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OddsSnapshotEntity.prototype, "betTypeCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OddsSnapshotEntity.prototype, "selection", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], OddsSnapshotEntity.prototype, "handicap", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OddsSnapshotEntity.prototype, "oddsValue", void 0);
class HomeMatchEntity {
}
exports.HomeMatchEntity = HomeMatchEntity;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HomeMatchEntity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HomeMatchEntity.prototype, "leagueId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HomeMatchEntity.prototype, "leagueName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HomeMatchEntity.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.MatchStatus }),
    __metadata("design:type", String)
], HomeMatchEntity.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], HomeMatchEntity.prototype, "isLive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], HomeMatchEntity.prototype, "liveMinute", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], HomeMatchEntity.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], HomeMatchEntity.prototype, "homeScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], HomeMatchEntity.prototype, "awayScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: HomeTeamEntity }),
    __metadata("design:type", HomeTeamEntity)
], HomeMatchEntity.prototype, "homeTeam", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: HomeTeamEntity }),
    __metadata("design:type", HomeTeamEntity)
], HomeMatchEntity.prototype, "awayTeam", void 0);
class HomeFeedEntity {
}
exports.HomeFeedEntity = HomeFeedEntity;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [HomeLeagueEntity] }),
    __metadata("design:type", Array)
], HomeFeedEntity.prototype, "hotLeagues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [HomeMatchEntity] }),
    __metadata("design:type", Array)
], HomeFeedEntity.prototype, "topLiveMatches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Odds snapshot keyed by matchId',
        type: 'object',
        additionalProperties: { type: 'array', items: { $ref: '#/components/schemas/OddsSnapshotEntity' } },
    }),
    __metadata("design:type", Object)
], HomeFeedEntity.prototype, "oddsSnapshotByMatchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HomeFeedEntity.prototype, "lastUpdate", void 0);
//# sourceMappingURL=home-feed.entity.js.map