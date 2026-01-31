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
    .replace(/[^a-z0-9]+/g, '');
}
