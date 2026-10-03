// Netlify Scheduled Function — corre todos los días a las 12:00 UTC (09:00 ART).
// Busca vacunas/controles pendientes con Fecha Programada dentro de los
// próximos 3 días y manda un email de recordatorio al tutor de cada paciente.
// Ver el plan de implementación completo para el diseño y los trade-offs:
// /home/javier/.claude/plans/ethereal-tickling-puddle.md

import { TP, FP, TV, FV, TCo, FCo, esPacienteActivo } from './lib/airtable-config.mjs';
import { airtableList, airtableGetByIds, airtablePatchOne } from './lib/airtable-client.mjs';
import { enviarEmailRecordatorio } from './lib/email-client.mjs';

// Ventana [hoy, hoy+3] inclusive. Combinada con el flag "Alerta Enviada" (no
// sólo la fecha exacta) para que un día de cron perdido se recupere solo al
// día siguiente sin duplicar avisos, y para tolerar un "Run now" manual sin
// reenviar a quien ya fue notificado.
function formulaPendientes(campoHecho, campoAlerta, campoFecha) {
  return `AND(
    {${campoHecho}} = FALSE(),
    {${campoAlerta}} = FALSE(),
    IS_AFTER({${campoFecha}}, DATEADD(TODAY(), -1, 'days')),
    IS_BEFORE({${campoFecha}}, DATEADD(TODAY(), 4, 'days'))
  )`;
}

function agregarItem(porPaciente, tipo, record, campos, nombreCampo) {
  const pacienteId = record.fields[campos.paciente]?.[0];
  if (!pacienteId) return;
  if (!porPaciente.has(pacienteId)) porPaciente.set(pacienteId, []);
  porPaciente.get(pacienteId).push({
    tipo,
    tabla: tipo === 'vacuna' ? TV : TCo,
    recordId: record.id,
    campoAlerta: campos.alertaEnv,
    nombre: record.fields[nombreCampo] || (tipo === 'vacuna' ? 'Vacuna' : 'Control'),
    fechaProg: record.fields[campos.fechaProg],
  });
}

export default async () => {
  const summary = { vacunas: 0, controles: 0, emailsEnviados: 0, emailsFallidos: 0, pacientesSinEmail: [] };

  try {
    const [vacunas, controles] = await Promise.all([
      airtableList(
        TV,
        formulaPendientes('Aplicada', 'Alerta Enviada', 'Fecha Programada'),
        [FV.paciente, FV.vacuna, FV.fechaProg]
      ),
      airtableList(
        TCo,
        formulaPendientes('Realizado', 'Alerta Enviada', 'Fecha Programada'),
        [FCo.paciente, FCo.tipo, FCo.fechaProg]
      ),
    ]);
    summary.vacunas = vacunas.length;
    summary.controles = controles.length;

    if (vacunas.length === 0 && controles.length === 0) {
      console.log('[recordatorios] nada pendiente hoy', summary);
      return;
    }

    const porPaciente = new Map();
    vacunas.forEach(r => agregarItem(porPaciente, 'vacuna', r, FV, FV.vacuna));
    controles.forEach(r => agregarItem(porPaciente, 'control', r, FCo, FCo.tipo));

    const pacienteIds = [...porPaciente.keys()];
    const pacientes = await airtableGetByIds(TP, pacienteIds, [FP.nombre, FP.tutor, FP.emailTutor, FP.estado]);
    const pacientesById = new Map(pacientes.map(p => [p.id, p]));

    for (const [pacienteId, items] of porPaciente) {
      const paciente = pacientesById.get(pacienteId);
      if (!paciente) {
        console.warn(`[recordatorios] paciente ${pacienteId} no encontrado, se omite`);
        continue;
      }

      const estado = paciente.fields[FP.estado];
      if (!esPacienteActivo(estado)) {
        console.warn(`[recordatorios] paciente ${pacienteId} no activo (${estado}), se omite`);
        continue;
      }

      const email = paciente.fields[FP.emailTutor];
      const nombrePaciente = paciente.fields[FP.nombre] || 'el paciente';
      if (!email) {
        console.warn(`[recordatorios] paciente ${pacienteId} (${nombrePaciente}) sin emailTutor — no se puede avisar`);
        summary.pacientesSinEmail.push(nombrePaciente);
        continue;
      }

      try {
        await enviarEmailRecordatorio({
          to: email,
          nombreTutor: paciente.fields[FP.tutor],
          nombrePaciente,
          items,
        });
        for (const item of items) {
          await airtablePatchOne(item.tabla, item.recordId, { [item.campoAlerta]: true });
        }
        summary.emailsEnviados++;
      } catch (err) {
        console.error(`[recordatorios] fallo enviando a ${email} (paciente ${pacienteId}):`, err.message);
        summary.emailsFallidos++;
      }
    }
  } catch (err) {
    console.error('[recordatorios] error fatal:', err);
  } finally {
    console.log('[recordatorios] resumen:', JSON.stringify(summary));
  }
};

export const config = { schedule: '0 12 * * *' };
