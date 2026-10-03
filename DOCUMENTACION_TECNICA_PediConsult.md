# PediConsult — Documentación funcional-técnica

**Última actualización:** 2026-10-03 (verificado contra el commit `9527a0a` del 2026-08-02, más los cambios sin commitear: `netlify/functions/` y el reporte clínico con varias páginas, encabezado repetido y firma)
**Alcance:** describe el estado real del código en `index.html`, verificado línea por línea contra el archivo — no el estado deseado ni el de versiones anteriores. Donde el código y los textos de ayuda embebidos no coinciden, este documento sigue al código.

---

## 1. Qué es esto, en una frase

Una PWA (Progressive Web App) de un solo archivo (`index.html`, ~7200 líneas), sin build step y sin framework: todo el HTML/CSS/JS vive en un único archivo que el navegador ejecuta tal cual, y todas las llamadas a datos van directo del navegador a Airtable y Cloudinary. La única pieza de servidor es una función programada de Netlify que manda recordatorios por email (sección 11); la app en sí no depende de ella.

**Origen del proyecto**: el código nace de un producto anterior de gestión de neurocirugía llamada "Synapsis" (ver `README.md`, que todavía documenta ese producto). PediConsult es un fork recortado a consultorios pediátricos. Esto importa porque **una parte sustancial del código sigue siendo de Synapsis y no tiene ninguna ruta de acceso desde la interfaz actual** — sección 12 de este documento la detalla, para que nadie pierda tiempo debugueando o extendiendo pantallas que el usuario nunca llega a ver.

## 2. Stack y arquitectura

- **Frontend**: HTML + CSS + JavaScript vanilla en `index.html`. Sin React/Vue/build tool. Un único `<script>` de ~6300 líneas.
- **Persistencia de datos**: Airtable (API REST directa desde el cliente).
- **Archivos adjuntos**: Cloudinary (unsigned upload).
- **Autenticación**: local al dispositivo (PIN + 2FA opcional), sin servidor de auth.
- **Offline**: Service Worker (`sw.js`) con estrategia network-first, más algo de `localStorage` como caché manual (parcial, ver sección 8).
- **Tareas programadas**: una Netlify Scheduled Function (`netlify/functions/enviar-recordatorios.mjs`) que envía recordatorios de vacunas/controles por email vía Resend — sección 11.
- **Despliegue**: sitio estático, configurado tanto para Netlify (`netlify.toml`) como Vercel (`vercel.json`) — ambos hacen rewrite de cualquier ruta a `index.html` (comportamiento de SPA) y agregan headers de seguridad básicos (`X-Content-Type-Options`, `X-Frame-Options`).

La app no tiene backend propio para sus operaciones: el token de Airtable y el preset de Cloudinary quedan **expuestos en el HTML servido al cliente** (ver riesgos en las secciones 4 y 14). La función de recordatorios sí corre en servidor y lee sus credenciales de variables de entorno, pero no reemplaza ninguna llamada del cliente.

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
| **CONSULTAS** (`TC`) | Historial clínico: cada registro es una "instancia" (consulta) vinculada a un paciente. CRUD desde el formulario de edición de paciente. Ver sección 6. |
| **VACUNAS** (`TV`) | Lista general de la pantalla "Vacunas", vista por paciente para mayores de 15 años y reporte de vacunación. Ver sección 7. |
| **CONTROLES** (`TCo`) | Lista general de la pantalla "Controles" y vista por paciente para mayores de 15 años. Ver sección 7. |

**Tablas/constantes definidas en el código pero sin uso real** (confirmado por ausencia de cualquier `apiFetch`/`apiAll` sobre ellas, o por apuntar a stubs vacíos):

