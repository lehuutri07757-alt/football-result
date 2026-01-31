import { PrismaClient } from '@prisma/client';

import { buildLeagueSearchKey } from '../common/utils/search-normalize';

/**
 * Backfill League.searchKey for existing rows.
 * Run:
 *   pnpm -C apps/api exec ts-node src/scripts/backfill-league-search-key.ts
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    const leagues = await prisma.league.findMany({
      select: { id: true, name: true, slug: true, country: true },
    });

    const batchSize = 200;
    let updated = 0;

    for (let i = 0; i < leagues.length; i += batchSize) {
      const batch = leagues.slice(i, i + batchSize);
      await prisma.$transaction(
        batch.map((l) =>
          prisma.league.update({
            where: { id: l.id },
            data: {
              searchKey: buildLeagueSearchKey({
                name: l.name,
                slug: l.slug,
                country: l.country,
              }),
            },
          }),
        ),
      );
      updated += batch.length;
      // eslint-disable-next-line no-console
      console.log(`Backfilled ${updated}/${leagues.length}`);
    }

    // eslint-disable-next-line no-console
    console.log('Done');
  } finally {
    await prisma.$disconnect();
  }
}

void main();
