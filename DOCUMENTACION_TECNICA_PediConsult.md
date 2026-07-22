# PediConsult — Documentación funcional-técnica

**Última actualización:** 2026-07-22
**Alcance:** describe el estado real del código en `index.html`, verificado línea por línea contra el archivo — no el estado deseado ni el de versiones anteriores. Donde el código y los textos de ayuda embebidos no coinciden, este documento sigue al código.

---

## 1. Qué es esto, en una frase

Una PWA (Progressive Web App) de un solo archivo (`index.html`, ~6300 líneas), sin build step, sin framework y sin backend propio: todo el HTML/CSS/JS vive en un único archivo que el navegador ejecuta tal cual, y todas las llamadas a datos van directo del navegador a Airtable y Cloudinary.

**Origen del proyecto**: el código nace de un producto anterior de gestión de neurocirugía llamada "Synapsis" (ver `README.md`, que todavía documenta ese producto). PediConsult es un fork recortado a consultorios pediátricos. Esto importa porque **una parte sustancial del código sigue siendo de Synapsis y no tiene ninguna ruta de acceso desde la interfaz actual** — sección 9 de este documento la detalla, para que nadie pierda tiempo debugueando o extendiendo pantallas que el usuario nunca llega a ver.

## 2. Stack y arquitectura

- **Frontend**: HTML + CSS + JavaScript vanilla en `index.html`. Sin React/Vue/build tool. Un único `<script>` de ~5000 líneas.
- **Persistencia de datos**: Airtable (API REST directa desde el cliente).
- **Archivos adjuntos**: Cloudinary (unsigned upload).
- **Autenticación**: local al dispositivo (PIN + 2FA opcional), sin servidor de auth.
- **Offline**: Service Worker (`sw.js`) con estrategia network-first, más algo de `localStorage` como caché manual (parcial, ver sección 6).
- **Despliegue**: sitio estático, configurado tanto para Netlify (`netlify.toml`) como Vercel (`vercel.json`) — ambos hacen rewrite de cualquier ruta a `index.html` (comportamiento de SPA) y agregan headers de seguridad básicos (`X-Content-Type-Options`, `X-Frame-Options`).

No hay backend propio: no existen carpetas `functions/` ni `api/`. Todo el token de Airtable y el preset de Cloudinary quedan **expuestos en el HTML servido al cliente** (ver riesgos, sección 10).

## 3. Integraciones externas

### Airtable

```
BASE  = 'appHMssWPjGZjPPAI'   // "Red_consultorios_pediatricos"
TOKEN = <Personal Access Token embebido en el cliente>
```

Helpers genéricos: `apiFetch`, `apiAll` (pagina automáticamente), `apiGetRecord`, `apiPost`, `apiPatch`, `apiDelete` — todos contra `https://api.airtable.com/v0/${BASE}/${table}`.

**Tablas realmente usadas por la aplicación hoy:**

| Tabla | Uso |
|---|---|
| **PACIENTES** (`TP`) | Tabla central. CRUD completo desde el formulario de pacientes. Ver modelo de datos en sección 5. |
| **VACUNAS** (`TV`) | Alimenta la pantalla "Vacunas": registros con `aplicada=FALSE()`, ordenados por fecha programada. |
| **CONTROLES** (`TCo`) | Alimenta la pantalla "Controles": mismo patrón que Vacunas (`realizado=FALSE()`). |

**Tablas/constantes definidas en el código pero sin uso real** (confirmado por ausencia de cualquier `apiFetch`/`apiAll` sobre ellas, o por apuntar a stubs vacíos):

| Constante | Estado |
|---|---|
| `TC`/`FC` (CONSULTAS) | Definida, nunca consultada. |
| `TC_CIR`/`FC_CIR` (CIRUGIAS_v3) | El propio código la comenta como "Synapsis legacy — no se usa en PediConsultorios". |
| `T = {}`, `FV2 = {}`, `FA = {}`, `FS = {}` | **Stubs vacíos explícitos**, con comentario en el código: *"Stubs — código de Synapsis no utilizado en esta versión pediátrica"*. Cualquier referencia a `T.cirV2`, `T.stockA`, campos de `FV2`/`FA` resuelve a `undefined`. |
| `T_UNIF = ''`, `FUNIF = {}` | Tabla "PACIENTES_UNIFICADOS" del producto original — string vacío. El botón admin "Regenerar tabla unificada" **falla en producción** (capturado por try/catch, muestra toast de error). No usar. |
| `T_PASE`/`FPA` (PASE_GUARDIA) | Tabla con ID real y campos mapeados, y el código sí le hace `fetch`/`post`/`patch` — pero ningún flujo de UI llega a invocar esas funciones (sección 9). Consumo puramente muerto hoy. |
| 6 tablas clínicas legado (`CLINICAL_TABLES_LINKS`: Hidrocefalia, Malform. Vasculares, Disrafismo, Craneosinostosis, Chiari, Tumores) | Sólo se tocan desde la fusión de duplicados (sección 8), para re-vincular registros — no tienen pantalla propia. |