| Constante | Estado |
|---|---|
| `TC_CIR`/`FC_CIR` (CIRUGIAS_v3) | El propio código la comenta como "Synapsis legacy — no se usa en PediConsultorios". |
| `T = {}`, `FV2 = {}`, `FA = {}`, `FS = {}` | **Stubs vacíos explícitos**, con comentario en el código: *"Stubs — código de Synapsis no utilizado en esta versión pediátrica"*. Cualquier referencia a `T.cirV2`, `T.stockA`, campos de `FV2`/`FA` resuelve a `undefined`. |
| `T_UNIF = ''`, `FUNIF = {}` | Tabla "PACIENTES_UNIFICADOS" del producto original — string vacío. El botón admin "Regenerar tabla unificada" **falla en producción** (capturado por try/catch, muestra toast de error). No usar. |
| `T_PASE`/`FPA` (PASE_GUARDIA) | Tabla con ID real y campos mapeados, y el código sí le hace `fetch`/`post`/`patch` — pero ningún flujo de UI llega a invocar esas funciones (sección 12). Consumo puramente muerto hoy. |
| 6 tablas clínicas legado (`CLINICAL_TABLES_LINKS`: Hidrocefalia, Malform. Vasculares, Disrafismo, Craneosinostosis, Chiari, Tumores) | Sólo se tocan desde la fusión de duplicados (sección 10), para re-vincular registros — no tienen pantalla propia. |

### Cloudinary

Upload sin firma (unsigned): `POST https://api.cloudinary.com/v1_1/dm1yeahfb/auto/upload` con `upload_preset='mi_preset'`. Usado por el formulario de pacientes, tanto para los adjuntos del paciente (campo Airtable `FP.archivos`) como para los de cada instancia del historial clínico (`FC.archivos`). (Existen también llamadas de Cloudinary en los módulos de Stock y Pase de guardia, pero esos módulos son código muerto — sección 12.)

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

`isAdmin()` = `roleLevel() >= 3`. El rol por defecto de un perfil nuevo es **`Medico`**, que ya satisface `isAdmin()`. En la práctica, cualquier usuario que no haya cambiado su rol a "Administrativo" ve las herramientas de administración (sección 10).

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
| Teléfono (`pf-tel`) | texto | no | Teléfono del tutor (`FP.telTutor`) |
| Email (`pf-email`) | texto | no | Email del tutor (`FP.emailTutor`). Único campo sin pregunta de voz — no entra al dictado guiado. Es el destino de los recordatorios automáticos (sección 11) |

**Diagnóstico, Antecedentes y Notas ya no son campos del paciente**: desde la versión "historia clínica v1" (2026-07-29) viven como instancias repetibles en la tabla CONSULTAS (sección 6). Las columnas `FP.diag`, `FP.antec` y `FP.notas` siguen existiendo en PACIENTES sólo para leer datos viejos y migrarlos.

**Estado**: un paciente nuevo se crea siempre con `Estado = 'Activo'`. La lista de pacientes se puede filtrar por estado, y los recordatorios por email sólo se mandan a pacientes `Activo` o `En seguimiento`.

**Apellido y Nombre combinados**: Airtable sólo tiene una columna ("Apellido y Nombre"). Al guardar, la app arma `"Apellido, Nombre"` y lo escribe en esa única columna; al editar, hace el camino inverso (separa por la coma si existe, o usa la primera palabra como apellido si no).

**Validación de duplicados al crear** (no al editar): primero por DNI exacto, si no por nombre normalizado (sin tildes, minúsculas, orden de palabras). Si encuentra coincidencia, ofrece "Editar existente" o "Crear de todas formas" (fuerza el alta salteando la validación).

**Adjuntos**: se suben a Cloudinary, y al guardar se relee el registro fresco de Airtable antes de hacer el patch final — porque las URLs de adjuntos de Airtable expiran y hay que evitar pisar adjuntos ya existentes con una lista vieja en memoria.

**Ficha de detalle** (`modal-pac-detail`): muestra los datos del paciente y, debajo, el historial clínico en modo sólo lectura (`fetchAndShowHistorialReadonly`). Tiene el botón "📄 Generar reporte clínico" (sección 6), igual que el formulario de edición.

