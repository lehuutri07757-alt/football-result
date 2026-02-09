import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BetsService } from './bets.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BettingLimitsService } from '../betting-limits/betting-limits.service';
import { PlaceBetDto, QueryMyBetsDto } from './dto';

describe('BetsService', () => {
  let service: BetsService;
  let mockPrismaService: any;
  let mockBettingLimitsService: any;

  beforeEach(async () => {
    // Mock PrismaService
    mockPrismaService = {
      bet: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      betSelection: {
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      odds: {
        findUnique: jest.fn(),
      },
      wallet: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      match: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    // Mock BettingLimitsService
    mockBettingLimitsService = {
      validateBetAmount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BetsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: BettingLimitsService, useValue: mockBettingLimitsService },
      ],
    }).compile();

    service = module.get<BetsService>(BetsService);
    jest.clearAllMocks();
  });

  describe('placeBet', () => {
    const userId = 'user-123';
    const dto: PlaceBetDto = {
      oddsId: 'odds-123',
      stake: 50000,
      idempotencyKey: 'key-001',
    };

    const mockOdds = {
      id: 'odds-123',
      oddsValue: 2.5,
      status: 'active',
      selection: 'Home',
      selectionName: 'Home Win',
      handicap: null,
      matchId: 'match-123',
      betType: { id: 'bt-1', code: 'match_winner', name: '1X2' },
      match: {
        id: 'match-123',
        status: 'scheduled',
        bettingEnabled: true,
        homeTeam: { name: 'Team A' },
        awayTeam: { name: 'Team B' },
      },
    };

    const mockWallet = {
      id: 'wallet-123',
      userId,
      realBalance: 100000,
      bonusBalance: 50000,
    };

    const mockCreatedBet = {
      id: 'bet-001',
      userId,
      betType: 'single',
      stake: 50000,
      totalOdds: 2.5,
      potentialWin: 125000,
      actualWin: 0,
      status: 'pending',
      ipAddress: null,
      metadata: { idempotencyKey: 'key-001', realStake: 50000, bonusStake: 0 },
      selections: [
        {
          id: 'sel-001',
          oddsId: 'odds-123',
          matchId: 'match-123',
          oddsValue: 2.5,
          selection: 'Home',
          selectionName: 'Home Win',
          handicap: null,
          result: 'pending',
        },
      ],
    };

    it('should place a bet successfully with valid inputs', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);
      mockPrismaService.odds.findUnique.mockResolvedValue(mockOdds);
      mockBettingLimitsService.validateBetAmount.mockResolvedValue({ valid: true });
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      // Mock the $transaction callback
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrismaService);
      });

      // Mock the internal transaction operations
      mockPrismaService.wallet.update.mockResolvedValue({
        ...mockWallet,
        realBalance: 50000,
        bonusBalance: 50000,
      });
      mockPrismaService.bet.create.mockResolvedValue(mockCreatedBet);
      mockPrismaService.betSelection.create.mockResolvedValue({});
      mockPrismaService.transaction.create.mockResolvedValue({});
      mockPrismaService.bet.findUnique.mockResolvedValue(mockCreatedBet);

      const result = await service.placeBet(userId, dto);

      expect(result.duplicate).toBe(false);
      expect(result.bet).toBeDefined();
      expect(result.balance).toBeDefined();
      expect(mockPrismaService.bet.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.odds.findUnique).toHaveBeenCalled();
    });

    it('should return existing bet on duplicate idempotency key', async () => {
      const existingBet = { ...mockCreatedBet, id: 'bet-existing' };
      mockPrismaService.bet.findFirst.mockResolvedValue(existingBet);

      const result = await service.placeBet(userId, dto);

      expect(result.duplicate).toBe(true);
      expect(result.bet).toEqual(existingBet);
      expect(result.balance).toBe(null);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when odds not found', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);
      mockPrismaService.odds.findUnique.mockResolvedValue(null);

      await expect(service.placeBet(userId, dto)).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.odds.findUnique).toHaveBeenCalledWith({
        where: { id: 'odds-123' },
        include: {
          match: { include: { homeTeam: true, awayTeam: true } },
          betType: true,
        },
      });
    });

    it('should throw BadRequestException when odds status is suspended', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);
      mockPrismaService.odds.findUnique.mockResolvedValue({
        ...mockOdds,
        status: 'suspended',
      });

      await expect(service.placeBet(userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when odds status is closed', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);
      mockPrismaService.odds.findUnique.mockResolvedValue({
        ...mockOdds,
        status: 'closed',
      });

      await expect(service.placeBet(userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when match betting is disabled', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);
      mockPrismaService.odds.findUnique.mockResolvedValue({
        ...mockOdds,
        match: { ...mockOdds.match, bettingEnabled: false },
      });

      await expect(service.placeBet(userId, dto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when match status is finished', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);
      mockPrismaService.odds.findUnique.mockResolvedValue({
        ...mockOdds,
        match: { ...mockOdds.match, status: 'finished' },
      });

      await expect(service.placeBet(userId, dto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when match status is cancelled', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);
      mockPrismaService.odds.findUnique.mockResolvedValue({
        ...mockOdds,
        match: { ...mockOdds.match, status: 'cancelled' },
      });

      await expect(service.placeBet(userId, dto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when match status is postponed', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);
      mockPrismaService.odds.findUnique.mockResolvedValue({
        ...mockOdds,
        match: { ...mockOdds.match, status: 'postponed' },
      });

      await expect(service.placeBet(userId, dto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when betting limit validation fails', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);
      mockPrismaService.odds.findUnique.mockResolvedValue(mockOdds);
      mockBettingLimitsService.validateBetAmount.mockResolvedValue({
        valid: false,
        reason: 'LIMIT_EXCEEDED',
      });

      await expect(service.placeBet(userId, dto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException when wallet not found', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);
      mockPrismaService.odds.findUnique.mockResolvedValue(mockOdds);
      mockBettingLimitsService.validateBetAmount.mockResolvedValue({ valid: true });
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);

      await expect(service.placeBet(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when real balance is insufficient', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);
      mockPrismaService.odds.findUnique.mockResolvedValue(mockOdds);
      mockBettingLimitsService.validateBetAmount.mockResolvedValue({ valid: true });
      mockPrismaService.wallet.findUnique.mockResolvedValue({
        ...mockWallet,
        realBalance: 10000,
        bonusBalance: 5000,
      });

      await expect(service.placeBet(userId, dto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should deduct from bonus balance when real balance is insufficient', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);
      mockPrismaService.odds.findUnique.mockResolvedValue(mockOdds);
      mockBettingLimitsService.validateBetAmount.mockResolvedValue({ valid: true });
      mockPrismaService.wallet.findUnique.mockResolvedValue({
        ...mockWallet,
        realBalance: 30000,
        bonusBalance: 50000,
      });

      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrismaService);
      });

      mockPrismaService.wallet.update.mockResolvedValue({
        ...mockWallet,
        realBalance: 0,
        bonusBalance: 30000,
      });
      mockPrismaService.bet.create.mockResolvedValue(mockCreatedBet);
      mockPrismaService.betSelection.create.mockResolvedValue({});
      mockPrismaService.transaction.create.mockResolvedValue({});
      mockPrismaService.bet.findUnique.mockResolvedValue(mockCreatedBet);

      const result = await service.placeBet(userId, dto);

      expect(result.duplicate).toBe(false);
      expect(mockPrismaService.wallet.update).toHaveBeenCalled();
    });

    it('should create transaction record with bet metadata', async () => {
      mockPrismaService.bet.findFirst.mockResolvedValue(null);
      mockPrismaService.odds.findUnique.mockResolvedValue(mockOdds);
      mockBettingLimitsService.validateBetAmount.mockResolvedValue({ valid: true });
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockPrismaService);
      });

      mockPrismaService.wallet.update.mockResolvedValue({
        ...mockWallet,
        realBalance: 50000,
        bonusBalance: 50000,
      });
      mockPrismaService.bet.create.mockResolvedValue(mockCreatedBet);
      mockPrismaService.betSelection.create.mockResolvedValue({});
      mockPrismaService.transaction.create.mockResolvedValue({});
      mockPrismaService.bet.findUnique.mockResolvedValue(mockCreatedBet);

      await service.placeBet(userId, dto, '192.168.1.1');

      expect(mockPrismaService.transaction.create).toHaveBeenCalled();
    });
  });

  describe('settleMatchBets', () => {
    const matchId = 'match-123';

    it('should throw NotFoundException when match not found', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(service.settleMatchBets(matchId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when match is not finished', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        id: matchId,
        status: 'scheduled',
      });

      await expect(service.settleMatchBets(matchId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should return settled count when match has finished', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        id: matchId,
        status: 'finished',
        homeScore: 2,
        awayScore: 1,
      });

      mockPrismaService.betSelection.findMany.mockResolvedValue([]);

      const result = await service.settleMatchBets(matchId);

      expect(result).toHaveProperty('settled');
      expect(result).toHaveProperty('errors');
      expect(result.settled).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should settle home win correctly when home team wins', async () => {
      const mockMatch = {
        id: matchId,
        status: 'finished',
        homeScore: 2,
        awayScore: 1,
      };

      const mockSelection = {
        id: 'sel-1',
        betId: 'bet-1',
        matchId,
        selection: 'Home',
        result: 'pending',
        oddsValue: 2.5,
        odds: { betType: { code: 'match_winner' } },
        bet: {
          id: 'bet-1',
          userId: 'user-1',
          status: 'pending',
          potentialWin: 125000,
          stake: 50000,
          metadata: { realStake: 50000, bonusStake: 0 },
        },
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.betSelection.findMany.mockResolvedValue([mockSelection]);
      mockPrismaService.betSelection.findMany.mockResolvedValueOnce([
        mockSelection,
      ]);
      mockPrismaService.betSelection.update.mockResolvedValue({});
      mockPrismaService.betSelection.findMany.mockResolvedValueOnce([
        { ...mockSelection, result: 'won' },
      ]);
      mockPrismaService.$transaction.mockResolvedValue(undefined);

      const result = await service.settleMatchBets(matchId);

      expect(result.settled).toBeGreaterThan(0);
      expect(mockPrismaService.betSelection.update).toHaveBeenCalled();
    });

    it('should settle home loss correctly when away team wins', async () => {
      const mockMatch = {
        id: matchId,
        status: 'finished',
        homeScore: 0,
        awayScore: 2,
      };

      const mockSelection = {
        id: 'sel-1',
        betId: 'bet-1',
        matchId,
        selection: 'Home',
        result: 'pending',
        oddsValue: 2.5,
        odds: { betType: { code: 'match_winner' } },
        bet: {
          id: 'bet-1',
          userId: 'user-1',
          status: 'pending',
          potentialWin: 125000,
          stake: 50000,
          metadata: { realStake: 50000, bonusStake: 0 },
        },
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.betSelection.findMany.mockResolvedValue([mockSelection]);
      mockPrismaService.betSelection.update.mockResolvedValue({});
      mockPrismaService.betSelection.findMany.mockResolvedValueOnce([
        { ...mockSelection, result: 'lost' },
      ]);
      mockPrismaService.bet.update.mockResolvedValue({});

      const result = await service.settleMatchBets(matchId);

      expect(mockPrismaService.betSelection.update).toHaveBeenCalled();
    });

    it('should settle draw correctly when both teams draw', async () => {
      const mockMatch = {
        id: matchId,
        status: 'finished',
        homeScore: 1,
        awayScore: 1,
      };

      const mockSelection = {
        id: 'sel-1',
        betId: 'bet-1',
        matchId,
        selection: 'Draw',
        result: 'pending',
        oddsValue: 3.5,
        odds: { betType: { code: 'match_winner' } },
        bet: {
          id: 'bet-1',
          userId: 'user-1',
          status: 'pending',
          potentialWin: 175000,
          stake: 50000,
          metadata: { realStake: 50000, bonusStake: 0 },
        },
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.betSelection.findMany.mockResolvedValue([mockSelection]);
      mockPrismaService.betSelection.update.mockResolvedValue({});
      mockPrismaService.betSelection.findMany.mockResolvedValueOnce([
        { ...mockSelection, result: 'won' },
      ]);
      mockPrismaService.$transaction.mockResolvedValue(undefined);

      const result = await service.settleMatchBets(matchId);

      expect(mockPrismaService.betSelection.update).toHaveBeenCalled();
    });

    it('should call voidMatchBets when match is cancelled', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        id: matchId,
        status: 'cancelled',
      });

      mockPrismaService.betSelection.findMany.mockResolvedValue([]);

      const result = await service.settleMatchBets(matchId);

      expect(result).toBeDefined();
      expect(mockPrismaService.betSelection.findMany).toHaveBeenCalled();
    });

    it('should call voidMatchBets when match is postponed', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        id: matchId,
        status: 'postponed',
      });

      mockPrismaService.betSelection.findMany.mockResolvedValue([]);

      const result = await service.settleMatchBets(matchId);

      expect(result).toBeDefined();
      expect(mockPrismaService.betSelection.findMany).toHaveBeenCalled();
    });

    it('should skip non-1X2 market types', async () => {
      const mockMatch = {
        id: matchId,
        status: 'finished',
        homeScore: 2,
        awayScore: 1,
      };

      const mockSelection = {
        id: 'sel-1',
        betId: 'bet-1',
        matchId,
        selection: 'Over 2.5',
        result: 'pending',
        odds: { betType: { code: 'over_under' } },
        bet: {
          id: 'bet-1',
          userId: 'user-1',
          status: 'pending',
          potentialWin: 100000,
          stake: 50000,
          metadata: { realStake: 50000, bonusStake: 0 },
        },
      };

      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.betSelection.findMany.mockResolvedValue([mockSelection]);

      const result = await service.settleMatchBets(matchId);

      expect(result.settled).toBe(0);
    });
  });

  describe('voidMatchBets', () => {
    const matchId = 'match-123';

    it('should void pending bets and refund stakes', async () => {
      const mockSelection = {
        id: 'sel-1',
        betId: 'bet-1',
        matchId,
        result: 'pending',
        bet: {
          id: 'bet-1',
          userId: 'user-1',
          status: 'pending',
          stake: 50000,
          metadata: { realStake: 40000, bonusStake: 10000 },
        },
      };

      mockPrismaService.betSelection.findMany.mockResolvedValue([mockSelection]);
      mockPrismaService.bet.findUnique.mockResolvedValue(mockSelection.bet);
      mockPrismaService.$transaction.mockResolvedValue(undefined);

      const result = await service.voidMatchBets(matchId);

      expect(result.settled).toBe(1);
      expect(mockPrismaService.betSelection.findMany).toHaveBeenCalledWith({
        where: { matchId, result: 'pending' },
        include: { bet: true },
      });
    });

    it('should not void when no pending bets exist', async () => {
      mockPrismaService.betSelection.findMany.mockResolvedValue([]);

      const result = await service.voidMatchBets(matchId);

      expect(result.settled).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should handle multiple bets and deduplicate by betId', async () => {
      const mockSelections = [
        {
          id: 'sel-1',
          betId: 'bet-1',
          matchId,
          result: 'pending',
          bet: {
            id: 'bet-1',
            userId: 'user-1',
            status: 'pending',
            stake: 50000,
            metadata: { realStake: 50000, bonusStake: 0 },
          },
        },
        {
          id: 'sel-2',
          betId: 'bet-1',
          matchId,
          result: 'pending',
          bet: {
            id: 'bet-1',
            userId: 'user-1',
            status: 'pending',
            stake: 50000,
            metadata: { realStake: 50000, bonusStake: 0 },
          },
        },
      ];

      mockPrismaService.betSelection.findMany.mockResolvedValue(mockSelections);
      mockPrismaService.bet.findUnique.mockResolvedValue(mockSelections[0].bet);
      mockPrismaService.$transaction.mockResolvedValue(undefined);

      const result = await service.voidMatchBets(matchId);

      expect(result.settled).toBe(1);
    });

    it('should skip already settled bets', async () => {
      const mockSelection = {
        id: 'sel-1',
        betId: 'bet-1',
        matchId,
        result: 'pending',
        bet: {
          id: 'bet-1',
          userId: 'user-1',
          status: 'won',
          stake: 50000,
          metadata: { realStake: 50000, bonusStake: 0 },
        },
      };

      mockPrismaService.betSelection.findMany.mockResolvedValue([mockSelection]);
      mockPrismaService.bet.findUnique.mockResolvedValue(mockSelection.bet);

      const result = await service.voidMatchBets(matchId);

      expect(result.settled).toBe(0);
    });
  });

  describe('getUserBets', () => {
    const userId = 'user-123';

    it('should return paginated bets with default pagination', async () => {
      const mockBets = [
        {
          id: 'bet-1',
          userId,
          stake: 50000,
          status: 'pending',
          placedAt: new Date('2025-01-01'),
          selections: [],
        },
        {
          id: 'bet-2',
          userId,
          stake: 100000,
          status: 'won',
          placedAt: new Date('2025-01-02'),
          selections: [],
        },
      ];

      mockPrismaService.bet.findMany.mockResolvedValue(mockBets);
      mockPrismaService.bet.count.mockResolvedValue(2);

      const result = await service.getUserBets(userId, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter bets by status', async () => {
      const mockBets = [
        {
          id: 'bet-1',
          userId,
          stake: 50000,
          status: 'pending',
          placedAt: new Date('2025-01-01'),
          selections: [],
        },
      ];

      mockPrismaService.bet.findMany.mockResolvedValue(mockBets);
      mockPrismaService.bet.count.mockResolvedValue(1);

      const query: QueryMyBetsDto = { page: 1, limit: 20, status: 'pending' };
      const result = await service.getUserBets(userId, query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(mockPrismaService.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'pending' }),
        })
      );
    });

    it('should filter bets by date range', async () => {
      mockPrismaService.bet.findMany.mockResolvedValue([]);
      mockPrismaService.bet.count.mockResolvedValue(0);

      const query: QueryMyBetsDto = {
        page: 1,
        limit: 20,
        fromDate: '2025-01-01',
        toDate: '2025-01-31',
      };
      await service.getUserBets(userId, query);

      expect(mockPrismaService.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            placedAt: expect.any(Object),
          }),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.bet.findMany.mockResolvedValue([]);
      mockPrismaService.bet.count.mockResolvedValue(50);

      const query: QueryMyBetsDto = { page: 2, limit: 10 };
      const result = await service.getUserBets(userId, query);

      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.page).toBe(2);
      expect(mockPrismaService.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 })
      );
    });

    it('should order bets by placedAt descending', async () => {
      mockPrismaService.bet.findMany.mockResolvedValue([]);
      mockPrismaService.bet.count.mockResolvedValue(0);

      await service.getUserBets(userId, { page: 1, limit: 20 });

      expect(mockPrismaService.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { placedAt: 'desc' } })
      );
    });

    it('should include selections with odds and match data', async () => {
      mockPrismaService.bet.findMany.mockResolvedValue([]);
      mockPrismaService.bet.count.mockResolvedValue(0);

      await service.getUserBets(userId, { page: 1, limit: 20 });

      expect(mockPrismaService.bet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            selections: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('getBetById', () => {
    const userId = 'user-123';
    const betId = 'bet-123';

    it('should return bet when found and belongs to user', async () => {
      const mockBet = {
        id: betId,
        userId,
        stake: 50000,
        status: 'pending',
        selections: [],
      };

      mockPrismaService.bet.findUnique.mockResolvedValue(mockBet);

      const result = await service.getBetById(userId, betId);

      expect(result).toEqual(mockBet);
    });

    it('should throw NotFoundException when bet not found', async () => {
      mockPrismaService.bet.findUnique.mockResolvedValue(null);

      await expect(service.getBetById(userId, betId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when bet belongs to different user', async () => {
      const mockBet = {
        id: betId,
        userId: 'different-user',
        stake: 50000,
        status: 'pending',
        selections: [],
      };

      mockPrismaService.bet.findUnique.mockResolvedValue(mockBet);

      await expect(service.getBetById(userId, betId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should include selections with odds and match data', async () => {
      const mockBet = {
        id: betId,
        userId,
        stake: 50000,
        status: 'pending',
        selections: [],
      };

      mockPrismaService.bet.findUnique.mockResolvedValue(mockBet);

      await service.getBetById(userId, betId);

      expect(mockPrismaService.bet.findUnique).toHaveBeenCalledWith({
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
    });
  });
});
