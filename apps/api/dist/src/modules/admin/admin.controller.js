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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const admin_service_1 = require("./admin.service");
const users_service_1 = require("../users/users.service");
const dto_1 = require("../users/dto");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const decorators_1 = require("../auth/decorators");
const permissions_1 = require("../roles/constants/permissions");
let AdminController = class AdminController {
    constructor(adminService, usersService) {
        this.adminService = adminService;
        this.usersService = usersService;
    }
    async getStats() {
        return this.adminService.getStats();
    }
    async getUsers(query) {
        return this.usersService.findAllPaginated(query);
    }
    async getUser(id) {
        const user = await this.usersService.findById(id);
        if (user) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }
    async updateUser(id, updateUserDto) {
        return this.usersService.updateUser(id, updateUserDto);
    }
    async updateUserStatus(id, body) {
        return this.usersService.updateUser(id, { status: body.status });
    }
    async adjustBalance(id, body) {
        return this.adminService.adjustUserBalance(id, body.amount, body.type, body.balanceType, body.reason);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get admin dashboard statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin statistics' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.REPORTS.VIEW),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users with pagination and filters (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of users with pagination' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.USERS.READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryUserDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user details by ID (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User details' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.USERS.READ),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUser", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User updated successfully' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.USERS.UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user status (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User status updated successfully' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.USERS.UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Post)('users/:id/adjust-balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Adjust user balance (Admin)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Balance adjusted successfully' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.USERS.UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "adjustBalance", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        users_service_1.UsersService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map