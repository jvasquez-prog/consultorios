// Envío de emails vía la REST API de Resend (https://resend.com/docs/api-reference/emails/send-email).
// Sin SDK — un solo fetch, consistente con el resto del proyecto (sin build,
// sin dependencias npm).

function formatFecha(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function labelItem(item) {
  const fecha = formatFecha(item.fechaProg);
  return item.tipo === 'vacuna'
    ? `Vacuna: <strong>${item.nombre}</strong> — programada para el ${fecha}`
    : `Control: <strong>${item.nombre}</strong> — programado para el ${fecha}`;
}

// Manda un único email agrupando todos los items pendientes de un paciente.
// `items`: [{ tipo: 'vacuna'|'control', nombre, fechaProg }]
export async function enviarEmailRecordatorio({ to, nombreTutor, nombrePaciente, items }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey) throw new Error('Falta la variable de entorno RESEND_API_KEY');
  if (!from) throw new Error('Falta la variable de entorno EMAIL_FROM');

  const saludo = nombreTutor ? `Hola ${nombreTutor},` : 'Hola,';
  const listaHtml = items.map(it => `<li>${labelItem(it)}</li>`).join('');
  const html = `
    <p>${saludo}</p>
    <p>Te recordamos que ${nombrePaciente} tiene lo siguiente próximo a vencer:</p>
    <ul>${listaHtml}</ul>
    <p>Ante cualquier duda, comunicate con el consultorio.</p>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Recordatorio: próxima(s) vacuna(s)/control(es) de ${nombrePaciente}`,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend falló (${res.status}): ${await res.text()}`);
  }
  return res.json();
}
