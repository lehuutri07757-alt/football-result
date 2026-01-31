/*
  Cleanup old football data (matches/odds/leagues/teams).

  Usage:
    node prisma/cleanup-old-football-data.js --days=30 --dry-run
    node prisma/cleanup-old-football-data.js --days=30

  Notes:
  - Deletes (in order): bet_selections -> odds -> matches
  - Then deletes inactive leagues with no matches
  - Then deletes teams with no matches (home/away)
*/

const { PrismaClient } = require('@prisma/client');

function parseArgs(argv) {
  const args = { days: 30, dryRun: false };
  for (const raw of argv.slice(2)) {
    if (raw === '--dry-run') args.dryRun = true;
    if (raw.startsWith('--days=')) args.days = Number(raw.split('=')[1]);
  }
  if (!Number.isFinite(args.days) || args.days < 0) {
    throw new Error(`Invalid --days value: ${args.days}`);
  }
  return args;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function main() {
  const { days, dryRun } = parseArgs(process.argv);
  const prisma = new PrismaClient();

  const now = new Date();
  const cutoff = startOfDay(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));

  console.log('--- Cleanup old football data ---');
  console.log(`Now:        ${now.toISOString()}`);
  console.log(`Cutoff:     ${cutoff.toISOString()} (delete startTime < cutoff)`);
  console.log(`Mode:       ${dryRun ? 'DRY RUN (no deletes)' : 'DELETE'}`);

  // Counts (for visibility)
  const [matchesToDelete, oddsToDelete, selectionsToDelete] = await Promise.all([
    prisma.match.count({ where: { startTime: { lt: cutoff } } }),
    prisma.odds.count({ where: { match: { startTime: { lt: cutoff } } } }),
    prisma.betSelection.count({ where: { match: { startTime: { lt: cutoff } } } }),
  ]);

  console.log('Planned deletions:');
  console.log(`- matches:        ${matchesToDelete}`);
  console.log(`- odds:           ${oddsToDelete}`);
  console.log(`- betSelections:  ${selectionsToDelete}`);

  const inactiveFootballLeaguesToDelete = await prisma.league.count({
    where: {
      sport: { slug: 'football' },
      isActive: false,
      matches: { none: {} },
    },
  });

  const footballTeamsToDelete = await prisma.team.count({
    where: {
      sport: { slug: 'football' },
      homeMatches: { none: {} },
      awayMatches: { none: {} },
    },
  });

  console.log(`- inactive football leagues (no matches): ${inactiveFootballLeaguesToDelete}`);
  console.log(`- football teams (no matches):            ${footballTeamsToDelete} (will NOT be deleted by this script)`);

  if (dryRun) {
    console.log('\nDry-run complete. Re-run without --dry-run to execute deletes.');
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const delSelections = await tx.betSelection.deleteMany({
      where: { match: { startTime: { lt: cutoff } } },
    });
    const delOdds = await tx.odds.deleteMany({
      where: { match: { startTime: { lt: cutoff } } },
    });
    const delMatches = await tx.match.deleteMany({
      where: { startTime: { lt: cutoff } },
    });

    const delLeagues = await tx.league.deleteMany({
      where: {
        sport: { slug: 'football' },
        isActive: false,
        matches: { none: {} },
      },
    });

    return {
      deletedBetSelections: delSelections.count,
      deletedOdds: delOdds.count,
      deletedMatches: delMatches.count,
      deletedLeagues: delLeagues.count,
      deletedTeams: 0,
    };
  });

  console.log('\nDelete complete:');
  console.log(result);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Cleanup failed:', err);
  process.exitCode = 1;
});
