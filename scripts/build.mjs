#!/usr/bin/env node
// Genera /docs completo a partir de /plantilla + /comercios.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import QRCode from 'qrcode';
import {
  P, ROOT, readJson, render, fill, esc, c as col, DIAS, validar, listarComercios, carpetaDe,
  esMovilES, telefonoLegible, poblacionDe, partirDireccion, provinciaDeCP, horarioVacio, hm,
  contraste, mezcla, alpha, mejorSobre, ajustaContraste, lum,
} from './lib.mjs';
import { ICONOS, estrellas, patron } from './graficos.mjs';
import { textoAPath } from './og.mjs';

const t0 = Date.now();
const CFG = readJson(P.config);
const BASE = CFG.baseUrl.replace(/\/+$/, '');
const TEMAS = readJson(path.join(P.plantilla, 'temas.json'));
const I18N = { es: readJson(path.join(P.plantilla, 'i18n/es.json')), ca: readJson(path.join(P.plantilla, 'i18n/ca.json')) };
const TPL = Object.fromEntries(['index', 'aviso-legal', 'privacidad', 'entrega'].map((n) => [n, fs.readFileSync(path.join(P.plantilla, `${n}.html`), 'utf8')]));
const CSS_BASE = fs.readFileSync(path.join(P.plantilla, 'styles.css'), 'utf8');
const MAIN_JS = fs.readFileSync(path.join(P.plantilla, 'main.js'), 'utf8');
const CACHE = path.join(ROOT, '.cache', 'img');
const ANIO = new Date().getFullYear();
const HOY = new Date().toISOString().slice(0, 10);
const SOLO = process.argv.slice(2).filter((a) => !a.startsWith('-')); // npm run build -- slug  → solo ese comercio

const minCss = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();
const minJs = (s) => s.replace(/^\s*\/\*[\s\S]*?\*\/\s*/m, '').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//') && !l.startsWith('/*')).join('\n');
const jsonScript = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const mkdir = (d) => fs.mkdirSync(d, { recursive: true });
const write = (f, s) => { mkdir(path.dirname(f)); fs.writeFileSync(f, s); };

