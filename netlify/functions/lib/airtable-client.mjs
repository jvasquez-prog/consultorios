// Cliente mínimo de la REST API de Airtable para la función de recordatorios.
// Mismo patrón que ya usa index.html (apiFetch/apiPatch con
// returnFieldsByFieldId=true y fields keyeados por field ID) — pero con su
// propio token, leído de una variable de entorno server-side, nunca del
// código fuente ni del cliente.

import { BASE } from './airtable-config.mjs';

function authHeaders() {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error('Falta la variable de entorno AIRTABLE_TOKEN');
  return { Authorization: `Bearer ${token}` };
}

// Lista todos los records de `table` que matchean `formula`, trayendo sólo
// los `fieldIds` pedidos (paginando hasta agotar `offset`).
export async function airtableList(table, formula, fieldIds) {
  const records = [];
  let offset;
  do {
    const params = new URLSearchParams({
      filterByFormula: formula,
      pageSize: '100',
      returnFieldsByFieldId: 'true',
    });
    fieldIds.forEach(f => params.append('fields[]', f));
    if (offset) params.append('offset', offset);

    const url = `https://api.airtable.com/v0/${BASE}/${table}?${params}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) {
      throw new Error(`Airtable list ${table} falló (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

// Trae records puntuales por ID, agrupando en OR(RECORD_ID()=...) de a
// `chunkSize` para no exceder el largo máximo de URL en un GET.
export async function airtableGetByIds(table, ids, fieldIds, chunkSize = 40) {
  const out = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const formula = `OR(${chunk.map(id => `RECORD_ID()='${id}'`).join(',')})`;
    out.push(...await airtableList(table, formula, fieldIds));
  }
  return out;
}

// Actualiza un único record. `fields` va keyeado por field ID (igual que
// apiPatch() en index.html), ej. { [FCo.alertaEnv]: true }.
export async function airtablePatchOne(table, id, fields) {
  const url = `https://api.airtable.com/v0/${BASE}/${table}/${id}?returnFieldsByFieldId=true`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    throw new Error(`Airtable patch ${table}/${id} falló (${res.status}): ${await res.text()}`);
  }
  return res.json();
}
