#!/usr/bin/env node
// Valida los JSON y la web generada. Sale con código 1 solo si hay errores en
// webs PUBLICADAS o en la salida (así una demo a medias no bloquea publicar).
import fs from 'node:fs';
import path from 'node:path';
import { P, c as col, validar, listarComercios, carpetaDe, revisarPendientes, E164 } from './lib.mjs';

const LIMITE_KB = 300;
let fallos = 0, avisosTot = 0;
const pendientes = [];
const err = (m) => { fallos++; console.log(col.red(`   ✗ ${m}`)); };
const warn = (m) => { avisosTot++; console.log(col.yellow(`   ⚠ ${m}`)); };

for (const { archivo, datos: c } of listarComercios()) {
  const pub = c.estado === 'publicada';
  console.log(`\n${pub ? col.bold('[publicada]') : col.dim('[demo]     ')} ${path.basename(archivo)}`);
  const { errores, avisos } = validar(c, { imgDir: path.join(P.img, c.slug || '') });
  errores.forEach((m) => (pub ? err(m) : warn(`(demo, no bloquea) ${m}`)));
  avisos.forEach(warn);
  const rev = revisarPendientes(c);
  if (rev.length) pendientes.push({ archivo: path.basename(archivo), campos: rev, nombre: c.nombre });
  if (errores.length) continue;

  const dir = path.join(P.docs, carpetaDe(c));
  const idx = path.join(dir, 'index.html');
  if (!fs.existsSync(idx)) { (pub ? err : warn)('no está generada: ejecuta npm run build'); continue; }
  for (const f of ['index.html', 'aviso-legal.html', 'privacidad.html', 'entrega.html', 'llms.txt', 'og.png', 'favicon.svg', 'main.js']) if (!fs.existsSync(path.join(dir, f))) err(`falta ${f}`);
  const html = fs.readFileSync(idx, 'utf8');
  for (const f of ['index.html', 'aviso-legal.html', 'privacidad.html', 'entrega.html']) {
    const h = fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : '';
    if (/\{\{/.test(h.replace(/<(style|script)[\s\S]*?<\/\1>/g, ''))) err(`${f}: quedan marcadores {{ }} sin rellenar`);
    if (/undefined|\[object Object\]|NaN/.test(h.replace(/<script[\s\S]*?<\/script>/g, ''))) err(`${f}: aparece «undefined», «NaN» u «[object Object]»`);
  }
  for (const [, n] of html.matchAll(/href="tel:([^"]*)"/g)) if (!E164.test(n)) err(`enlace tel: no válido «${n}»`);
  for (const [, n] of html.matchAll(/href="https:\/\/wa\.me\/([^"?]*)/g)) if (!/^[1-9]\d{7,14}$/.test(n)) err(`enlace wa.me no válido «${n}»`);
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) err('debe haber exactamente un <h1>');
  const robots = /<meta name="robots" content="noindex/.test(html);
  if (pub && robots) err('publicada pero con noindex');
  if (!pub && !robots) err('demo sin noindex');
  if (!pub && !html.includes('class="demo-bar"')) err('demo sin la franja de propuesta');
  if (pub && html.includes('class="demo-bar"')) err('publicada con la franja de demo');
  if (/<(img|iframe|script|link)[^>]+(src|href)="https?:\/\/(?!wa\.me|www\.google\.com\/maps)/.test(html.replace(/<link rel="canonical"[^>]*>/, ''))) err('carga recursos de otro dominio (rompe el «nada externo»)');
  try { JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]); } catch { err('JSON-LD no válido'); }
  if (/aggregateRating/.test(html)) err('JSON-LD con aggregateRating (Google no lo admite en reseñas propias)');
  const titulo = /<title>([^<]*)<\/title>/.exec(html)?.[1] || '';
  const desc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] || '';
  if (titulo.length > 70) warn(`<title> largo (${titulo.length} car.): Google lo cortará`);
  if (desc.length < 70 || desc.length > 165) warn(`meta description de ${desc.length} car. (ideal 120–160)`);
  // Peso sin imágenes: HTML + JS + CSS + fuentes que se cargan
  const fuentes = [...html.matchAll(/url\(assets\/fonts\/([^)]+)\)/g)].map((m) => m[1]);
  const archivos = ['index.html', 'main.js', 'favicon.svg', ...new Set(fuentes.map((f) => `assets/fonts/${f}`))];
  const kb = archivos.reduce((a, f) => a + (fs.existsSync(path.join(dir, f)) ? fs.statSync(path.join(dir, f)).size : 0), 0) / 1024;
  if (kb > LIMITE_KB) err(`peso sin imágenes ${kb.toFixed(0)} KB (> ${LIMITE_KB} KB)`);
  console.log(col.green(`   ✓ salida correcta · ${kb.toFixed(0)} KB sin imágenes · ${titulo}`));
}

for (const f of ['index.html', 'robots.txt', 'sitemap.xml', '404.html']) if (!fs.existsSync(path.join(P.docs, f))) err(`docs/${f} no existe`);
const sm = fs.existsSync(path.join(P.docs, 'sitemap.xml')) ? fs.readFileSync(path.join(P.docs, 'sitemap.xml'), 'utf8') : '';
for (const { datos: c } of listarComercios()) if (c.ejemplo && c.estado === 'publicada') err(`${c.slug}: un comercio de ejemplo (ficticio) no se puede publicar`);
for (const { datos: c } of listarComercios()) if (c.estado === 'demo' && sm.includes(`/${c.slug}`)) err(`el sitemap raíz incluye la demo ${c.slug}`);

if (pendientes.length) {
  console.log(col.bold('\nCampos _revisar pendientes:'));
  for (const p of pendientes) console.log(`  · ${p.nombre} (${p.archivo}): ${p.campos.join(', ')}`);
}
console.log(`\n${fallos ? col.red(`${fallos} error(es)`) : col.green('Sin errores')} · ${avisosTot} aviso(s)`);
process.exit(fallos ? 1 : 0);
