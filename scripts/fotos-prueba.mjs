#!/usr/bin/env node
// Genera fotos de PRUEBA abstractas (no son fotos reales) para el comercio ficticio
// «estudio-aurora-granollers». Solo sirve para probar el flujo de imágenes.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { P } from './lib.mjs';

const dir = path.join(P.img, 'estudio-aurora-granollers');
fs.mkdirSync(dir, { recursive: true });
let seed = 7; const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function escena(w, h, base, tonos, tipo) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs>`;
  s += `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${base[0]}"/><stop offset="1" stop-color="${base[1]}"/></linearGradient>`;
  tonos.forEach((t, i) => { s += `<radialGradient id="r${i}"><stop offset="0" stop-color="${t}" stop-opacity=".9"/><stop offset="1" stop-color="${t}" stop-opacity="0"/></radialGradient>`; });
  s += `</defs><rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  for (let i = 0; i < 26; i++) { const r = (0.08 + R() * 0.3) * w; s += `<circle cx="${R() * w}" cy="${R() * h}" r="${r}" fill="url(#r${i % tonos.length})"/>`; }
  if (tipo === 'arcos') for (let i = 0; i < 3; i++) { const aw = w * 0.22, x = w * (0.12 + i * 0.29), y = h * 0.18; s += `<path d="M${x} ${h * 0.95}V${y + aw / 2}a${aw / 2} ${aw / 2} 0 0 1 ${aw} 0V${h * 0.95}Z" fill="#fff" fill-opacity=".22" stroke="#fff" stroke-opacity=".5" stroke-width="${w * 0.006}"/>`; }
  if (tipo === 'frascos') for (let i = 0; i < 5; i++) { const fw = w * 0.11, x = w * (0.1 + i * 0.17), fh = h * (0.3 + R() * 0.25); s += `<rect x="${x}" y="${h * 0.85 - fh}" width="${fw}" height="${fh}" rx="${fw * 0.25}" fill="#fff" fill-opacity="${0.18 + R() * 0.2}"/><rect x="${x + fw * 0.3}" y="${h * 0.85 - fh - h * 0.05}" width="${fw * 0.4}" height="${h * 0.06}" rx="4" fill="#3a2a22" fill-opacity=".35"/>`; }
  if (tipo === 'ondas') for (let i = 0; i < 9; i++) { let d = `M0 ${h * (0.2 + i * 0.08)}`; for (let x = 0; x <= w; x += w / 20) d += ` L${x} ${h * (0.2 + i * 0.08) + Math.sin(x / w * 6 + i) * h * 0.05}`; s += `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="${w * 0.012}"/>`; }
  return s + '</svg>';
}
const crema = ['#F3E6DA', '#C98F72'], terra = ['#B5603C', '#5A2E1F'], rosa = ['#EBCFC3', '#A9705C'];
const fotos = [
  ['salon.jpg', 1600, 2000, terra, ['#F2C7A5', '#FFE8D6', '#8C3D20'], 'arcos'],
  ['color.jpg', 1600, 1067, rosa, ['#D9825B', '#FCE3D2', '#7E3B22'], 'ondas'],
  ['corte.jpg', 1600, 1067, crema, ['#FFFFFF', '#B9785A', '#E9B795'], 'arcos'],
  ['tratamiento.jpg', 1600, 1067, crema, ['#E8C1A5', '#FFFFFF', '#A55A3A'], 'frascos'],
  ['local1.jpg', 1600, 2000, rosa, ['#FFE9DA', '#B5603C', '#F0BFA0'], 'arcos'],
  ['local2.jpg', 1600, 1600, terra, ['#F7D3B9', '#6E331F', '#FFF1E6'], 'ondas'],
  ['local3.jpg', 1600, 1600, crema, ['#C77B57', '#FFF', '#E2A47F'], 'frascos'],
  ['local4.jpg', 1600, 1600, rosa, ['#FFFFFF', '#C2704C', '#F4D2BC'], 'ondas'],
];
for (const [f, w, h, base, tonos, tipo] of fotos) {
  await sharp(Buffer.from(escena(w, h, base, tonos, tipo))).blur(6).jpeg({ quality: 88 }).toFile(path.join(dir, f));
  console.log('✓', f);
}
