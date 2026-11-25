# Webs MAzure · fábrica de webs para comercios locales

Un solo proyecto que genera webs de una página para comercios locales (peluquerías, bares, talleres, tiendas…). Todas comparten estructura y nivel de acabado; cambian el contenido y la paleta. Se publican gratis en GitHub Pages: `https://mazureof.github.io/demo-cafeteria/<slug>/`.

**Cómo funciona:** cada comercio es un archivo `comercios/<slug>.json`. Un script lo combina con la plantilla y genera la web en `docs/<slug>/`. Cada vez que se sube un cambio a GitHub, una Action construye todo y lo publica. Para publicar una demo en la tienda basta con cambiar una palabra del JSON desde el móvil.

---

## 0. Puesta en marcha (ya está hecha)

- El proyecto vive en el repo público **`github.com/mazureof/demo-cafeteria`** (la demo de cafetería que había antes está guardada en la rama `cafeteria-original`).
- Las webs se sirven gratis con GitHub Pages en **`https://mazureof.github.io/demo-cafeteria/<slug>/`**.
- **Cómo se publica:** en cada cambio en `main`, la Action «Publicar webs» ejecuta `build` y `check` y sube el resultado a la rama **`gh-pages`**, que es la que sirve GitHub Pages. Nunca hace falta tocar `gh-pages` a mano.
- En tu ordenador: instala Node 20 o superior y luego:
  ```bash
  git clone https://github.com/mazureof/demo-cafeteria.git webs-mazure
  cd webs-mazure && npm install
  ```
- Rellena `config.json` → `mazure.url`, `mazure.email` y `mazure.telefono` (salen en la página raíz y en el enlace del pie).
- Los 3 comercios con `"ejemplo": true` son **ficticios** y sirven de muestrario: llevan la franja «Ejemplo de diseño · negocio ficticio» y el check impide publicarlos.
- **Si algún día queréis URLs más cortas** (`https://mazureof.github.io/<slug>/`): cread un repo llamado `mazureof.github.io`, subid allí este proyecto y cambiad `baseUrl` en `config.json`. Si GitHub Pages diera problemas, la carpeta `docs/` funciona igual en Cloudflare Pages o Netlify, también gratis.

## 1. Crear una web (5 minutos)

### Opción A: desde la hoja de visitas (muchos de golpe)

Exporta la hoja como CSV con estas columnas:
`Comercio, Pueblo, Cuándo ir, Horario del comercio, Teléfono, Tipo, Dirección, ¿Tiene web?, Estado, Notas`

```bash
npm run importar -- visitas.csv          # en castellano
npm run importar -- visitas.csv --ca     # textos en catalán
```

- Convierte horarios como `Mar-Vie 9:00-13:00 y 15:00-20:00 · Sáb 8:00-14:00 · Dom-Lun cerrado` (también entiende `L-V`, `Dl-Dv`, `9-13`, `19,30`…). Si no entiende algo, avisa.
- Deduce el tipo por la columna Tipo, el nombre o las notas.
- Rellena claim, resumen, puntos de confianza y servicios con **propuestas genéricas** del tipo de negocio y los apunta en `"_revisar"`.
- No sobrescribe un JSON que ya exista, salvo que añadas `--sobrescribir`.

### Opción B: uno a uno

```bash
npm run nuevo -- "Perruqueria Montse" --pueblo Canovelles --tipo peluqueria
npm run nuevo -- "Forn Can Rosa" --pueblo "Sant Celoni" --ca
```

### Luego, en los dos casos

1. Abre `comercios/<slug>.json` y completa o corrige los datos (el esquema está en la sección 6).
2. Si tienes fotos del local, ponlas en `comercios/img/<slug>/` y cítalas por nombre (`"fotoHero": "local.jpg"`). Sin fotos, el hero usa un panel con degradado y patrón geométrico, y queda bien.
3. Cuando hayas revisado los textos, vacía `"_revisar": []`.
4. `npm run build` y `npm run preview`.

> **Regla de honestidad:** nunca inventes reseñas, cifras, años, premios ni precios. Si un dato no está, deja el campo vacío y su bloque desaparece solo.

---

## 2. Revisar

```bash
npm run build     # genera docs/ (fotos WebP, imagen OG, QR, sitemaps)
npm run check     # valida JSON y salida; lista los _revisar pendientes
npm run preview   # http://localhost:4321  +  la URL para el móvil
```

`preview` muestra un índice con todas las webs (también las demos), su estado, los campos por revisar y enlaces a la hoja de entrega y a la imagen OG. En la consola aparece una dirección tipo `http://192.168.1.34:4321`: ábrela en el móvil, conectado a la misma wifi, para verla como la verá el cliente.

Para generar solo una web: `npm run build -- <slug>`.

Cuando esté bien: `git add . && git commit -m "Demo Perruqueria Montse" && git push`. Al minuto, la demo está en
`https://mazureof.github.io/demo-cafeteria/<slug>-<codigo>/` (por ejemplo `.../perruqueria-montse-canovelles-8jb3/`).

