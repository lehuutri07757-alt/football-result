import { PrismaClient } from '@prisma/client';

import { DEFAULT_ROLE_PERMISSIONS, ROLE_CODES } from '../src/modules/roles/constants/permissions';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      name: 'Super Admin',
      code: ROLE_CODES.SUPER_ADMIN,
      description: 'Full system access',
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_CODES.SUPER_ADMIN],
    },
    {
      name: 'Master Agent',
      code: ROLE_CODES.MASTER_AGENT,
      description: 'Top level agent with full agent capabilities',
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_CODES.MASTER_AGENT],
    },
    {
      name: 'Agent',
      code: ROLE_CODES.AGENT,
      description: 'Level 1 agent',
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_CODES.AGENT],
    },
    {
      name: 'Sub Agent',
      code: ROLE_CODES.SUB_AGENT,
      description: 'Level 2 agent',
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_CODES.SUB_AGENT],
    },
    {
      name: 'User',
      code: ROLE_CODES.USER,
      description: 'Regular player',
      permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_CODES.USER],
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      },
      create: role,
    });
  }

  const sports = [
    { name: 'Football', slug: 'football', icon: '⚽', sortOrder: 1 },
    { name: 'Basketball', slug: 'basketball', icon: '🏀', sortOrder: 2 },
    { name: 'Tennis', slug: 'tennis', icon: '🎾', sortOrder: 3 },
    { name: 'E-Sports', slug: 'esports', icon: '🎮', sortOrder: 4 },
  ];

  for (const sport of sports) {
    await prisma.sport.upsert({
      where: { slug: sport.slug },
      update: sport,
      create: sport,
    });
  }

  const football = await prisma.sport.findUnique({ where: { slug: 'football' } });

  if (football) {
    const betTypes = [
      { sportId: football.id, name: 'Match Winner', code: 'match_winner', description: '1X2 - Home, Draw, Away', sortOrder: 1 },
      { sportId: football.id, name: 'Asian Handicap', code: 'asian_handicap', description: 'Asian Handicap betting', sortOrder: 2 },
      { sportId: football.id, name: 'Over/Under', code: 'over_under', description: 'Total goals over/under', sortOrder: 3 },
      { sportId: football.id, name: 'Both Teams to Score', code: 'btts', description: 'Both teams to score (Yes/No)', sortOrder: 4 },
      { sportId: football.id, name: 'Double Chance', code: 'double_chance', description: '1X, 12, X2', sortOrder: 5 },
      { sportId: football.id, name: 'Home Team Total', code: 'home_total', description: 'Home team total goals over/under', sortOrder: 6 },
      { sportId: football.id, name: 'Away Team Total', code: 'away_total', description: 'Away team total goals over/under', sortOrder: 7 },
      { sportId: football.id, name: 'HT Match Winner', code: 'ht_match_winner', description: 'Half-time 1X2', sortOrder: 8 },
      { sportId: football.id, name: 'HT Asian Handicap', code: 'ht_asian_handicap', description: 'Half-time Asian Handicap', sortOrder: 9 },
      { sportId: football.id, name: 'HT Over/Under', code: 'ht_over_under', description: 'Half-time total goals', sortOrder: 10 },
    ];

    for (const betType of betTypes) {
      await prisma.betType.upsert({
        where: { sportId_code: { sportId: betType.sportId, code: betType.code } },
        update: {
          name: betType.name,
          description: betType.description,
          sortOrder: betType.sortOrder,
        },
        create: betType,
      });
    }
  }

  await prisma.dataProvider.upsert({
    where: { code: 'api_football' },
    update: {
      name: 'API-Football',
      description: 'Football data from API-Sports',
      types: ['odds', 'fixtures', 'live_scores', 'statistics', 'leagues', 'teams'],
      baseUrl: 'https://v3.football.api-sports.io',
      apiKey: process.env.API_FOOTBALL_KEY || '',
      headers: { 'x-apisports-key': '{{apiKey}}' },
      config: { timeout: 30000, retryAttempts: 3, retryDelay: 1000 },
      status: 'active',
      priority: 100,
      dailyLimit: 100,
      monthlyLimit: 3000,
    },
    create: {
      code: 'api_football',
      name: 'API-Football',
      description: 'Football data from API-Sports',
      types: ['odds', 'fixtures', 'live_scores', 'statistics', 'leagues', 'teams'],
      baseUrl: 'https://v3.football.api-sports.io',
      apiKey: process.env.API_FOOTBALL_KEY || '',
      headers: { 'x-apisports-key': '{{apiKey}}' },
      config: { timeout: 30000, retryAttempts: 3, retryDelay: 1000 },
      status: 'active',
      priority: 100,
      dailyLimit: 100,
      monthlyLimit: 3000,
    },
  });

  const featuredLeagues = await prisma.league.findMany({
    where: {
      OR: [
        { name: 'Premier League', country: 'England' },
        { name: 'La Liga', country: 'Spain' },
        { name: 'Bundesliga', country: 'Germany' },
        { name: 'Serie A', country: 'Italy' },
        { name: 'UEFA Champions League' },
      ],
      externalId: { not: null },
    },
    select: { id: true, name: true },
  });

  const topTeamNames = [
    'Manchester United',
    'Manchester City',
    'Liverpool',
    'Arsenal',
    'Chelsea',
    'Real Madrid',
    'FC Barcelona',
    'Bayern München',
    'Borussia Dortmund',
    'Juventus',
    'AC Milan',
    'Inter',
    'Paris Saint Germain',
  ];

  const topTeams = await prisma.team.findMany({
    where: {
      name: { in: topTeamNames },
      externalId: { not: null },
    },
    select: { id: true, name: true },
  });

  const teamIdMap = new Map(topTeams.map((t) => [t.name, t.id]));

  const derbyPairs: Array<{ homeTeamId: string; awayTeamId: string; name: string }> = [];

  const manUtdId = teamIdMap.get('Manchester United');
  const manCityId = teamIdMap.get('Manchester City');
  const liverpoolId = teamIdMap.get('Liverpool');
  const arsenalId = teamIdMap.get('Arsenal');
  const chelseaId = teamIdMap.get('Chelsea');
  const realMadridId = teamIdMap.get('Real Madrid');
  const barcelonaId = teamIdMap.get('FC Barcelona');
  const bayernId = teamIdMap.get('Bayern München');
  const dortmundId = teamIdMap.get('Borussia Dortmund');
  const juventusId = teamIdMap.get('Juventus');
  const acMilanId = teamIdMap.get('AC Milan');
  const interMilanId = teamIdMap.get('Inter');

  if (manUtdId && manCityId) {
    derbyPairs.push({ homeTeamId: manUtdId, awayTeamId: manCityId, name: 'Manchester Derby' });
  }
  if (manUtdId && liverpoolId) {
    derbyPairs.push({ homeTeamId: manUtdId, awayTeamId: liverpoolId, name: 'North West Derby' });
  }
  if (arsenalId && chelseaId) {
    derbyPairs.push({ homeTeamId: arsenalId, awayTeamId: chelseaId, name: 'London Derby' });
  }
  if (realMadridId && barcelonaId) {
    derbyPairs.push({ homeTeamId: realMadridId, awayTeamId: barcelonaId, name: 'El Clasico' });
  }
  if (bayernId && dortmundId) {
    derbyPairs.push({ homeTeamId: bayernId, awayTeamId: dortmundId, name: 'Der Klassiker' });
  }
  if (acMilanId && interMilanId) {
    derbyPairs.push({ homeTeamId: acMilanId, awayTeamId: interMilanId, name: 'Derby della Madonnina' });
  }
  if (juventusId && interMilanId) {
    derbyPairs.push({ homeTeamId: juventusId, awayTeamId: interMilanId, name: "Derby d'Italia" });
  }

  const featuredMatchesSettings = {
    featuredLeagueIds: featuredLeagues.map((l) => l.id),
    topTeamRankThreshold: 4,
    topTeamIds: topTeams.map((t) => t.id),
    derbyPairs,
    maxFeaturedMatches: 10,
    autoSelectEnabled: true,
    includeUpcoming: true,
    includeLive: true,
    upcomingHours: 48,
  };

  await prisma.setting.upsert({
    where: { key: 'featured_matches_settings' },
    update: {
      value: featuredMatchesSettings,
      category: 'matches',
      isPublic: false,
    },
    create: {
      key: 'featured_matches_settings',
      value: featuredMatchesSettings,
      description: 'Featured matches configuration',
      category: 'matches',
      isPublic: false,
    },
  });

  console.log('Featured Matches Settings:');
  console.log(`  - Leagues: ${featuredLeagues.length} (${featuredLeagues.map((l) => l.name).join(', ')})`);
  console.log(`  - Top Teams: ${topTeams.length}`);
  console.log(`  - Derby Pairs: ${derbyPairs.length}`);

  console.log('Seed completed successfully');
}

main()
  .catch(async error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
