/**
 * Search-friendly normalization:
 * - lowercases
 * - removes diacritics
 * - removes all non [a-z0-9] characters (including spaces)
 */
export function normalizeForSearch(input: string): string {
  return input
    .normalize('NFD')
    // remove diacritic marks (safe without Unicode property escapes)
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    // remove everything except ascii letters/numbers
    .replace(/[^a-z0-9]+/g, '');
}

export function buildLeagueSearchKey(league: {
  name?: string | null;
  slug?: string | null;
  country?: string | null;
}): string {
  const raw = [league.name, league.slug, league.country].filter(Boolean).join(' ');
  return normalizeForSearch(raw);
}
