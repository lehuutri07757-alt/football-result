import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const FEATURED_LEAGUE_MAPPING = [
  { name: 'Premier League', country: 'England', externalId: '39' },
  { name: 'La Liga', country: 'Spain', externalId: '140' },
  { name: 'Bundesliga', country: 'Germany', externalId: '78' },
  { name: 'Serie A', country: 'Italy', externalId: '135' },
  { name: 'Ligue 1', country: 'France', externalId: '61' },
  { name: 'UEFA Champions League', country: 'World', externalId: '2' },
];

async function main() {
  console.log('Starting duplicate league cleanup...\n');

  const seedLeagues = await prisma.league.findMany({
    where: { externalId: null },
    include: {
      _count: {
        select: { matches: true },
      },
    },
  });

  console.log(`Found ${seedLeagues.length} leagues without externalId (seed-created):\n`);

  for (const league of seedLeagues) {
    console.log(`  - ${league.name} (${league.country}) - slug: ${league.slug}, matches: ${league._count.matches}`);
  }

  const duplicates: Array<{
    seedLeague: (typeof seedLeagues)[0];
    apiLeague: { id: string; name: string; slug: string; country: string | null; externalId: string | null };
  }> = [];

  for (const seedLeague of seedLeagues) {
    const apiLeague = await prisma.league.findFirst({
      where: {
        name: seedLeague.name,
        country: seedLeague.country,
        externalId: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        externalId: true,
      },
    });

    if (apiLeague) {
      duplicates.push({ seedLeague, apiLeague });
    }
  }

  console.log(`\n\nFound ${duplicates.length} duplicate pairs:\n`);

  for (const { seedLeague, apiLeague } of duplicates) {
    console.log(`  DUPLICATE: "${seedLeague.name}" (${seedLeague.country})`);
    console.log(`    Seed league  : id=${seedLeague.id}, slug=${seedLeague.slug}`);
    console.log(`    API league   : id=${apiLeague.id}, slug=${apiLeague.slug}, externalId=${apiLeague.externalId}`);
  }

  if (duplicates.length === 0) {
    console.log('\nNo duplicates found. Nothing to clean up.');
    return;
  }

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question('\nDo you want to delete the seed-created leagues and their matches? (yes/no): ', resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'yes') {
    console.log('Aborted. No changes made.');
    return;
  }

  console.log('\nDeleting seed-created duplicate leagues...\n');

  let deleted = 0;
  let matchesDeleted = 0;

  for (const { seedLeague } of duplicates) {
    try {
      if (seedLeague._count.matches > 0) {
        const deleteResult = await prisma.match.deleteMany({
          where: { leagueId: seedLeague.id },
        });
        matchesDeleted += deleteResult.count;
        console.log(`  Deleted ${deleteResult.count} matches from ${seedLeague.name}`);
      }

      await prisma.league.delete({
        where: { id: seedLeague.id },
      });
      console.log(`  DELETED: ${seedLeague.name} (${seedLeague.slug})`);
      deleted++;
    } catch (error) {
      console.log(`  ERROR deleting ${seedLeague.name}: ${error}`);
    }
  }

  console.log(`\nCleanup complete: ${deleted} leagues deleted, ${matchesDeleted} matches deleted`);

  console.log('\nUpdating featured_matches_settings...');

  const featuredLeagues = await prisma.league.findMany({
    where: {
      OR: FEATURED_LEAGUE_MAPPING.map((m) => ({
        externalId: m.externalId,
      })),
    },
    select: { id: true, name: true, country: true, externalId: true },
  });

  console.log('Featured leagues from API:');
  for (const league of featuredLeagues) {
    console.log(`  - ${league.name} (${league.country}): ${league.id} [ext: ${league.externalId}]`);
  }

  if (featuredLeagues.length > 0) {
    const currentSettings = await prisma.setting.findUnique({
      where: { key: 'featured_matches_settings' },
    });

    if (currentSettings?.value && typeof currentSettings.value === 'object') {
      const settings = currentSettings.value as Prisma.JsonObject;
      settings.featuredLeagueIds = featuredLeagues.map((l) => l.id);

      await prisma.setting.update({
        where: { key: 'featured_matches_settings' },
        data: { value: settings },
      });

      console.log(`\nFeatured matches settings updated with ${featuredLeagues.length} league IDs`);
    }
  }
}

main()
  .catch(async (error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
