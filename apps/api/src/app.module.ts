import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { BullModule } from "@nestjs/bull";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { RolesModule } from "./modules/roles/roles.module";
import { AgentsModule } from "./modules/agents/agents.module";
import { BettingLimitsModule } from "./modules/betting-limits/betting-limits.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { DepositsModule } from "./modules/deposits/deposits.module";
import { WithdrawalsModule } from "./modules/withdrawals/withdrawals.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { AdminModule } from "./modules/admin/admin.module";
import { SportsModule } from "./modules/sports/sports.module";
import { LeaguesModule } from "./modules/leagues/leagues.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { MatchesModule } from "./modules/matches/matches.module";
import { ApiFootballModule } from "./modules/api-football/api-football.module";
import { RedisModule } from "./redis/redis.module";
import { HomeModule } from "./modules/home/home.module";
import { FeaturedMatchesModule } from "./modules/featured-matches/featured-matches.module";
import { SearchModule } from "./modules/search/search.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>("REDIS_HOST") || "127.0.0.1",
          port: Number(configService.get<string>("REDIS_PORT") || 6379),
          password: configService.get<string>("REDIS_PASSWORD") || undefined,
          db: Number(configService.get<string>("REDIS_DB") || 0),
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    SettingsModule,
    AuthModule,
    UsersModule,
    RolesModule,
    AgentsModule,
    BettingLimitsModule,
    WalletModule,
    DepositsModule,
    WithdrawalsModule,
    TransactionsModule,
    AdminModule,
    SportsModule,
    LeaguesModule,
    TeamsModule,
    MatchesModule,
    ApiFootballModule,
    RedisModule,
    HomeModule,
    FeaturedMatchesModule,
    SearchModule,
  ],
})
export class AppModule {}
