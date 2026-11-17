// Deterministic benchmark corpus: the same seed always yields the same cases.
export const DEFAULT_SEED = 0x5eed;
export const DEFAULT_COUNT = 2000;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WORDS = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore ' +
  'magna aliqua render speed parser markdown benchmark block inline token stream list item quote code fence table cell ' +
  'naïve café über straße 東京 emoji').split(' ');

export function buildCases(seed = DEFAULT_SEED, count = DEFAULT_COUNT) {
  const r = rng(seed);
  const int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = arr => arr[Math.floor(r() * arr.length)];
  const words = n => Array.from({ length: n }, () => pick(WORDS)).join(' ');

  const inlineSpan = () => {
    const w = words(int(1, 3));
    switch (int(0, 13)) {
      case 0: return `*${w}*`;
      case 1: return `**${w}**`;
      case 2: return `_${w}_`;
      case 3: return `***${w}***`;
      case 4: return `~~${w}~~`;
      case 5: return `\`${w}\``;
      case 6: return `[${w}](https://example.com/${pick(WORDS)}?q=${int(1, 99)} "${pick(WORDS)}")`;
      case 7: return `[${w}][ref${int(0, 4)}]`;
      case 8: return `![${w}](/img/${int(1, 50)}.png)`;
      case 9: return `<https://example.org/${pick(WORDS)}>`;
      case 10: return `https://www.example.net/${pick(WORDS)}`;
      case 11: return `&amp; &copy; &#169; \\* <span class="x">${w}</span>`;
      case 12: return `**bold with *nested ${w}* emphasis**`;
      default: return w;
    }
  };
  const text = n => Array.from({ length: n }, () => (r() < 0.35 ? inlineSpan() : words(int(2, 6)))).join(' ');
  const para = () => Array.from({ length: int(1, 4) }, () => text(int(2, 6))).join('\n');

  const block = depth => {
    switch (int(0, depth > 1 ? 5 : 11)) {
      case 0: return `${'#'.repeat(int(1, 6))} ${text(2)}`;
      case 1: return `${text(2)}\n${pick(['===', '---'])}`;
      case 2: case 3: case 4: case 5: return para();
      case 6: {
        const ordered = r() < 0.4, loose = r() < 0.3, task = !ordered && r() < 0.3;
        return Array.from({ length: int(2, 6) }, (_, i) => {
          const marker = ordered ? `${i + 1}.` : pick(['-', '*', '+']).repeat(1);
          const box = task ? (r() < 0.5 ? '[x] ' : '[ ] ') : '';
          let item = `${marker} ${box}${text(int(1, 3))}`;
          if (r() < 0.25) item += '\n' + block(depth + 1).split('\n').map(l => ' '.repeat(marker.length + 1) + l).join('\n');
          return item;
        }).join(loose ? '\n\n' : '\n');
      }
      case 7: return block(depth + 1).split('\n').map(l => '> ' + l).join('\n');
      case 8: {
        const fence = pick(['```', '~~~']);
        const lines = Array.from({ length: int(2, 10) }, () => `  const ${pick(WORDS)} = ${int(0, 999)}; // <${pick(WORDS)}> & "x"`);
        return `${fence}${pick(['js', 'ts', 'python', ''])}\n${lines.join('\n')}\n${fence}`;
      }
      case 9: return Array.from({ length: int(2, 5) }, () => '    ' + words(int(3, 8))).join('\n');
      case 10: {
        const cols = int(2, 4);
        const row = () => '| ' + Array.from({ length: cols }, () => text(1)).join(' | ') + ' |';
        const sep = '| ' + Array.from({ length: cols }, () => pick(['---', ':---', '---:', ':---:'])).join(' | ') + ' |';
        return [row(), sep, ...Array.from({ length: int(1, 5) }, row)].join('\n');
      }
      default: return r() < 0.5 ? pick(['---', '***', '___']) : `<div class="note">\n${words(5)}\n</div>`;
    }
  };

  const cases = [];
  for (let c = 0; c < count; c++) {
    const blocks = Array.from({ length: int(3, 20) }, () => block(0));
    if (r() < 0.6) for (let k = 0; k < 5; k++) blocks.push(`[ref${k}]: https://example.com/ref/${k} "Ref ${k}"`);
    cases.push({ id: `case-${String(c).padStart(4, '0')}`, markdown: blocks.join('\n\n') + '\n' });
  }
  return cases;
}
