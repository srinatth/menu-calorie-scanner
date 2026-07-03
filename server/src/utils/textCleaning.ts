const PRICE_LINE_RE =
  /(?:rs\.?|inr|₹)\s?\d+(?:[.,]\d+)?|\$\s?\d+(?:[.,]\d{1,2})?|\b\d{2,4}\s*\/-|\b\d{2,4}(?=\s*$)/i;
const NOISE_KEYWORDS = ['gst', 'service charge', 'tax', 'taxes extra', 'all prices', 'terms and conditions'];
// Menu section headers and restaurant branding text ("Salads", "Main Courses", "Restaurant") are
// often Title Case rather than ALL-CAPS, so HEADING_RE below won't catch them — matched here by
// exact (not substring) match against the whole line so real dish names aren't caught in the net.
const SECTION_HEADER_WORDS = new Set([
  'appetizers', 'appetizer', 'starters', 'starter', 'soups', 'soup', 'salads', 'salad',
  'main course', 'main courses', 'mains', 'entrees', 'entree', 'sides', 'side dishes',
  'breads', 'desserts', 'dessert', 'beverages', 'beverage', 'drinks', 'drink',
  'specials', 'special', 'food menu', 'menu', 'restaurant', 'cafe', 'bistro',
]);
const HEADING_RE = /^[A-Z0-9\s&'-]{3,40}$/; // all-caps short lines are usually section headings
const SYMBOL_ONLY_RE = /^[\s*_=~-]{2,}$/;

export function cleanMenuText(rawText: string): string[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const cleaned: string[] = [];

  for (const line of lines) {
    if (SYMBOL_ONLY_RE.test(line)) continue;

    const lower = line.toLowerCase();
    if (NOISE_KEYWORDS.some((kw) => lower.includes(kw))) continue;
    if (SECTION_HEADER_WORDS.has(lower)) continue;

    if (HEADING_RE.test(line) && !/[a-z]/.test(line)) continue;

    let candidate = line.replace(PRICE_LINE_RE, '').trim();
    candidate = candidate.replace(/[.\-–—]+$/, '').trim();

    if (candidate.length < 2) continue;
    if (/^\d+$/.test(candidate)) continue;

    cleaned.push(candidate);
  }

  return cleaned;
}