## 6. Historial clínico

Cada paciente tiene una lista de **instancias** (consultas), guardadas como registros de la tabla CONSULTAS vinculados al paciente. `HIST_FIELDS` es la fuente única de verdad de los campos de cada instancia, con el mismo criterio que `PAC_FIELDS`:

| Campo | Columna Airtable | Notas |
|---|---|---|
| Fecha | `FC.fecha` (Fecha de Atención) | Si queda vacía, al guardar se usa la fecha de hoy |
| Diagnóstico Principal | `FC.diag` | Texto largo |
| Antecedentes | `FC.antec` | Texto largo |
| Notas Clínicas | `FC.obs` (Observaciones) | Texto largo |
| Archivos | `FC.archivos` | Adjuntos subidos a Cloudinary, igual que los del paciente |

`FC.trat` (Tratamiento) y `FC.medico` (Médico) están mapeados en el código pero la UI no los usa.

**Dónde se edita**: en el formulario de **edición** de un paciente ya existente, sección "Historial clínico" (`renderHistorialList`). Cada instancia es una tarjeta expandible; "+ Nuevo" agrega una, y cada una se puede borrar. Un paciente **nuevo** todavía no tiene historial: hay que guardarlo primero, porque las instancias necesitan un registro de paciente al cual vincularse.

**Guardado**: no hay un botón propio. El mismo "Guardar paciente" guarda primero el paciente y después recorre las instancias: borra en CONSULTAS las marcadas como eliminadas, crea las nuevas y actualiza las existentes. Una tarjeta "+ Nuevo" sin ningún contenido se ignora. Si falla una instancia, se avisa con un toast y se siguen guardando las demás. Antes de cada re-render, `syncHistFromDom()` copia al estado en memoria lo que el usuario escribió, para no perder texto de otras tarjetas abiertas.

**Dictado por voz**: cada campo de texto tiene su micrófono (`startVoiceHist`), con escucha continua que termina tras ~3 segundos de silencio (`captureLongTextField`, `LONG_TEXT_SILENCE_MS = 3000`, con un tope absoluto de 3 minutos). La fecha tiene su propio micrófono (`startVoiceHistDate`), que interpreta "día, mes y año". Dictar sobre un campo que ya tiene texto lo **reemplaza**. Si en el dictado libre del paciente (sección 9.1) se mencionan diagnóstico, antecedentes o notas, se crea automáticamente una instancia nueva con esos datos (sólo al editar un paciente existente).

**Migración de datos viejos**: si un paciente no tiene ninguna instancia pero sí tiene cargados los campos viejos (`FP.diag`/`FP.antec`/`FP.notas`), al abrirlo se precargan como primera instancia sin pedir confirmación. Recién al tocar "Guardar paciente", y sólo si esa instancia se guarda bien, se vacían los campos viejos. Hasta ese momento no se pierde ni se duplica nada.

**Reporte clínico en PDF** (`openReporteClinico(pacId)` → `generarReportePdf`): se abre desde la ficha de detalle o desde el formulario de edición. El usuario elige "Historial completo" o una instancia puntual. Siempre usa lo guardado en Airtable (si se abre desde el formulario, avisa que hay que guardar antes los cambios).
- **Contenido**: datos del paciente, datos clínicos viejos todavía sin migrar (si los hay), las instancias elegidas y, al final, el **aval del médico**: firma, nombre con tratamiento (Dr./Dra.), especialidad y matrícula, tomados de "Mi Perfil" (sección 8). Sin datos cargados, deja una línea de "Firma y aclaración" para firmar a mano. La firma va siempre pegada al último bloque, para que nunca quede sola en una hoja.
- **Varias páginas con encabezado repetido**: el contenido se arma en una `<table>` cuyo `<thead>` (marca, "Reporte clínico", fecha de emisión y nombre/DNI/nacimiento/obra social del paciente) el navegador repite en cada hoja. Cada instancia evita partirse entre páginas cuando entra entera.
- **Impresión**: no usa librerías. `printReportArea()` marca `#report-print-area` y agrega `body.printing-report`, de modo que sólo se imprime el reporte, y llama a `window.print()`. El PDF sale de "Guardar como PDF" del diálogo, con el nombre de archivo propuesto `Reporte clínico - <paciente> - <fecha>`. La limpieza se hace en `afterprint`, porque en algunos móviles `print()` no bloquea.
- **Arreglo de una sola hoja (2026-10-03)**: la app fija `html,body{height:100%;overflow:hidden}`, y antes la hoja `@media print` no lo anulaba, así que el PDF cortaba todo lo que no entraba en la primera página. Afectaba también al reporte de vacunación.

