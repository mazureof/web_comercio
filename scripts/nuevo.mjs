#!/usr/bin/env node
// npm run nuevo -- "Nombre del comercio" [--pueblo Canovelles] [--tipo peluqueria] [--ca]
import fs from 'node:fs';
import path from 'node:path';
import { P, writeJson, c as col, TIPOS } from './lib.mjs';
import { crearBorrador, deducirTipo, slugLibre } from './borrador.mjs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args.splice(i, 2)[1] : ''; };
const pueblo = opt('pueblo'), tipoArg = opt('tipo');
const ca = args.includes('--ca'); const nombre = args.filter((a) => !a.startsWith('--')).join(' ').trim();
if (!nombre) { console.log('Uso: npm run nuevo -- "Nombre del comercio" [--pueblo Canovelles] [--tipo peluqueria] [--ca]'); process.exit(1); }
if (tipoArg && !TIPOS.includes(tipoArg)) { console.log(col.red(`Tipo no válido. Usa uno de: ${TIPOS.join(', ')}`)); process.exit(1); }
const tipo = tipoArg || deducirTipo(nombre);
const c = crearBorrador({ nombre, poblacion: pueblo, tipo, idioma: ca ? 'ca' : 'es' });
c.slug = slugLibre(c.slug);
const f = path.join(P.comercios, `${c.slug}.json`);
writeJson(f, c);
fs.mkdirSync(path.join(P.img, c.slug), { recursive: true });
console.log(`${col.green('✓')} Creado comercios/${c.slug}.json (tipo: ${tipo}${tipoArg ? '' : ', deducido del nombre'})`);
console.log(`  Fotos en: comercios/img/${c.slug}/`);
console.log(`  Demo en:  /${c.slug}-${c.codigoDemo}/`);
console.log(col.yellow(`  Rellena teléfono, dirección y horario, revisa los textos y vacía "_revisar".`));