### Cloudinary

Upload sin firma (unsigned): `POST https://api.cloudinary.com/v1_1/dm1yeahfb/auto/upload` con `upload_preset='mi_preset'`. Usado únicamente por el formulario de pacientes, para adjuntar estudios/fotos/PDF al campo Airtable `FP.archivos`. (Existen también llamadas de Cloudinary en los módulos de Stock y Pase de guardia, pero esos módulos son código muerto — sección 9.)

## 4. Autenticación y seguridad

### PIN

- `hashPin(pin)` = `SHA-256('synapsis-v2-' + pin)`, hex, guardado en `localStorage['synapsis_pin']`. Salt fijo (no por usuario/dispositivo).
- Primer uso: pide el PIN dos veces (confirmación) antes de guardarlo.
- Reintentos: 5 fallos seguidos → bloqueo de 30 segundos (`localStorage['synapsis_lock']` con timestamp de expiración).
- "Olvidé mi PIN": borra `synapsis_pin`, `synapsis_lock` y las claves de caché de Cirugías/Stock (vestigiales), y vuelve al flujo de creación. No borra pacientes ni ningún dato de Airtable.

### 2FA (TOTP, RFC 6238)

Implementación propia (no usa librería): genera 20 bytes random en Base32, HMAC-SHA1 sobre ventanas de 30s vía Web Crypto (`crypto.subtle.sign`), tolerancia de ±1 paso (90s de ventana efectiva). Es **adicional** al PIN, no lo reemplaza — se activa opcionalmente desde "Mi Perfil", queda guardado en `localStorage['synapsis_totp']`, y si está activo se exige después de un PIN correcto. Cualquier usuario puede activarlo/desactivarlo para su propio dispositivo; no depende del rol.

### Roles

Solo existen dos roles, documentado explícitamente en el propio código ("Sólo 2 roles en esta versión"):

```
ROLE_LEVEL = { 'Medico': 3, 'Administrativo': 1 }
```

`isAdmin()` = `roleLevel() >= 3`. El rol por defecto de un perfil nuevo es **`Medico`**, que ya satisface `isAdmin()`. En la práctica, cualquier usuario que no haya cambiado su rol a "Administrativo" ve las herramientas de administración (sección 8).

El rol se guarda en `localStorage['synapsis_profile']` — es una preferencia local al dispositivo, **no hay backend de autenticación/autorización de roles**. Cualquier persona con acceso al dispositivo (y el PIN) puede cambiarse el rol ella misma desde "Mi Perfil".

### Permisos configurables por rol (parcialmente sin efecto)

Existe un panel de administración (`openAdminPermsPanel`) que permite configurar, por rol, si cada "tab" está en modo `editar`/`ver`/`ocultar`, guardado en `localStorage['synapsis_role_perms']` (el propio código comenta *"sincronización Airtable pendiente"* — hoy es 100% local, sin sincronizar entre dispositivos).

Los tabs configurables son `cir, pac, seg, stock, dash, pase` — pero la navegación real de esta build sólo tiene `nav-home, nav-pac, nav-seg, nav-ctrl, nav-cal`. Consecuencia:
- Los permisos sobre `cir`, `stock`, `dash`, `pase` **no tienen ningún efecto** (esos botones de navegación no existen en el DOM).
- Los tabs `ctrl` (Controles) y `cal` (Calendario) **no están en la lista configurable**, así que siempre son visibles sin importar el rol.
- En la práctica, hoy este panel sólo puede efectivamente ocultar/mostrar Pacientes y Vacunas por rol.

### Riesgos de seguridad conocidos

- El token de Airtable y el preset de Cloudinary están en texto plano en el HTML que llega al navegador — cualquiera con acceso al código fuente de la página tiene acceso de lectura/escritura a la base completa de Airtable.
- No hay backend que valide autorización — toda la app confía en el cliente.
- El PIN usa un salt fijo compartido por todas las instalaciones (no por usuario), lo que lo debilita levemente frente a ataques de diccionario si el hash se filtrara (impacto acotado porque igual no hay forma de exfiltrar el hash sin acceso directo al dispositivo/localStorage).