/* ------------------------------------------------------------------ */
/* Tema: preset del tipo + colores del JSON → variables CSS            */
/* ------------------------------------------------------------------ */
function resolverTema(c) {
  const tipo = TEMAS.tipos[c.tipo] || TEMAS.tipos.otro;
  const nombre = (c.tema && c.tema.preset) || tipo.preset;
  const pre = TEMAS.presets[nombre];
  if (!pre) throw new Error(`tema.preset «${nombre}» no existe en temas.json`);
  const k = { ...pre.colores };
  if (c.tema?.primario) { k.primario = c.tema.primario; k.sobrePrimario = mejorSobre(k.primario, '#FFFFFF', k.texto); }
  if (c.tema?.acento) { k.acento = c.tema.acento; k.sobreAcento = mejorSobre(k.acento, '#FFFFFF', k.texto); }
  const oscuro = lum(k.fondo) < 0.2;
  const hacia = oscuro ? '#FFFFFF' : '#000000';
  const primarioTexto = ajustaContraste(k.primario, [k.fondo, k.superficie], oscuro ? '#FFFFFF' : k.texto);
  const heroFondo = k.heroFondo || mezcla(k.primario, '#000000', 0.55);
  const heroTexto = k.heroTexto || mejorSobre(heroFondo, '#FFFFFF', k.texto);
  const avisos = [];
  const chk = (a, b, min, que) => { const r = contraste(a, b); if (r < min) avisos.push(`contraste ${que}: ${r.toFixed(2)} (mínimo AA ${min})`); };
  chk(k.texto, k.fondo, 4.5, 'texto/fondo'); chk(k.suave, k.fondo, 4.5, 'texto suave/fondo'); chk(k.suave, k.superficie, 4.5, 'texto suave/superficie');
  chk(k.sobrePrimario, k.primario, 4.5, 'botón (texto sobre primario)'); chk(k.sobreAcento, k.acento, 4.5, 'cinta (texto sobre acento)');
  chk(primarioTexto, k.fondo, 4.5, 'primario como texto');
  if (pre.hero === 'poster') { chk(heroTexto, heroFondo, 4.5, 'hero póster'); chk(k.sobreAcento, k.acento, 4.5, 'botón póster'); }
  const F = (key) => TEMAS.fuentes[key];
  const fd = F(pre.fuentes.display), fi = F(pre.fuentes.cursiva), fb = F(pre.fuentes.cuerpo);
  const archivos = new Set([`${fd.archivo}-normal.woff2`, `${fb.archivo}-normal.woff2`, `${fi.archivo}-${fi.italica ? 'italic' : 'normal'}.woff2`]);
  const faces = [...archivos].map((f) => {
    const def = Object.values(TEMAS.fuentes).find((x) => f.startsWith(x.archivo + '-'));
    const it = f.endsWith('-italic.woff2');
    const w = def.archivo === 'oswald' ? '200 700' : def.archivo === 'playfair-display' ? '400 900' : '100 900';
    return `@font-face{font-family:"${def.familia}";font-style:${it ? 'italic' : 'normal'};font-weight:${w};font-display:swap;src:url(assets/fonts/${f}) format("woff2")}`;
  }).join('');
  const iw = pre.fuentes.cursiva === pre.fuentes.display ? Math.max(400, pre.displayPeso - 100) : 500;
  const panel = `linear-gradient(140deg,${k.primario} 0%,${mezcla(k.primario, '#000000', 0.38)} 100%)`;
  const vars = {
    bg: k.fondo, surface: k.superficie, 'surface-alt': k.superficie, ink: k.texto, muted: k.suave, line: k.linea,
    'line-strong': mezcla(k.linea, k.texto, 0.22), primary: k.primario, 'primary-text': primarioTexto, 'on-primary': k.sobrePrimario,
    'primary-soft': alpha(k.primario, oscuro ? 0.18 : 0.09), accent: k.acento, 'on-accent': k.sobreAcento,
    'accent-line': contraste(k.acento, k.fondo) >= 1.6 ? k.acento : k.primario, focus: primarioTexto,
    'hero-bg': heroFondo, 'hero-ink': heroTexto, 'panel-bg': panel, 'on-panel': k.sobrePrimario,
    'poster-panel': `radial-gradient(120% 90% at 85% 15%,${mezcla(heroFondo, k.primario, 0.35)} 0%,${heroFondo} 60%)`,
    'topbar-bg': oscuro ? mezcla(k.fondo, '#000000', 0.5) : k.texto, 'topbar-ink': oscuro ? k.suave : k.fondo,
    'nav-bg': alpha(k.fondo, 0.9), 'foot-bg': oscuro ? mezcla(k.fondo, '#000000', 0.45) : k.texto, 'foot-ink': oscuro ? k.texto : k.fondo,
    shadow: oscuro ? 'rgb(0 0 0/.7)' : alpha(k.texto, 0.22), star: oscuro ? '#E8B94A' : '#C98A00',
    'f-display': `"${fd.familia}",${fd.fallback}`, 'f-italic': `"${fi.familia}",${fi.fallback}`, 'f-body': `"${fb.familia}",${fb.fallback}`,
    dw: pre.displayPeso, iw, r: `${pre.radio}px`, 'r-lg': `${Math.round(pre.radio * 1.4)}px`,
    'btn-r': pre.tarjetas === 'recta' ? `${Math.max(4, pre.radio)}px` : '999px',
  };
  const root = `:root{${Object.entries(vars).map(([a, b]) => `--${a}:${b}`).join(';')};color-scheme:${oscuro ? 'dark' : 'light'}}`;
  return { k, pre, oscuro, vars, fontsCss: faces + root, archivos: [...archivos], preload: [`${fd.archivo}-normal.woff2`, `${fi.archivo}-${fi.italica ? 'italic' : 'normal'}.woff2`].filter((v, i, a) => a.indexOf(v) === i), avisos, heroFondo, heroTexto, fd, fi };
}

