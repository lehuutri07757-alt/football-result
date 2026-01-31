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
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const search_service_1 = require("./search.service");
let SearchController = class SearchController {
    constructor(searchService) {
        this.searchService = searchService;
    }
    async globalSearch(query, limit) {
        return this.searchService.globalSearch(query, limit);
    }
    async getSuggestions(query) {
        return this.searchService.getSuggestions(query);
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Global search across leagues, teams, and matches',
        description: 'Search for leagues, teams, and matches simultaneously with a single query'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Search results grouped by entity type',
        schema: {
            example: {
                leagues: [
                    { id: '123', name: 'Premier League', country: 'England', logoUrl: '...' }
                ],
                teams: [
                    { id: '456', name: 'Manchester United', logoUrl: '...' }
                ],
                matches: [
                    { id: '789', homeTeam: { name: 'Arsenal' }, awayTeam: { name: 'Chelsea' }, startTime: '2024-02-15T15:00:00Z' }
                ],
                meta: {
                    total: 15,
                    query: 'manchester',
                    executionTime: 45
                }
            }
        }
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Search query (minimum 2 characters)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Results limit per entity type', type: Number }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "globalSearch", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get search suggestions/autocomplete' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suggested search terms' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Partial search query' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSuggestions", null);
exports.SearchController = SearchController = __decorate([
    (0, swagger_1.ApiTags)('Search'),
    (0, common_1.Controller)('search'),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map