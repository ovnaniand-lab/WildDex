/** Convert simple API-provided HTML excerpts into safe plain text for React Native. */
export function plainDescription(input?: string | null): string | undefined {
  if (!input) return undefined;
  const entities: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘',
    ldquo: '“', rdquo: '”', copy: '©',
  };
  const text = input
    .replace(/<\s*br\s*\/?\s*>/gi, ' ')
    .replace(/<\s*\/(?:p|div|li|h[1-6])\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (full, code: string) => {
      if (code[0] === '#') {
        const hex = code[1]?.toLowerCase() === 'x';
        const point = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
        return Number.isInteger(point) && point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
          ? String.fromCodePoint(point) : full;
      }
      return entities[code.toLowerCase()] ?? full;
    })
    .replace(/<[^>]*>/g, '') // remove markup that was HTML-entity-encoded
    .replace(/\s+/g, ' ')
    .trim();
  return text || undefined;
}
