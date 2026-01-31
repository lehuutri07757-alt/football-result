"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const permissions_1 = require("../src/modules/roles/constants/permissions");
const prisma = new client_1.PrismaClient();
async function main() {
    const roles = [
        {
            name: 'Super Admin',
            code: permissions_1.ROLE_CODES.SUPER_ADMIN,
            description: 'Full system access',
            permissions: permissions_1.DEFAULT_ROLE_PERMISSIONS[permissions_1.ROLE_CODES.SUPER_ADMIN],
        },
        {
            name: 'Master Agent',
            code: permissions_1.ROLE_CODES.MASTER_AGENT,
            description: 'Top level agent with full agent capabilities',
            permissions: permissions_1.DEFAULT_ROLE_PERMISSIONS[permissions_1.ROLE_CODES.MASTER_AGENT],
        },
        {
            name: 'Agent',
            code: permissions_1.ROLE_CODES.AGENT,
            description: 'Level 1 agent',
            permissions: permissions_1.DEFAULT_ROLE_PERMISSIONS[permissions_1.ROLE_CODES.AGENT],
        },
        {
            name: 'Sub Agent',
            code: permissions_1.ROLE_CODES.SUB_AGENT,
            description: 'Level 2 agent',
            permissions: permissions_1.DEFAULT_ROLE_PERMISSIONS[permissions_1.ROLE_CODES.SUB_AGENT],
        },
        {
            name: 'User',
            code: permissions_1.ROLE_CODES.USER,
            description: 'Regular player',
            permissions: permissions_1.DEFAULT_ROLE_PERMISSIONS[permissions_1.ROLE_CODES.USER],
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
        const leagues = [
            { sportId: football.id, name: 'Premier League', slug: 'premier-league', country: 'England', countryCode: 'GB', sortOrder: 1, isFeatured: true },
            { sportId: football.id, name: 'La Liga', slug: 'la-liga', country: 'Spain', countryCode: 'ES', sortOrder: 2, isFeatured: true },
            { sportId: football.id, name: 'Bundesliga', slug: 'bundesliga', country: 'Germany', countryCode: 'DE', sortOrder: 3, isFeatured: true },
            { sportId: football.id, name: 'Serie A', slug: 'serie-a', country: 'Italy', countryCode: 'IT', sortOrder: 4, isFeatured: true },
            { sportId: football.id, name: 'Ligue 1', slug: 'ligue-1', country: 'France', countryCode: 'FR', sortOrder: 5, isFeatured: false },
            { sportId: football.id, name: 'Champions League', slug: 'champions-league', country: 'Europe', countryCode: 'EU', sortOrder: 0, isFeatured: true },
        ];
        for (const league of leagues) {
            const existing = await prisma.league.findFirst({ where: { slug: league.slug, sportId: league.sportId } });
            if (!existing) {
                await prisma.league.create({ data: league });
            }
        }
        const teams = [
            { sportId: football.id, name: 'Manchester United', shortName: 'MUN', slug: 'manchester-united', country: 'England', countryCode: 'GB' },
            { sportId: football.id, name: 'Liverpool', shortName: 'LIV', slug: 'liverpool', country: 'England', countryCode: 'GB' },
            { sportId: football.id, name: 'Arsenal', shortName: 'ARS', slug: 'arsenal', country: 'England', countryCode: 'GB' },
            { sportId: football.id, name: 'Chelsea', shortName: 'CHE', slug: 'chelsea', country: 'England', countryCode: 'GB' },
            { sportId: football.id, name: 'Manchester City', shortName: 'MCI', slug: 'manchester-city', country: 'England', countryCode: 'GB' },
            { sportId: football.id, name: 'Real Madrid', shortName: 'RMA', slug: 'real-madrid', country: 'Spain', countryCode: 'ES' },
            { sportId: football.id, name: 'Barcelona', shortName: 'BAR', slug: 'barcelona', country: 'Spain', countryCode: 'ES' },
            { sportId: football.id, name: 'Bayern Munich', shortName: 'BAY', slug: 'bayern-munich', country: 'Germany', countryCode: 'DE' },
            { sportId: football.id, name: 'Borussia Dortmund', shortName: 'BVB', slug: 'borussia-dortmund', country: 'Germany', countryCode: 'DE' },
            { sportId: football.id, name: 'Juventus', shortName: 'JUV', slug: 'juventus', country: 'Italy', countryCode: 'IT' },
            { sportId: football.id, name: 'AC Milan', shortName: 'ACM', slug: 'ac-milan', country: 'Italy', countryCode: 'IT' },
            { sportId: football.id, name: 'Inter Milan', shortName: 'INT', slug: 'inter-milan', country: 'Italy', countryCode: 'IT' },
            { sportId: football.id, name: 'PSG', shortName: 'PSG', slug: 'psg', country: 'France', countryCode: 'FR' },
            { sportId: football.id, name: 'Lyon', shortName: 'LYO', slug: 'lyon', country: 'France', countryCode: 'FR' },
        ];
        for (const team of teams) {
            const existing = await prisma.team.findFirst({ where: { slug: team.slug, sportId: team.sportId } });
            if (!existing) {
                await prisma.team.create({ data: team });
            }
        }
        const premierLeague = await prisma.league.findFirst({ where: { slug: 'premier-league' } });
        const laLiga = await prisma.league.findFirst({ where: { slug: 'la-liga' } });
        const bundesliga = await prisma.league.findFirst({ where: { slug: 'bundesliga' } });
        const manUtd = await prisma.team.findFirst({ where: { slug: 'manchester-united' } });
        const liverpool = await prisma.team.findFirst({ where: { slug: 'liverpool' } });
        const realMadrid = await prisma.team.findFirst({ where: { slug: 'real-madrid' } });
        const barcelona = await prisma.team.findFirst({ where: { slug: 'barcelona' } });
        const bayern = await prisma.team.findFirst({ where: { slug: 'bayern-munich' } });
        const dortmund = await prisma.team.findFirst({ where: { slug: 'borussia-dortmund' } });
        if (premierLeague && manUtd && liverpool) {
            const existingMatch = await prisma.match.findFirst({
                where: { homeTeamId: manUtd.id, awayTeamId: liverpool.id, leagueId: premierLeague.id }
            });
            if (!existingMatch) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(22, 0, 0, 0);
                await prisma.match.create({
                    data: {
                        leagueId: premierLeague.id,
                        homeTeamId: manUtd.id,
                        awayTeamId: liverpool.id,
                        startTime: tomorrow,
                        status: 'scheduled',
                        bettingEnabled: true,
                        isFeatured: true,
                    }
                });
            }
        }
        if (laLiga && realMadrid && barcelona) {
            const existingMatch = await prisma.match.findFirst({
                where: { homeTeamId: realMadrid.id, awayTeamId: barcelona.id, leagueId: laLiga.id }
            });
            if (!existingMatch) {
                const dayAfter = new Date();
                dayAfter.setDate(dayAfter.getDate() + 2);
                dayAfter.setHours(2, 0, 0, 0);
                await prisma.match.create({
                    data: {
                        leagueId: laLiga.id,
                        homeTeamId: realMadrid.id,
                        awayTeamId: barcelona.id,
                        startTime: dayAfter,
                        status: 'scheduled',
                        bettingEnabled: true,
                        isFeatured: true,
                    }
                });
            }
        }
        if (bundesliga && bayern && dortmund) {
            const existingMatch = await prisma.match.findFirst({
                where: { homeTeamId: bayern.id, awayTeamId: dortmund.id, leagueId: bundesliga.id }
            });
            if (!existingMatch) {
                const threeDays = new Date();
                threeDays.setDate(threeDays.getDate() + 3);
                threeDays.setHours(0, 30, 0, 0);
                await prisma.match.create({
                    data: {
                        leagueId: bundesliga.id,
                        homeTeamId: bayern.id,
                        awayTeamId: dortmund.id,
                        startTime: threeDays,
                        status: 'scheduled',
                        bettingEnabled: true,
                        isFeatured: true,
                    }
                });
            }
        }
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
            slug: {
                in: [
                    'premier-league',
                    'la-liga',
                    'bundesliga',
                    'serie-a',
                    'champions-league',
                ],
            },
        },
        select: { id: true },
    });
    const topTeams = await prisma.team.findMany({
        where: {
            slug: {
                in: [
                    'manchester-united',
                    'manchester-city',
                    'liverpool',
                    'arsenal',
                    'chelsea',
                    'real-madrid',
                    'barcelona',
                    'bayern-munich',
                    'borussia-dortmund',
                    'juventus',
                    'ac-milan',
                    'inter-milan',
                    'psg',
                ],
            },
        },
        select: { id: true, slug: true },
    });
    const teamIdMap = new Map(topTeams.map(t => [t.slug, t.id]));
    const derbyPairs = [];
    const manUtdId = teamIdMap.get('manchester-united');
    const manCityId = teamIdMap.get('manchester-city');
    const liverpoolId = teamIdMap.get('liverpool');
    const arsenalId = teamIdMap.get('arsenal');
    const chelseaId = teamIdMap.get('chelsea');
    const realMadridId = teamIdMap.get('real-madrid');
    const barcelonaId = teamIdMap.get('barcelona');
    const bayernId = teamIdMap.get('bayern-munich');
    const dortmundId = teamIdMap.get('borussia-dortmund');
    const juventusId = teamIdMap.get('juventus');
    const acMilanId = teamIdMap.get('ac-milan');
    const interMilanId = teamIdMap.get('inter-milan');
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
        derbyPairs.push({ homeTeamId: juventusId, awayTeamId: interMilanId, name: 'Derby d\'Italia' });
    }
    const featuredMatchesSettings = {
        featuredLeagueIds: featuredLeagues.map(l => l.id),
        topTeamRankThreshold: 4,
        topTeamIds: topTeams.map(t => t.id),
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
            description: 'Featured Matches Settings - Auto-configured with top leagues, teams and derby matches',
            category: 'matches',
            isPublic: false,
        },
        create: {
            key: 'featured_matches_settings',
            value: featuredMatchesSettings,
            description: 'Featured Matches Settings - Auto-configured with top leagues, teams and derby matches',
            category: 'matches',
            isPublic: false,
        },
    });
    console.log('Featured Matches Settings seeded:');
    console.log(`  - Featured Leagues: ${featuredLeagues.length}`);
    console.log(`  - Top Teams: ${topTeams.length}`);
    console.log(`  - Derby Pairs: ${derbyPairs.length}`);
    console.log('Seed completed successfully');
}
main()
    .catch(async (error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map