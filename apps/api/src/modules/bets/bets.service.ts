import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { BettingLimitsService } from '../betting-limits/betting-limits.service';
import { PlaceBetDto, QueryMyBetsDto, QueryAdminBetsDto } from './dto';

@Injectable()
export class BetsService {
  private readonly logger = new Logger(BetsService.name);

  constructor(
    private prisma: PrismaService,
    private bettingLimitsService: BettingLimitsService,
  ) {}

  async placeBet(userId: string, dto: PlaceBetDto, ipAddress?: string) {
    // Step 1: Idempotency check
    const existingBet = await this.prisma.bet.findFirst({
      where: {
        metadata: {
          path: ['idempotencyKey'],
          equals: dto.idempotencyKey,
        },
      },
      include: {
        selections: {
          include: {
            match: { include: { homeTeam: true, awayTeam: true, league: true } },
          },
        },
      },
    });
    if (existingBet) {
      return { duplicate: true, bet: existingBet, balance: null };
    }

    // Step 2: Fetch odds with relations
    const odds = await this.prisma.odds.findUnique({
      where: { id: dto.oddsId },
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
        betType: true,
      },
    });
    if (!odds) {
      throw new NotFoundException('Odds not found');
    }

    // Step 3: Validate odds status
    if (odds.status !== 'active') {
      throw new BadRequestException('ODDS_SUSPENDED');
    }

    // Step 4: Validate match betting enabled
    if (!odds.match.bettingEnabled) {
      throw new BadRequestException('MATCH_NOT_BETTABLE');
    }

    // Step 5: Validate match status
    if (!['scheduled', 'live'].includes(odds.match.status)) {
      throw new BadRequestException('MATCH_NOT_BETTABLE');
    }

    // Step 6: Validate betting limits
    const limitCheck = await this.bettingLimitsService.validateBetAmount(userId, dto.stake);
    if (!limitCheck.valid) {
      throw new BadRequestException(limitCheck.reason || 'LIMIT_EXCEEDED');
    }

    // Step 7: Fetch wallet
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Step 8: Validate balance
    const realBalance = Number(wallet.realBalance);
    const bonusBalance = Number(wallet.bonusBalance);
    const totalAvailable = realBalance + bonusBalance;
    if (totalAvailable < dto.stake) {
      throw new BadRequestException('INSUFFICIENT_FUNDS');
    }

    // Step 9: Calculate balance split
    const realDeduction = Math.min(dto.stake, realBalance);
    const bonusDeduction = dto.stake - realDeduction;

    // Step 10: Calculate potential win
    const oddsValue = Number(odds.oddsValue);
    const potentialWin = dto.stake * oddsValue;

