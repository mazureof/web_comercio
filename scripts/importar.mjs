#!/usr/bin/env node
// npm run importar -- comercios.csv [--ca] [--sobrescribir]
// Columnas: Comercio, Pueblo, Cuándo ir, Horario del comercio, Teléfono, Tipo, Dirección, ¿Tiene web?, Estado, Notas
import fs from 'node:fs';
import path from 'node:path';
import { P, writeJson, c as col, normalizaTelefono, parseHorario, slugify } from './lib.mjs';
import { crearBorrador, deducirTipo } from './borrador.mjs';

const args = process.argv.slice(2);
const archivo = args.find((a) => !a.startsWith('--'));
const ca = args.includes('--ca'), sobrescribir = args.includes('--sobrescribir');
if (!archivo || !fs.existsSync(archivo)) { console.log('Uso: npm run importar -- comercios.csv [--ca] [--sobrescribir]'); process.exit(1); }

function parseCSV(txt) {
  txt = txt.replace(/^﻿/, '');
  const primera = txt.split(/\r?\n/)[0];
  const sep = [';', ',', '\t'].sort((a, b) => primera.split(b).length - primera.split(a).length)[0];
  const filas = []; let fila = [], campo = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"') { if (txt[i + 1] === '"') { campo += '"'; i++; } else q = false; } else campo += ch; }
    else if (ch === '"') q = true;
    else if (ch === sep) { fila.push(campo); campo = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else campo += ch;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  return filas.filter((f) => f.some((x) => x.trim()));
}
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const filas = parseCSV(fs.readFileSync(archivo, 'utf8'));
const cab = filas.shift().map(norm);
const col_ = (fila, ...nombres) => { for (const n of nombres) { const i = cab.indexOf(norm(n)); if (i >= 0) return (fila[i] || '').trim(); } return ''; };

let creados = 0, saltados = 0; const informe = [];
for (const f of filas) {
  const nombre = col_(f, 'Comercio', 'Nombre');
  if (!nombre) continue;
  const pueblo = col_(f, 'Pueblo', 'Población', 'Poble');
  const tipoTxt = col_(f, 'Tipo');
  const notas = col_(f, 'Notas');
  const tipo = deducirTipo(tipoTxt, nombre, notas);
  const telRaw = col_(f, 'Teléfono', 'Telefono');
  const tel = normalizaTelefono(telRaw);
  let dir = col_(f, 'Dirección', 'Direccion');
  if (dir && pueblo && !dir.toLowerCase().includes(pueblo.toLowerCase())) dir = `${dir}, ${pueblo}`;
  const hTxt = col_(f, 'Horario del comercio', 'Horario');
  const { horario, avisos } = parseHorario(hTxt);
  const c = crearBorrador({
    nombre, poblacion: pueblo, tipo, idioma: ca ? 'ca' : 'es', telefono: tel, direccion: dir, horario,
    notas: [notas, col_(f, '¿Tiene web?') && `¿Tiene web?: ${col_(f, '¿Tiene web?')}`].filter(Boolean).join(' · '),
    extra: { _visita: { cuandoIr: col_(f, 'Cuándo ir', 'Cuando ir'), estado: col_(f, 'Estado'), horarioOriginal: hTxt, tipoOriginal: tipoTxt } },
  });
  if (!tipoTxt || deducirTipo(tipoTxt) === 'otro') c._revisar.push('tipo');
  if (telRaw && !tel) c._revisar.push('contacto.telefono');
  const destino = path.join(P.comercios, `${c.slug}.json`);
  if (fs.existsSync(destino) && !sobrescribir) { saltados++; console.log(col.dim(`- ${nombre}: ya existe comercios/${c.slug}.json (usa --sobrescribir)`)); continue; }
  writeJson(destino, c);
  fs.mkdirSync(path.join(P.img, c.slug), { recursive: true });
  creados++;
  const av = [...avisos.map((a) => `horario: ${a}`), ...(telRaw && !tel ? [`teléfono «${telRaw}» no reconocido`] : [])];
  console.log(`${col.green('✓')} ${nombre} → ${c.slug}.json (${tipo})${av.length ? col.yellow(`\n   ⚠ ${av.join('\n   ⚠ ')}`) : ''}`);
  informe.push({ nombre, slug: c.slug, revisar: c._revisar });
}
console.log(col.bold(`\n${creados} comercios importados, ${saltados} ya existían.`));
if (informe.length) {
  console.log(col.bold('\nCampos _revisar por comercio:'));
  for (const i of informe) console.log(`  · ${i.nombre}: ${i.revisar.join(', ')}`);
  console.log(col.dim('\nSiguiente paso: npm run build && npm run preview'));
}
