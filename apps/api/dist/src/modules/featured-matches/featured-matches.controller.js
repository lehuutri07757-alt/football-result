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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturedMatchesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const featured_matches_service_1 = require("./featured-matches.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let FeaturedMatchesController = class FeaturedMatchesController {
    constructor(featuredMatchesService) {
        this.featuredMatchesService = featuredMatchesService;
    }
    async getFeaturedMatches() {
        return this.featuredMatchesService.getFeaturedMatches();
    }
    async getSettings() {
        return this.featuredMatchesService.getSettings();
    }
    async updateSettings(settings) {
        return this.featuredMatchesService.updateSettings(settings);
    }
    async getStats() {
        return this.featuredMatchesService.getStats();
    }
    async autoSelect() {
        return this.featuredMatchesService.autoSelectFeaturedMatches();
    }
    async toggleFeatured(matchId) {
        return this.featuredMatchesService.toggleMatchFeatured(matchId);
    }
    async batchUpdate(body) {
        return this.featuredMatchesService.batchUpdateFeatured(body.matchIds, body.featured);
    }
    async getAvailableLeagues() {
        return this.featuredMatchesService.getAvailableLeagues();
    }
    async getAvailableTeams(leagueId) {
        return this.featuredMatchesService.getAvailableTeams(leagueId);
    }
};
exports.FeaturedMatchesController = FeaturedMatchesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get featured matches based on settings criteria' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of featured matches' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeaturedMatchesController.prototype, "getFeaturedMatches", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get featured matches settings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeaturedMatchesController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update featured matches settings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated settings' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FeaturedMatchesController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get featured matches statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeaturedMatchesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('auto-select'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Auto-select featured matches based on criteria' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Number of matches updated' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeaturedMatchesController.prototype, "autoSelect", null);
__decorate([
    (0, common_1.Post)('toggle/:matchId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle featured status for a match' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated match' }),
    __param(0, (0, common_1.Param)('matchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeaturedMatchesController.prototype, "toggleFeatured", null);
__decorate([
    (0, common_1.Post)('batch-update'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Batch update featured status for multiple matches' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Number of matches updated' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FeaturedMatchesController.prototype, "batchUpdate", null);
__decorate([
    (0, common_1.Get)('available-leagues'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get available leagues for featured selection' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of leagues' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeaturedMatchesController.prototype, "getAvailableLeagues", null);
__decorate([
    (0, common_1.Get)('available-teams'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get available teams for top teams selection' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of teams' }),
    __param(0, (0, common_1.Query)('leagueId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FeaturedMatchesController.prototype, "getAvailableTeams", null);
exports.FeaturedMatchesController = FeaturedMatchesController = __decorate([
    (0, swagger_1.ApiTags)('Featured Matches'),
    (0, common_1.Controller)('featured-matches'),
    __metadata("design:paramtypes", [featured_matches_service_1.FeaturedMatchesService])
], FeaturedMatchesController);
//# sourceMappingURL=featured-matches.controller.js.map