## 7. Vacunas, Controles y Calendario

Las tres pantallas cargan sus datos con `fetch` directo a Airtable cada vez que se abren (sin caché offline, sección 8).

### 7.1 Clasificación de estados

Las listas generales y las vistas de mayores de 15 años usan las mismas dos funciones, `classifyVacuna` y `classifyControl`. La edad del paciente se calcula a partir de su fecha de nacimiento, y el corte es **mayor de 15 años** ("adulto" en el código).

| Caso | Vacunas | Controles |
|---|---|---|
| Menor de 15 | Aplicada / Atrasada / Pendiente, sólo dentro de la ventana [hoy − 3 meses, hoy + 1 año] | Cumplido / Atrasado / Pendiente, sólo dentro de la ventana [hoy − 2 meses, hoy + 1 año] |
| Mayor de 15 | Aplicada / **No aplicada** (sin límite hacia atrás) / Pendiente (hasta 1 año adelante) | Sólo los **Cumplidos**, sin límite de fecha. Atrasados y pendientes no se muestran |

Las ventanas se calculan con meses y años de calendario (`dateOffset`), no con una cantidad fija de días. Las consultas a Airtable sólo acotan hacia adelante (`Fecha Programada` anterior a hoy + 1 año, máximo 200 registros); el resto del recorte se hace en el navegador.

### 7.2 Pantalla Vacunas

- **Selector de paciente** arriba ("Calendario 2026 por paciente"). Al elegir uno (`renderVacunasPaciente`):
  - **Menor de 15**: la lista **se calcula** a partir de la fecha de nacimiento y del esquema pediátrico fijo `PEDIATRIC_VACUNAS_SCHEDULE` (hasta los 11 años), con `computePediatricVacSchedule`. Muestra las vacunas que caen en 2026 más las de años anteriores que ya están atrasadas, cada una con "Faltan N días/meses", "Hoy" o "Atrasada N días". **No lee lo cargado en Airtable**: una vacuna aplicada y registrada igual figura en este cálculo.
  - **Mayor de 15**: muestra lo cargado en Airtable para ese paciente, con la clasificación de la sección 7.1.
  - Sin fecha de nacimiento: muestra un aviso.
- **Botón "Reporte de vacunación"** (`generarReporteVacunacion`): genera un PDF (vía `printReportArea()`, igual que el reporte clínico, así que también imprime todas las páginas) con **exactamente lo mismo que la vista del paciente**. Para menores reutiliza `computePediatricVacSchedule`, así reporte y pantalla no pueden diferir. Para mayores de 15 (o sin fecha de nacimiento) usa los registros de Airtable.
- **Lista general "Vacunas pendientes"** (`loadVacunas`): todos los registros de la tabla VACUNAS de todos los pacientes, clasificados según la sección 7.1.

### 7.3 Pantalla Controles

