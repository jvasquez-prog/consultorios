# PediConsult — Plan técnico multi-consultorio

*Escrito el 2026-10-21 contra el commit 5ea1863. Es la "Fase 0" de la estrategia de crecimiento: lo mínimo para poder venderle PediConsult a un segundo pediatra sin exponer datos de salud de menores (Ley 25.326 / 26.529).*

---

## 1. Dónde estamos

| Hoy | Problema para vender |
|---|---|
| Token de Airtable en `index.html` (línea ~1064) y repo `jvasquez-prog/consultorios` público | Cualquiera puede leer, modificar y borrar todos los pacientes |
| Una sola base (`appHMssWPjGZjPPAI`) sin noción de consultorio | Un segundo médico vería los pacientes del primero |
| PIN + TOTP + rol guardados en `localStorage` | No hay identidad real; no se puede dar de baja a nadie; "Olvidé mi PIN" no verifica nada |
| Cloudinary con preset unsigned y URLs públicas | Adjuntos clínicos accesibles para cualquiera con el link |
| Sin backups, borrados duros | Un error es irreversible; la fusión de duplicados ya deja huérfanos |
| Airtable: tope de registros por base y 5 requests/s por base | Cada paciente genera ~30 filas en VACUNAS + CONTROLES + CONSULTAS: con 20–30 médicos se llega al tope del plan y al rate limit compartido |

## 2. Decisión: migrar a Postgres (Supabase), en dos etapas

**Etapa A — contención (1–3 días, no cambia la arquitectura):** cerrar la exposición actual mientras se trabaja en la B.

**Etapa B — multi-consultorio (3–5 semanas):** Supabase (Postgres + Auth + Storage), con aislamiento por consultorio hecho por la base de datos (Row Level Security), no por el código del cliente.

Por qué Supabase y no "Airtable + proxy + campo Consultorio":

- **Aislamiento garantizado por la base:** con RLS, aunque el frontend tenga un bug, una consulta nunca devuelve filas de otro consultorio. Con Airtable el filtro lo pone nuestro proxy, y un olvido en una sola ruta filtra datos.
- **Escala y costo:** sin tope práctico de registros para este volumen, sin rate limit compartido entre clientes.
- **Auth incluida:** login por email con enlace mágico o contraseña, recuperación segura, sesiones revocables.
- **Backups diarios y restauración a un punto en el tiempo** (plan Pro, ~US$25/mes aprox. — verificar precio vigente), región São Paulo (`sa-east-1`) disponible.
- El frontend ya centraliza el acceso a datos en `apiFetch` / `apiAll` / `apiGetRecord` / `apiPost` / `apiPatch` / `apiDelete` (`index.html:1403-1450`), así que el cambio se concentra en una capa.

Alternativa descartada por ahora: una base de Airtable por consultorio. Aísla bien, pero multiplica la administración manual (crear base, copiar schema, rotar tokens por cliente) y no resuelve backups ni auth.

## 3. Etapa A — contención inmediata

1. **Rotar el PAT de Airtable** en airtable.com → Developer hub (invalida el expuesto). El nuevo **no** va en el HTML.
2. **Repo privado** en GitHub (Settings → Danger zone → Change visibility). El token viejo sigue en el historial de git: por eso el paso 1 es obligatorio, no alcanza con borrarlo.
3. **Proxy en Netlify Functions:** `netlify/functions/api.mjs` recibe `{tabla, método, id, params, fields}`, valida la tabla contra una lista blanca (`TP`, `TC`, `TV`, `TCo`) y reenvía a Airtable con `process.env.AIRTABLE_TOKEN`. El cliente cambia sólo la URL base de los 6 helpers. Reutilizar `netlify/functions/lib/airtable-client.mjs`.
4. **Proteger el proxy:** mientras no haya auth real, un secreto compartido por consultorio en un header no alcanza (queda en el cliente). Opción mínima razonable: Netlify Identity o un login básico con cookie firmada del lado de la función. Esto es transitorio hasta la Etapa B.
5. **Cloudinary firmado:** función `netlify/functions/firma-upload.mjs` que devuelve una firma; borrar el preset unsigned `mi_preset`.
6. **Export completo** de las 4 tablas a CSV + adjuntos, guardado fuera de Airtable.

## 4. Etapa B — modelo de datos

```sql
-- Un consultorio = un cliente (tenant). Un médico puede estar en más de uno.
create table consultorios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  plan text not null default 'prueba',          -- prueba | esencial | copiloto | consultorio
  prueba_hasta date,
  creado_en timestamptz not null default now()
);

create table membresias (
  consultorio_id uuid references consultorios on delete cascade,
  usuario_id uuid references auth.users on delete cascade,
  rol text not null check (rol in ('medico', 'administrativo')),
  primary key (consultorio_id, usuario_id)
);

create table perfiles (                          -- hoy en localStorage['synapsis_profile'] + ['synapsis_firma']
  usuario_id uuid primary key references auth.users on delete cascade,
  nombre text, apellido text, tratamiento text, matricula text, especialidad text,
  firma_path text                                -- en Storage privado
);

create table pacientes (
  id uuid primary key default gen_random_uuid(),
  consultorio_id uuid not null references consultorios,
  -- columnas = campos de FP (sección 5 de DOCUMENTACION_TECNICA)
  ...,
  airtable_id text unique,                       -- para la migración y la verificación
  borrado_en timestamptz,                        -- borrado lógico
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
-- consultas, vacunas, controles: misma forma, + paciente_id uuid references pacientes,
-- + consultorio_id (redundante a propósito: simplifica RLS e índices).

create table auditoria (
  id bigserial primary key,
  consultorio_id uuid not null, usuario_id uuid, tabla text, fila_id uuid,
  accion text, cambios jsonb, en timestamptz not null default now()
);
```