/* ------------------------------------------------------------------ */
/* Imágenes: WebP a 480/960/1600 con caché                             */
/* ------------------------------------------------------------------ */
const ANCHOS = [480, 960, 1600];
async function procesarFoto(c, archivo, destDir, alt) {
  const src = path.join(P.img, c.slug, archivo);
  const base = path.parse(archivo).name.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const meta = await sharp(src).rotate().metadata();
  const anchoReal = meta.autoOrient?.width || meta.width; const altoReal = meta.autoOrient?.height || meta.height;
  const anchos = ANCHOS.filter((w) => w <= anchoReal); if (!anchos.length) anchos.push(anchoReal);
  const mtime = fs.statSync(src).mtimeMs;
  const out = [];
  for (const w of anchos) {
    const nombre = `${base}-${w}.webp`, cache = path.join(CACHE, c.slug, nombre);
    if (!fs.existsSync(cache) || fs.statSync(cache).mtimeMs < mtime) {
      mkdir(path.dirname(cache));
      await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 74, effort: 5 }).toFile(cache);
    }
    mkdir(path.join(destDir, 'img')); fs.copyFileSync(cache, path.join(destDir, 'img', nombre));
    out.push({ w, f: `img/${nombre}` });
  }
  const mid = out.find((o) => o.w === 960) || out[out.length - 1];
  const h = Math.round((altoReal / anchoReal) * mid.w);
  return { src: mid.f, srcset: out.map((o) => `${o.f} ${o.w}w`).join(', '), w: mid.w, h, alt, full: out[out.length - 1].f };
}

/* ------------------------------------------------------------------ */
/* JSON-LD                                                             */
/* ------------------------------------------------------------------ */
const SCHEMA_DIA = { lun: 'Monday', mar: 'Tuesday', mie: 'Wednesday', jue: 'Thursday', vie: 'Friday', sab: 'Saturday', dom: 'Sunday' };
function jsonLd(c, v, tipoDef) {
  const dir = partirDireccion(c.contacto.direccion);
  const o = {
    '@context': 'https://schema.org', '@type': c.schemaTipo || tipoDef.schema, '@id': v.seo.url + '#negocio',
    name: c.nombre, description: c.resumen, url: v.seo.url, telephone: c.contacto.telefono,
    image: v.seo.url + (v.hero.foto ? v.hero.foto.full : 'og.png'),
    address: { '@type': 'PostalAddress', ...dir, ...(dir.postalCode && provinciaDeCP(dir.postalCode) ? { addressRegion: provinciaDeCP(dir.postalCode) } : {}), addressCountry: 'ES' },
  };
  if (c.contacto.email) o.email = c.contacto.email;
  if (c.geo) o.geo = { '@type': 'GeoCoordinates', latitude: c.geo.lat, longitude: c.geo.lng };
  if (c.zonas?.length) o.areaServed = c.zonas.map((z) => ({ '@type': 'City', name: z }));
  if (!horarioVacio(c.horario)) {
    const grupos = new Map();
    for (const d of DIAS) for (const [a, b] of c.horario[d] || []) { const key = `${a}-${b}`; if (!grupos.has(key)) grupos.set(key, []); grupos.get(key).push(SCHEMA_DIA[d]); }
    o.openingHoursSpecification = [...grupos].map(([key, dias]) => { const [a, b] = key.split('-'); return { '@type': 'OpeningHoursSpecification', dayOfWeek: dias, opens: a, closes: b }; });
  }
  const same = [c.contacto.instagram, c.contacto.facebook, c.resenas?.urlGoogle].filter(Boolean);
  if (same.length) o.sameAs = same;
  if (c.servicios?.length) o.makesOffer = c.servicios.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.titulo, description: s.texto } }));
  return jsonScript(o);
}

