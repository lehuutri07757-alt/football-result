import { Test, TestingModule } from '@nestjs/testing';
import { LeagueSyncService } from './league-sync.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { ApiFootballService } from './api-football.service';

describe('LeagueSyncService', () => {
  let service: LeagueSyncService;
  let mockPrismaService: Record<string, any>;
  let mockRedisService: Record<string, any>;
  let mockApiFootballService: Record<string, any>;

  const apiLeagues = [
    {
      league: { id: 100, name: 'Premier League', logo: 'logo' },
      country: { name: 'England', code: 'GB' },
      seasons: [{ year: 2025, current: true }],
    },
  ];

  beforeEach(async () => {
    mockPrismaService = {
      league: {
        updateMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      sport: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    mockRedisService = {
      getJson: jest.fn(),
      setJson: jest.fn(),
      getClient: jest.fn().mockReturnValue({
        keys: jest.fn().mockResolvedValue([]),
        del: jest.fn().mockResolvedValue(0),
      }),
    };

    mockApiFootballService = {
      fetchAllLeagues: jest.fn().mockResolvedValue(apiLeagues),
    };

    mockPrismaService.sport.findFirst.mockResolvedValue({ id: 'sport-1' });
    mockPrismaService.league.updateMany.mockResolvedValue({ count: 0 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeagueSyncService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ApiFootballService, useValue: mockApiFootballService },
      ],
    }).compile();

    service = module.get<LeagueSyncService>(LeagueSyncService);
    jest.clearAllMocks();
  });

  it('does not overwrite isActive for existing leagues', async () => {
    mockPrismaService.league.findFirst.mockResolvedValue({ id: 'league-1' });
    mockPrismaService.league.update.mockResolvedValue({ id: 'league-1' });

    await service.syncLeagues();

    expect(mockPrismaService.league.update).toHaveBeenCalledTimes(1);

    const updateArgs = mockPrismaService.league.update.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: 'league-1' });
    expect(updateArgs.data).not.toHaveProperty('isActive');
  });

  it('creates new leagues as active by default', async () => {
    mockPrismaService.league.findFirst.mockResolvedValue(null);
    mockPrismaService.league.create.mockResolvedValue({ id: 'league-1' });

    await service.syncLeagues();

    expect(mockPrismaService.league.create).toHaveBeenCalledTimes(1);
    const createArgs = mockPrismaService.league.create.mock.calls[0][0];
    expect(createArgs.data.isActive).toBe(true);
  });
});
