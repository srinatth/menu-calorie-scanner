// A bare trailing number is treated as a price only if it's 3-4 digits (≥100).
// A trailing *two*-digit number is deliberately kept: "65" is a whole class of
// Indian dish names (Gobi 65, Paneer 65, Idli 65, Chicken 65), not a price —
// stripping it both loses the dish's identity and causes wrong fuzzy matches
// ("Paneer 65" → "Paneer" → "Paneer Butter Masala"). Currency-prefixed and
// "50/-"-style prices are still stripped at any digit count.
const PRICE_LINE_RE =
  /(?:rs\.?|inr|₹)\s?\d+(?:[.,]\d+)?|\$\s?\d+(?:[.,]\d{1,2})?|\b\d{2,4}\s*\/-|\b\d{3,4}(?=\s*$)/i;
// OCR misreads the little veg/spicy icons next to dish names as trailing junk
// ("Paneer Fry*", "Chinta Chiguru Paneer ✔", "Idli Fries 1:"). Strip trailing
// symbols and a lone single digit — but never a 2-digit suffix like "65".
const TRAILING_SYMBOLS_RE = /[\s.:;*•·|✓✔★☆–—-]+$/;
const TRAILING_LONE_DIGIT_RE = /\s+\d$/;
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
    // Repeatedly peel trailing icon-misread junk until the name is stable, e.g.
    // "Ishtaa Spl Chilli Paneer (Dry) 1:" -> "Ishtaa Spl Chilli Paneer (Dry)".
    let previous: string;
    do {
      previous = candidate;
      candidate = candidate.replace(TRAILING_SYMBOLS_RE, '').replace(TRAILING_LONE_DIGIT_RE, '').trim();
    } while (candidate !== previous);

    if (candidate.length < 2) continue;
    if (/^\d+$/.test(candidate)) continue;

    cleaned.push(candidate);
  }

  return cleaned;
}
