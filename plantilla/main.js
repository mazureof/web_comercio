/* MAzure · main.js — sin dependencias. Menú, abierto ahora, contadores,
   apariciones, lightbox, mapa con clic y formulario → WhatsApp. */
(function () {
  'use strict';
  var d = document, de = d.documentElement;
  de.classList.add('js');
  var D = {};
  try { D = JSON.parse(d.getElementById('datos').textContent); } catch (e) {}
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* ---------- Navegación ---------- */
  var nav = $('[data-nav]'), btn = $('[data-menu-btn]'), menu = $('[data-menu]'), lbl = $('[data-menu-label]');
  function setMenuTop() { if (nav) de.style.setProperty('--menu-top', nav.getBoundingClientRect().bottom + 'px'); }
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false');
    if (lbl) lbl.textContent = lbl.getAttribute('data-open');
  }
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      setMenuTop();
      menu.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open));
      if (lbl) lbl.textContent = lbl.getAttribute(open ? 'data-close' : 'data-open');
      if (open) { var a = $('a', menu); if (a) a.focus(); }
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); btn.focus(); } });
  }
  var onScroll = function () { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Abierto ahora (hora de Europa/Madrid) ---------- */
  var DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
  function ahoraMadrid() {
    try {
      var p = new Intl.DateTimeFormat('en-GB', { timeZone: D.tz || 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
      var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
      return { dia: wd, min: (+o.hour % 24) * 60 + (+o.minute) };
    } catch (e) { var n = new Date(); return { dia: n.getDay(), min: n.getHours() * 60 + n.getMinutes() }; }
  }
  function aMin(h) { var s = h.split(':'); return (+s[0]) * 60 + (+s[1] || 0); }
  function fmt(h) { var s = h.split(':'); return (+s[0]) + ':' + s[1]; }
  function estado() {
    var H = D.horario; if (!H) return null;
    var now = ahoraMadrid(), hoy = H[DIAS[now.dia]] || [];
    for (var i = 0; i < hoy.length; i++) {
      var a = aMin(hoy[i][0]), b = aMin(hoy[i][1]); if (b <= a) b += 1440;
      if (now.min >= a && now.min < b) return { open: true, txt: D.t.abierto + ' · ' + D.t.cierra.replace('{h}', fmt(hoy[i][1])) };
    }
    for (var k = 0; k < 8; k++) {
      var di = (now.dia + k) % 7, tr = H[DIAS[di]] || [];
      for (var j = 0; j < tr.length; j++) {
        if (k === 0 && aMin(tr[j][0]) <= now.min) continue;
        var h = fmt(tr[j][0]), msg;
        if (k === 0) msg = D.t.abreHoy.replace('{h}', h);
        else if (k === 1) msg = D.t.abreManana.replace('{h}', h);
        else msg = D.t.abreDia.replace('{dia}', D.dias[DIAS[di]]).replace('{h}', h);
        return { open: false, txt: D.t.cerrado + ' · ' + msg };
      }
    }
    return { open: false, txt: D.t.cerrado };
  }
  function pintaEstado() {
    var e = estado(); if (!e) return;
    $$('[data-estado]').forEach(function (el) {
      el.setAttribute('data-open', e.open ? '1' : '0');
      var t = $('[data-estado-texto]', el); if (t) t.textContent = e.txt;
    });
    var hoy = DIAS[ahoraMadrid().dia];
    $$('tr[data-dia]').forEach(function (tr) { tr.classList.toggle('is-today', tr.getAttribute('data-dia') === hoy); });
  }
  pintaEstado(); setInterval(pintaEstado, 60000);

  /* ---------- Apariciones y contadores ---------- */
  function cuenta(el) {
    var fin = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '';
    if (reduce || !isFinite(fin)) return;
    var dec = (String(fin).split('.')[1] || '').length, t0 = null, dur = 1400;
    function paso(t) {
      if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), v = fin * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toFixed(dec).replace('.', ',') + suf;
      if (p < 1) requestAnimationFrame(paso); else el.textContent = String(fin).replace('.', ',') + suf;
    }
    el.textContent = '0' + suf; requestAnimationFrame(paso);
  }
  var revs = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
        el.style.transitionDelay = Math.min(sib, 5) * 70 + 'ms';
        el.classList.add('is-in');
        $$('[data-count]', el).forEach(cuenta);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revs.forEach(function (el) { io.observe(el); });
  } else { revs.forEach(function (el) { el.classList.add('is-in'); }); }

  /* ---------- Lightbox ---------- */
  var dlg = $('[data-lb-dialog]');
  if (dlg && typeof dlg.showModal === 'function') {
    var items = $$('[data-lb]'), img = $('[data-lb-img]', dlg), cap = $('[data-lb-cap]', dlg), cur = 0, opener = null;
    var show = function (i) {
      cur = (i + items.length) % items.length; var it = items[cur];
      img.src = it.getAttribute('data-full'); img.alt = it.getAttribute('data-caption') || '';
      cap.textContent = it.getAttribute('data-caption') || '';
    };
    items.forEach(function (it, i) { it.addEventListener('click', function () { opener = it; show(i); dlg.showModal(); }); });
    $('[data-lb-close]', dlg).addEventListener('click', function () { dlg.close(); });
    $('[data-lb-prev]', dlg).addEventListener('click', function () { show(cur - 1); });
    $('[data-lb-next]', dlg).addEventListener('click', function () { show(cur + 1); });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { if (opener) opener.focus(); });
    var x0 = null;
    dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); x0 = null;
    });
    if (items.length < 2) { $('[data-lb-prev]', dlg).hidden = true; $('[data-lb-next]', dlg).hidden = true; }
  }

  /* ---------- Mapa con un clic ---------- */
  $$('[data-map]').forEach(function (box) {
    var b = $('[data-map-btn]', box);
    if (!b) return;
    b.addEventListener('click', function () {
      var f = d.createElement('iframe');
      f.src = box.getAttribute('data-src'); f.title = box.getAttribute('data-title') || 'Mapa';
      f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true;
      box.innerHTML = ''; box.appendChild(f); f.focus();
    });
  });

  /* ---------- Formulario → WhatsApp ---------- */
  var form = $('[data-form]');
  if (form && D.wa) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { return (form.elements[n] && form.elements[n].value || '').trim(); };
      var err = $('[data-form-error]', form);
      if (!v('nombre')) { err.hidden = false; form.elements.nombre.focus(); return; }
      err.hidden = true;
      var M = D.msg, part = function (k, val) { return val ? M[k].replace('{v}', val) : ''; };
      var txt = M.plantilla.replace('{nombre}', v('nombre'))
        .replace('{telefono}', part('telefono', v('telefono')))
        .replace('{servicio}', part('servicio', v('servicio')))
        .replace('{mensaje}', part('mensaje', v('mensaje')));
      window.open('https://wa.me/' + D.wa + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
    });
  }
})();
