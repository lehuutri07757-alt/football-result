import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ScheduleModule.forRoot(),
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
  ],
})
export class AppModule {}
