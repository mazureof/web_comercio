// Asigna fotos de uso libre (Unsplash, licencia gratuita) a los comercios que no tienen fotos propias.
// Uso: node scripts/fotos-stock.mjs [--forzar]
// Solo toca fotoHeroStock y servicios[].fotoStock. Si el comercio ya tiene fotoHero o servicio.foto propia, esa manda.
// Cuando el comercio nos dé sus fotos reales, ponlas en comercios/img/<slug>/ y usa fotoHero / servicios[].foto.
import fs from 'node:fs';
import { listarComercios } from './lib.mjs';

const forzar = process.argv.includes('--forzar');

// Bancos por categoría: héroes y fotos de servicio por palabra clave (ids de images.unsplash.com).
const B = {
  barberia: {
    hero: ['photo-1585747860715-2ba37e788b70', 'photo-1621645582931-d1d3e6564943', 'photo-1536520002442-39764a41e987', 'photo-1592647420148-bfcc177e2117', 'photo-1773904215697-e6c21fc27ac2', 'photo-1781455793310-8427c96454c7'],
    serv: [[/barba|afeit/i, 'photo-1599351431202-1e0f0137899a'], [/corte|pelo|tall/i, 'photo-1621605815971-fbc98d665033']],
  },
  peluqueria: {
    hero: ['photo-1600948836101-f9ffda59d250', 'photo-1633681926022-84c23e8cb2d6', 'photo-1521590832167-7bcbfaa6381f', 'photo-1781450090585-1a511b7066d9', 'photo-1637777269327-c4d5c7944d7b'],
    serv: [[/color|mecha|tint/i, 'photo-1580618672591-eb180b1a973f'], [/tratam|spa/i, 'photo-1562322140-8baeececf3df'], [/peinad|fiesta/i, 'photo-1560869713-7d0a29430803'], [/corte|tall/i, 'photo-1595475884562-073c30d45670']],
  },
  estetica: {
    hero: ['photo-1787651343620-8d5303006ecb', 'photo-1570172619644-dfd03ed5d881', 'photo-1619607146034-5a05296c8f9a'],
    serv: [[/facial/i, 'photo-1761718209835-c8586b7dcac0'], [/manicura|diseño/i, 'photo-1775500835259-d3b3f6d6e2f2'], [/pedicura|uñas/i, 'photo-1610992015762-45dca7fa3a85'], [/depila|corporal/i, 'photo-1639162906614-0603b0ae95fd'],
      [/color/i, 'photo-1580618672591-eb180b1a973f'], [/corte|peinad/i, 'photo-1595475884562-073c30d45670']],
  },
  bar: {
    hero: ['photo-1738894715313-9f952be758b0', 'photo-1721715115717-8dfeea6bfb8a', 'photo-1633583960343-e258fb899aef', 'photo-1469631423273-6995642a6a40'],
    serv: [[/brava/i, 'photo-1565599837634-134bc3aadce8'], [/bocad|entrepa|bocata/i, 'photo-1550507992-eb63ffee0847'], [/desayun|esmorzar|caf/i, 'photo-1484251065541-c9770829890f'],
      [/tapa|tape/i, 'photo-1781115650881-bc5d55bd31d2'], [/raci|combinad/i, 'photo-1767096088529-1ba1ecc457ee'], [/men[uú]/i, 'photo-1605013343009-c126c3dc2f9d']],
  },
  restaurante: {
    hero: ['photo-1656423521731-9665583f100c', 'photo-1718912334263-1518476fe9b1', 'photo-1555939594-58d7cb561ad1', 'photo-1694685367640-05d6624e57f1'],
    serv: [[/brasa/i, 'photo-1508615263227-c5d58c1e5821'], [/gallega/i, 'photo-1630175860333-5131bda75071'], [/casera|comidas/i, 'photo-1622883464819-e086aa5d4830'], [/men[uú]|fin de semana|cenas/i, 'photo-1605013343009-c126c3dc2f9d'],
      [/bocad|bocata|desayun/i, 'photo-1550507992-eb63ffee0847'], [/tapa/i, 'photo-1781115650881-bc5d55bd31d2'], [/terraza/i, 'photo-1469631423273-6995642a6a40'], [/paella|arroz/i, 'photo-1763647738062-d83e44328a6f'], [/cordero/i, 'photo-1766589152485-9aafd9812a19']],
  },
  panaderia: {
    hero: ['photo-1568254183919-78a4f43a2877', 'photo-1577595927087-dedbe84f0e4d'],
    serv: [[/brio|boller/i, 'photo-1609950547346-a4f431435b2b'], [/encarg/i, 'photo-1730406928830-25b6133a6ebb'], [/pa|pan/i, 'photo-1509440159596-0249088772ff']],
  },
  carniceria: {
    hero: ['photo-1625643269470-5d3e7b69fa34', 'photo-1763033035770-e83f50e8e8b1'],
    serv: [[/ast|asad|pollastre|pollo/i, 'photo-1558030089-02acba3c214e'], [/embotit|embutid/i, 'photo-1592686092916-672fa9e86866'], [/prepar/i, 'photo-1529692236671-f1f6cf9683ba'],
      [/elabor|encarg/i, 'photo-1602470521007-20293bd1fd31'], [/carn|fresca/i, 'photo-1786812594035-d9ff77d0ecb2']],
  },
  taller: {
    hero: ['photo-1727893119356-1702fe921cf9', 'photo-1767681092416-bccf9410bda4'],
    serv: [[/mantenim/i, 'photo-1487754180451-c456f719a1fc'], [/neum|freno/i, 'photo-1645445522156-9ac06bc7a767'], [/diagn/i, 'photo-1486262715619-67b85e0b08d3'], [/itv/i, 'photo-1498887960847-2a5e46312788']],
  },
  alimentacion: {
    hero: ['photo-1670684684445-a4504dca0bbc', 'photo-1773946836315-bd8269b62b93', 'photo-1583258292688-d0213dc5a3a8'],
    serv: [[/pan/i, 'photo-1566698629409-787a68fc5724'], [/paquet|pedido|envío|envio/i, 'photo-1766040923580-16ad32fae8b4'], [/cervez|bebida/i, 'photo-1760776140488-32fcfab4066a'],
      [/embutid/i, 'photo-1592686092916-672fa9e86866'], [/especia|latino|rumano|despensa/i, 'photo-1757801752791-8bcd63cec878'], [/fruta|verdura|alimenta/i, 'photo-1607349913338-fca6f7fc42d0']],
  },
  ropa: {
    hero: ['photo-1441984904996-e0b6ba687e04'],
    serv: [[/moda/i, 'photo-1489987707025-afc232f7ea0f'], [/oferta/i, 'photo-1532453288672-3a27e9be9efd'], [/asesor/i, 'photo-1603400521630-9f2de124b33b']],
  },
  estanco: {
    hero: ['photo-1601469090980-fc95e8d95544'],
    serv: [[/llibre|libro|paper/i, 'photo-1543002588-bfa74002ed7e'], [/inpost|paquet/i, 'photo-1577705998148-6da4f3963bc8'], [/estanc/i, 'photo-1521056787327-165dc2a32836']],
  },
  bazar: {
    hero: ['photo-1740439225991-ab26e8f6da9d'],
    serv: [[/hogar|casa/i, 'photo-1604851880472-376ce53d3244'], [/regal/i, 'photo-1585221330389-24fb30535ec7'], [/./, 'photo-1631856954655-966f97d809de']],
  },
};

