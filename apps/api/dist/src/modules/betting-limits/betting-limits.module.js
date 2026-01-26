"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BettingLimitsModule = void 0;
const common_1 = require("@nestjs/common");
const betting_limits_controller_1 = require("./betting-limits.controller");
const betting_limits_service_1 = require("./betting-limits.service");
const prisma_module_1 = require("../../prisma/prisma.module");
let BettingLimitsModule = class BettingLimitsModule {
};
exports.BettingLimitsModule = BettingLimitsModule;
exports.BettingLimitsModule = BettingLimitsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [betting_limits_controller_1.BettingLimitsController],
        providers: [betting_limits_service_1.BettingLimitsService],
        exports: [betting_limits_service_1.BettingLimitsService],
    })
], BettingLimitsModule);
//# sourceMappingURL=betting-limits.module.js.map