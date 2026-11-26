/* MAzure · main.js — sin dependencias: abierto ahora, lightbox y mapa con un clic. */
(function () {
  'use strict';
  var d = document, D = {};
  try { D = JSON.parse(d.getElementById('datos').textContent); } catch (e) {}
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* Abierto ahora (hora de Europa/Madrid) */
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


  /* Calendario de solicitud (no reserva al momento: envía la petición al negocio) */
  var form = $('[data-reserva]');
  if (form && D.res) {
    var R = D.res, T = R.t, H = D.horario, daysBox = $('[data-days]', form), slotsBox = $('[data-slots]', form);
    var sel = { dia: null, hora: null };
    var abiertoPor = function (d) { // tramos del día (Date)
      if (!H) return d.getDay() === 0 ? [] : [['09:00', '13:30'], ['16:00', '20:00']];
      return H[DIAS[d.getDay()]] || [];
    };
    var hoy = new Date(), ahoraMin = ahora().min;
    var dias = [];
    for (var i = 0; dias.length < 12 && i < 30; i++) {
      var d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
      if (abiertoPor(d).length) dias.push(d);
    }
    var iso = function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
    var marca = function (box, btn) { $$('[role="radio"]', box).forEach(function (b) { b.setAttribute('aria-checked', b === btn ? 'true' : 'false'); b.tabIndex = b === btn ? 0 : -1; }); };
    var pintaSlots = function (d) {
      slotsBox.innerHTML = ''; sel.hora = null;
      var tr = abiertoPor(d), esHoy = iso(d) === iso(hoy), n = 0;
      tr.forEach(function (t) {
        var a = m(t[0]), b = m(t[1]); if (b <= a) b += 1440;
        for (var x = Math.ceil(a / 30) * 30; x <= b - 30; x += 30) {
          if (esHoy && x < ahoraMin + 60) continue;
          var h = Math.floor(x / 60) % 24 + ':' + ('0' + (x % 60)).slice(-2);
          var btn = document.createElement('button');
          btn.type = 'button'; btn.className = 'cal__slot'; btn.setAttribute('role', 'radio'); btn.setAttribute('aria-checked', 'false'); btn.textContent = h; btn.tabIndex = n ? -1 : 0;
          btn.addEventListener('click', function () { sel.hora = this.textContent; marca(slotsBox, this); });
          slotsBox.appendChild(btn); n++;
        }
      });
      if (!n) slotsBox.innerHTML = '<p class="cal__hint">' + T.sinHoras + '</p>';
    };
    dias.forEach(function (d, k) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'cal__day'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false'); b.tabIndex = k ? -1 : 0;
      b.innerHTML = '<small>' + R.cortos[DIAS[d.getDay()]] + '</small><b>' + d.getDate() + '</b><small>' + R.meses[d.getMonth()] + '</small>';
      b.setAttribute('aria-label', D.dias[DIAS[d.getDay()]] + ' ' + d.getDate());
      b.addEventListener('click', function () { sel.dia = d; marca(daysBox, b); pintaSlots(d); });
      daysBox.appendChild(b);
    });
    var err = $('[data-err]', form), ok = $('[data-ok]', form), send = $('[data-send]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { return (form.elements[n] && form.elements[n].value || '').trim(); };
      if (!sel.dia || !sel.hora || !v('nombre') || v('telefono').replace(/\D/g, '').length < 9) { err.textContent = T.falta; err.hidden = false; return; }
      err.hidden = true;
      var cuando = D.dias[DIAS[sel.dia.getDay()]] + ' ' + sel.dia.getDate() + '/' + (sel.dia.getMonth() + 1) + ' · ' + sel.hora;
      var datos = { _subject: T.asunto + ' · ' + R.nombre, _template: 'table', _captcha: 'false', Cuando: cuando, Nombre: v('nombre'), Telefono: v('telefono') };
      ['servicio', 'personas', 'encargo', 'coche', 'comentario'].forEach(function (k) { if (v(k)) datos[k.charAt(0).toUpperCase() + k.slice(1)] = v(k); });
      var fin = function (texto, nota) {
        ok.innerHTML = ''; ok.appendChild(document.createTextNode(texto + ' (' + cuando + ')'));
        if (nota) { var s2 = document.createElement('small'); s2.textContent = nota; ok.appendChild(s2); }
        ok.hidden = false; send.hidden = true; ok.focus && ok.setAttribute('tabindex', '-1'); ok.focus();
      };
      if (R.demo || !R.email) { fin(T.ok, R.demo ? T.okDemo : ''); return; }
      send.disabled = true; send.textContent = T.enviando;
      fetch('https://formsubmit.co/ajax/' + encodeURIComponent(R.email), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(datos) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); fin(T.ok); })
        .catch(function () { send.disabled = false; send.textContent = T.enviar; err.textContent = T.error.replace('{tel}', R.tel || ''); err.hidden = false; });
    });
  }

  /* Lightbox */
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

  /* Mapa con un clic */
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