Mismo esquema que Vacunas:
- **Selector de paciente** ("Controles según edad por paciente", `renderControlesPaciente`). Menores: controles **calculados** por edad con `generarControlesEsperados` (cada 7/14/30 días de recién nacido, mensual el primer año, y así hasta los 12 años); muestra el último ya pasado y los próximos 6. Mayores de 15: sólo los controles cumplidos registrados en Airtable.
- **Lista general "Controles pendientes"** (`loadControles`): todos los registros de CONTROLES, clasificados según la sección 7.1.
- No tiene reporte en PDF.

### 7.4 Pantalla Calendario

Tabla de referencia, sólo lectura, con el Calendario Nacional de Vacunación 2026 del Ministerio de Salud de Argentina (`CALENDARIO_VACUNACION_2026`, transcripto en el código). No depende de ningún paciente ni de Airtable.

**Año fijo en el código**: tanto el calendario como `computePediatricVacSchedule` (que filtra por `getFullYear() === 2026`) tienen el año 2026 escrito a mano. Al pasar a 2027 hay que actualizar la tabla y ese filtro, o la vista por paciente sólo va a mostrar vacunas atrasadas.

## 8. Persistencia local y modo offline

Claves de `localStorage` en uso activo:

| Clave | Contenido |
|---|---|
| `synapsis_pin` / `synapsis_lock` | Hash del PIN / timestamp de bloqueo |
| `synapsis_profile` | Nombre, apellido, rol del usuario del dispositivo, y los datos del aval de los reportes: tratamiento (Dr./Dra.), matrícula y especialidad |
| `synapsis_firma` | Imagen PNG (data URL) de la firma para los reportes, dibujada o subida desde "Mi Perfil → Firma para reportes" |
| `synapsis_totp` | Secret del 2FA |
| `synapsis_role_perms` | Matriz de permisos por rol (parcialmente sin efecto, sección 4) |
| `synapsis_guided_voice_fields` | Preset de campos elegidos para el dictado guiado por voz (sección 9) |
| `syn_diag_aliases` | Diccionario custom de sinónimos de diagnóstico, editable desde el panel admin |
| `synapsis_novedades` / `synapsis_novedades_seen` | Texto de "Novedades" y la última vez que se leyó (ver abajo) |

**Firma por dispositivo**: igual que el resto del perfil, la firma vive en el navegador de cada dispositivo. Si el médico usa la app en el celular y en la PC, tiene que cargarla en los dos. Es una imagen de la firma, no una firma digital con certificado en el sentido legal (Ley 25.506).

**Novedades**: en el menú de información (ícono 🩺 del encabezado) hay un ítem "Novedades" con un texto libre editable para avisos al equipo. Si cambió desde la última lectura, aparece un punto rojo en el ícono y en el ítem. **Se guarda sólo en el dispositivo**: lo que escribe un usuario no lo ven los demás.

Claves de caché (`syn_cirV2`, `syn_stock`) existen pero **sólo alimentan pantallas muertas** (Cirugías, Stock) — no tienen efecto en el uso real de la app. `syn_dash` se borra en el reset de PIN pero nunca se llega a escribir (pantalla muerta también).

**Importante**: las pantallas realmente activas (Pacientes, historial clínico, Vacunas, Controles) **no tienen ningún caché ni fallback offline real** — se cargan con `fetch` directo a Airtable cada vez. Si no hay conexión, esas pantallas simplemente no tienen datos que mostrar. El único mecanismo con fallback a caché real (`navigator.onLine` + datos guardados) pertenece a la rama muerta de Cirugías.

**Service Worker** (`sw.js`): estrategia network-first (fetch primero, cae a caché sólo si falla la red) — precachea únicamente `/`, `/index.html`, `/manifest.json`. Excluye explícitamente Airtable y Google Fonts del manejo de caché (van directo a red). Esto significa que la app permite reabrir la última pantalla vista sin conexión, pero no garantiza datos frescos de pacientes sin red.

## 9. Sistema de carga de pacientes por voz