/* ------------------------------------------------------------------ */
/* Imagen OG 1200×630, favicon e icono                                  */
/* ------------------------------------------------------------------ */
async function imagenes(c, v, tema, dest) {
  const { k } = tema;
  const pat = patron(tema.pre.patron, c.slug, { w: 1200, h: 630 }).replace('class="hero__pattern"', `opacity=".16" color="${k.sobrePrimario}"`);
  const nombre = await textoAPath(c.nombre, tema.fd.archivo, 'normal', { x: 80, y: 250, size: 92, maxW: 1040, fill: k.sobrePrimario, upper: tema.pre.displayMayus });
  const claim1 = await textoAPath(c.claim[0], tema.fd.archivo, 'normal', { x: 80, y: 360, size: 54, maxW: 1040, fill: k.sobrePrimario, opacity: 0.92, upper: tema.pre.displayMayus });
  const claim2 = await textoAPath(c.claim[1], tema.fi.archivo, tema.fi.italica ? 'italic' : 'normal', { x: 80, y: 425, size: 54, maxW: 1040, fill: k.acento });
  const meta = await textoAPath(`${v.tipoLegible} · ${v.poblacion}`.toUpperCase(), 'inter', 'normal', { x: 80, y: 548, size: 24, maxW: 1040, fill: k.sobrePrimario, opacity: 0.75, track: 3 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${k.primario}"/><stop offset="1" stop-color="${mezcla(k.primario, '#000000', 0.42)}"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/>${pat}<rect x="80" y="130" width="56" height="5" fill="${k.acento}"/>${nombre}${claim1}${claim2}${meta}</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(path.join(dest, 'og.png'));
  const letra = await textoAPath(c.nombre.trim()[0].toUpperCase(), tema.fd.archivo, 'normal', { x: 0, y: 0, size: 40, fill: k.sobrePrimario, center: [32, 32] });
  const fav = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${tema.pre.tarjetas === 'recta' ? 10 : 32}" fill="${k.primario}"/>${letra}</svg>`;
  write(path.join(dest, 'favicon.svg'), fav);
  await sharp(Buffer.from(fav.replace(/rx="\d+"/, 'rx="0"'))).resize(180, 180).png().toFile(path.join(dest, 'icon-180.png'));
}

/* ------------------------------------------------------------------ */
/* Una web                                                             */
/* ------------------------------------------------------------------ */
async function generarWeb(c) {
  const tipoDef = TEMAS.tipos[c.tipo];
  const t = I18N[c.idioma];
  const tl = tipoDef[c.idioma];
  const carpeta = carpetaDe(c);
  const dest = path.join(P.docs, carpeta);
  const urlFinal = `${BASE}/${c.slug}/`;
  const url = `${BASE}/${carpeta}/`;
  const tema = resolverTema(c);
  const poblacion = poblacionDe(c);
  const tipoLegible = c.tipoLegible || tl.legible;
  const demo = c.estado === 'demo';
  const ctaTipo = tipoDef.cta;
  fs.rmSync(dest, { recursive: true, force: true });
  mkdir(dest);

  // WhatsApp: el del JSON o, si no hay, el teléfono solo si es móvil
  const waNum = (c.contacto.whatsapp || (esMovilES(c.contacto.telefono) ? c.contacto.telefono : '')).replace(/\D/g, '');
  const msgDef = c.mensajeWhatsApp || '';
  const wa = waNum ? {
    num: waNum, base: `https://wa.me/${waNum}`,
    cta: `https://wa.me/${waNum}${msgDef ? `?text=${encodeURIComponent(msgDef)}` : ''}`,
    legible: telefonoLegible('+' + waNum),
  } : null;
  const telHref = `tel:${c.contacto.telefono}`;

  // Imágenes
  const fotoAlt = (txt) => [txt, c.nombre, poblacion].filter(Boolean).join(' · ');
  let heroFoto = null;
  if (c.fotoHero) {
    heroFoto = await procesarFoto(c, c.fotoHero, dest, `${c.nombre}, ${tipoLegible.toLowerCase()} en ${poblacion}`);
    heroFoto.sizes = tema.pre.hero === 'split' ? '(min-width: 900px) 46vw, 100vw' : '100vw';
  }
  const servicios = [];
  for (const [i, s] of (c.servicios || []).entries()) {
    const href = wa ? `${wa.base}?text=${encodeURIComponent(fill(t.contacto.tarjetaMensaje, { servicio: s.titulo }))}` : telHref;
    servicios.push({
      ...s, num: String(i + 1).padStart(2, '0'), tieneEtiquetas: !!s.etiquetas?.length, href, externo: !!wa,
      ctaTarjeta: t.ctaTarjeta[ctaTipo], foto: s.foto ? await procesarFoto(c, s.foto, dest, fotoAlt(s.titulo)) : null,
    });
  }
  const galeria = [];
  for (const [i, g] of (c.galeria || []).entries()) galeria.push({ ...(await procesarFoto(c, g.foto, dest, fotoAlt(g.texto))), texto: g.texto || '', idx: i });

  // Secciones visibles y numeración
  const tieneGaleria = galeria.length > 0;
  const r = c.resenas || {};
  const tieneResenas = typeof r.nota === 'number';
  const orden = ['servicios', 'metodo', tieneGaleria && 'galeria', tieneResenas && 'opiniones', 'horario', 'contacto'].filter(Boolean);
  const sec = Object.fromEntries(orden.map((s, i) => [s, String(i + 1).padStart(2, '0')]));
  const seccionServiciosTitulo = c.seccionServiciosTitulo || t.seccionServicios[tipoDef.seccionServicios];
  const navLinks = [
    { id: 'servicios', texto: seccionServiciosTitulo }, { id: 'metodo', texto: tl.metodo },
    tieneGaleria && { id: 'galeria', texto: t.nav.galeria }, tieneResenas && { id: 'opiniones', texto: t.nav.opiniones },
    { id: 'horario', texto: t.nav.horario }, { id: 'contacto', texto: t.nav.contacto },
  ].filter(Boolean);

  const tieneHorario = !horarioVacio(c.horario);
  const horarioFilas = tieneHorario ? DIAS.map((d) => ({
    clave: d, dia: t.dias[d],
    texto: (c.horario[d] || []).length ? c.horario[d].map(([a, b]) => `${hm(a)} – ${hm(b)}`).join(` ${t.horario.y} `) : t.horario.cerrado,
  })) : [];

  const pasosSrc = c.pasos?.length ? c.pasos.map((p) => [p.titulo, p.texto]) : tl.pasos;
  const pasos = pasosSrc.map(([titulo, texto], i) => ({ titulo, texto, num: String(i + 1).padStart(2, '0') }));
  const n = servicios.length;
  const cinta = [...servicios.map((s) => s.titulo), ...(c.zonas || [])];

  const metaCta = (wa ? t.metaCta : t.metaCtaTel)[ctaTipo];
  let descripcion = `${c.resumen.trim().replace(/\.?$/, '.')} ${metaCta}`;
  if (descripcion.length > 158) descripcion = descripcion.slice(0, 155).replace(/\s+\S*$/, '') + '…';

  const v = {
    lang: c.idioma, t, i: ICONOS, nombre: c.nombre, demo, demoTexto: c.ejemplo ? t.demoEjemplo : fill(t.demo, { nombre: c.nombre }),
    seo: { titulo: fill(t.tituloEn, { nombre: c.nombre, tipo: tipoLegible, poblacion }), descripcion, url, locale: c.idioma === 'ca' ? 'ca_ES' : 'es_ES' },
    h1: fill(t.h1, { nombre: c.nombre, tipo: tipoLegible, poblacion }),
    col: tema.k, estilo: { hero: tema.pre.hero, tarjetas: tema.pre.tarjetas, mayus: tema.pre.displayMayus, oscuro: tema.oscuro },
    fuentesPreload: tema.preload, css: '', poblacion, tipoLegible,
    claim1: c.claim[0], claim2: c.claim[1], resumen: c.resumen,
    puntosConfianza: (c.puntosConfianza || []).slice(0, 3), tienePuntos: !!c.puntosConfianza?.length,
    contacto: { ...c.contacto, telefonoLegible: telefonoLegible(c.contacto.telefono) }, wa,
    ctaPrincipal: wa ? { href: wa.cta, texto: t.cta[ctaTipo], icono: ICONOS.wa, externo: true } : { href: telHref, texto: `${t.llamar} · ${telefonoLegible(c.contacto.telefono)}`, icono: ICONOS.phone, externo: false },
    ctaSecundario: wa ? { href: telHref, texto: t.llamar, icono: ICONOS.phone } : { href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${c.nombre}, ${c.contacto.direccion}`)}`, texto: t.horario.comoLlegar, icono: ICONOS.route, externo: true },
    hero: { foto: heroFoto, patron: patron(tema.pre.patron, c.slug), patronMapa: patron('mapa', c.slug) },
    tieneCinta: cinta.length > 0, cinta,
    sec, navLinks, seccionServiciosTitulo, introServicios: t.introServicios[tipoDef.seccionServicios], servicios,
    numServiciosClase: n <= 4 ? String(n) : n === 6 ? '6' : 'muchas',
    metodoTitulo: tl.metodo, datos: (c.datos || []).map((d) => ({ ...d, numeroTexto: String(d.numero).replace('.', ','), sufijo: d.sufijo || '' })), tieneDatos: !!c.datos?.length, pasos, numPasos: pasos.length,
    tieneGaleria, galeria,
    tieneResenas, resenas: tieneResenas ? {
      notaTexto: r.nota.toFixed(1).replace('.', ','), estrellas: estrellas(r.nota),
      total: r.total || 0, totalTexto: (r.total || 0).toLocaleString('es-ES'), urlGoogle: r.urlGoogle || '',
      destacadas: (r.destacadas || []).slice(0, 3).map((x) => ({ ...x, estrellas: x.estrellas || 5, estrellasHtml: estrellas(x.estrellas || 5) })),
      cols: Math.min(4, 1 + Math.min(3, (r.destacadas || []).length)),
    } : null,
    tieneHorario, horarioFilas,
    mapa: {
      embed: `https://www.google.com/maps?q=${encodeURIComponent(`${c.nombre}, ${c.contacto.direccion}`)}&output=embed`,
      comoLlegar: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${c.nombre}, ${c.contacto.direccion}`)}`,
      titulo: fill(t.horario.mapaTitulo, { nombre: c.nombre }),
    },
    zonas: c.zonas || [], tieneZonas: !!c.zonas?.length,
    tieneRedes: !!(c.contacto.instagram || c.contacto.facebook),
    anio: ANIO, mazure: { url: CFG.mazure?.url || `${BASE}/` },
  };
  v.jsonld = jsonLd(c, v, tipoDef);
  v.datosJs = jsonScript({
    tz: 'Europe/Madrid', horario: tieneHorario ? c.horario : null,
    t: t.estado, dias: t.dias, wa: waNum || null,
    msg: { plantilla: t.contacto.plantillaMensaje, telefono: t.contacto.msgTelefono, servicio: t.contacto.msgServicio, mensaje: t.contacto.msgMensaje },
  });
  const cssCompleto = minCss(tema.fontsCss + CSS_BASE);
  v.css = cssCompleto;

  write(path.join(dest, 'index.html'), render(TPL.index, v));
  write(path.join(dest, 'main.js'), minJs(MAIN_JS));
  write(path.join(dest, 'styles.css'), cssCompleto);
  for (const f of tema.archivos) { mkdir(path.join(dest, 'assets/fonts')); fs.copyFileSync(path.join(P.plantilla, 'assets/fonts', f), path.join(dest, 'assets/fonts', f)); }

  // Legales
  const ti = c.titular || {};
  const pend = `<span class="pending">${esc(t.legal.pendiente)}</span>`;
  const campo = (val) => (val ? esc(val) : pend);
  const filas = [
    [t.legal.campos.titular, campo(ti.nombre)], [t.legal.campos.nif, campo(ti.nif)],
    [t.legal.campos.domicilio, campo(ti.direccionFiscal || c.contacto.direccion)],
    [t.legal.campos.actividad, esc(tipoLegible)],
    [t.legal.campos.telefono, esc(telefonoLegible(c.contacto.telefono))],
    c.contacto.email && [t.legal.campos.email, esc(c.contacto.email)],
  ].filter(Boolean).map(([a, b]) => ({ k: a, v: b }));
  const legalV = {
    ...v, filas, actualizado: fill(t.legal.actualizado, { fecha: HOY.split('-').reverse().join('/') }),
    secciones: null,
  };
  const secs = (arr) => arr.map(([titulo, texto], i) => ({ titulo, texto: fill(texto, { nombre: c.nombre }), conDatos: i === 0 }));
  write(path.join(dest, 'aviso-legal.html'), render(TPL['aviso-legal'], { ...legalV, titulo: t.legal.avisoTitulo, secciones: secs(t.legal.aviso) }));
  write(path.join(dest, 'privacidad.html'), render(TPL.privacidad, { ...legalV, titulo: t.legal.privacidadTitulo, secciones: secs(t.legal.privacidad) }));

  // Hoja de entrega
  const qr = await QRCode.toString(urlFinal, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#161512', light: '#00000000' } });
  write(path.join(dest, 'entrega.html'), render(TPL.entrega, {
    ...v, e: t.entrega, urlFinal, qr: qr.replace('<svg', '<svg role="img" aria-label="QR"'),
    hola: fill(t.entrega.hola, { nombre: c.nombre }), resenasUrl: c.resenas?.urlEscribir || '',
  }));
  for (const f of ['inclusive-sans-400.woff2', 'inclusive-sans-700.woff2', 'alegreya-italic.woff2']) {
    mkdir(path.join(dest, 'assets/fonts/mazure')); fs.copyFileSync(path.join(P.plantilla, 'assets/fonts/mazure', f), path.join(dest, 'assets/fonts/mazure', f));
  }

  await imagenes(c, v, tema, dest);

  // llms.txt
  const horarioTxt = tieneHorario ? horarioFilas.map((h) => `- ${h.dia}: ${h.texto}`).join('\n') : '';
  write(path.join(dest, 'llms.txt'), [
    `# ${c.nombre}`, '', `> ${c.resumen}`, '',
    `${tipoLegible} en ${poblacion}.`, '',
    '## Servicios', ...servicios.map((s) => `- ${s.titulo}: ${s.texto}${s.precio ? ` (${s.precio})` : ''}`), '',
    ...(tieneHorario ? ['## Horario', horarioTxt, ''] : []),
    '## Contacto', `- Teléfono: ${c.contacto.telefono}`, ...(wa ? [`- WhatsApp: https://wa.me/${waNum}`] : []),
    ...(c.contacto.email ? [`- Email: ${c.contacto.email}`] : []), `- Dirección: ${c.contacto.direccion}`,
    ...(c.zonas?.length ? [`- Zonas: ${c.zonas.join(', ')}`] : []), `- Web: ${url}`, '',
  ].join('\n'));
  if (!demo) write(path.join(dest, 'sitemap.xml'), sitemap([url]));

  return { carpeta, url, urlFinal, demo, avisosTema: tema.avisos, nombre: c.nombre, tipo: c.tipo };
}

const sitemap = (urls) => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${HOY}</lastmod></url>`).join('\n')}\n</urlset>\n`;

/* ------------------------------------------------------------------ */
/* Página raíz, 404, robots y sitemap                                  */
/* ------------------------------------------------------------------ */
function raiz(publicadas) {
  const m = CFG.mazure || {};
  const css = `@font-face{font-family:"Inclusive Sans";font-weight:400;font-display:swap;src:url(assets/mazure/inclusive-sans-400.woff2) format("woff2")}@font-face{font-family:"Inclusive Sans";font-weight:700;font-display:swap;src:url(assets/mazure/inclusive-sans-700.woff2) format("woff2")}@font-face{font-family:"Alegreya";font-style:italic;font-weight:400 900;font-display:swap;src:url(assets/mazure/alegreya-italic.woff2) format("woff2")}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#FAF7F2;color:#161512;font:400 1.05rem/1.6 "Inclusive Sans",system-ui,sans-serif;padding:2rem}main{max-width:560px;text-align:center}h1{font-size:clamp(2rem,6vw,3rem);line-height:1.1;margin:0 0 .5rem;color:#4B4E51}em{font-family:Alegreya,Georgia,serif;font-style:italic;font-weight:500}p{color:#4B4E51}a{color:#161512;font-weight:700;text-underline-offset:3px}.k{display:inline-block;margin-bottom:1.5rem;padding:.3rem .8rem;border-radius:999px;background:#F5E6D3;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase}ul{list-style:none;padding:0;display:grid;gap:.5rem;margin-top:1.5rem}`;
  const contacto = [m.email && `<li><a href="mailto:${esc(m.email)}">${esc(m.email)}</a></li>`, m.telefono && `<li><a href="tel:${esc(m.telefono)}">${esc(telefonoLegible(m.telefono))}</a></li>`, m.url && `<li><a href="${esc(m.url)}">${esc(m.url.replace(/^https?:\/\//, ''))}</a></li>`].filter(Boolean).join('');
  const page = (titulo, cuerpo) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>${titulo}</title><link rel="icon" href="data:,"><style>${minCss(css)}</style></head><body><main>${cuerpo}</main></body></html>`;
  write(path.join(P.docs, 'index.html'), page('Webs creadas por MAzure', `<span class="k">MAzure</span><h1>Webs creadas por <em>MAzure</em></h1><p>Diseñamos webs para comercios locales: rápidas, claras y pensadas para que te encuentren en Google.</p>${contacto ? `<ul>${contacto}</ul>` : ''}`));
  write(path.join(P.docs, '404.html'), page('Página no encontrada', `<span class="k">404</span><h1>Esta página <em>no existe</em></h1><p>Puede que la dirección haya cambiado. Si buscas un comercio, búscalo en Google por su nombre.</p>`));
  for (const f of ['inclusive-sans-400.woff2', 'inclusive-sans-700.woff2', 'alegreya-italic.woff2']) { mkdir(path.join(P.docs, 'assets/mazure')); fs.copyFileSync(path.join(P.plantilla, 'assets/fonts/mazure', f), path.join(P.docs, 'assets/mazure', f)); }
  write(path.join(P.docs, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);
  write(path.join(P.docs, 'sitemap.xml'), sitemap(publicadas));
  write(path.join(P.docs, '.nojekyll'), '');
}

/* ------------------------------------------------------------------ */
async function main() {
  const todos = listarComercios().filter(({ datos }) => !SOLO.length || SOLO.includes(datos.slug));
  if (!SOLO.length) {
    // Limpia carpetas de comercios que ya no existen (demos borradas o publicadas)
    mkdir(P.docs);
    const validas = new Set(listarComercios().map(({ datos }) => carpetaDe(datos)));
    for (const d of fs.readdirSync(P.docs, { withFileTypes: true })) if (d.isDirectory() && d.name !== 'assets' && !validas.has(d.name)) fs.rmSync(path.join(P.docs, d.name), { recursive: true, force: true });
  }
  const fatales = [], hechas = [];
  for (const { archivo, datos } of todos) {
    const nombre = path.basename(archivo);
    const { errores, avisos } = validar(datos, { imgDir: path.join(P.img, datos.slug || '') });
    if (errores.length) {
      const msg = `${nombre}:\n   - ${errores.join('\n   - ')}`;
      if (datos.estado === 'publicada') { fatales.push(msg); console.log(col.red(`✗ ${msg}`)); }
      else console.log(col.yellow(`⚠ demo omitida · ${msg}`));
      continue;
    }
    try {
      const r = await generarWeb(datos);
      hechas.push(r);
      const av = [...avisos, ...r.avisosTema];
      console.log(`${col.green('✓')} ${r.demo ? col.dim('[demo]     ') : col.bold('[publicada]')} ${r.carpeta}${av.length ? col.yellow(`\n   ⚠ ${av.join('\n   ⚠ ')}`) : ''}`);
    } catch (err) {
      const msg = `${nombre}: ${err.message}`;
      if (datos.estado === 'publicada') fatales.push(msg);
      console.log(col.red(`✗ ${msg}`));
      if (process.env.DEBUG) console.error(err);
    }
  }
  const publicadas = listarComercios().filter(({ datos }) => datos.estado === 'publicada' && fs.existsSync(path.join(P.docs, datos.slug, 'index.html'))).map(({ datos }) => `${BASE}/${datos.slug}/`);
  raiz(publicadas);
  console.log(col.dim(`\n${hechas.length} webs generadas en ${((Date.now() - t0) / 1000).toFixed(1)} s · ${publicadas.length} publicadas en el sitemap`));
  if (fatales.length) {
    console.log(col.red(`\nEl build ha fallado: ${fatales.length} web(s) publicada(s) con errores. Corrígelas o vuelve a ponerlas en "demo".`));
    process.exit(1);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
