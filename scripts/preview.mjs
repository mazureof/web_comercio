#!/usr/bin/env node
// Servidor local de /docs con un índice de todas las webs (incluidas las demos).
// Escucha en toda la red local para revisarlas desde el móvil (misma wifi).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { P, listarComercios, carpetaDe, esc } from './lib.mjs';

const PORT = Number(process.env.PORT || 4321);
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

function indice() {
  const filas = listarComercios().map(({ datos: c }) => {
    const carpeta = carpetaDe(c), ok = fs.existsSync(path.join(P.docs, carpeta, 'index.html'));
    const rev = Array.isArray(c._revisar) ? c._revisar.length : c._revisar ? 1 : 0;
    return `<tr><td><a href="/${carpeta}/">${esc(c.nombre)}</a><small>${esc(c.tipo)} · ${esc(c.poblacion || '')}</small></td><td><span class="b ${c.estado}">${c.estado}</span>${rev ? ` <span class="b rev">${rev} por revisar</span>` : ''}${ok ? '' : ' <span class="b err">sin generar</span>'}</td><td><a href="/${carpeta}/entrega.html">entrega</a> · <a href="/${carpeta}/og.png">og</a></td></tr>`;
  }).join('');
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview · webs MAzure</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:0;background:#FAF7F2;color:#161512}main{max-width:900px;margin:auto;padding:1.5rem}h1{color:#4B4E51}table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden}td{padding:.8rem;border-bottom:1px solid #eee;vertical-align:top}td a{font-weight:600;color:#161512}small{display:block;color:#777}.b{display:inline-block;font-size:.75rem;padding:.1rem .5rem;border-radius:99px;background:#eee}.publicada{background:#d1fadf}.demo{background:#F5E6D3}.rev{background:#fff1c2}.err{background:#fde2e1}</style>
<main><h1>Webs MAzure · preview</h1><p>Tras cambiar un JSON, ejecuta <code>npm run build</code> y recarga.</p><table>${filas}</table></main>`;
}

http.createServer((req, res) => {
  let u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (u === '/' || u === '/__') { res.writeHead(200, { 'content-type': TIPOS['.html'] }); return res.end(indice()); }
  let f = path.join(P.docs, path.normalize(u).replace(/^(\.\.[/\\])+/, ''));
  if (!f.startsWith(P.docs)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
    if (!u.endsWith('/')) { res.writeHead(301, { location: u + '/' }); return res.end(); }
    f = path.join(f, 'index.html');
  }
  if (!fs.existsSync(f)) { res.writeHead(404, { 'content-type': TIPOS['.html'] }); return res.end(fs.existsSync(path.join(P.docs, '404.html')) ? fs.readFileSync(path.join(P.docs, '404.html')) : 'No encontrado'); }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
  console.log(`\nPreview de las webs:\n  En este ordenador:  http://localhost:${PORT}`);
  for (const ip of ips) console.log(`  En el móvil (wifi): http://${ip}:${PORT}`);
  console.log('\nCtrl+C para parar.\n');
});