Es la funcionalidad más elaborada de la app. Usa la Web Speech API del navegador (`SpeechRecognition`/`webkitSpeechRecognition` para reconocimiento, `speechSynthesis` para texto-a-voz) — **sin backend de voz propio**, por lo que la calidad depende enteramente del motor del navegador/SO (Chrome/Android típicamente mejor soportado que Safari/iOS). El idioma de reconocimiento es `es-AR`.

Regla común: dictar sobre un campo que ya tiene texto lo **reemplaza**, no lo agrega al final.

### 9.1 Dictado libre ("Decir los datos, uno seguido del otro")

El usuario dicta todo de corrido; `extractEntities(text)` corre una batería de regex con anclas de palabra clave ("dni", "teléfono", "correo electrónico", etc.) más un par de heurísticas sin ancla (nombre/apellido por capitalización, sexo, obra social por lista fija `OBRAS_SOCIALES`). Si detecta diagnóstico, antecedentes o notas, los manda a una instancia nueva del historial clínico (sección 6).

**Generalización de "casi lo tengo" (`tryExtractField`)**: cuando se detecta la palabra clave de un campo pero el valor no pasa la validación (formato de email, cantidad de dígitos de DNI/teléfono, fecha no interpretable), en vez de descartarlo en silencio se guarda en `r[rKey+'FailedRaw']` y el resumen de extracción muestra un aviso ámbar accionable ("se escuchó algo pero no se pudo interpretar, tocá para redictarlo"). Aplica a fecha de nacimiento, email, DNI y teléfono.

**Fix específico de iOS (Obra social)**: el motor de dictado de iOS deletrea siglas letra por letra ("o. s. d. e." en vez de "osde", como hace el motor de Android/Chrome), lo que rompía la detección de obra social (casi todas las opciones son siglas). Se agregó un paso de normalización que colapsa corridas de letras sueltas separadas por espacio/punto antes de comparar contra la lista de obras sociales.

Al terminar (botón "■ Listo" o decir "listo"), el resumen muestra chips verdes por campo detectado, cada uno con:
- ✕ para borrar el campo.
- 🎤 para **redictar sólo ese campo** (`retryVoiceField`), sin tener que repetir todo el dictado.

Los campos sin detectar se muestran como píldoras tocables (mismo 🎤 de redictado directo).

### 9.2 Dictado guiado

Recorre campo por campo, preguntando por voz (TTS) y escuchando la respuesta. Lo reconocido se escribe **en tiempo real** en el campo mientras el usuario habla.

**Confirmación pasiva por campo**: tras cada respuesta, la app **afirma** lo entendido ("Apellido: Vásquez.") y abre una ventana de escucha de 2,5 segundos (`PASSIVE_CONFIRM_WINDOW_MS`):
- Si no se escucha nada, el valor se da por bueno y pasa al siguiente campo. No hace falta decir "sí".
- Si se escucha cualquier cosa, se toma como que el usuario quiere corregir: borra el campo y vuelve a preguntar ("Decilo de nuevo…"). No importa qué se dijo, alcanza con detectar voz.
- Los botones táctiles `✔ Confirmar` / `🔁 Corregir` siguen visibles como respaldo.
- Dos correcciones seguidas para el mismo campo: deja de insistir por voz, resalta el campo en ámbar para carga manual y sigue con el siguiente.
- Campos de texto largo (Domicilio y Tutor, marcados `longText:true` en `PAC_FIELDS`) usan una frase genérica ("Domicilio cargado.") en vez de leer el texto completo.

Este esquema reemplazó (2026-07-22) a la confirmación activa anterior, que preguntaba "¿es correcto?" y esperaba un "sí"/"no". Esa versión fallaba seguido porque el motor reconoce mal palabras tan cortas. `speak()` además espera 300 ms antes de hablar, para que no se corten las primeras sílabas al pasar del micrófono al parlante.

