# PediConsult — Manual de usuario

**Última actualización:** 2026-07-22

Este manual describe únicamente lo que hoy se puede hacer desde la app. Se actualizó a partir de una revisión completa del funcionamiento actual, así que si en algún momento leíste una versión anterior de este documento y algo no coincide, valen los pasos de acá.

---

## ¿Qué es PediConsult?

Es la app para llevar el consultorio pediátrico: los datos de cada paciente, cuándo le toca cada vacuna y cuándo le toca el próximo control. Se puede cargar todo hablando, sin tipear. Funciona desde el celular, la tablet o la computadora, sin instalar nada especial — es un sitio web que también se puede "instalar" como si fuera una app (ver más abajo).

## Primer acceso

1. **Creá un PIN de 4 dígitos.** Te lo va a pedir dos veces para confirmar. Ese PIN te lo va a volver a pedir cada vez que entres.
2. **Si olvidás el PIN**, tocá "Olvidé mi PIN" en la pantalla de acceso. Se borra el PIN (y podés crear uno nuevo) — los pacientes cargados **no se pierden**.
3. **Tu perfil**: tocando tu avatar (arriba a la derecha) cargás tu nombre y elegís tu rol: **Médico** (acceso completo, incluidas las herramientas de administración) o **Administrativo** (para quien ayuda con la carga de datos, sin esas herramientas). Por defecto el rol es Médico.
4. **Cerrar sesión**: tocá el candado 🔒 en la esquina superior derecha.

### Seguridad extra: verificación en dos pasos (2FA)

Desde "Mi Perfil" podés activar un segundo paso de seguridad además del PIN, usando una app autenticadora (Google Authenticator, Authy, o similar) en tu celular. Una vez activado, además del PIN te va a pedir un código de 6 dígitos que cambia cada 30 segundos. Es opcional, y lo podés desactivar cuando quieras desde el mismo lugar.

---

## Pantalla principal (Home)

Muestra cuántos pacientes tenés cargados y accesos directos a Pacientes, Vacunas, Controles, y un botón para cargar un paciente nuevo directamente.

---

## Pacientes

Acá está la ficha de cada chico: datos personales, del padre/madre/tutor, obra social, diagnóstico y antecedentes.

- **Buscá** por nombre, DNI u obra social.
- **Filtrá** por estado: Activo o Alta.
- Tocá **+** para cargar un paciente nuevo, o abrí cualquier ficha para editarla.
- **Adjuntá** estudios, análisis o cualquier archivo (JPG, PNG, PDF, DOC) directamente desde el formulario — se pueden subir varios a la vez, y los archivos anteriores nunca se borran al agregar nuevos.

### Carga por voz

En vez de tipear, podés tocar el micrófono y decir los datos en voz alta. Hay dos formas:

#### 🎤 "Decir los datos, uno seguido del otro"

Decís todos los datos seguidos, sin necesidad de nombrar cada campo para los datos más simples (ej. *"Javier Vasquez, doce años, DNI 12345678, OSDE"*), aunque para algunos conviene nombrar el dato antes de decirlo (ver consejos más abajo). Al terminar (decís **"listo"** o tocás "■ Listo"):

- Los campos que se cargaron bien aparecen en **chips verdes**. Cada chip tiene:
  - ✕ para borrarlo.
  - 🎤 para **redictar solo ese campo**, sin tener que repetir todo de nuevo.
- Los campos que faltan aparecen como píldoras tocables — tocá el 🎤 de cualquiera para dictar justo ese dato.
- Si la app escuchó algo para un campo pero no lo pudo interpretar (por ejemplo, un email mal deletreado), aparece un **aviso amarillo** con lo que se escuchó — tocalo para redictar ese campo puntual, en vez de que el dato se pierda en silencio.

#### Dictado guiado

La app te pregunta campo por campo y vos respondés de a uno. Es más lento pero más ordenado — y después de cada respuesta **te repite lo que entendió y te pregunta si es correcto**, para que corrijas ahí mismo si escuchó mal, sin tener que darte cuenta recién al final.

- Respondé "sí" o "no" por voz, o usá los botones **✔ Confirmar** / **🔁 Corregir** en pantalla.
- Si decís "no" dos veces seguidas para el mismo campo, la app deja de insistir por voz, resalta el campo y seguís completándolo a mano — no te deja trabado repitiendo lo mismo sin avanzar.
- En cualquier pregunta podés decir **"omitir"** para saltarla.

