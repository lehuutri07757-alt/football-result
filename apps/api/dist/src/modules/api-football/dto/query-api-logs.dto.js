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
exports.QueryApiLogsDto = exports.ApiRequestStatusFilter = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var ApiRequestStatusFilter;
(function (ApiRequestStatusFilter) {
    ApiRequestStatusFilter["ALL"] = "all";
    ApiRequestStatusFilter["SUCCESS"] = "success";
    ApiRequestStatusFilter["ERROR"] = "error";
    ApiRequestStatusFilter["TIMEOUT"] = "timeout";
})(ApiRequestStatusFilter || (exports.ApiRequestStatusFilter = ApiRequestStatusFilter = {}));
class QueryApiLogsDto {
    constructor() {
        this.status = ApiRequestStatusFilter.ALL;
        this.page = 1;
        this.limit = 50;
    }
}
exports.QueryApiLogsDto = QueryApiLogsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by endpoint', example: '/fixtures' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryApiLogsDto.prototype, "endpoint", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by status',
        enum: ApiRequestStatusFilter,
        default: ApiRequestStatusFilter.ALL
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ApiRequestStatusFilter),
    __metadata("design:type", String)
], QueryApiLogsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Start date (ISO format)', example: '2024-01-01' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryApiLogsDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'End date (ISO format)', example: '2024-01-31' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryApiLogsDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryApiLogsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page', default: 50, maximum: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QueryApiLogsDto.prototype, "limit", void 0);
//# sourceMappingURL=query-api-logs.dto.js.map