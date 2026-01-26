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
exports.HomeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const home_service_1 = require("./home.service");
const dto_1 = require("./dto");
const home_feed_entity_1 = require("./entities/home-feed.entity");
let HomeController = class HomeController {
    constructor(homeService) {
        this.homeService = homeService;
    }
    async getFeed(query) {
        return this.homeService.getFeed(query);
    }
};
exports.HomeController = HomeController;
__decorate([
    (0, common_1.Get)('feed'),
    (0, swagger_1.ApiOperation)({ summary: 'Get home feed (hot leagues + top live matches + odds snapshot)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: home_feed_entity_1.HomeFeedEntity }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryHomeFeedDto]),
    __metadata("design:returntype", Promise)
], HomeController.prototype, "getFeed", null);
exports.HomeController = HomeController = __decorate([
    (0, swagger_1.ApiTags)('Home'),
    (0, common_1.Controller)('home'),
    __metadata("design:paramtypes", [home_service_1.HomeService])
], HomeController);
//# sourceMappingURL=home.controller.js.map