**⚙ Elegir campos**: si sentís que el dictado guiado pregunta demasiadas cosas, tocá "⚙ Elegir campos" (al lado del botón de dictado guiado) y elegí solo los que querés que te pregunte (por ejemplo, únicamente DNI, Fecha de nacimiento y Sexo — los datos donde más ayuda la confirmación). El resto de los campos completalos a mano o con "Decir los datos, uno seguido del otro". Tu elección queda guardada en el dispositivo para la próxima vez; podés cambiarla cuando quieras, o tocar "Restablecer" para volver a que pregunte todos.

### Consejos para que te entienda mejor

- Hablá despacio y claro, sin apurarte.
- Antes de empezar, fijate que el micrófono esté habilitado para esta app en tu navegador.
- Para el DNI, teléfono, domicilio y fecha de nacimiento, nombrá el dato antes de decirlo: *"DNI 40123456"*, *"teléfono 11 2233 4455"*, *"domicilio Mitre 450"*, *"fecha de nacimiento 15 de marzo de 2022"*.
- Para el email, deletrealo con las palabras "arroba", "punto" y "guion" en vez de los símbolos: *"correo electrónico juan punto pérez arroba gmail punto com"*.
- Encadená los datos sin pausas largas — una pausa larga puede cortar la escucha.

### Pacientes duplicados

Si al crear un paciente nuevo la app detecta que ya existe uno con el mismo DNI o un nombre muy parecido, te avisa antes de guardar y te deja elegir entre **editar el paciente existente** o **crear uno nuevo igual** (por si son dos personas distintas con datos parecidos).

---

## Vacunas

Elegís un paciente de la lista y la app calcula, según su fecha de nacimiento, qué vacunas le corresponden según el esquema pediátrico habitual (BCG y Hepatitis B al nacer, y luego a los 2, 4, 6, 12, 15 y 18 meses, a los 5 años y a los 11 años), con la fecha estimada y cuánto tiempo le queda — o si ya está atrasada. Más abajo también está la lista general de vacunas pendientes de todos los pacientes, tal como está cargada en el sistema.

> Una vacuna se marca "Atrasada" apenas pasa un día de su fecha estimada — no hay margen de tolerancia adicional.

## Controles

Igual que Vacunas, pero para los controles médicos de rutina. La app calcula los controles esperados según la edad:

- A los 7, 14 y 30 días de vida.
- Mensual durante el primer año.
- Cada 3 meses entre 1 y 2 años.
- Cada 6 meses entre 2 y 4 años.
- Anual de los 5 a los 12 años.

## Calendario

La tabla completa y oficial del Calendario Nacional de Vacunación 2026 del Ministerio de Salud, para consultar cualquier duda puntual sobre una vacuna. Es solo de consulta, no interactúa con los pacientes cargados.

---

## Herramientas de administración (rol Médico)

Desde "Mi Perfil", con rol Médico ves además una sección de administración:

- **🔍 Detectar y fusionar duplicados**: revisa todos los pacientes buscando posibles duplicados (mismo DNI o nombre muy parecido) y te deja fusionarlos de a uno o todos de una vez. Al fusionar, los datos que falten en el registro que queda se completan con los del duplicado.
- **📖 Diccionario de diagnósticos**: te deja agregar sinónimos propios para que ciertos términos de diagnóstico se reconozcan siempre de la misma forma.
- **⚙️ Gestionar permisos de roles**: te deja restringir qué puede ver o editar cada rol en algunas secciones. Hoy afecta únicamente a las pantallas de Pacientes y Vacunas.

> Nota: el botón "🔀 Regenerar tabla unificada" que ves en este panel no está operativo por ahora — si lo tocás vas a ver un aviso de error; no representa un problema con tus datos.

---

## Uso sin conexión e instalación en el celular

Si perdés señal, la app sigue mostrando la última pantalla que tenías abierta, pero **Pacientes, Vacunas y Controles necesitan conexión para traer datos actualizados** — no guardan una copia offline completa todavía.

**Instalar como app:**
- **Android (Chrome)**: menú (3 puntos) → "Agregar a pantalla de inicio".
- **iPhone (Safari)**: botón compartir → "Agregar a pantalla de inicio".

Si en algún momento la app se ve "vieja" o le faltan funciones nuevas, probá primero una recarga forzada (`Ctrl+Shift+R` en notebook, o cerrar y reabrir en el celular) antes de reportarlo como un problema — suele ser caché del navegador.