**Cómo es una demo:** lleva una franja negra arriba («Propuesta de diseño para … · MAzure»), tiene `noindex` (Google no la indexa), no entra en el sitemap y su URL lleva 4 caracteres aleatorios para que nadie la encuentre por casualidad.

---

## 3. Publicar desde el móvil, en la tienda

Antes de entrar, ten abierta la demo en el móvil para enseñársela.

1. **Cobra los 50 €.**
2. Pide al dueño **nombre o razón social del titular y su NIF** (son obligatorios en el aviso legal). Si la dirección fiscal no es la del local, pídela también.
3. En el navegador del móvil, entra en **github.com/mazureof/demo-cafeteria** con la sesión iniciada.
   *En pantalla:* la lista de carpetas del repo (`comercios`, `plantilla`, `scripts`…).
4. Toca **`comercios`** y después el archivo **`<slug>.json`** del comercio.
   *En pantalla:* el contenido del JSON con un icono de lápiz ✏️ arriba a la derecha (a veces dentro del menú «⋯»).
5. Toca el **lápiz ✏️** («Edit this file»). Se abre el editor.
6. Cambia:
   - `"estado": "demo"` → `"estado": "publicada"`
   - `"titular": { "nombre": "Montserrat Puig Vila", "nif": "12345678Z", "direccionFiscal": "" }` (con los datos reales)
   - Cualquier detalle que te corrija el dueño: horario, precios, texto…
7. Toca **«Commit changes…»** (botón verde) y otra vez **«Commit changes»** en la ventana que aparece. Deja «Commit directly to the main branch».
8. Toca la pestaña **Actions**. Verás «Publicar webs» con un círculo amarillo. Cuando se pone en **verde ✓**, GitHub Pages tarda otro minuto en servir la nueva versión (en total, unos 2 minutos).
9. Abre **`https://mazureof.github.io/demo-cafeteria/<slug>/`** (ya **sin** el código del final). La franja de demo ha desaparecido y la web es indexable.
10. Envíale por WhatsApp la hoja de entrega: **`https://mazureof.github.io/demo-cafeteria/<slug>/entrega.html`**. Incluye su URL, un QR para imprimir, el paso a paso para ponerla en su ficha de Google y cómo pedir reseñas. Si queréis, haced juntos el paso de Google allí mismo.

**Si la Action sale en rojo ✗:** toca en ella → «build» → abre el paso que falló. El mensaje dice qué falta (lo normal es el NIF o una coma en el JSON). Mientras tanto, **sigue online la versión anterior**, no se rompe nada. Corrige el JSON y vuelve a guardar.

> La URL de la demo (con código) deja de funcionar al publicar. Es lo esperado.

---

## 4. Editar una web publicada

- **Cambio rápido** (horario, precio, teléfono): igual que en la sección 3. Editas el JSON en github.com, haces commit y en un minuto está online.
- **Fotos nuevas:** súbelas a `comercios/img/<slug>/` (en github.com: «Add file → Upload files») y cítalas en el JSON.
- **Cambio de diseño para todas las webs:** se edita `plantilla/` (HTML, CSS, JS o textos en `plantilla/i18n/`). En el siguiente push, todas las webs se regeneran con el cambio.
- **Paleta propia de un comercio:** `"tema": { "primario": "#0F5C4A", "acento": "#F2C14E" }`. El build comprueba el contraste AA y avisa si no llega.

## 5. Borrar demos no vendidas

Borra `comercios/<slug>.json` y la carpeta `comercios/img/<slug>/` (en local con `git rm`, o en github.com: archivo → «⋯» → «Delete file»). En el siguiente build, la carpeta de la web desaparece de `docs/` y la URL da 404.

Recomendación: cada semana, borrad las demos de más de 30 días sin respuesta.

---

## 6. El JSON de un comercio

Plantilla completa en `comercios/_ejemplo.json` (los archivos que empiezan por `_` no se publican). Un campo opcional vacío **oculta su bloque**: nunca queda un hueco.

