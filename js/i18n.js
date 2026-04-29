/* ============================================================
   Sistema multiidioma — i18n.md + fallback embebido
   En file:// el fetch() está bloqueado por el navegador,
   así que los textos completos están aquí como respaldo.
   En producción (Vercel/HTTP) usa los archivos locales/xx.json
   ============================================================ */

/* Traducciones embebidas: se usan cuando fetch() falla (file://) */
const TRANSLATIONS_FALLBACK = {
  es: {
    "nav": {
      "specialties": "Especialidades",
      "about":       "Nosotros",
      "gallery":     "Galería",
      "contact":     "Contacto",
      "cta":         "Reservar mesa"
    },
    "hero": {
      "tagline":  "Cafetería de especialidad · Granollers",
      "title":    "El café que te hace volver",
      "subtitle": "Especialidades de origen, desayunos con alma y tartas hechas con cariño, en el corazón de Granollers.",
      "cta":      "Reservar mesa por WhatsApp"
    },
    "specialties": {
      "label":    "Nuestro menú",
      "title":    "Nuestras especialidades",
      "subtitle": "Cada taza y cada plato, preparado con amor y los mejores ingredientes.",
      "coffee":    { "title": "Cafés de especialidad",  "desc": "Granos seleccionados de origen único, tostados artesanalmente. Espresso, V60, Aeropress... tu método favorito." },
      "breakfast": { "title": "Desayunos completos",    "desc": "Empezar el día bien importa. Tostadas con tomate, zumos naturales y bollería recién horneada cada mañana." },
      "brunch":    { "title": "Brunch del domingo",     "desc": "Los domingos son para tomárselos con calma. Huevos, aguacate, smoothies y buena compañía." },
      "cakes":     { "title": "Tartas artesanas",       "desc": "Las recetas de siempre, sin prisa ni atajos. Brownie de chocolate, tarta de zanahoria y tarta del día." }
    },
    "about": {
      "label":       "Quiénes somos",
      "title":       "Nuestra historia",
      "subtitle":    "Un rincón con alma en Granollers desde 2019.",
      "p1":          "El Gra de Cafè nació cuando Marc y Júlia, dos apasionados del café de especialidad, decidieron abrir un espacio tranquilo en el corazón de Granollers. Empezamos con una máquina espresso, mucha ilusión y las recetas de la abuela de Júlia.",
      "p2":          "Hoy, cada mañana recibimos a nuestros vecinos con el aroma del mejor café de origen y una sonrisa. Creemos que un buen café es mucho más que una bebida: es un momento de pausa, de conexión, de vida.",
      "stat1_label": "años abiertos",
      "stat2_label": "cafés de origen",
      "stat3_label": "clientes diarios"
    },
    "gallery": {
      "label":    "Imágenes",
      "title":    "Galería",
      "subtitle": "Momentos, sabores y rincones de El Gra de Cafè."
    },
    "testimonials": {
      "label":   "Opiniones",
      "title":   "Lo que dicen nuestros clientes",
      "t1_text": "La millor tarta de xocolata de Granollers, sense cap dubte. I el cafè amb llet és un ritual diari per a mi.",
      "t1_name": "Anna G.",
      "t1_area": "Barri de Llevant",
      "t2_text": "El brunch del domingo se ha convertido en nuestra tradición familiar. Los huevos benedictine están deliciosos.",
      "t2_name": "Carles M.",
      "t2_area": "Can Batllori",
      "t3_text": "Un lloc molt acollidor on sempre et reben amb un somriure. El cafè d'origen és una meravella.",
      "t3_name": "Laura P.",
      "t3_area": "Centre Granollers"
    },
    "hours": {
      "label":          "Visítanos",
      "title":          "Horarios y ubicación",
      "subtitle":       "Ven a visitarnos cuando quieras.",
      "weekdays":       "Lunes a viernes",
      "weekdays_hours": "7:30 – 20:00",
      "saturday":       "Sábado",
      "saturday_hours": "8:00 – 21:00",
      "sunday":         "Domingo",
      "sunday_hours":   "9:00 – 15:00",
      "address":        "Carrer de Sant Jaume, 14",
      "city":           "08400 Granollers, Barcelona"
    },
    "contact": {
      "label":               "Escríbenos",
      "title":               "Contacto",
      "subtitle":            "¿Tienes alguna pregunta o quieres reservar? Escríbenos.",
      "name":                "Nombre",
      "name_placeholder":    "Tu nombre",
      "phone":               "Teléfono",
      "phone_placeholder":   "Tu teléfono",
      "email":               "Email",
      "email_placeholder":   "tu@email.com",
      "message":             "Mensaje",
      "message_placeholder": "¿En qué podemos ayudarte?",
      "send":                "Enviar mensaje",
      "success":             "¡Mensaje enviado! Te contactaremos pronto."
    },
    "footer": {
      "tagline":       "Cafetería de especialidad en el corazón de Granollers desde 2019.",
      "rights":        "Todos los derechos reservados",
      "nav_title":     "Secciones",
      "contact_title": "Contacto",
      "address_label": "Dirección",
      "phone_label":   "Teléfono",
      "hours_label":   "Horario"
    },
    "whatsapp": {
      "number":  "34938764521",
      "message": "Hola! Me gustaría reservar una mesa en El Gra de Cafè."
    }
  },
  ca: {
    "nav": {
      "specialties": "Especialitats",
      "about":       "Nosaltres",
      "gallery":     "Galeria",
      "contact":     "Contacte",
      "cta":         "Reservar taula"
    },
    "hero": {
      "tagline":  "Cafeteria d'especialitat · Granollers",
      "title":    "El cafè que et fa tornar",
      "subtitle": "Especialitats d'origen, esmorzars amb ànima i pastissos fets amb estima, al cor de Granollers.",
      "cta":      "Reservar taula per WhatsApp"
    },
    "specialties": {
      "label":    "El nostre menú",
      "title":    "Les nostres especialitats",
      "subtitle": "Cada tassa i cada plat, preparat amb amor i els millors ingredients.",
      "coffee":    { "title": "Cafès d'especialitat",  "desc": "Grans seleccionats d'origen únic, torrats artesanalment. Espresso, V60, Aeropress... el teu mètode preferit." },
      "breakfast": { "title": "Esmorzars complets",    "desc": "Començar el dia bé és important. Torrades amb tomàquet, sucs naturals i brioixeria acabada de fer cada matí." },
      "brunch":    { "title": "Brunch de diumenge",    "desc": "Els diumenges són per prendre's la calma. Ous, alvocat, smoothies i bona companyia." },
      "cakes":     { "title": "Pastissos artesans",    "desc": "Les receptes de sempre, sense pressa ni dreceres. Brownie de xocolata, pastís de pastanaga i pastís del dia." }
    },
    "about": {
      "label":       "Qui som",
      "title":       "La nostra història",
      "subtitle":    "Un racó amb ànima a Granollers des del 2019.",
      "p1":          "El Gra de Cafè va néixer quan en Marc i la Júlia, dos apassionats del cafè d'especialitat, van decidir obrir un espai tranquil al cor de Granollers. Vam començar amb una màquina espresso, molta il·lusió i les receptes de l'àvia de la Júlia.",
      "p2":          "Avui, cada matí rebem els nostres veïns amb l'aroma del millor cafè d'origen i un somriure. Creiem que un bon cafè és molt més que una beguda: és un moment de pausa, de connexió, de vida.",
      "stat1_label": "anys oberts",
      "stat2_label": "cafès d'origen",
      "stat3_label": "clients diaris"
    },
    "gallery": {
      "label":    "Imatges",
      "title":    "Galeria",
      "subtitle": "Moments, sabors i racons d'El Gra de Cafè."
    },
    "testimonials": {
      "label":   "Opinions",
      "title":   "El que diuen els nostres clients",
      "t1_text": "La millor tarta de xocolata de Granollers, sense cap dubte. I el cafè amb llet és un ritual diari per a mi.",
      "t1_name": "Anna G.",
      "t1_area": "Barri de Llevant",
      "t2_text": "El brunch del diumenge s'ha convertit en la nostra tradició familiar. Els ous benedictins estan deliciosos.",
      "t2_name": "Carles M.",
      "t2_area": "Can Batllori",
      "t3_text": "Un lloc molt acollidor on sempre et reben amb un somriure. El cafè d'origen és una meravella.",
      "t3_name": "Laura P.",
      "t3_area": "Centre Granollers"
    },
    "hours": {
      "label":          "Visita'ns",
      "title":          "Horaris i ubicació",
      "subtitle":       "Vine a visitar-nos quan vulguis.",
      "weekdays":       "Dilluns a divendres",
      "weekdays_hours": "7:30 – 20:00",
      "saturday":       "Dissabte",
      "saturday_hours": "8:00 – 21:00",
      "sunday":         "Diumenge",
      "sunday_hours":   "9:00 – 15:00",
      "address":        "Carrer de Sant Jaume, 14",
      "city":           "08400 Granollers, Barcelona"
    },
    "contact": {
      "label":               "Escriu-nos",
      "title":               "Contacte",
      "subtitle":            "Tens alguna pregunta o vols reservar? Escriu-nos.",
      "name":                "Nom",
      "name_placeholder":    "El teu nom",
      "phone":               "Telèfon",
      "phone_placeholder":   "El teu telèfon",
      "email":               "Correu",
      "email_placeholder":   "tu@email.com",
      "message":             "Missatge",
      "message_placeholder": "En què et podem ajudar?",
      "send":                "Enviar missatge",
      "success":             "Missatge enviat! Et contactarem aviat."
    },
    "footer": {
      "tagline":       "Cafeteria d'especialitat al cor de Granollers des del 2019.",
      "rights":        "Tots els drets reservats",
      "nav_title":     "Seccions",
      "contact_title": "Contacte",
      "address_label": "Adreça",
      "phone_label":   "Telèfon",
      "hours_label":   "Horari"
    },
    "whatsapp": {
      "number":  "34938764521",
      "message": "Hola! M'agradaria reservar una taula a El Gra de Cafè."
    }
  }
};

/* ============================================================
   Motor i18n
   ============================================================ */
const I18n = {
  currentLang: localStorage.getItem('lang') || 'es',
  translations: {},

  async load(lang) {
    /* Intentar cargar desde archivo JSON (funciona en HTTP/Vercel) */
    try {
      const res = await fetch(`locales/${lang}.json`);
      if (!res.ok) throw new Error(`locales/${lang}.json no encontrado`);
      this.translations = await res.json();
    } catch {
      /* Fallback: usar el objeto embebido arriba (necesario en file://) */
      this.translations = TRANSLATIONS_FALLBACK[lang] || TRANSLATIONS_FALLBACK['es'];
    }

    this.currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    this.apply();
    this.updateLangButtons();
    if (typeof initWhatsApp === 'function') initWhatsApp();
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const value = this.get(el.getAttribute('data-i18n'));
      if (value) el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const value = this.get(el.getAttribute('data-i18n-placeholder'));
      if (value) el.placeholder = value;
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
      const value = this.get(el.getAttribute('data-i18n-alt'));
      if (value) el.alt = value;
    });
  },

  get(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.translations);
  },

  updateLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
    });
  },

  init() { this.load(this.currentLang); }
};

document.addEventListener('DOMContentLoaded', () => I18n.init());
