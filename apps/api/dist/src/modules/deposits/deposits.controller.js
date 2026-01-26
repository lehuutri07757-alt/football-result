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
exports.DepositsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const deposits_service_1 = require("./deposits.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const dto_1 = require("./dto");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const decorators_1 = require("../auth/decorators");
const permissions_1 = require("../roles/constants/permissions");
let DepositsController = class DepositsController {
    constructor(depositsService) {
        this.depositsService = depositsService;
    }
    async findAll(query) {
        return this.depositsService.findAll(query);
    }
    async getStats() {
        return this.depositsService.getStats();
    }
    async getMyDeposits(req, page, limit) {
        return this.depositsService.findByUser(req.user.sub, page ? parseInt(page) : 1, limit ? parseInt(limit) : 10);
    }
    async create(req, createDto) {
        return this.depositsService.create(req.user.sub, createDto);
    }
    async findOne(id) {
        return this.depositsService.findById(id);
    }
    async process(req, id, processDto) {
        return this.depositsService.process(id, processDto, req.user.sub);
    }
    async cancel(req, id) {
        return this.depositsService.cancel(id, req.user.sub);
    }
};
exports.DepositsController = DepositsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all deposit requests (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of deposit requests' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.DEPOSITS.READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryDepositDto]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get deposit statistics (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Deposit statistics' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.DEPOSITS.READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get my deposit requests' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User deposit requests' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "getMyDeposits", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create deposit request' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Deposit request created' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateDepositDto]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get deposit request by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Deposit request details' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.DEPOSITS.READ),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/process'),
    (0, swagger_1.ApiOperation)({ summary: 'Process deposit request (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Deposit processed' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.DEPOSITS.APPROVE, permissions_1.PERMISSIONS.DEPOSITS.REJECT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.ProcessDepositDto]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "process", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel deposit request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Deposit cancelled' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DepositsController.prototype, "cancel", null);
exports.DepositsController = DepositsController = __decorate([
    (0, swagger_1.ApiTags)('Deposits'),
    (0, common_1.Controller)('deposits'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [deposits_service_1.DepositsService])
], DepositsController);
//# sourceMappingURL=deposits.controller.js.map