/* ============================================================
   main.js — Lógica principal de El Gra de Cafè
   Inicializa: navbar, menú hamburger, galería/lightbox,
   formulario de contacto y botones de WhatsApp
   ============================================================ */

/* ── NAVBAR sticky (scroll > 80px → clase .scrolled) ── */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('navbar-menu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 80);
});

// Abrir/cerrar menú hamburger en móvil
hamburger.addEventListener('click', () => {
  navMenu.classList.toggle('open');
  hamburger.classList.toggle('open');
});

// Cerrar menú al hacer clic en cualquier enlace
navMenu.querySelectorAll('.navbar-link').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    hamburger.classList.remove('open');
  });
});


/* ── GALERÍA Y LIGHTBOX (del componente gallery.md) ── */
// Recoger todas las imágenes del grid de galería
const galleryImages = Array.from(
  document.querySelectorAll('.gallery-item img')
).map(img => ({ src: img.src, alt: img.alt }));

let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  const lb  = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  img.src = galleryImages[index].src;
  img.alt = galleryImages[index].alt;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function changeLightbox(dir) {
  currentIndex = (currentIndex + dir + galleryImages.length) % galleryImages.length;
  openLightbox(currentIndex);
}

// Teclado: Escape cierra, flechas navegan
document.addEventListener('keydown', e => {
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   changeLightbox(-1);
  if (e.key === 'ArrowRight')  changeLightbox(1);
});


/* ── FORMULARIO DE CONTACTO (del componente formulario.md) ── */
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
      const res = await fetch(form.action, {
        method:  'POST',
        body:    new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        form.reset();
        const success = document.getElementById('form-success');
        success.style.display = 'flex';
        // Reinicializar iconos de Lucide dentro del mensaje de éxito
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    } catch (err) {
      console.error('Error enviando formulario:', err);
    } finally {
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  });
}


/* ── WHATSAPP (del componente whatsapp.md) ── */
// Actualiza todos los enlaces de WhatsApp con el número y mensaje del JSON activo
function initWhatsApp() {
  const number  = I18n.translations?.whatsapp?.number  || '';
  const message = encodeURIComponent(I18n.translations?.whatsapp?.message || '');
  if (!number) return;

  const url = `https://wa.me/${number}?text=${message}`;

  // Botón flotante
  const floatBtn = document.getElementById('whatsapp-btn');
  if (floatBtn) floatBtn.href = url;

  // Todos los CTAs con clase .wa-link (hero + contacto)
  document.querySelectorAll('.wa-link').forEach(el => {
    el.href = url;
  });
}


/* ── LUCIDE ICONS ── */
// Renderizar todos los iconos data-lucide después de que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
});
