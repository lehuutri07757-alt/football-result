"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const settings_module_1 = require("./modules/settings/settings.module");
const roles_module_1 = require("./modules/roles/roles.module");
const agents_module_1 = require("./modules/agents/agents.module");
const betting_limits_module_1 = require("./modules/betting-limits/betting-limits.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const deposits_module_1 = require("./modules/deposits/deposits.module");
const withdrawals_module_1 = require("./modules/withdrawals/withdrawals.module");
const transactions_module_1 = require("./modules/transactions/transactions.module");
const admin_module_1 = require("./modules/admin/admin.module");
const sports_module_1 = require("./modules/sports/sports.module");
const leagues_module_1 = require("./modules/leagues/leagues.module");
const teams_module_1 = require("./modules/teams/teams.module");
const matches_module_1 = require("./modules/matches/matches.module");
const api_football_module_1 = require("./modules/api-football/api-football.module");
const redis_module_1 = require("./redis/redis.module");
const home_module_1 = require("./modules/home/home.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ".env",
            }),
            schedule_1.ScheduleModule.forRoot(),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            prisma_module_1.PrismaModule,
            settings_module_1.SettingsModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            agents_module_1.AgentsModule,
            betting_limits_module_1.BettingLimitsModule,
            wallet_module_1.WalletModule,
            deposits_module_1.DepositsModule,
            withdrawals_module_1.WithdrawalsModule,
            transactions_module_1.TransactionsModule,
            admin_module_1.AdminModule,
            sports_module_1.SportsModule,
            leagues_module_1.LeaguesModule,
            teams_module_1.TeamsModule,
            matches_module_1.MatchesModule,
            api_football_module_1.ApiFootballModule,
            redis_module_1.RedisModule,
            home_module_1.HomeModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map