**Selector de campos configurable** ("⚙ Elegir campos"): el usuario puede elegir qué campos pregunta el guiado desde un checklist (todos marcados por defecto, comportamiento sin cambios si nunca se toca), guardado en `localStorage['synapsis_guided_voice_fields']` y recordado entre sesiones. `VOICE_FLOW` se construye (`buildVoiceFlow()`) al iniciar cada sesión, filtrando `VOICE_FLOW_FIELDS` (los 9 campos de `PAC_FIELDS` con `voiceQ`) según el preset guardado.

### 9.3 Arquitectura interna compartida

Ambos modos comparten piezas para no duplicar lógica:
- `parseVoiceValue(type, text)`: interpreta una respuesta hablada según el tipo de campo (fecha/DNI/sexo/texto), sin tocar el DOM.
- `captureTypedField(step, onDone)`: dueña del ciclo de vida de `SpeechRecognition` para una captura puntual — la usan tanto el guiado como el reintento dirigido del dictado libre, así campos tipo `select`/`date` quedan bien parseados en cualquiera de los dos caminos (el botón de micrófono genérico por campo, `startVoice()`, en cambio, sólo escribe texto crudo — se usa para los pocos campos con mic inline en el formulario, no para reintentos tipados).
- `captureLongTextField(step, onDone)`: variante para respuestas largas con pausas (escucha continua, termina tras 3 s de silencio). Hoy la usan los campos del historial clínico (marcados `slowCapture` en `HIST_FIELDS`).
- `speakFieldValue(step, value)`: formatea un valor para lectura en voz alta (fecha ISO → "15 de marzo de 2022"; DNI agrupado de a 3 dígitos).
- `discardRecognition(rec)`: limpia handlers y detiene una instancia de reconocimiento antes de reemplazarla — necesario porque `stop()` dispara `onend` de forma asíncrona y, sin esto, una instancia vieja puede pisar la referencia global de la nueva y quedar escuchando en segundo plano sin control.

## 10. Detección y fusión de pacientes duplicados

Herramienta manual (no corre automáticamente salvo la validación al crear, sección 5), accesible sólo a usuarios con `isAdmin()===true` (rol Médico, el default) desde "Mi Perfil → 🔍 Detectar y fusionar duplicados":

- `detectPacDuplicates()` agrupa por DNI idéntico, por similitud fuzzy de nombre normalizado, y por "misma fecha de nacimiento + nombre similar".
- Fusión 1 a 1 o "fusionar todos automáticamente" (el maestro es siempre el primer registro del grupo, no elegible por el usuario en la fusión masiva).
- Al fusionar: copia al maestro los campos vacíos que sólo tiene el duplicado, reasigna vínculos en las tablas clínicas legado relacionadas y **borra el duplicado** de PACIENTES. **No reasigna** los registros de CONSULTAS, VACUNAS ni CONTROLES del duplicado: al borrarse el paciente quedan sin vínculo y desaparecen del historial y de las vistas por paciente. Hasta que se corrija, conviene revisar a mano esos registros antes de fusionar.
- Existe además un flujo de "precheck de duplicados antes de crear" (`openPacPrecheck`) completo pero **sin ningún punto de entrada en la UI** — código muerto, no confundir con la validación real que sí corre en `savePac()`.

## 11. Recordatorios automáticos por email

**Estado: implementado pero todavía sin commitear ni desplegar** (carpeta `netlify/functions/` y bloque `[functions]` de `netlify.toml`, a 2026-10-03).

Netlify Scheduled Function `netlify/functions/enviar-recordatorios.mjs`, programada `0 12 * * *` (todos los días a las 12:00 UTC = 09:00 hora argentina):

1. Busca en VACUNAS y CONTROLES los registros no aplicados/no realizados, con `Alerta Enviada = FALSE` y `Fecha Programada` entre hoy y hoy + 3 días.
2. Los agrupa por paciente y lee de PACIENTES el nombre, el tutor, el email del tutor y el estado.
3. Saltea pacientes que no están `Activo` o `En seguimiento`, y los que no tienen email del tutor (quedan listados en el log).
4. Manda **un email por paciente** con todos sus ítems, vía la API de Resend.
5. Si el envío sale bien, marca `Alerta Enviada = TRUE` en cada registro avisado.

