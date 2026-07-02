# Guía de pruebas funcionales y de experiencia de usuario — PediConsult

Esta guía sirve para hacer una sesión de pruebas con el cliente (el médico o quien vaya a usar la app en el día a día), relevar bugs reales de uso y validar que la experiencia sea la esperada. Está pensada para leerse casi como un guion: pedile al usuario que haga cada acción él mismo (no se la hagas vos), y anotá lo que pasa.

## Antes de empezar

- **Probá en los dispositivos reales que usa el cliente** — como mínimo notebook/PC y el celular que usa a diario. Varios problemas (por ejemplo, el reconocimiento de voz) se comportan distinto según el dispositivo.
- **Usá pacientes de prueba, no reales.** Cargá 2-3 pacientes ficticios al arrancar y bórralos al final, para no ensuciar la base real con datos de prueba (ya pasó una vez en este proyecto).
- **Anotá todo en el momento**, no de memoria al final — los detalles de un bug (qué se dijo, qué campo falló) se pierden rápido.
- Tené a mano el [template de reporte de bug](#template-de-reporte-de-bug) para cada problema que aparezca.
- Repetí las pruebas de voz **al menos una vez en notebook y una vez en celular** — no asumas que si anda en uno anda en el otro.

---

## 1. Acceso y perfil

| # | Acción | Resultado esperado |
|---|--------|---------------------|
| 1.1 | Abrir la app por primera vez (o después de borrar datos del sitio) | Pide crear un PIN de 4 dígitos, dos veces para confirmar |
| 1.2 | Cerrar la app y volver a abrirla | Pide el PIN ya creado, no vuelve a pedir crear uno |
| 1.3 | Ingresar el PIN incorrecto 3 veces | Muestra algún tipo de error/aviso razonable, no rompe la app |
| 1.4 | Tocar "Olvidé mi PIN" | Permite crear un PIN nuevo sin perder los pacientes cargados |
| 1.5 | Tocar el avatar (arriba a la derecha) → cargar nombre/apellido y elegir rol | Se guarda y se refleja el nombre en el avatar (iniciales) |
| 1.6 | Cerrar sesión (candado 🔒) y volver a entrar | Pide el PIN de nuevo |

---

## 2. Pacientes — carga manual

| # | Acción | Resultado esperado |
|---|--------|---------------------|
| 2.1 | Ir a "Pacientes" → tocar **+** → completar todos los campos a mano → Guardar | El paciente aparece en la lista con todos los datos, sin "Sin nombre" ni campos vacíos que se hayan cargado |
| 2.2 | Buscar ese paciente por nombre, por DNI y por obra social | Aparece en los 3 casos |
| 2.3 | Filtrar por estado (Activo/Alta) | La lista se filtra correctamente |
| 2.4 | Abrir el paciente, editar un campo (ej. teléfono), Guardar cambios | El cambio queda guardado — cerrá la app y volvé a abrir la ficha para confirmar que **no se revirtió** |
| 2.5 | Adjuntar un archivo (foto o PDF) a un paciente | El archivo queda visible en la ficha |
| 2.6 | Intentar crear un paciente con el mismo DNI o nombre que uno ya existente | Debería avisar de posible duplicado, con opción de editar el existente o crear igual |

---

## 3. Carga por voz — "Hablar libremente"

**Repetir esta sección completa en notebook Y en celular.**

| # | Acción | Resultado esperado |
|---|--------|---------------------|
| 3.1 | Tocar "🎤 Hablar libremente" y dictar de corrido todos los datos de un paciente ficticio (nombre, edad, DNI, obra social, domicilio, tutor, teléfono, email, diagnóstico) sin decir el nombre de cada campo | Al terminar, aparecen en verde la mayoría de los campos detectados correctamente |
| 3.2 | Decir el DNI en grupos ("cuarenta, ciento veintitrés, cuatrocientos cincuenta y seis") en vez de todo junto | El DNI se arma completo igual |
| 3.3 | Decir el email deletreado ("juan punto perez arroba gmail punto com") | El email se arma con el formato correcto (con @ y puntos reales) |
| 3.4 | Decir el nombre del tutor seguido de "teléfono" y el número (ej. "mamá Ana Gómez teléfono 11 2233 4455") | El campo Tutor queda sólo con el nombre, sin la palabra "teléfono" pegada |
| 3.5 | Terminar el dictado diciendo la palabra **"listo"** (sin tocar el botón) | El dictado se corta y procesa igual que si tocaras "■ Listo" |
| 3.6 | Terminar el dictado tocando el botón "■ Listo" | Mismo resultado que el punto anterior |
| 3.7 | **[Específico celular]** Dictar una frase larga (15-20 segundos seguidos) | Revisar con atención que **ninguna palabra se repita duplicada o triplicada** en el texto reconocido |
| 3.8 | Con algún campo sin detectar, tocar "🎤 Seguir dictando" y decir sólo lo que falta | Los campos ya cargados **no se borran ni se pisan**, sólo se completa lo nuevo |
| 3.9 | Tocar la ✕ de una de las chips verdes (campo detectado) | Ese campo se vacía en el formulario, sin afectar los demás |
| 3.10 | Abrir un paciente **ya existente** para editarlo, corregir un solo dato por voz (ej. el teléfono), Guardar cambios | Se guarda sólo el cambio — el resto de los datos del paciente siguen intactos al reabrirlo |
| 3.11 | Tocar "Guardar cambios" **inmediatamente** después de decir "listo" (sin esperar) | Debería aparecer un aviso de "terminando de procesar..." y guardar solo, sin necesidad de tocar el botón una segunda vez |

---

## 4. Carga por voz — "Dictado guiado"

| # | Acción | Resultado esperado |
|---|--------|---------------------|
| 4.1 | Iniciar el dictado guiado y responder cada pregunta (incluye nombre, DNI, sexo, fecha de nacimiento, obra social, domicilio, tutor, teléfono, diagnóstico, antecedentes, notas) | Recorre los 11 campos sin saltarse ninguno |
| 4.2 | En la pregunta de fecha de nacimiento, responder con números en palabras ("quince de marzo de dos mil veintidós") | La fecha se carga correctamente en el campo |
| 4.3 | En la pregunta de sexo, responder "masculino" o "femenino" | Se selecciona la opción correcta |
| 4.4 | En cualquier pregunta, decir "omitir" | Salta ese campo y sigue con el siguiente |
| 4.5 | Dejar pasar varios segundos sin decir nada en una pregunta | Después de un rato razonable, la app debería seguir sola al siguiente campo en vez de quedarse trabada esperando para siempre |
| 4.6 | Cancelar el dictado guiado a mitad de camino (✕) | Los campos completados hasta ese momento quedan guardados en el formulario |

---

## 5. Vacunas

| # | Acción | Resultado esperado |
|---|--------|---------------------|
| 5.1 | Ir a "Vacunas" → elegir un paciente del desplegable | Aparece la lista de vacunas que le corresponden en 2026, con fecha estipulada y tiempo restante (o "atrasada") |
| 5.2 | Elegir un paciente sin fecha de nacimiento cargada | Muestra un aviso claro en vez de romper o mostrar datos incorrectos |
| 5.3 | Revisar la lista general de "Vacunas pendientes" (debajo del selector) | Coincide con lo cargado manualmente en esa tabla, si la usan |

## 6. Controles

| # | Acción | Resultado esperado |
|---|--------|---------------------|
| 6.1 | Ir a "Controles" → elegir un paciente recién nacido (fecha de nacimiento reciente) | Muestra los controles a los 7/14/30 días y los mensuales según corresponda |
| 6.2 | Elegir un paciente de más de 4 años | Muestra controles anuales, no mensuales |

## 7. Calendario

| # | Acción | Resultado esperado |
|---|--------|---------------------|
| 7.1 | Ir a la solapa "Calendario" | Se ve la tabla completa del Calendario Nacional de Vacunación 2026, con la fuente citada abajo |
| 7.2 | Tocar el link de la fuente (Ministerio de Salud) | Abre la página oficial en una pestaña nueva |

---

## 8. Instalación y uso sin conexión

| # | Acción | Resultado esperado |
|---|--------|---------------------|
| 8.1 | En el celular, agregar la app a la pantalla de inicio (Android: menú ⋮ → "Añadir a pantalla de inicio" / iPhone: Compartir → "Añadir a pantalla de inicio") | Queda un ícono como cualquier app instalada |
| 8.2 | Abrir la app instalada, activar modo avión, navegar entre pantallas | Sigue mostrando los últimos datos cargados, sin pantalla en blanco |
| 8.3 | Desactivar el modo avión | La app se sincroniza sola con los datos más recientes |
| 8.4 | Si alguna vez ves la app "vieja" o le faltan funciones nuevas | Probar `Ctrl+Shift+R` (recarga forzada) antes de reportarlo como bug — puede ser caché del navegador |

---

## 9. "Mi perfil" y ayuda

| # | Acción | Resultado esperado |
|---|--------|---------------------|
| 9.1 | Entrar a "Mi perfil" | El desplegable de Rol sólo muestra Médico y Administrativo |
| 9.2 | Tocar el ícono 🩺 (arriba a la derecha) → "¿Cómo funciona PediConsult?" | El contenido describe las funciones reales de la app, en lenguaje simple |

---

## Template de reporte de bug

Copiá este bloque por cada problema encontrado:

```
Fecha:
Dispositivo y navegador: (ej. iPhone 13, Safari / Notebook Windows, Chrome)
Pantalla/función: (ej. Hablar libremente, Vacunas, Editar paciente)
Pasos para reproducirlo:
  1.
  2.
  3.
Qué esperabas que pasara:
Qué pasó en realidad:
¿Se repite siempre o sólo a veces?:
Captura de pantalla o grabación (si se puede):
```

## Registro de la sesión

```
Fecha de la sesión:
Quién probó:
Dispositivos usados:
Duración:
Cantidad de bugs encontrados:
Observaciones generales de experiencia de uso (qué se sintió lento, confuso, o que no cerraba con lo que esperaba):
```