**Recomendación** (fuera del alcance de esta documentación, pero vale dejarla escrita): migrar las llamadas a Airtable/Cloudinary detrás de un backend propio (o funciones serverless) que oculte las credenciales, antes de escalar el uso a más consultorios.

## 5. Modelo de datos — Pacientes

`PAC_FIELDS` es la fuente única de verdad para el formulario, el dictado guiado, el dictado libre y el guardado — antes esta información estaba duplicada en varios lugares y se desincronizaba; ahora todo (UI, voz, guardado) recorre esta misma lista.

| Campo (id) | Tipo | Requerido | Notas |
|---|---|---|---|
| Apellido (`pf-apellido`) | texto | **sí** | No tiene columna propia en Airtable — ver combinación abajo |
| Nombre (`pf-nombre`) | texto | **sí** | Idem |
| DNI (`pf-dni`) | numérico | no | Se guarda como número (`parseFloat`), único campo con transformación |
| Sexo (`pf-sexo`) | select | no | Masculino / Femenino / Otro |
| Fecha de nacimiento (`pf-fnac`) | fecha | **sí** | |
| Obra social (`pf-os`) | texto | no | |
| Domicilio (`pf-domicilio`) | texto largo | no | |
| Tutor (`pf-tutor`) | texto largo | no | |
| Teléfono (`pf-tel`) | texto | no | |
| Email (`pf-email`) | texto | no | Único campo sin pregunta de voz — no entra al dictado guiado |
| Diagnóstico (`pf-diag`) | texto | no | |
| Antecedentes (`pf-ant`) | texto largo | no | |
| Notas (`pf-notas`) | texto largo | no | |

**Apellido y Nombre combinados**: Airtable sólo tiene una columna ("Apellido y Nombre"). Al guardar, la app arma `"Apellido, Nombre"` y lo escribe en esa única columna; al editar, hace el camino inverso (separa por la coma si existe, o usa la primera palabra como apellido si no).

**Validación de duplicados al crear** (no al editar): primero por DNI exacto, si no por nombre normalizado (sin tildes, minúsculas, orden de palabras). Si encuentra coincidencia, ofrece "Editar existente" o "Crear de todas formas" (fuerza el alta salteando la validación).

**Adjuntos**: se suben a Cloudinary, y al guardar se relee el registro fresco de Airtable antes de hacer el patch final — porque las URLs de adjuntos de Airtable expiran y hay que evitar pisar adjuntos ya existentes con una lista vieja en memoria.

## 6. Persistencia local y modo offline

Claves de `localStorage` en uso activo:

| Clave | Contenido |
|---|---|
| `synapsis_pin` / `synapsis_lock` | Hash del PIN / timestamp de bloqueo |
| `synapsis_profile` | Nombre, apellido, rol del usuario del dispositivo |
| `synapsis_totp` | Secret del 2FA |
| `synapsis_role_perms` | Matriz de permisos por rol (parcialmente sin efecto, sección 4) |
| `synapsis_guided_voice_fields` | Preset de campos elegidos para el dictado guiado por voz (sección 7) |
| `syn_diag_aliases` | Diccionario custom de sinónimos de diagnóstico, editable desde el panel admin |

Claves de caché (`syn_cirV2`, `syn_stock`) existen pero **sólo alimentan pantallas muertas** (Cirugías, Stock) — no tienen efecto en el uso real de la app. `syn_dash` se borra en el reset de PIN pero nunca se llega a escribir (pantalla muerta también).

**Importante**: las pantallas realmente activas (Pacientes, Vacunas, Controles) **no tienen ningún caché ni fallback offline real** — se cargan con `fetch` directo a Airtable cada vez. Si no hay conexión, esas pantallas simplemente no tienen datos que mostrar. El único mecanismo con fallback a caché real (`navigator.onLine` + datos guardados) pertenece a la rama muerta de Cirugías.

**Service Worker** (`sw.js`): estrategia network-first (fetch primero, cae a caché sólo si falla la red) — precachea únicamente `/`, `/index.html`, `/manifest.json`. Excluye explícitamente Airtable y Google Fonts del manejo de caché (van directo a red). Esto significa que la app permite reabrir la última pantalla vista sin conexión, pero no garantiza datos frescos de pacientes sin red.

## 7. Sistema de carga de pacientes por voz

Es la funcionalidad más elaborada de la app. Usa la Web Speech API del navegador (`SpeechRecognition`/`webkitSpeechRecognition` para reconocimiento, `speechSynthesis` para texto-a-voz) — **sin backend de voz propio**, por lo que la calidad depende enteramente del motor del navegador/SO (Chrome/Android típicamente mejor soportado que Safari/iOS).