Usar el flag además de la fecha permite que, si un día no corre, los avisos salgan al día siguiente sin duplicarse, y que un "Run now" manual no reenvíe a quien ya fue avisado.

**Variables de entorno** (en Netlify): `AIRTABLE_TOKEN`, `AIRTABLE_BASE` (opcional, por defecto `appHMssWPjGZjPPAI`), `RESEND_API_KEY`, `EMAIL_FROM`.

**Schema duplicado a mano**: `netlify/functions/lib/airtable-config.mjs` copia los IDs de tablas y campos de `index.html`, porque no hay build ni módulo compartido. Si cambia un campo en Airtable, hay que actualizar los dos lugares.

**Pendiente antes de desplegar**: la tabla VACUNAS todavía no tiene el checkbox "Alerta Enviada" (CONTROLES sí lo tiene). En `airtable-config.mjs`, `FV.alertaEnv` es un placeholder (`fldTODO_ALERTA_ENVIADA_VACUNAS`). Además, la fórmula de búsqueda referencia `{Alerta Enviada}` por nombre: mientras el campo no exista, Airtable rechaza la consulta de vacunas y, como ambas consultas corren juntas (`Promise.all`), **tampoco salen los recordatorios de controles**. Hay que crear el campo en Airtable y poner su ID real en `FV.alertaEnv`.

## 12. Código muerto / vestigial confirmado (sin ruta de acceso desde la UI)

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

## 13. Despliegue

- **Netlify** (`netlify.toml`) y **Vercel** (`vercel.json`): configuraciones equivalentes, sin build command (`publish='.'`), rewrite de cualquier ruta a `/index.html`, headers de seguridad básicos. Netlify además sirve `sw.js` con `Cache-Control: no-cache` y, con el cambio pendiente, declara `netlify/functions` como carpeta de funciones. **Los recordatorios por email sólo funcionan en Netlify**: Vercel no tiene equivalente configurado.
- **`manifest.json`**: PWA `standalone`, `lang:'es'`, iconos 192/512 maskable, categorías `medical`/`health`, tema claro (`theme_color #FFFFFF`, `background_color #F2F5F3`).
- **`sw.js`**: cache versionado (`pediconsultorios-v3`), estrategia network-first, precarga mínima (`/`, `/index.html`, `/manifest.json`).
- Instalación en celular: Android (Chrome → "Agregar a pantalla de inicio"), iPhone (Safari → Compartir → "Agregar a pantalla de inicio").

## 14. Resumen de riesgos y deuda técnica

1. Credenciales (Airtable, Cloudinary) expuestas en el cliente — sin backend que las oculte.
2. Sin caché/fallback offline real para Pacientes, historial clínico, Vacunas y Controles (las únicas pantallas que importan hoy).
3. ~40% del código (estimado) corresponde a módulos sin ruta de UI (sección 12) — deuda de mantenimiento y riesgo de confusión para quien no conozca esta historia.
4. Sistema de permisos por rol parcialmente inconsistente con la navegación real actual.
5. Salt fijo compartido en el hash del PIN.
6. Año 2026 escrito a mano en el calendario de vacunación y en el cálculo por paciente (sección 7.4).
7. La vista de vacunas de menores es calculada y no refleja lo registrado en Airtable (sección 7.2).
8. Schema de Airtable duplicado entre `index.html` y `netlify/functions/lib/airtable-config.mjs` (sección 11).
9. Recordatorios de vacunas pendientes de configurar en Airtable; mientras tanto también bloquean los de controles (sección 11).
10. La fusión de duplicados borra el duplicado sin reasignar sus consultas, vacunas ni controles, que quedan huérfanos (sección 10).
11. "Novedades" se guarda por dispositivo, así que no sirve todavía como canal real para el equipo (sección 8).
