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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wallet_service_1 = require("./wallet.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const dto_1 = require("./dto");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const decorators_1 = require("../auth/decorators");
const permissions_1 = require("../roles/constants/permissions");
let WalletController = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    async getMyWallet(req) {
        return this.walletService.getWalletByUserId(req.user.sub);
    }
    async getMyBalance(req) {
        return this.walletService.getBalance(req.user.sub);
    }
    async getMyHistory(req, page, limit) {
        return this.walletService.getBalanceHistory(req.user.sub, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    }
    async transfer(req, transferDto) {
        return this.walletService.transfer(req.user.sub, transferDto);
    }
    async getUserWallet(userId) {
        return this.walletService.getWalletByUserId(userId);
    }
    async getUserBalance(userId) {
        return this.walletService.getBalance(userId);
    }
    async adjustBalance(req, userId, adjustDto) {
        return this.walletService.adjustBalance(userId, adjustDto, req.user.sub);
    }
    async addBonus(userId, body) {
        return this.walletService.addBonus(userId, body.amount, body.description);
    }
    async getUserHistory(userId, page, limit) {
        return this.walletService.getBalanceHistory(userId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user wallet' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User wallet details' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getMyWallet", null);
__decorate([
    (0, common_1.Get)('me/balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user balance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User balance' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getMyBalance", null);
__decorate([
    (0, common_1.Get)('me/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user balance history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Balance history' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getMyHistory", null);
__decorate([
    (0, common_1.Post)('me/transfer'),
    (0, swagger_1.ApiOperation)({ summary: 'Transfer balance to another user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transfer successful' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.TransferDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "transfer", null);
__decorate([
    (0, common_1.Get)('users/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user wallet (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User wallet details' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.WALLET.READ),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getUserWallet", null);
__decorate([
    (0, common_1.Get)('users/:userId/balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user balance (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User balance' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.WALLET.READ),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getUserBalance", null);
__decorate([
    (0, common_1.Post)('users/:userId/adjust'),
    (0, swagger_1.ApiOperation)({ summary: 'Adjust user balance (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Balance adjusted' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.WALLET.ADJUST),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.AdjustBalanceDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "adjustBalance", null);
__decorate([
    (0, common_1.Post)('users/:userId/bonus'),
    (0, swagger_1.ApiOperation)({ summary: 'Add bonus to user (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bonus added' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.WALLET.ADJUST),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "addBonus", null);
__decorate([
    (0, common_1.Get)('users/:userId/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user balance history (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Balance history' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.WALLET.READ),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getUserHistory", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Wallet'),
    (0, common_1.Controller)('wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map