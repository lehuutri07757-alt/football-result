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
exports.LeaguesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const leagues_service_1 = require("./leagues.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const dto_1 = require("./dto");
let LeaguesController = class LeaguesController {
    constructor(leaguesService) {
        this.leaguesService = leaguesService;
    }
    async findAll(query) {
        return this.leaguesService.findAll(query);
    }
    async findFeatured() {
        return this.leaguesService.findFeatured();
    }
    async findBySport(sportId) {
        return this.leaguesService.findBySport(sportId);
    }
    async findOne(id) {
        return this.leaguesService.findOne(id);
    }
    async create(createLeagueDto) {
        return this.leaguesService.create(createLeagueDto);
    }
    async update(id, updateLeagueDto) {
        return this.leaguesService.update(id, updateLeagueDto);
    }
    async remove(id) {
        return this.leaguesService.remove(id);
    }
    async toggleActive(id) {
        return this.leaguesService.toggleActive(id);
    }
    async toggleFeatured(id) {
        return this.leaguesService.toggleFeatured(id);
    }
    async inactiveAll() {
        return this.leaguesService.inactiveAll();
    }
    async reorder(reorderDto) {
        return this.leaguesService.reorder(reorderDto);
    }
};
exports.LeaguesController = LeaguesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all leagues with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of leagues' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryLeagueDto]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('featured'),
    (0, swagger_1.ApiOperation)({ summary: 'Get featured leagues' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of featured leagues' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "findFeatured", null);
__decorate([
    (0, common_1.Get)('sport/:sportId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get leagues by sport' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of leagues for a sport' }),
    __param(0, (0, common_1.Param)('sportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "findBySport", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get league by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'League details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new league (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'League created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateLeagueDto]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update league' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'League updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateLeagueDto]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete league' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'League deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/toggle-active'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle league active status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'League status toggled' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Post)(':id/toggle-featured'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle league featured status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'League featured status toggled' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "toggleFeatured", null);
__decorate([
    (0, common_1.Post)('inactive-all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Set all leagues to inactive (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All leagues set to inactive' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "inactiveAll", null);
__decorate([
    (0, common_1.Post)('reorder'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reorder leagues' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Leagues reordered successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ReorderLeaguesDto]),
    __metadata("design:returntype", Promise)
], LeaguesController.prototype, "reorder", null);
exports.LeaguesController = LeaguesController = __decorate([
    (0, swagger_1.ApiTags)('Leagues'),
    (0, common_1.Controller)('leagues'),
    __metadata("design:paramtypes", [leagues_service_1.LeaguesService])
], LeaguesController);
//# sourceMappingURL=leagues.controller.js.map