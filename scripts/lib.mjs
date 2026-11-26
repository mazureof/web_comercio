// Utilidades compartidas por build, check, nuevo e importar.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const P = {
  plantilla: path.join(ROOT, 'plantilla'),
  comercios: path.join(ROOT, 'comercios'),
  img: path.join(ROOT, 'comercios', 'img'),
  docs: path.join(ROOT, 'docs'),
  config: path.join(ROOT, 'config.json'),
};

export const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export const writeJson = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n');
export const DIAS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
export const TIPOS = ['peluqueria', 'barberia', 'estetica', 'bar', 'restaurante', 'panaderia', 'carniceria', 'taller', 'oficio', 'tienda', 'alimentacion', 'otro'];

export const c = { // colores de consola
  red: (s) => `\x1b[31m${s}\x1b[0m`, yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`, dim: (s) => `\x1b[2m${s}\x1b[0m`, bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

/* ------------------------------------------------------------------ */
/* Mini motor de plantillas tipo Mustache                              */
/* {{var}} escapado · {{{var}}} sin escapar · {{#x}}…{{/x}} · {{^x}}…{{/x}} */
/* ------------------------------------------------------------------ */
const TAG = /\{\{\{\s*([\w.]+)\s*\}\}\}|\{\{([#^/]?)\s*([\w.]+|\.)\s*\}\}/g;
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function parse(tpl) {
  const root = { kids: [] }, stack = [root];
  let last = 0, m;
  TAG.lastIndex = 0;
  while ((m = TAG.exec(tpl))) {
    const top = stack[stack.length - 1];
    if (m.index > last) top.kids.push({ t: 'txt', v: tpl.slice(last, m.index) });
    last = TAG.lastIndex;
    if (m[1]) { top.kids.push({ t: 'var', n: m[1], raw: true }); continue; }
    const [, , op, name] = m;
    if (op === '#' || op === '^') { const node = { t: 'sec', n: name, inv: op === '^', kids: [] }; top.kids.push(node); stack.push(node); }
    else if (op === '/') { const open = stack.pop(); if (!open || open.n !== name) throw new Error(`Plantilla: cierre {{/${name}}} sin abrir (abierto: ${open && open.n})`); }
    else top.kids.push({ t: 'var', n: name, raw: false });
  }
  if (stack.length > 1) throw new Error(`Plantilla: bloque {{#${stack[stack.length - 1].n}}} sin cerrar`);
  if (last < tpl.length) root.kids.push({ t: 'txt', v: tpl.slice(last) });
  return root;
}
function lookup(stack, name) {
  if (name === '.') return stack[stack.length - 1];
  const parts = name.split('.');
  for (let i = stack.length - 1; i >= 0; i--) {
    const ctx = stack[i];
    if (ctx !== null && typeof ctx === 'object' && parts[0] in ctx) {
      let v = ctx;
      for (const p of parts) { if (v == null) return undefined; v = v[p]; }
      return v;
    }
  }
  return undefined;
}
const truthy = (v) => !(v === undefined || v === null || v === false || v === '' || (Array.isArray(v) && v.length === 0));
function run(node, stack) {
  let out = '';
  for (const k of node.kids) {
    if (k.t === 'txt') out += k.v;
    else if (k.t === 'var') { const v = lookup(stack, k.n); out += k.raw ? (v ?? '') : esc(v); }
    else {
      const v = lookup(stack, k.n);
      if (k.inv) { if (!truthy(v)) out += run(k, stack); continue; }
      if (!truthy(v)) continue;
      if (Array.isArray(v)) for (const item of v) out += run(k, [...stack, item]);
      else out += run(k, [...stack, v]);
    }
  }
  return out;
}
const cache = new Map();
export function render(tpl, ctx) {
  if (!cache.has(tpl)) cache.set(tpl, parse(tpl));
  return run(cache.get(tpl), [ctx]);
}
export const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

/* ------------------------------------------------------------------ */
/* Texto, slugs, teléfonos                                            */
/* ------------------------------------------------------------------ */
export function slugify(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/l·l/g, 'll').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}
export function codigoAleatorio(n = 4) {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = '';
  for (let i = 0; i < n; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}
export const E164 = /^\+[1-9]\d{7,14}$/;
export function normalizaTelefono(raw) {
  if (!raw) return '';
  let s = String(raw).replace(/[^\d+]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (!s.startsWith('+')) { if (/^[6789]\d{8}$/.test(s)) s = '+34' + s; else return ''; }
  return E164.test(s) ? s : '';
}
export const esMovilES = (t) => /^\+34[67]\d{8}$/.test(t || '');
export function telefonoLegible(t) {
  const m = /^\+34(\d{9})$/.exec(t || '');
  if (m) { const d = m[1]; return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}`; }
  return t || '';
}
export function poblacionDe(c) {
  if (c.poblacion) return c.poblacion;
  const m = /\b\d{5}\s+([^,]+)/.exec(c.contacto?.direccion || '');
  return m ? m[1].trim() : (c.zonas?.[0] || '');
}
export function partirDireccion(dir) {
  const m = /^(.*?),?\s*(\d{5})\s+([^,]+)(?:,\s*(.*))?$/.exec(dir || '');
  if (!m) return { streetAddress: dir };
  return { streetAddress: m[1].replace(/,\s*$/, ''), postalCode: m[2], addressLocality: m[3].trim() };
}
const PROV = { '01': 'Araba/Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería', '05': 'Ávila', '06': 'Badajoz', '07': 'Illes Balears', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres', '11': 'Cádiz', '12': 'Castellón', '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña', '16': 'Cuenca', '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa', '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León', '25': 'Lleida', '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia', '31': 'Navarra', '32': 'Ourense', '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas', '36': 'Pontevedra', '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria', '40': 'Segovia', '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona', '44': 'Teruel', '45': 'Toledo', '46': 'Valencia', '47': 'Valladolid', '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza', '51': 'Ceuta', '52': 'Melilla' };
export const provinciaDeCP = (cp) => PROV[String(cp || '').slice(0, 2)] || '';

/* ------------------------------------------------------------------ */
/* Color y contraste (WCAG)                                           */
/* ------------------------------------------------------------------ */
export const HEX = /^#([0-9a-f]{6})$/i;
export function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export const toHex = (r) => '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
export function lum(hex) {
  return rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
}
export function contraste(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }
export function mezcla(a, b, t) { const A = rgb(a), B = rgb(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); }
export const alpha = (hex, a) => { const [r, g, b] = rgb(hex); return `rgb(${r} ${g} ${b}/${a})`; };
export function mejorSobre(bg, claro = '#FFFFFF', oscuro = '#111111') { return contraste(bg, claro) >= contraste(bg, oscuro) ? claro : oscuro; }
/** Oscurece/aclara `col` hacia `hacia` hasta alcanzar `min` de contraste contra todos los fondos. */
export function ajustaContraste(col, fondos, hacia, min = 4.5) {
  let t = 0, out = col;
  while (t <= 1 && !fondos.every((f) => contraste(out, f) >= min)) { t += 0.05; out = mezcla(col, hacia, t); }
  return out;
}

/* ------------------------------------------------------------------ */
/* Horario                                                            */
/* ------------------------------------------------------------------ */
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const hm = (h) => { const [a, b] = h.split(':'); return `${+a}:${b}`; };
export function horarioVacio(h) { return !h || DIAS.every((d) => !h[d] || !h[d].length); }

/* Convierte textos como «Mar-Vie 9:00-13:00 y 15:00-20:00 · Sáb 8:00-14:00 · Dom-Lun cerrado» */
const ALIAS_DIA = {
  lun: 'lun', lunes: 'lun', l: 'lun', dl: 'lun', dilluns: 'lun', mon: 'lun',
  mar: 'mar', martes: 'mar', m: 'mar', dt: 'mar', dimarts: 'mar', tue: 'mar',
  mie: 'mie', mier: 'mie', miercoles: 'mie', x: 'mie', dc: 'mie', dimecres: 'mie', wed: 'mie',
  jue: 'jue', jueves: 'jue', j: 'jue', dj: 'jue', dijous: 'jue', thu: 'jue',
  vie: 'vie', viernes: 'vie', v: 'vie', dv: 'vie', divendres: 'vie', fri: 'vie',
  sab: 'sab', sabado: 'sab', s: 'sab', ds: 'sab', dissabte: 'sab', sat: 'sab',
  dom: 'dom', domingo: 'dom', d: 'dom', dg: 'dom', diumenge: 'dom', sun: 'dom',
};
const normDia = (s) => ALIAS_DIA[s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\.$/, '')];
function rangoDias(a, b) {
  const i = DIAS.indexOf(a), j = DIAS.indexOf(b); if (i < 0 || j < 0) return null;
  const out = []; for (let k = i; ; k = (k + 1) % 7) { out.push(DIAS[k]); if (k === j) break; } return out;
}
const pad = (h) => { const m = /^(\d{1,2})(?:[:.h](\d{2}))?$/.exec(h.trim()); if (!m || +m[1] > 24) return null; return `${String(+m[1] % 24 === 0 && +m[1] === 24 ? 0 : +m[1]).padStart(2, '0')}:${m[2] || '00'}`; };
export function parseHorario(texto) {
  const horario = Object.fromEntries(DIAS.map((d) => [d, []]));
  const avisos = []; const vistos = new Set();
  if (!texto || !String(texto).trim()) return { horario: null, avisos: ['horario vacío'] };
  const segs = String(texto).split(/\s*[·|;\n]\s*|\s*\/\s*(?=[A-Za-zÀ-ÿ])/).filter(Boolean);
  for (const seg of segs) {
    const m = /^\s*([A-Za-zÀ-ÿ.]+(?:\s*(?:-|–|a|al|i|y|,)\s*[A-Za-zÀ-ÿ.]+)*)\s*:?\s*(.*)$/.exec(seg);
    if (!m) { avisos.push(`no entiendo «${seg}»`); continue; }
    // días
    let dias = [];
    for (const parte of m[1].split(/\s*,\s*|\s+(?:y|i)\s+/)) {
      const r = parte.split(/\s*(?:-|–|\sa\s|\sal\s)\s*/);
      if (r.length === 2) { const a = normDia(r[0]), b = normDia(r[1]); const rg = a && b && rangoDias(a, b); if (rg) dias.push(...rg); else { avisos.push(`días no reconocidos en «${seg}»`); dias = null; break; } }
      else { const a = normDia(parte); if (a) dias.push(a); else { avisos.push(`día no reconocido «${parte}» en «${seg}»`); dias = null; break; } }
    }
    if (!dias) continue;
    const resto = m[2].trim().toLowerCase().replace(/(\d)[,'](\d{2})\b/g, '$1:$2');
    if (/cerrad|tancat|closed|festiu|festivo/.test(resto) || resto === '') {
      if (resto === '') avisos.push(`«${seg}» sin horas: lo marco como cerrado`);
      dias.forEach((d) => { horario[d] = []; vistos.add(d); }); continue;
    }
    if (/24\s*h/.test(resto)) { dias.forEach((d) => { horario[d] = [['00:00', '23:59']]; vistos.add(d); }); continue; }
    const tramos = [];
    for (const t of resto.split(/\s*(?:y|i|,|\+|&)\s*/)) {
      const r = /^(\d{1,2}(?:[:.h]\d{2})?)\s*(?:-|–|a)\s*(\d{1,2}(?:[:.h]\d{2})?)\s*h?$/.exec(t.trim());
      const a = r && pad(r[1]), b = r && pad(r[2]);
      if (a && b) tramos.push([a, b]); else { avisos.push(`horas no reconocidas «${t}» en «${seg}»`); }
    }
    if (tramos.length) dias.forEach((d) => { horario[d] = tramos.slice(0, 2); vistos.add(d); });
  }
  const faltan = DIAS.filter((d) => !vistos.has(d));
  if (faltan.length && faltan.length < 7) avisos.push(`sin datos para ${faltan.join(', ')}: los dejo cerrados`);
  if (!vistos.size) return { horario: null, avisos };
  return { horario, avisos };
}

/* ------------------------------------------------------------------ */
/* Validación del JSON de un comercio                                  */
/* ------------------------------------------------------------------ */
const URL_RE = /^https:\/\/[^\s]+$/;
export function validar(c, { imgDir } = {}) {
  const E = [], W = [];
  const e = (m) => E.push(m), w = (m) => W.push(m);
  const str = (v) => typeof v === 'string' && v.trim() !== '';
  if (!str(c.slug) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.slug)) e('slug: solo minúsculas, números y guiones');
  if (!['demo', 'publicada'].includes(c.estado)) e('estado: "demo" o "publicada"');
  if (c.estado === 'demo' && !/^[a-z0-9]{4}$/.test(c.codigoDemo || '')) e('codigoDemo: 4 caracteres (minúsculas/números) obligatorios en las demos');
  if (!['es', 'ca'].includes(c.idioma)) e('idioma: "es" o "ca"');
  if (!TIPOS.includes(c.tipo)) e(`tipo: uno de ${TIPOS.join(', ')}`);
  if (!str(c.nombre)) e('nombre: obligatorio');
  if (!Array.isArray(c.claim) || c.claim.length !== 2 || !c.claim.every(str)) e('claim: dos líneas de texto');
  if (!str(c.resumen)) e('resumen: obligatorio'); else if (c.resumen.length > 190) w(`resumen largo (${c.resumen.length} car.); mejor < 160`);
  if (c.puntosConfianza && (!Array.isArray(c.puntosConfianza) || c.puntosConfianza.length > 3)) w('puntosConfianza: máximo 3');
  const k = c.contacto || {};
  if (k.telefono && !E164.test(k.telefono)) e(`contacto.telefono: formato E.164 (+34600000000), recibido «${k.telefono}»`);
  if (!k.telefono) (c.estado === 'publicada' ? e : w)('contacto.telefono vacío: sin botón de llamar (obligatorio para publicar)');
  if (k.whatsapp && !E164.test(k.whatsapp)) e(`contacto.whatsapp: formato E.164, recibido «${k.whatsapp}»`);
  if (!k.whatsapp && k.telefono && !esMovilES(k.telefono)) w('sin WhatsApp: el teléfono es fijo, se usa el botón de llamar');
  if (k.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k.email)) e('contacto.email no válido');
  if (!str(k.direccion)) e('contacto.direccion: obligatoria');
  for (const r of ['instagram', 'facebook']) if (k[r] && !URL_RE.test(k[r])) e(`contacto.${r}: URL completa con https://`);
  if (c.horario && !horarioVacio(c.horario)) {
    for (const d of DIAS) {
      const t = c.horario[d];
      if (!Array.isArray(t)) { e(`horario.${d}: falta (usa [] si cierra)`); continue; }
      if (t.length > 2) e(`horario.${d}: máximo dos tramos`);
      for (const tr of t) if (!Array.isArray(tr) || tr.length !== 2 || !HM.test(tr[0]) || !HM.test(tr[1])) e(`horario.${d}: tramo ${JSON.stringify(tr)} no válido (usa ["09:00","13:00"])`);
    }
  } else w('sin horario: se ocultan la tabla y el indicador de abierto');
  const sv = c.servicios || [];
  if (sv.length < 3 || sv.length > 8) e(`servicios: entre 3 y 8 (hay ${sv.length})`);
  sv.forEach((s, i) => { if (!str(s.titulo) || !str(s.texto)) e(`servicios[${i}]: título y texto obligatorios`); });
  if (c.datos && c.datos.length > 4) e('datos: máximo 4');
  (c.datos || []).forEach((d, i) => { if (typeof d.numero !== 'number' || !str(d.texto)) e(`datos[${i}]: número (sin comillas) y texto`); });
  if (c.pasos && c.pasos.length && (c.pasos.length < 3 || c.pasos.length > 4)) e('pasos: vacío o entre 3 y 4');
  (c.pasos || []).forEach((p, i) => { if (!str(p.titulo) || !str(p.texto)) e(`pasos[${i}]: título y texto`); });
  const r = c.resenas || {};
  if (r.nota != null && r.nota !== '') {
    if (typeof r.nota !== 'number' || r.nota < 0 || r.nota > 5) e('resenas.nota: número entre 0 y 5');
    if (r.total != null && r.total !== '' && !Number.isInteger(r.total)) e('resenas.total: número entero');
    if (r.urlGoogle && !URL_RE.test(r.urlGoogle)) e('resenas.urlGoogle: URL con https://');
    if ((r.destacadas || []).length > 3) w('resenas.destacadas: se muestran como máximo 3');
    (r.destacadas || []).forEach((x, i) => { if (!str(x.autor) || !str(x.texto)) e(`resenas.destacadas[${i}]: autor y texto`); if (x.estrellas && (x.estrellas < 1 || x.estrellas > 5)) e(`resenas.destacadas[${i}]: estrellas 1–5`); });
  }
  const t = c.tema || {};
  for (const kk of ['primario', 'acento', 'cabecera']) if (t[kk] && !HEX.test(t[kk])) e(`tema.${kk}: color hex de 6 cifras (#A84B26)`);
  if (c.geo && (typeof c.geo.lat !== 'number' || typeof c.geo.lng !== 'number')) e('geo: { "lat": número, "lng": número }');
  if (c.estado === 'publicada') {
    const ti = c.titular || {};
    if (!str(ti.nombre)) e('titular.nombre: obligatorio para publicar (aviso legal)');
    if (!str(ti.nif)) e('titular.nif: obligatorio para publicar (aviso legal, LSSI art. 10). Pídeselo al cliente en la visita.');
    if (!str(ti.direccionFiscal) && !str(k.direccion)) e('titular.direccionFiscal: obligatoria para publicar');
  }
  if (imgDir) {
    const fotos = [c.fotoHero, ...sv.map((s) => s.foto), ...(c.galeria || []).map((g) => g.foto)].filter(Boolean);
    for (const f of fotos) if (!fs.existsSync(path.join(imgDir, f))) e(`foto no encontrada: comercios/img/${c.slug}/${f}`);
  }
  const rev = revisarPendientes(c);
  if (rev.length) w(`campos _revisar pendientes: ${rev.join(', ')}`);
  return { errores: E, avisos: W };
}
export function revisarPendientes(c) {
  if (c._revisar === true) return ['(todo el JSON)'];
  if (Array.isArray(c._revisar)) return c._revisar;
  return [];
}

export function listarComercios() {
  return fs.readdirSync(P.comercios).filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort()
    .map((f) => ({ archivo: path.join(P.comercios, f), datos: readJson(path.join(P.comercios, f)) }));
}
export const carpetaDe = (c) => (c.estado === 'demo' ? `${c.slug}-${c.codigoDemo}` : c.slug);
