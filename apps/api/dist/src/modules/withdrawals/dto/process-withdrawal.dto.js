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
exports.ProcessWithdrawalDto = exports.WithdrawalAction = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var WithdrawalAction;
(function (WithdrawalAction) {
    WithdrawalAction["APPROVE"] = "approve";
    WithdrawalAction["REJECT"] = "reject";
})(WithdrawalAction || (exports.WithdrawalAction = WithdrawalAction = {}));
class ProcessWithdrawalDto {
}
exports.ProcessWithdrawalDto = ProcessWithdrawalDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: WithdrawalAction }),
    (0, class_validator_1.IsEnum)(WithdrawalAction),
    __metadata("design:type", String)
], ProcessWithdrawalDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Transaction reference (for approved)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessWithdrawalDto.prototype, "transactionRef", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Reason for rejection' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessWithdrawalDto.prototype, "rejectReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessWithdrawalDto.prototype, "notes", void 0);
//# sourceMappingURL=process-withdrawal.dto.js.map