"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const search_normalize_1 = require("../common/utils/search-normalize");
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        const leagues = await prisma.league.findMany({
            select: { id: true, name: true, slug: true, country: true },
        });
        const batchSize = 200;
        let updated = 0;
        for (let i = 0; i < leagues.length; i += batchSize) {
            const batch = leagues.slice(i, i + batchSize);
            await prisma.$transaction(batch.map((l) => prisma.league.update({
                where: { id: l.id },
                data: {
                    searchKey: (0, search_normalize_1.buildLeagueSearchKey)({
                        name: l.name,
                        slug: l.slug,
                        country: l.country,
                    }),
                },
            })));
            updated += batch.length;
            console.log(`Backfilled ${updated}/${leagues.length}`);
        }
        console.log('Done');
    }
    finally {
        await prisma.$disconnect();
    }
}
void main();
//# sourceMappingURL=backfill-league-search-key.js.map