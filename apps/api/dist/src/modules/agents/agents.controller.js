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
exports.AgentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const agents_service_1 = require("./agents.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const dto_1 = require("./dto");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const decorators_1 = require("../auth/decorators");
const permissions_1 = require("../roles/constants/permissions");
let AgentsController = class AgentsController {
    constructor(agentsService) {
        this.agentsService = agentsService;
    }
    async findAll(query) {
        return this.agentsService.findAll(query);
    }
    async create(createAgentDto) {
        return this.agentsService.create(createAgentDto);
    }
    async findOne(id) {
        return this.agentsService.findById(id);
    }
    async update(id, updateAgentDto) {
        return this.agentsService.update(id, updateAgentDto);
    }
    async delete(id) {
        return this.agentsService.delete(id);
    }
    async getTree(id) {
        return this.agentsService.getAgentTree(id);
    }
    async getDownline(id, page, limit) {
        return this.agentsService.getDownlineUsers(id, page ? parseInt(page) : 1, limit ? parseInt(limit) : 10);
    }
    async getStats(id) {
        return this.agentsService.getAgentStats(id);
    }
};
exports.AgentsController = AgentsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all agents with pagination and filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of agents' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.AGENTS.READ),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryAgentDto]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new agent' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Agent created successfully' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.AGENTS.CREATE),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateAgentDto]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent details' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.AGENTS.READ),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update agent' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent updated successfully' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.AGENTS.UPDATE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateAgentDto]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete agent' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent deleted successfully' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.AGENTS.DELETE),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)(':id/tree'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent hierarchy tree' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent tree structure' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.AGENTS.READ),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "getTree", null);
__decorate([
    (0, common_1.Get)(':id/downline'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent downline users' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of downline users' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.AGENTS.MANAGE_DOWNLINE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "getDownline", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent statistics' }),
    (0, decorators_1.RequirePermissions)(permissions_1.PERMISSIONS.AGENTS.READ),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "getStats", null);
exports.AgentsController = AgentsController = __decorate([
    (0, swagger_1.ApiTags)('Agents'),
    (0, common_1.Controller)('agents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [agents_service_1.AgentsService])
], AgentsController);
//# sourceMappingURL=agents.controller.js.map