**Row Level Security** (una política por tabla, mismo patrón):

```sql
alter table pacientes enable row level security;

create policy "miembros del consultorio" on pacientes
  for all using (
    consultorio_id in (select consultorio_id from membresias where usuario_id = auth.uid())
  ) with check (
    consultorio_id in (select consultorio_id from membresias where usuario_id = auth.uid())
  );
```

- `borrado_en` en vez de `delete`: la app filtra `borrado_en is null`; se purga a los 30 días con un job.
- Trigger `after insert or update or delete` en las tablas clínicas → fila en `auditoria` (exigencia de trazabilidad de la Ley 26.529).
- La fusión de duplicados pasa a ser una función SQL transaccional que **reasigna** consultas/vacunas/controles antes de marcar borrado el duplicado (corrige el bug de huérfanos).
- Adjuntos y firma: Supabase Storage, bucket privado por consultorio (`{consultorio_id}/...`), URLs firmadas de vida corta. Reemplaza Cloudinary.

## 5. Etapa B — cambios en el frontend

| Área | Hoy | Después |
|---|---|---|
| Acceso a datos | 6 helpers contra `api.airtable.com`, campos por field ID (`FP.nombre` = `fld...`) | Mismos 6 helpers reescritos sobre `supabase-js`; los objetos `FP`/`FC`/`FV`/`FCo` pasan a mapear a nombres de columna, así el resto del código no cambia |
| Login | PIN local + TOTP local | Supabase Auth (enlace mágico o contraseña; TOTP de Supabase opcional). El PIN puede quedar como **bloqueo rápido de pantalla** en el dispositivo, no como identidad |
| Roles | `localStorage['synapsis_profile'].rol` | `membresias.rol`, leído del servidor; `isAdmin()` lo consulta |
| Perfil y firma | `localStorage` por dispositivo | Tabla `perfiles` + Storage: el médico la carga una vez y la ve en todos sus dispositivos |
| Alta de cliente | No existe | Pantalla de registro: email → crea `consultorio` en plan `prueba` (30 días) + membresía `medico` + paciente de ejemplo |
| `supabase-js` | — | Incluido en `vendor/` como jsPDF (sin CDN) |

Aprovechar el corte para **no migrar el código muerto** (sección 12 de la doc técnica: Cirugías, Stock, Dashboard, Pase de guardia, tabla unificada, tablas clínicas de Synapsis). Reduce ~40 % del script.

## 6. Recordatorios por email

`netlify/functions/enviar-recordatorios.mjs` pasa a consultar Supabase con la `service_role` key (variable de entorno, nunca en el cliente), recorriendo **todos** los consultorios y firmando cada email con el nombre del consultorio. Agregar `recordatorio_enviado_en` en vacunas/controles (reemplaza el checkbox "Alerta Enviada" que hoy falta). Esto resuelve también el pendiente `fldTODO_ALERTA_ENVIADA_VACUNAS`.

## 7. Migración de los datos actuales

1. Script Node (`scripts/migrar-airtable.mjs`, una sola vez): lee las 4 tablas con el token nuevo, crea el consultorio actual, inserta pacientes guardando `airtable_id`, luego consultas/vacunas/controles resolviendo el link de paciente por `airtable_id`. Descarga adjuntos de Cloudinary y los sube a Storage.
2. Verificación: conteos por tabla iguales; 20 pacientes al azar comparados campo por campo.
3. Corte: un fin de semana. Airtable queda en sólo lectura 30 días como respaldo y después se archiva.

## 8. Orden de trabajo y estimación

| # | Tarea | Estimación |
|---|---|---|
| A1–A6 | Contención (sección 3) | 1–3 días |
| B1 | Proyecto Supabase, schema, RLS, auditoría, tests de aislamiento (dos usuarios de distintos consultorios no se ven) | 4–5 días |
| B2 | Reescribir los 6 helpers + mapas de campos | 3–4 días |
| B3 | Auth, registro con prueba de 30 días, perfil/firma en servidor | 3–4 días |
| B4 | Storage para adjuntos y firma | 1–2 días |
| B5 | Fusión transaccional, borrado lógico | 1–2 días |
| B6 | Recordatorios multi-consultorio | 1 día |
| B7 | Script de migración + verificación + corte | 2–3 días |
| B8 | Quitar el año 2026 fijo (`computePediatricVacSchedule`, calendario) | 0,5 día |
| — | Legal en paralelo: inscripción en el Registro de Bases de Datos (AAIP), términos y condiciones, política de privacidad, acuerdo de encargado de tratamiento con cada médico | — |

**Criterio de salida de la Fase 0:** 5 pilotos usando la app 2 semanas sin incidentes, test de aislamiento entre consultorios pasando, backup restaurado al menos una vez en un entorno de prueba.

## 9. Decisiones abiertas

- ¿Enlace mágico o contraseña como login principal? (El enlace mágico evita contraseñas débiles; la contraseña funciona mejor si el médico usa la app en una PC compartida del consultorio.)
- ¿Se mantiene Vercel o se consolida todo en Netlify? (Las funciones sólo están en Netlify.)
- ¿Se cobra por consultorio o por profesional? Afecta si `plan` vive en `consultorios` o en `membresias`.
