// Crea el JSON inicial de un comercio a partir de _ejemplo.json y de las
// propuestas genéricas por tipo de temas.json. Lo usan nuevo.mjs e importar.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { P, readJson, slugify, codigoAleatorio, TIPOS, DIAS } from './lib.mjs';

const TEMAS = readJson(path.join(P.plantilla, 'temas.json'));

/** Deduce el tipo a partir de un texto libre (columna Tipo, nombre, notas). */
export function deducirTipo(...textos) {
  const t = textos.filter(Boolean).join(' ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const reglas = [
    ['barberia', /barber|barbe/], ['peluqueria', /pelu|perruq|cabell|hair|salon de belleza/],
    ['estetica', /estetic|unas|ungles|nail|depil|belleza|bellesa|spa|masaj|massatg/],
    ['restaurante', /restaur|pizzer|braser|asador|kebab|sushi|hamburg|cuina|cocina/],
    ['bar', /\bbar\b|cafeter|cafe|granja|taberna|taverna|cervec|xurrer|churrer/],
    ['panaderia', /panad|fleca|forn de pa|\bforn\b|pasteler|pastisser|obrador|bolleria/],
    ['carniceria', /carnic|carnis|xarcut|charcut|polleria|botifar/],
    ['taller', /taller|mecani|neumat|pneumat|chapa|planxa|automo|motos?\b|itv/],
    ['oficio', /fontaner|lampist|electric|pintor|paleta|albanil|reform|cerrajer|manyà|serraller|climatiz|carpinter|jardiner|persian|cristaler|vidrier|limpieza|neteja/],
    ['alimentacion', /aliment|fruter|fruiter|supermerc|colmado|queviures|verdul|peixat|pescader|bodega|celler/],
    ['tienda', /tienda|botiga|moda|roba|ropa|zapat|sabat|regal|floris|llibre|librer|ferreter|optica|joier|joyer|merceri|papeler|estanc|farmac|bazar|mascota/],
  ];
  for (const [tipo, re] of reglas) if (re.test(t)) return tipo;
  return TIPOS.includes(t.trim()) ? t.trim() : 'otro';
}

export function crearBorrador({ nombre, poblacion = '', tipo = 'otro', idioma = 'es', telefono = '', whatsapp = '', direccion = '', horario = null, notas = '', extra = {} }) {
  const ej = readJson(path.join(P.comercios, '_ejemplo.json'));
  if (!TIPOS.includes(tipo)) tipo = 'otro';
  const prop = TEMAS.tipos[tipo].propuesta[idioma];
  const sub = (s) => s.replace(/\{\{poblacion\}\}/g, poblacion || '[población]');
  const slugBase = slugify(poblacion && !slugify(nombre).includes(slugify(poblacion)) ? `${nombre} ${poblacion}` : nombre);
  const revisar = ['claim', 'resumen', 'puntosConfianza', 'servicios'];
  if (!telefono) revisar.push('contacto.telefono');
  if (!direccion) revisar.push('contacto.direccion');
  if (!horario) revisar.push('horario');
  const puedeWa = !!whatsapp || /^\+34[67]/.test(telefono);
  const puntos = puedeWa ? prop.puntos : prop.puntos.map((p) => (/whatsapp/i.test(p) ? (idioma === 'ca' ? 'Atenció per telèfon' : 'Atención por teléfono') : p));
  const c = {
    ...(notas ? { _notas: notas } : {}),
    slug: slugBase, estado: 'demo', codigoDemo: codigoAleatorio(), idioma, tipo, nombre: nombre.trim(), tipoLegible: '', poblacion,
    claim: prop.claim, resumen: sub(prop.resumen), puntosConfianza: puntos,
    contacto: { telefono, whatsapp, email: '', direccion, instagram: '', facebook: '' },
    horario: horario || Object.fromEntries(DIAS.map((d) => [d, []])),
    fotoHero: '',
    servicios: prop.servicios.map(([titulo, texto]) => ({ titulo, texto, etiquetas: [], precio: '', foto: '' })),
    seccionServiciosTitulo: '', datos: [], pasos: [], galeria: [],
    resenas: { nota: null, total: null, urlGoogle: '', urlEscribir: '', destacadas: [] },
    zonas: poblacion ? [poblacion] : [], geo: null, schemaTipo: '',
    titular: { nombre: '', nif: '', direccionFiscal: '' }, tema: { preset: '', primario: '', acento: '' },
    mensajeWhatsApp: ej.mensajeWhatsApp && idioma === 'es' ? ej.mensajeWhatsApp.replace('pedir cita', { cita: 'pedir cita', reserva: 'reservar', encargo: 'hacer un encargo', presupuesto: 'pedir presupuesto' }[TEMAS.tipos[tipo].cta] || 'información') : (idioma === 'ca' ? 'Hola, vinc del vostre web i voldria informació.' : ''),
    _revisar: revisar, ...extra,
  };
  return c;
}

/** Devuelve un slug libre (añade -2, -3… si ya existe). */
export function slugLibre(slug) {
  let s = slug, i = 2;
  while (fs.existsSync(path.join(P.comercios, `${s}.json`))) s = `${slug}-${i++}`;
  return s;
}
