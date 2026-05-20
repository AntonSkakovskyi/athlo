/**
 * String normalization used to match the same exercise across sources
 * (wger → ExerciseDB) and to deduplicate noisy names.
 */

const EQUIP_SUFFIX_RE = /\s*\((barbell|dumbbell|cable|machine|smith|kettlebell|bodyweight|trap bar|ez bar|band|resistance band|sled)\)\s*$/i;

/**
 * Lowercase, strip diacritics, strip equipment suffixes like "(Barbell)",
 * collapse whitespace.
 */
function normalize(input) {
  if (input == null) return '';
  return String(input)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diacritics
    .replace(EQUIP_SUFFIX_RE, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Levenshtein distance (iterative, O(n·m), no recursion).
 * Capped early once distance exceeds `max` for cheap "≤ max" checks.
 */
function levenshtein(a, b, max = Infinity) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > max) return max + 1;

  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/**
 * Strip a string of HTML tags. Used because wger descriptions ship as HTML.
 */
function stripHtml(html) {
  if (!html) return null;
  return String(html)
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { normalize, levenshtein, stripHtml };
