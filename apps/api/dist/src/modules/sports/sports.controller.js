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
exports.SportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sports_service_1 = require("./sports.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const dto_1 = require("./dto");
let SportsController = class SportsController {
    constructor(sportsService) {
        this.sportsService = sportsService;
    }
    async findAll(query) {
        return this.sportsService.findAll(query);
    }
    async findAllActive() {
        return this.sportsService.findAllActive();
    }
    async findOne(id) {
        return this.sportsService.findOne(id);
    }
    async findBySlug(slug) {
        return this.sportsService.findBySlug(slug);
    }
    async create(createSportDto) {
        return this.sportsService.create(createSportDto);
    }
    async update(id, updateSportDto) {
        return this.sportsService.update(id, updateSportDto);
    }
    async remove(id) {
        return this.sportsService.remove(id);
    }
    async toggleActive(id) {
        return this.sportsService.toggleActive(id);
    }
};
exports.SportsController = SportsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all sports with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of sports' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QuerySportDto]),
    __metadata("design:returntype", Promise)
], SportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active sports' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of active sports' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SportsController.prototype, "findAllActive", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get sport by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sport details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SportsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get sport by slug' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sport details' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SportsController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new sport (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Sport created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateSportDto]),
    __metadata("design:returntype", Promise)
], SportsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update sport' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sport updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSportDto]),
    __metadata("design:returntype", Promise)
], SportsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete sport' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sport deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SportsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/toggle-active'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle sport active status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sport status toggled' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SportsController.prototype, "toggleActive", null);
exports.SportsController = SportsController = __decorate([
    (0, swagger_1.ApiTags)('Sports'),
    (0, common_1.Controller)('sports'),
    __metadata("design:paramtypes", [sports_service_1.SportsService])
], SportsController);
//# sourceMappingURL=sports.controller.js.map