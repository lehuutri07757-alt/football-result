"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturedMatchesModule = void 0;
const common_1 = require("@nestjs/common");
const featured_matches_controller_1 = require("./featured-matches.controller");
const featured_matches_service_1 = require("./featured-matches.service");
const prisma_module_1 = require("../../prisma/prisma.module");
let FeaturedMatchesModule = class FeaturedMatchesModule {
};
exports.FeaturedMatchesModule = FeaturedMatchesModule;
exports.FeaturedMatchesModule = FeaturedMatchesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [featured_matches_controller_1.FeaturedMatchesController],
        providers: [featured_matches_service_1.FeaturedMatchesService],
        exports: [featured_matches_service_1.FeaturedMatchesService],
    })
], FeaturedMatchesModule);
//# sourceMappingURL=featured-matches.module.js.map