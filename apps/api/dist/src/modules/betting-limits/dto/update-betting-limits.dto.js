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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBettingLimitsDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateBettingLimitsDto {
}
exports.UpdateBettingLimitsDto = UpdateBettingLimitsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10000, description: 'Minimum bet amount' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateBettingLimitsDto.prototype, "minBet", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10000000, description: 'Maximum bet amount' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateBettingLimitsDto.prototype, "maxBet", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 100000000, description: 'Daily betting limit' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateBettingLimitsDto.prototype, "dailyLimit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 500000000, description: 'Weekly betting limit' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateBettingLimitsDto.prototype, "weeklyLimit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2000000000, description: 'Monthly betting limit' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateBettingLimitsDto.prototype, "monthlyLimit", void 0);
//# sourceMappingURL=update-betting-limits.dto.js.map