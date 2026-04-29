/* ============================================================
   Animaciones de scroll — basado en el componente animations.md
   Usa IntersectionObserver para activar fade-in y counter-up
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Fade-in al entrar en el viewport
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Dejar de observar una vez que ya es visible (no se repite)
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    fadeObserver.observe(el);
  });

  // Animación de conteo para los números de estadísticas
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-counter]').forEach(el => {
    counterObserver.observe(el);
  });

});

// Anima un número desde 0 hasta el valor de data-counter
function animateCounter(el) {
  const target   = parseInt(el.getAttribute('data-counter'));
  const suffix   = el.dataset.suffix || '';
  const duration = 2000; // milisegundos
  const step     = target / (duration / 16);
  let current    = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      el.textContent = target + suffix;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current) + suffix;
    }
  }, 16);
}
