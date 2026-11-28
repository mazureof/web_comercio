(function () {
'use strict';
var d = document, D = {};
try { D = JSON.parse(d.getElementById('datos').textContent); } catch (e) {}
var $ = function (s, c) { return (c || d).querySelector(s); };
var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
var DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
function ahora() {
try {
var o = {};
new Intl.DateTimeFormat('en-GB', { timeZone: D.tz || 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
.formatToParts(new Date()).forEach(function (x) { o[x.type] = x.value; });
return { dia: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday], min: (+o.hour % 24) * 60 + (+o.minute) };
} catch (e) { var n = new Date(); return { dia: n.getDay(), min: n.getHours() * 60 + n.getMinutes() }; }
}
var m = function (h) { var s = h.split(':'); return (+s[0]) * 60 + (+s[1] || 0); };
var f = function (h) { var s = h.split(':'); return (+s[0]) + ':' + s[1]; };
function estado() {
var H = D.horario; if (!H) return null;
var n = ahora(), hoy = H[DIAS[n.dia]] || [], i, j, k;
for (i = 0; i < hoy.length; i++) {
var a = m(hoy[i][0]), b = m(hoy[i][1]); if (b <= a) b += 1440;
if (n.min >= a && n.min < b) return { open: true, main: D.t.abierto, det: D.t.cierra.replace('{h}', f(hoy[i][1])) };
}
for (k = 0; k < 8; k++) {
var di = (n.dia + k) % 7, tr = H[DIAS[di]] || [];
for (j = 0; j < tr.length; j++) {
if (k === 0 && m(tr[j][0]) <= n.min) continue;
var h = f(tr[j][0]);
var det = k === 0 ? D.t.abreHoy.replace('{h}', h) : k === 1 ? D.t.abreManana.replace('{h}', h) : D.t.abreDia.replace('{dia}', D.dias[DIAS[di]]).replace('{h}', h);
return { open: false, main: D.t.cerrado, det: det };
}
}
return { open: false, main: D.t.cerrado, det: '' };
}
function pinta() {
var e = estado(); if (!e) return;
$$('[data-estado]').forEach(function (el) {
el.setAttribute('data-open', e.open ? '1' : '0');
var t = $('[data-estado-texto]', el);
if (t) t.innerHTML = '<span class="estado__main"></span><span class="estado__det"></span>';
$('.estado__main', el).textContent = e.main;
$('.estado__det', el).textContent = e.det ? ' · ' + e.det : '';
});
var hoy = DIAS[ahora().dia];
$$('tr[data-dia]').forEach(function (tr) { tr.classList.toggle('is-today', tr.getAttribute('data-dia') === hoy); });
}
pinta(); setInterval(pinta, 60000);
var dlg = $('[data-lb-dialog]');
if (dlg && typeof dlg.showModal === 'function') {
var items = $$('[data-lb]'), img = $('[data-lb-img]', dlg), cap = $('[data-lb-cap]', dlg), cur = 0, from = null;
var show = function (i) { cur = (i + items.length) % items.length; var it = items[cur]; img.src = it.getAttribute('data-full'); img.alt = it.getAttribute('data-caption') || ''; cap.textContent = it.getAttribute('data-caption') || ''; };
items.forEach(function (it, i) { it.addEventListener('click', function () { from = it; show(i); dlg.showModal(); }); });
$('[data-lb-close]', dlg).addEventListener('click', function () { dlg.close(); });
$('[data-lb-prev]', dlg).addEventListener('click', function () { show(cur - 1); });
$('[data-lb-next]', dlg).addEventListener('click', function () { show(cur + 1); });
dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
dlg.addEventListener('close', function () { if (from) from.focus(); });
var x0 = null;
dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
dlg.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
if (items.length < 2) { $('[data-lb-prev]', dlg).hidden = true; $('[data-lb-next]', dlg).hidden = true; }
}
$$('[data-map]').forEach(function (box) {
var b = $('[data-map-btn]', box); if (!b) return;
b.addEventListener('click', function () {
var fr = d.createElement('iframe');
fr.src = box.getAttribute('data-src'); fr.title = box.getAttribute('data-title') || 'Mapa';
fr.loading = 'lazy'; fr.referrerPolicy = 'no-referrer-when-downgrade'; fr.allowFullscreen = true;
box.innerHTML = ''; box.appendChild(fr); fr.focus();
});
});
})();