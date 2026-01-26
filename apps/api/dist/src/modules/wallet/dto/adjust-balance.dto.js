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
exports.AdjustBalanceDto = exports.AdjustmentType = exports.BalanceType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var BalanceType;
(function (BalanceType) {
    BalanceType["REAL"] = "real";
    BalanceType["BONUS"] = "bonus";
})(BalanceType || (exports.BalanceType = BalanceType = {}));
var AdjustmentType;
(function (AdjustmentType) {
    AdjustmentType["ADD"] = "add";
    AdjustmentType["SUBTRACT"] = "subtract";
})(AdjustmentType || (exports.AdjustmentType = AdjustmentType = {}));
class AdjustBalanceDto {
}
exports.AdjustBalanceDto = AdjustBalanceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100000, description: 'Amount to adjust' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AdjustBalanceDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: BalanceType, example: BalanceType.REAL }),
    (0, class_validator_1.IsEnum)(BalanceType),
    __metadata("design:type", String)
], AdjustBalanceDto.prototype, "balanceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: AdjustmentType, example: AdjustmentType.ADD }),
    (0, class_validator_1.IsEnum)(AdjustmentType),
    __metadata("design:type", String)
], AdjustBalanceDto.prototype, "adjustmentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Manual adjustment by admin' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdjustBalanceDto.prototype, "description", void 0);
//# sourceMappingURL=adjust-balance.dto.js.map