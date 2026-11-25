// Convierte texto en trazados SVG con las fuentes autoalojadas, para que la
// imagen OG y el favicon salgan con la tipografía del comercio en cualquier
// máquina (incluido GitHub Actions, que no tiene esas fuentes instaladas).
import fs from 'node:fs';
import path from 'node:path';
import wawoff2 from 'wawoff2';
import opentype from 'opentype.js';
import { P } from './lib.mjs';

const fuentes = new Map();
async function cargar(archivo, estilo) {
  const key = `${archivo}-${estilo}`;
  if (!fuentes.has(key)) {
    let f = path.join(P.plantilla, 'assets/fonts', `${key}.woff2`);
    if (!fs.existsSync(f)) f = path.join(P.plantilla, 'assets/fonts', `${archivo}-normal.woff2`);
    const ttf = await wawoff2.decompress(fs.readFileSync(f));
    fuentes.set(key, opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength)));
  }
  return fuentes.get(key);
}

function medir(font, texto, size, track) {
  let w = 0; const s = size / font.unitsPerEm; let prev = null;
  for (const ch of texto) {
    const g = font.charToGlyph(ch);
    if (prev) w += font.getKerningValue(prev, g) * s;
    w += g.advanceWidth * s + track; prev = g;
  }
  return w - track;
}

/** Devuelve un <path> SVG con el texto. Reduce el tamaño si no cabe en maxW. */
export async function textoAPath(texto, archivo, estilo, { x = 0, y = 0, size = 40, maxW = Infinity, fill = '#000', opacity = 1, upper = false, track = 0, center = null } = {}) {
  const font = await cargar(archivo, estilo);
  const txt = upper ? texto.toUpperCase() : texto;
  let sz = size;
  while (medir(font, txt, sz, track) > maxW && sz > 12) sz -= 2;
  let cx = x, cy = y;
  if (center) { // centra ópticamente (pensado para una sola letra)
    const s0 = sz / font.unitsPerEm, bb = font.charToGlyph(txt[0]).getBoundingBox();
    cx = center[0] - ((bb.x1 + bb.x2) / 2) * s0; cy = center[1] + ((bb.y1 + bb.y2) / 2) * s0;
  }
  let d = ''; const s = sz / font.unitsPerEm; let prev = null;
  for (const ch of txt) {
    const g = font.charToGlyph(ch);
    if (prev) cx += font.getKerningValue(prev, g) * s;
    d += g.getPath(cx, cy, sz).toPathData(1);
    cx += g.advanceWidth * s + track; prev = g;
  }
  return `<path d="${d}" fill="${fill}"${opacity < 1 ? ` fill-opacity="${opacity}"` : ''}/>`;
}