### 7.1 Dictado libre ("Decir los datos, uno seguido del otro")

El usuario dicta todo de corrido; `extractEntities(text)` corre una batería de regex con anclas de palabra clave ("dni", "teléfono", "correo electrónico", etc.) más un par de heurísticas sin ancla (nombre/apellido por capitalización, sexo, obra social por lista fija `OBRAS_SOCIALES`).

**Generalización de "casi lo tengo" (`tryExtractField`)**: cuando se detecta la palabra clave de un campo pero el valor no pasa la validación (formato de email, cantidad de dígitos de DNI/teléfono, fecha no interpretable), en vez de descartarlo en silencio se guarda en `r[rKey+'FailedRaw']` y el resumen de extracción muestra un aviso ámbar accionable ("se escuchó algo pero no se pudo interpretar, tocá para redictarlo"). Aplica a fecha de nacimiento, email, DNI y teléfono.

**Fix específico de iOS (Obra social)**: el motor de dictado de iOS deletrea siglas letra por letra ("o. s. d. e." en vez de "osde", como hace el motor de Android/Chrome), lo que rompía la detección de obra social (casi todas las opciones son siglas). Se agregó un paso de normalización que colapsa corridas de letras sueltas separadas por espacio/punto antes de comparar contra la lista de obras sociales.

Al terminar (botón "■ Listo" o decir "listo"), el resumen muestra chips verdes por campo detectado, cada uno con:
- ✕ para borrar el campo.
- 🎤 para **redictar sólo ese campo** (`retryVoiceField`), sin tener que repetir todo el dictado.

Los campos sin detectar se muestran como píldoras tocables (mismo 🎤 de redictado directo).

### 7.2 Dictado guiado

Recorre campo por campo, preguntando por voz (TTS) y escuchando la respuesta. Dos mejoras clave sobre la versión inicial:

**Confirmación por voz por campo**: tras cada respuesta, la app repite lo entendido ("Apellido: Vásquez, ¿es correcto?") y espera confirmación de voz o táctil (`✔ Confirmar` / `🔁 Corregir`, siempre visibles como respaldo si el reconocimiento de la confirmación en sí falla). Reglas:
- Respuesta ambigua (ni sí ni no claro): repregunta una vez ("¿sí o no?"); si sigue sin entenderse, se acepta el valor y avanza (nunca se traba).
- Dos "no" seguidos para el mismo campo: deja de insistir por voz, resalta el campo en ámbar para carga manual, y sigue con el siguiente.
- Campos de texto largo (Domicilio, Tutor, Antecedentes, Notas — marcados `longText:true` en `PAC_FIELDS`) usan una frase de confirmación genérica ("Domicilio cargado, ¿es correcto?") en vez de leer el párrafo completo en voz alta.

**Selector de campos configurable** ("⚙ Elegir campos"): antes el guiado siempre preguntaba los 12 campos con `voiceQ`, lo cual resultaba tedioso. Ahora el usuario puede elegir un subconjunto desde un checklist (todos marcados por defecto, comportamiento sin cambios si nunca se toca), guardado en `localStorage['synapsis_guided_voice_fields']` y recordado entre sesiones. `VOICE_FLOW` pasa de ser una constante fija a construirse (`buildVoiceFlow()`) al iniciar cada sesión, filtrando `VOICE_FLOW_FIELDS` (la lista completa de candidatos) según el preset guardado.

### 7.3 Arquitectura interna compartida

Ambos modos comparten piezas para no duplicar lógica:
- `parseVoiceValue(type, text)`: interpreta una respuesta hablada según el tipo de campo (fecha/DNI/sexo/texto), sin tocar el DOM.
- `captureTypedField(step, onDone)`: dueña del ciclo de vida de `SpeechRecognition` para una captura puntual — la usan tanto el guiado como el reintento dirigido del dictado libre, así campos tipo `select`/`date` quedan bien parseados en cualquiera de los dos caminos (el botón de micrófono genérico por campo, `startVoice()`, en cambio, sólo escribe texto crudo — se usa para los pocos campos con mic inline en el formulario, no para reintentos tipados).
- `speakFieldValue(step, value)`: formatea un valor para lectura en voz alta (fecha ISO → "15 de marzo de 2022"; DNI agrupado de a 3 dígitos).
- `discardRecognition(rec)`: limpia handlers y detiene una instancia de reconocimiento antes de reemplazarla — necesario porque `stop()` dispara `onend` de forma asíncrona y, sin esto, una instancia vieja puede pisar la referencia global de la nueva y quedar escuchando en segundo plano sin control.

