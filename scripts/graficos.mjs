// Iconos SVG y patrones geométricos generados por código (sin imágenes externas).

const ic = (body, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${body}</svg>`;
export const ICONOS = {
  phone: ic('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  wa: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5.1 5.2-1.4A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.1.8.83-3-.2-.31a8.2 8.2 0 1 1 6.97 3.84Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.97-.15.16-.29.18-.54.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.47a.9.9 0 0 0-.66.31 2.77 2.77 0 0 0-.86 2.06 4.8 4.8 0 0 0 1 2.55c.13.16 1.75 2.67 4.24 3.75 1.58.68 2.2.74 2.99.62.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.16-.48-.29Z"/></svg>`,
  mail: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  pin: ic('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  route: ic('<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16"/>'),
  check: ic('<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.6 2.5L16 9.5"/>'),
  arrow: ic('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  close: ic('<path d="M6 6l12 12M18 6 6 18"/>'),
  prev: ic('<path d="m15 6-6 6 6 6"/>'),
  next: ic('<path d="m9 6 6 6-6 6"/>'),
  ig: ic('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>'),
  fb: ic('<path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3.5h2V21h3.5v-8.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15Z"/>'),
};
const estrella = (fill) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8Z" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
export const estrellas = (n) => { const r = Math.round(n); return Array.from({ length: 5 }, (_, i) => estrella(i < r)).join(''); };

/* PRNG con semilla para que cada comercio tenga siempre el mismo patrón */
function semilla(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return h >>> 0; }
function rng(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const r1 = (n) => Math.round(n * 10) / 10;

export function patron(tipo, clave, { w = 800, h = 800 } = {}) {
  const R = rng(semilla(clave + tipo));
  let s = '';
  switch (tipo) {
    case 'arcos': {
      const cx = w * (0.75 + R() * 0.2), cy = h * (0.75 + R() * 0.2);
      for (let r = 60; r < w * 1.4; r += 34 + R() * 10) s += `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}"/>`;
      const cx2 = w * R() * 0.2, cy2 = h * R() * 0.2;
      for (let r = 40; r < w * 0.5; r += 30) s += `<circle cx="${r1(cx2)}" cy="${r1(cy2)}" r="${r}" opacity=".6"/>`;
      break;
    }
    case 'rayas': {
      for (let x = -h; x < w + h; x += 26) s += `<line x1="${x}" y1="${h}" x2="${x + h}" y2="0" stroke-width="${(x / 26) % 3 === 0 ? 7 : 1.2}"/>`;
      break;
    }
    case 'circulos': {
      for (let y = 30; y < h; y += 60) for (let x = 30 + ((y / 60) % 2) * 30; x < w; x += 60) {
        const rr = 4 + R() * 20; s += `<circle cx="${x}" cy="${y}" r="${r1(rr)}"${R() > 0.75 ? ' fill="currentColor" fill-opacity=".35"' : ''}/>`;
      }
      break;
    }
    case 'rejilla': {
      for (let x = 0; x <= w; x += 40) s += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke-width=".7"/>`;
      for (let y = 0; y <= h; y += 40) s += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke-width=".7"/>`;
      for (let i = 0; i < 18; i++) { const x = Math.floor(R() * (w / 40)) * 40, y = Math.floor(R() * (h / 40)) * 40; s += `<path d="M${x - 8} ${y}h16M${x} ${y - 8}v16" stroke-width="2.2"/>`; }
      const bx = w - 220, by = h - 60; s += `<g stroke-width="14">`; for (let x = bx; x < w + 60; x += 36) s += `<line x1="${x}" y1="${by + 60}" x2="${x + 60}" y2="${by}"/>`; s += `</g>`;
      break;
    }
    case 'puntos': {
      for (let y = 14; y < h; y += 26) for (let x = 14; x < w; x += 26) s += `<circle cx="${x}" cy="${y}" r="${R() > 0.93 ? 4 : 1.6}" fill="currentColor" stroke="none"/>`;
      break;
    }
    case 'ondas': {
      const amp = 10 + R() * 8, per = 120 + R() * 60;
      for (let y = 20; y < h + 40; y += 26) { let d = `M0 ${y}`; for (let x = 0; x <= w; x += 20) d += ` L${x} ${r1(y + Math.sin((x / per) * Math.PI * 2 + y / 60) * amp)}`; s += `<path d="${d}"/>`; }
      break;
    }
    case 'rombos': {
      const st = 56; for (let y = 0; y < h + st; y += st) for (let x = 0; x < w + st; x += st) s += `<path d="M${x} ${y - st / 2}L${x + st / 2} ${y}L${x} ${y + st / 2}L${x - st / 2} ${y}Z"${R() > 0.85 ? ' fill="currentColor" fill-opacity=".3"' : ''}/>`;
      break;
    }
    case 'mapa': {
      const calles = [];
      for (let y = 0; y < h;) { y += 50 + R() * 90; calles.push(`<path d="M0 ${r1(y)} L${w} ${r1(y + (R() - 0.5) * 80)}" stroke-width="${R() > 0.7 ? 9 : 3}"/>`); }
      for (let x = 0; x < w;) { x += 60 + R() * 110; calles.push(`<path d="M${r1(x)} 0 L${r1(x + (R() - 0.5) * 90)} ${h}" stroke-width="${R() > 0.7 ? 9 : 3}"/>`); }
      calles.push(`<path d="M0 ${r1(h * R())} L${w} ${r1(h * R())}" stroke-width="16"/>`);
      s = calles.join('');
      break;
    }
    default: return '';
  }
  return `<svg class="hero__pattern" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true" focusable="false">${s}</svg>`;
}