| Campo | Qué es |
|---|---|
| `slug` | Nombre de la carpeta/URL. Minúsculas y guiones. |
| `estado` | `"demo"` o `"publicada"`. |
| `codigoDemo` | 4 caracteres aleatorios para la URL de la demo (lo crea `nuevo`/`importar`). |
| `idioma` | `"es"` o `"ca"`. Todos los textos fijos salen del idioma elegido. |
| `tipo` | `peluqueria`, `barberia`, `estetica`, `bar`, `restaurante`, `panaderia`, `carniceria`, `taller`, `oficio`, `tienda`, `alimentacion`, `otro`. Decide paleta, tipografías, forma del hero y de las tarjetas, título de servicios («La carta», «Qué encontrarás»…), CTA y pasos por defecto. |
| `tipoLegible` | Opcional. Sustituye «Peluquería», «Taller mecánico»… en el título y el H1 (útil en `oficio`: «Fontanero», «Electricista»). |
| `poblacion` | Opcional. Si está vacío se saca de la dirección (lo que va tras el código postal). |
| `claim` | Dos líneas. La segunda sale en cursiva y en color. |
| `resumen` | Una o dos frases (< 160 caracteres). Se usa también en la meta description. |
| `puntosConfianza` | Hasta 3. |
| `contacto.telefono` | Obligatorio, formato `+34XXXXXXXXX`. |
| `contacto.whatsapp` | Si está vacío se usa el teléfono **solo si es móvil** (6/7). Sin WhatsApp se ocultan los botones y el formulario, y el CTA pasa a «Llamar». |
| `contacto.email`, `instagram`, `facebook` | Opcionales (URL completas con `https://`). |
| `horario` | `lun`…`dom`, cada día una lista de hasta 2 tramos `["09:00","13:00"]`. `[]` = cerrado. Alimenta la tabla, el «Abierto ahora» (hora de Madrid) y el JSON-LD. |
| `fotoHero` | Opcional. Sin foto, hero con panel de color y patrón. |
| `servicios` | De 3 a 8. `titulo`, `texto`, y opcionales `etiquetas`, `precio`, `foto`. |
| `seccionServiciosTitulo` | Opcional. Sustituye el título por defecto del tipo. |
| `datos` | 0–4 contadores animados. **Solo datos reales que diga el cliente.** `numero` sin comillas. |
| `pasos` | Vacío = pasos por defecto del tipo. O 3–4 propios. |
| `galeria` | Fotos con `texto`. Sin fotos, la sección no aparece. |
| `resenas` | `nota`, `total`, `urlGoogle`, `urlEscribir` (enlace para pedir reseñas, sale en la hoja de entrega) y hasta 3 `destacadas` **copiadas de su ficha y con permiso del dueño**. Sin `nota`, la sección no aparece. |
| `zonas` | Poblaciones donde atiende. Salen en la cinta, en «También atendemos en» y en el JSON-LD. |
| `geo` | Opcional: `{ "lat": 41.6, "lng": 2.28 }`. |
| `schemaTipo` | Opcional. Sustituye el tipo schema.org (`Plumber`, `Electrician`, `CafeOrCoffeeShop`…). |
| `titular` | Nombre, NIF y dirección fiscal para el aviso legal. **Obligatorio para publicar.** |
| `tema` | `preset` (uno de `temas.json`), `primario` y `acento` para personalizar. |
| `mensajeWhatsApp` | Texto que se rellena al pulsar el botón principal de WhatsApp. |
| `_revisar` | Lista de campos con texto genérico pendiente de repasar. `check` los lista. |
| `_nota`, `_notas`, `_visita` | Notas internas; no salen en la web. |

---

## 7. Qué lleva cada web

- Barra superior (población, teléfono, «● Abierto ahora / Cerrado · abre el martes a las 9:00»), menú fijo con hamburguesa accesible, hero con claim en dos líneas, CTA de WhatsApp y de llamada, 3 puntos de confianza y cinta animada ✦.
- Secciones numeradas según las que haya: servicios con tarjetas S.01…, método con contadores y pasos, galería con lightbox (teclado, swipe, Esc) y tarjeta «¿Te vemos pronto?», opiniones, horario y ubicación (tabla con el día de hoy resaltado, mapa que solo se carga al pulsar y «Cómo llegar»), contacto (tarjetas y formulario que abre WhatsApp; no envía nada a ningún servidor).
- Pie con aviso legal, privacidad y «Web creada por MAzure». Barra fija «Llamar / WhatsApp» en el móvil.
- **SEO local:** `<title>` «Nombre · Tipo en Población», meta description, canonical, Open Graph y Twitter con imagen OG generada (1200×630), un solo H1, JSON-LD `LocalBusiness` con el subtipo correcto, horario, zonas y redes (sin `aggregateRating`), `sitemap.xml` por web y sitemap raíz **solo con las publicadas**, `robots.txt` y `llms.txt` por web para los buscadores de IA.
- **Sin nada externo:** fuentes autoalojadas, sin analítica ni cookies, así que **no hace falta banner de cookies**. Google Maps solo se carga si el visitante pulsa «Ver mapa», y antes se le avisa.
- **Accesibilidad:** HTML semántico, contraste AA comprobado en el build, foco visible, `prefers-reduced-motion` (sin animaciones) y objetivos táctiles de 44 px.
- **Rendimiento:** CSS en línea, JS de ~7 KB, WebP a 480/960/1600 con `srcset`. Unos 180–200 KB sin contar imágenes.

## 8. Estructura

```
plantilla/   index.html · aviso-legal.html · privacidad.html · entrega.html · styles.css · main.js
             temas.json (presets y textos por tipo) · i18n/es.json, ca.json · assets/fonts/
comercios/   _ejemplo.json · <slug>.json · img/<slug>/
scripts/     build · check · nuevo · importar · preview  (+ lib, borrador, graficos, og, fotos-prueba)
docs/        salida (no se sube: la genera la Action)
config.json  baseUrl y datos de contacto de MAzure
```
