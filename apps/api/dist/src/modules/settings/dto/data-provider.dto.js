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
exports.QueryDataProviderDto = exports.UpdateDataProviderDto = exports.CreateDataProviderDto = exports.DataProviderType = exports.DataProviderStatus = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
var DataProviderStatus;
(function (DataProviderStatus) {
    DataProviderStatus["active"] = "active";
    DataProviderStatus["inactive"] = "inactive";
    DataProviderStatus["error"] = "error";
    DataProviderStatus["maintenance"] = "maintenance";
})(DataProviderStatus || (exports.DataProviderStatus = DataProviderStatus = {}));
var DataProviderType;
(function (DataProviderType) {
    DataProviderType["odds"] = "odds";
    DataProviderType["fixtures"] = "fixtures";
    DataProviderType["live_scores"] = "live_scores";
    DataProviderType["statistics"] = "statistics";
    DataProviderType["leagues"] = "leagues";
    DataProviderType["teams"] = "teams";
})(DataProviderType || (exports.DataProviderType = DataProviderType = {}));
class CreateDataProviderDto {
}
exports.CreateDataProviderDto = CreateDataProviderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'api_football' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateDataProviderDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'API-Football' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateDataProviderDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Primary football data provider' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDataProviderDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['odds', 'fixtures', 'live_scores'], enum: DataProviderType, isArray: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(DataProviderType, { each: true }),
    __metadata("design:type", Array)
], CreateDataProviderDto.prototype, "types", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://v3.football.api-sports.io' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDataProviderDto.prototype, "baseUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'your-api-key-here' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDataProviderDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'your-api-secret-here' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDataProviderDto.prototype, "apiSecret", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: { 'x-apisports-key': '{{apiKey}}' } }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateDataProviderDto.prototype, "headers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: { timeout: 30000, retryCount: 3 } }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateDataProviderDto.prototype, "config", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: DataProviderStatus, default: DataProviderStatus.inactive }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(DataProviderStatus),
    __metadata("design:type", String)
], CreateDataProviderDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, minimum: 0, maximum: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateDataProviderDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateDataProviderDto.prototype, "dailyLimit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateDataProviderDto.prototype, "monthlyLimit", void 0);
class UpdateDataProviderDto {
}
exports.UpdateDataProviderDto = UpdateDataProviderDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'API-Football' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateDataProviderDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Primary football data provider' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDataProviderDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['odds', 'fixtures'], enum: DataProviderType, isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(DataProviderType, { each: true }),
    __metadata("design:type", Array)
], UpdateDataProviderDto.prototype, "types", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://v3.football.api-sports.io' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDataProviderDto.prototype, "baseUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'your-api-key-here' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDataProviderDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'your-api-secret-here' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDataProviderDto.prototype, "apiSecret", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: { 'x-apisports-key': '{{apiKey}}' } }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateDataProviderDto.prototype, "headers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: { timeout: 30000, retryCount: 3 } }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateDataProviderDto.prototype, "config", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: DataProviderStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(DataProviderStatus),
    __metadata("design:type", String)
], UpdateDataProviderDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, minimum: 0, maximum: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateDataProviderDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateDataProviderDto.prototype, "dailyLimit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateDataProviderDto.prototype, "monthlyLimit", void 0);
class QueryDataProviderDto {
}
exports.QueryDataProviderDto = QueryDataProviderDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: DataProviderStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(DataProviderStatus),
    __metadata("design:type", String)
], QueryDataProviderDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: DataProviderType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(DataProviderType),
    __metadata("design:type", String)
], QueryDataProviderDto.prototype, "type", void 0);
//# sourceMappingURL=data-provider.dto.js.map