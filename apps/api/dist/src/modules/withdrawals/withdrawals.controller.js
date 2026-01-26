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
exports.WithdrawalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const withdrawals_service_1 = require("./withdrawals.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const dto_1 = require("./dto");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const decorators_1 = require("../auth/decorators");
const permissions_1 = require("../roles/constants/permissions");
let WithdrawalsController = class WithdrawalsController {
    constructor(withdrawalsService) {
        this.withdrawalsService = withdrawalsService;
    }
    async findAll(query) {
        return this.withdrawalsService.findAll(query);
    }
    async getStats() {
        return this.withdrawalsService.getStats();
    }
    async getMyWithdrawals(req, page, limit) {
        return this.withdrawalsService.findByUser(req.user.sub, page ? parseInt(page) : 1, limit ? parseInt(limit) : 10);
    }
    async create(req, createDto) {
        return this.withdrawalsService.create(req.user.sub, createDto);
    }
    async findOne(id) {
        return this.withdrawalsService.findById(id);
    }
    async process(req, id, processDto) {
        return this.withdrawalsService.process(id, processDto, req.user.sub);
    }
    async cancel(req, id) {
        return this.withdrawalsService.cancel(id, req.user.sub);
    }
};
exports.WithdrawalsController = WithdrawalsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all withdrawal requests (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of withdrawal requests' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.WITHDRAWALS.READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryWithdrawalDto]),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get withdrawal statistics (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Withdrawal statistics' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.WITHDRAWALS.READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my withdrawal requests' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User withdrawal requests' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "getMyWithdrawals", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create withdrawal request' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Withdrawal request created' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateWithdrawalDto]),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get withdrawal request by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Withdrawal request details' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.WITHDRAWALS.READ),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/process'),
    (0, swagger_1.ApiOperation)({ summary: 'Process withdrawal request (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Withdrawal processed' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.WITHDRAWALS.APPROVE, permissions_1.PERMISSIONS.WITHDRAWALS.REJECT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.ProcessWithdrawalDto]),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "process", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel withdrawal request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Withdrawal cancelled' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WithdrawalsController.prototype, "cancel", null);
exports.WithdrawalsController = WithdrawalsController = __decorate([
    (0, swagger_1.ApiTags)('Withdrawals'),
    (0, common_1.Controller)('withdrawals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [withdrawals_service_1.WithdrawalsService])
], WithdrawalsController);
//# sourceMappingURL=withdrawals.controller.js.map