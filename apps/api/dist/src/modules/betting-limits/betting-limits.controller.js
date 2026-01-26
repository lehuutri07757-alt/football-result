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
exports.BettingLimitsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const betting_limits_service_1 = require("./betting-limits.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const dto_1 = require("./dto");
let BettingLimitsController = class BettingLimitsController {
    constructor(bettingLimitsService) {
        this.bettingLimitsService = bettingLimitsService;
    }
    async getMyLimits(req) {
        return this.bettingLimitsService.getUserBettingLimits(req.user.sub);
    }
    async getMyStats(req) {
        return this.bettingLimitsService.getUserBettingStats(req.user.sub);
    }
    async validateBet(req, amount) {
        return this.bettingLimitsService.validateBetAmount(req.user.sub, parseFloat(amount));
    }
    async getUserLimits(userId) {
        return this.bettingLimitsService.getUserBettingLimits(userId);
    }
    async updateUserLimits(userId, updateDto) {
        return this.bettingLimitsService.updateUserBettingLimits(userId, updateDto);
    }
    async getUserStats(userId) {
        return this.bettingLimitsService.getUserBettingStats(userId);
    }
    async getAgentLimits(agentId) {
        return this.bettingLimitsService.getAgentBettingLimits(agentId);
    }
    async updateAgentLimits(agentId, updateDto) {
        return this.bettingLimitsService.updateAgentBettingLimits(agentId, updateDto);
    }
};
exports.BettingLimitsController = BettingLimitsController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user betting limits' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User betting limits' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BettingLimitsController.prototype, "getMyLimits", null);
__decorate([
    (0, common_1.Get)('me/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user betting stats and remaining limits' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User betting stats' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BettingLimitsController.prototype, "getMyStats", null);
__decorate([
    (0, common_1.Get)('validate'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate a bet amount for current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Validation result' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BettingLimitsController.prototype, "validateBet", null);
__decorate([
    (0, common_1.Get)('users/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user betting limits (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User betting limits' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BettingLimitsController.prototype, "getUserLimits", null);
__decorate([
    (0, common_1.Put)('users/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user betting limits (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated betting limits' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateBettingLimitsDto]),
    __metadata("design:returntype", Promise)
], BettingLimitsController.prototype, "updateUserLimits", null);
__decorate([
    (0, common_1.Get)('users/:userId/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user betting stats (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User betting stats' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BettingLimitsController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('agents/:agentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent betting limits' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent betting limits' }),
    __param(0, (0, common_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BettingLimitsController.prototype, "getAgentLimits", null);
__decorate([
    (0, common_1.Put)('agents/:agentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update agent betting limits' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated betting limits' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateBettingLimitsDto]),
    __metadata("design:returntype", Promise)
], BettingLimitsController.prototype, "updateAgentLimits", null);
exports.BettingLimitsController = BettingLimitsController = __decorate([
    (0, swagger_1.ApiTags)('Betting Limits'),
    (0, common_1.Controller)('betting-limits'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [betting_limits_service_1.BettingLimitsService])
], BettingLimitsController);
//# sourceMappingURL=betting-limits.controller.js.map