## 8. Detección y fusión de pacientes duplicados

Herramienta manual (no corre automáticamente salvo la validación al crear, sección 5), accesible sólo a usuarios con `isAdmin()===true` (rol Médico, el default) desde "Mi Perfil → 🔍 Detectar y fusionar duplicados":

- `detectPacDuplicates()` agrupa por DNI idéntico, por similitud fuzzy de nombre normalizado, y por "misma fecha de nacimiento + nombre similar".
- Fusión 1 a 1 o "fusionar todos automáticamente" (el maestro es siempre el primer registro del grupo, no elegible por el usuario en la fusión masiva).
- Al fusionar: copia al maestro los campos vacíos que sólo tiene el duplicado, y reasigna vínculos en las tablas clínicas legado relacionadas.
- Existe además un flujo de "precheck de duplicados antes de crear" (`openPacPrecheck`) completo pero **sin ningún punto de entrada en la UI** — código muerto, no confundir con la validación real que sí corre en `savePac()`.

## 9. Código muerto / vestigial confirmado (sin ruta de acceso desde la UI)

Confirmado por doble verificación (ausencia de elemento DOM destino y/o ausencia de cualquier llamador real). Documentado acá explícitamente para que nadie invierta tiempo extendiendo o debugueando estas rutas pensando que son parte del producto:

| Módulo | Evidencia de que está muerto |
|---|---|
| **Cirugías** (`renderCir`, `filterHtmlCir`, tabla legado CirV2) | Escribe en `#list-cir`, que no existe en el HTML. Sin botón de nav (`nav-cir` no existe). |
| **Stock** (`renderStock`, `loadAndRenderStock`) | Escribe en `#list-stock`, inexistente. Sin nav. |
| **Dashboard / Analítica de cirujanos** (`loadDash`, `renderDash`) | Sin ningún llamador en todo el archivo. Contenedor `#dash-content` inexistente. |
| **Pase de guardia** (`loadPase`, `renderPase`, módulo completo de ~440 líneas) | Sin llamador. Contenedor `#pase-content` inexistente. La tabla Airtable (`PASE_GUARDIA`) sí existe y el código le hace fetch/post/patch, pero nada la invoca desde la UI. |
| **`buildPacDetailHtml` + `CAT_MAP`** (categorías clínicas neuroquirúrgicas + historia quirúrgica en el detalle de paciente) | Sin llamador — el detalle de paciente real usa una implementación distinta y más simple. |
| **Precheck de duplicados al crear** (`openPacPrecheck`, `modal-pac-precheck`) | Sin llamador — coexiste con la validación real de duplicados que sí corre en `savePac()`. |
| **`PACIENTES_UNIFICADOS` / "Regenerar tabla unificada"** | Botón visible en el panel admin, pero `T_UNIF` es un string vacío — la función falla en cada ejecución (atrapado por try/catch, sólo muestra un toast de error). |
| **Permisos por rol sobre `cir`/`stock`/`dash`/`pase`** | Sin efecto — esos botones de navegación no existen en el DOM. |

**Recomendación**: decidir explícitamente si este código se elimina (reduce superficie de mantenimiento y confusión) o se reactiva a propósito con una tabla/pantalla real, en vez de dejarlo indefinidamente como deuda silenciosa.

## 10. Despliegue

- **Netlify** (`netlify.toml`) y **Vercel** (`vercel.json`): configuraciones equivalentes, sin build command (`publish='.'`), rewrite de cualquier ruta a `/index.html`, headers de seguridad básicos.
- **`manifest.json`**: PWA `standalone`, `lang:'es'`, iconos 192/512 maskable, categorías `medical`/`health`.
- **`sw.js`**: cache versionado (`pediconsultorios-v3`), estrategia network-first, precarga mínima (`/`, `/index.html`, `/manifest.json`).
- Instalación en celular: Android (Chrome → "Agregar a pantalla de inicio"), iPhone (Safari → Compartir → "Agregar a pantalla de inicio").

## 11. Resumen de riesgos y deuda técnica

1. Credenciales (Airtable, Cloudinary) expuestas en el cliente — sin backend que las oculte.
2. Sin caché/fallback offline real para Pacientes, Vacunas y Controles (las únicas pantallas que importan hoy).
3. ~40% del código (estimado) corresponde a módulos sin ruta de UI (sección 9) — deuda de mantenimiento y riesgo de confusión para quien no conozca esta historia.
4. Sistema de permisos por rol parcialmente inconsistente con la navegación real actual.
5. Salt fijo compartido en el hash del PIN.