    // Step 11: Atomic transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Deduct wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          realBalance: { decrement: realDeduction },
          bonusBalance: { decrement: bonusDeduction },
        },
      });

      // Create bet
      const bet = await tx.bet.create({
        data: {
          userId,
          betType: 'single',
          stake: dto.stake,
          totalOdds: oddsValue,
          potentialWin,
          status: 'pending',
          ipAddress: ipAddress || null,
          metadata: {
            idempotencyKey: dto.idempotencyKey,
            realStake: realDeduction,
            bonusStake: bonusDeduction,
          },
        },
      });

      // Create bet selection
      await tx.betSelection.create({
        data: {
          betId: bet.id,
          oddsId: odds.id,
          matchId: odds.matchId,
          oddsValue: oddsValue,
          selection: odds.selection,
          selectionName: odds.selectionName,
          handicap: odds.handicap ? Number(odds.handicap) : null,
          result: 'pending',
        },
      });

      // Create transaction record
      const balanceBefore = realBalance + bonusBalance;
      const balanceAfter = Number(updatedWallet.realBalance) + Number(updatedWallet.bonusBalance);
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'bet_placed',
          amount: dto.stake,
          balanceBefore,
          balanceAfter,
          balanceType: 'real',
          referenceType: 'bet',
          referenceId: bet.id,
          description: `Bet placed on ${odds.match.homeTeam.name} vs ${odds.match.awayTeam.name}`,
          status: 'completed',
        },
      });

      // Fetch bet with selections and match relations for response
      const betWithSelections = await tx.bet.findUnique({
        where: { id: bet.id },
        include: {
          selections: {
            include: {
              match: { include: { homeTeam: true, awayTeam: true, league: true } },
            },
          },
        },
      });

      return { bet: betWithSelections, wallet: updatedWallet };
    });

    return {
      duplicate: false,
      bet: result.bet,
      balance: {
        realBalance: Number(result.wallet.realBalance),
        bonusBalance: Number(result.wallet.bonusBalance),
        totalAvailable: Number(result.wallet.realBalance) + Number(result.wallet.bonusBalance),
      },
    };
  }

  async settleMatchBets(matchId: string): Promise<{ settled: number; errors: number }> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status === 'cancelled' || match.status === 'postponed') {
      return this.voidMatchBets(matchId);
    }

    if (match.status !== 'finished') {
      throw new BadRequestException('Match is not finished');
    }

    // Find all pending bet selections for this match
    const pendingSelections = await this.prisma.betSelection.findMany({
      where: {
        matchId,
        result: 'pending',
      },
      include: {
        bet: true,
        odds: { include: { betType: true } },
      },
    });

    let settled = 0;
    let errors = 0;

    for (const selection of pendingSelections) {
      try {
        let selectionResult: 'won' | 'lost' | 'pending' = 'pending';

        // Only auto-settle 1X2 (match_winner) market
        if (selection.odds.betType.code === 'match_winner') {
          const homeScore = match.homeScore ?? 0;
          const awayScore = match.awayScore ?? 0;

          if (homeScore > awayScore) {
            // Home win
            selectionResult = selection.selection === 'Home' ? 'won' : 'lost';
          } else if (awayScore > homeScore) {
            // Away win
            selectionResult = selection.selection === 'Away' ? 'won' : 'lost';
          } else {
            // Draw
            selectionResult = selection.selection === 'Draw' ? 'won' : 'lost';
          }
        } else {
          // Non-1X2 markets: skip (leave as pending)
          continue;
        }

        // Update selection result
        await this.prisma.betSelection.update({
          where: { id: selection.id },
          data: { result: selectionResult },
        });

        // Check if all selections for this bet are resolved
        const allSelections = await this.prisma.betSelection.findMany({
          where: { betId: selection.betId },
        });

        const allResolved = allSelections.every((s) => s.result !== 'pending');
        if (!allResolved) continue;

        const allWon = allSelections.every((s) => s.result === 'won');
        const anyLost = allSelections.some((s) => s.result === 'lost');

        if (allWon) {
          // Bet won - credit wallet
          const bet = selection.bet;
          const payout = Number(bet.potentialWin);

          await this.prisma.$transaction(async (tx) => {
            // Update bet status
            await tx.bet.update({
              where: { id: bet.id },
              data: {
                status: 'won',
                actualWin: payout,
                settledAt: new Date(),
              },
            });

            // Credit wallet (winnings go to realBalance)
            const wallet = await tx.wallet.findUnique({ where: { userId: bet.userId } });
            if (!wallet) return;

            const balanceBefore = Number(wallet.realBalance) + Number(wallet.bonusBalance);
            
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { realBalance: { increment: payout } },
            });

            await tx.transaction.create({
              data: {
                walletId: wallet.id,
                type: 'bet_won',
                amount: payout,
                balanceBefore,
                balanceAfter: balanceBefore + payout,
                balanceType: 'real',
                referenceType: 'bet',
                referenceId: bet.id,
                description: `Bet won - payout`,
                status: 'completed',
              },
            });
          });
        } else if (anyLost) {
          // Bet lost
          await this.prisma.bet.update({
            where: { id: selection.betId },
            data: {
              status: 'lost',
              settledAt: new Date(),
            },
          });
        }

        settled++;
      } catch (error) {
        this.logger.error(`Error settling selection ${selection.id}: ${error}`);
        errors++;
      }
    }

    return { settled, errors };
  }

  async voidMatchBets(matchId: string): Promise<{ settled: number; errors: number }> {
    const pendingSelections = await this.prisma.betSelection.findMany({
      where: {
        matchId,
        result: 'pending',
      },
      include: { bet: true },
    });

    let settled = 0;
    let errors = 0;

    // Group by betId to process each bet once
    const betIds = [...new Set(pendingSelections.map((s) => s.betId))];

    for (const betId of betIds) {
      try {
        const bet = await this.prisma.bet.findUnique({ where: { id: betId } });
        if (!bet || bet.status !== 'pending') continue;

        const metadata = bet.metadata as Record<string, unknown>;
        const realStake = Number(metadata?.realStake ?? bet.stake);
        const bonusStake = Number(metadata?.bonusStake ?? 0);

        await this.prisma.$transaction(async (tx) => {
          // Void all selections for this bet on this match
          await tx.betSelection.updateMany({
            where: { betId, matchId },
            data: { result: 'void' },
          });

          // Update bet status
          await tx.bet.update({
            where: { id: betId },
            data: {
              status: 'void',
              settledAt: new Date(),
            },
          });

          // Refund proportionally
          const wallet = await tx.wallet.findUnique({ where: { userId: bet.userId } });
          if (!wallet) return;

          const balanceBefore = Number(wallet.realBalance) + Number(wallet.bonusBalance);

          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              realBalance: { increment: realStake },
              bonusBalance: { increment: bonusStake },
            },
          });

          const refundAmount = Number(bet.stake);
          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              type: 'bet_refund',
              amount: refundAmount,
              balanceBefore,
              balanceAfter: balanceBefore + refundAmount,
              balanceType: 'real',
              referenceType: 'bet',
              referenceId: betId,
              description: 'Bet voided - match cancelled/postponed',
              status: 'completed',
            },
          });
        });

        settled++;
      } catch (error) {
        this.logger.error(`Error voiding bet ${betId}: ${error}`);
        errors++;
      }
    }

    return { settled, errors };
  }

  @Cron('*/5 * * * *')
  async processFinishedMatches(): Promise<void> {
    this.logger.log('Checking for finished matches with unsettled bets...');

    // Find matches that are finished/cancelled/postponed with pending bet selections
    const matchesWithPendingBets = await this.prisma.match.findMany({
      where: {
        status: { in: ['finished', 'cancelled', 'postponed'] },
        betSelections: {
          some: { result: 'pending' },
        },
      },
      select: { id: true, status: true },
    });

    for (const match of matchesWithPendingBets) {
      try {
        if (match.status === 'cancelled' || match.status === 'postponed') {
          await this.voidMatchBets(match.id);
        } else {
          await this.settleMatchBets(match.id);
        }
        this.logger.log(`Settled bets for match ${match.id}`);
      } catch (error) {
        this.logger.error(`Failed to settle match ${match.id}: ${error}`);
      }
    }
  }

  async getUserBets(userId: string, query: QueryMyBetsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.fromDate || query.toDate) {
      const placedAt: Record<string, Date> = {};
      if (query.fromDate) placedAt.gte = new Date(query.fromDate);
      if (query.toDate) placedAt.lte = new Date(query.toDate);
      where.placedAt = placedAt;
    }

    const [bets, total] = await Promise.all([
      this.prisma.bet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { placedAt: 'desc' },
        include: {
          selections: {
            include: {
              odds: { include: { betType: true } },
              match: { include: { homeTeam: true, awayTeam: true } },
            },
          },
        },
      }),
      this.prisma.bet.count({ where }),
    ]);

    return {
      data: bets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBetById(userId: string, betId: string) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: {
        selections: {
          include: {
            odds: { include: { betType: true } },
            match: { include: { homeTeam: true, awayTeam: true, league: true } },
          },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    if (bet.userId !== userId) {
      throw new NotFoundException('Bet not found');
    }

    return bet;
  }

  // ─── Admin Methods ────────────────────────────────────────────────

  async getAdminBets(query: QueryAdminBetsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.search) {
      where.user = {
        OR: [
          { username: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    if (query.fromDate || query.toDate) {
      const placedAt: Record<string, Date> = {};
      if (query.fromDate) placedAt.gte = new Date(query.fromDate);
      if (query.toDate) placedAt.lte = new Date(query.toDate);
      where.placedAt = placedAt;
    }

    const [bets, total] = await Promise.all([
      this.prisma.bet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { placedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          selections: {
            include: {
              odds: { include: { betType: true } },
              match: { include: { homeTeam: true, awayTeam: true, league: true } },
            },
          },
        },
      }),
      this.prisma.bet.count({ where }),
    ]);

    return {
      data: bets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAdminBetById(betId: string) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        selections: {
          include: {
            odds: { include: { betType: true } },
            match: { include: { homeTeam: true, awayTeam: true, league: true } },
          },
        },
      },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    return bet;
  }

  async voidBet(betId: string): Promise<{ message: string }> {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
      include: { selections: true },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    if (bet.status !== 'pending') {
      throw new BadRequestException('Only pending bets can be voided');
    }

    const metadata = bet.metadata as Record<string, unknown>;
    const realStake = Number(metadata?.realStake ?? bet.stake);
    const bonusStake = Number(metadata?.bonusStake ?? 0);

    await this.prisma.$transaction(async (tx) => {
      // Void all selections
      await tx.betSelection.updateMany({
        where: { betId },
        data: { result: 'void' },
      });

      // Update bet status
      await tx.bet.update({
        where: { id: betId },
        data: {
          status: 'void',
          settledAt: new Date(),
        },
      });

      // Refund wallet
      const wallet = await tx.wallet.findUnique({ where: { userId: bet.userId } });
      if (!wallet) return;

      const balanceBefore = Number(wallet.realBalance) + Number(wallet.bonusBalance);

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          realBalance: { increment: realStake },
          bonusBalance: { increment: bonusStake },
        },
      });

      const refundAmount = Number(bet.stake);
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'bet_refund',
          amount: refundAmount,
          balanceBefore,
          balanceAfter: balanceBefore + refundAmount,
          balanceType: 'real',
          referenceType: 'bet',
          referenceId: betId,
          description: 'Bet voided by admin',
          status: 'completed',
        },
      });
    });

    return { message: 'Bet voided and refunded successfully' };
  }
}
