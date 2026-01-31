"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeForSearch = normalizeForSearch;
exports.buildLeagueSearchKey = buildLeagueSearchKey;
function normalizeForSearch(input) {
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
}
function buildLeagueSearchKey(league) {
    const raw = [league.name, league.slug, league.country].filter(Boolean).join(' ');
    return normalizeForSearch(raw);
}
//# sourceMappingURL=search-normalize.js.map