# Synapsis PWA — Deploy en Vercel

## Archivos incluidos

```
synapsis/
├── index.html      ← App principal
├── manifest.json   ← Configuración PWA
├── sw.js           ← Service Worker (offline básico)
├── vercel.json     ← Configuración Vercel
└── README.md       ← Este archivo
```

> **Nota:** Los íconos (icon-192.png, icon-512.png) no están incluidos.
> Podés generarlos en https://favicon.io o usar cualquier imagen PNG.

---

## Deploy local (desarrollo / testing)

Es una PWA sin build ni dependencias de npm: alcanza con `index.html` + `manifest.json` + `sw.js`. Pero **no la abras haciendo doble clic** (protocolo `file://`) — el dictado por voz (Web Speech API) y el Service Worker sólo funcionan servidos por `http://localhost` o `https`.

### Opción A — Python (ya viene instalado en Linux/Mac)

```bash
cd red_consultorios_pediatricos/
python3 -m http.server 8000
```

Abrí http://localhost:8000

### Opción B — Node (npx serve)

```bash
npx serve -l 8000
```

### Opción C — VS Code, extensión "Live Server"

Clic derecho sobre `index.html` → **"Open with Live Server"**

### ⚠️ Ojo: apunta a la base de Airtable de producción

El `TOKEN` y el `BASE` de Airtable están hardcodeados en `index.html` (cerca de la línea 960) y son los mismos que usa la app real. Cualquier paciente que cargues probando en local **se guarda en la base de datos real**, no en un sandbox. Si vas a testear cargas, considerá duplicar la base en Airtable y pisar `TOKEN`/`BASE` temporalmente en tu copia local antes de probar.

---

## Pasos para deployar en Vercel

### Opción A — Desde GitHub (recomendada)

1. Creá un repositorio en GitHub (puede ser privado)
2. Subí todos los archivos de esta carpeta al repo
3. Entrá a https://vercel.com y logueate
4. Clic en **"Add New Project"**
5. Importá tu repositorio de GitHub
6. Dejá toda la configuración por defecto y clic en **"Deploy"**
7. En 30 segundos tenés tu URL pública (ej: `synapsis.vercel.app`)

### Opción B — Desde Vercel CLI

```bash
npm install -g vercel
cd synapsis/
vercel
```

Seguís las instrucciones en pantalla y obtenés la URL.

---

## Instalar como app en el celular

### Android (Chrome)
1. Abrí la URL en Chrome
2. Menú (3 puntos) → "Agregar a pantalla de inicio"
3. La app aparece como ícono en el home

### iPhone (Safari)
1. Abrí la URL en Safari (no Chrome)
2. Botón compartir → "Agregar a pantalla de inicio"
3. La app aparece como ícono en el home

---

## Seguridad

El token de Airtable está embebido en el HTML.
Para mayor seguridad en producción, considerá:
- Crear un token con permisos mínimos (solo la base Synapsis)
- Migrar a un backend propio que maneje el token server-side

---

## Soporte

Proyecto desarrollado para el Servicio de Neurocirugía Pediátrica
Hospital de Niños de La Plata — 2026
# consultorios
# consultorios