function categoria(c) {
  const l = `${c.tipoLegible || ''} ${c.nombre}`.toLowerCase();
  if (c.tipo === 'tienda') return /ropa|moda/.test(l) ? 'ropa' : /estanc|estanco/.test(l) ? 'estanco' : 'bazar';
  if (c.tipo === 'oficio') return 'taller';
  return B[c.tipo] ? c.tipo : null;
}

const contador = {};
let n = 0;
for (const { archivo: file, datos: c } of listarComercios()) {
  const cat = categoria(c);
  if (!cat) continue;
  const b = B[cat];
  const i = contador[cat] = (contador[cat] ?? -1) + 1;
  const usadas = new Set();
  if (!c.fotoHero && (forzar || !c.fotoHeroStock)) c.fotoHeroStock = b.hero[i % b.hero.length];
  if (c.fotoHeroStock) usadas.add(c.fotoHeroStock);
  const reserva = [...b.hero.slice(i % b.hero.length + 1), ...b.hero, ...b.serv.map((x) => x[1])];
  for (const s of c.servicios || []) {
    if (s.foto || (s.fotoStock && !forzar)) { if (s.fotoStock) usadas.add(s.fotoStock); continue; }
    let id = (b.serv.find(([re, v]) => re.test(s.titulo) && !usadas.has(v)) || [])[1];
    if (!id) id = reserva.find((v) => !usadas.has(v));
    if (id) { s.fotoStock = id; usadas.add(id); }
  }
  if (!c.reservas) c.reservas = { email: '' };
  fs.writeFileSync(file, JSON.stringify(c, null, 2) + '\n');
  n++;
}
console.log(`Fotos de uso libre asignadas a ${n} comercios.`);
