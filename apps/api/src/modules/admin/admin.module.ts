import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';
import { DepositsModule } from '../deposits/deposits.module';

@Module({
  imports: [PrismaModule, UsersModule, WithdrawalsModule, DepositsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
