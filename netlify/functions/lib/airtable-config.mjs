// Subset del schema de Airtable usado por la función de recordatorios.
// Copiado a propósito de index.html (líneas 958-1094) — no hay build ni módulo
// compartido entre el script inline del HTML y las funciones de Netlify.
// Si el schema cambia en Airtable (se agrega/renombra un campo), hay que
// actualizar ambos lugares a mano.

export const BASE = process.env.AIRTABLE_BASE || 'appHMssWPjGZjPPAI';

// PACIENTES
export const TP = 'tblnWNriph6YVs9Xf';
export const FP = {
  nombre:     'fldsbGgsJEgJ6EvL4', // Apellido y Nombre
  tutor:      'fldwd4QqGsRDjd1ws', // Nombre Tutor
  emailTutor: 'fldMC6VTOME3FAjab', // Email Tutor
  estado:     'fldGEdvUv0js29ocP', // Estado
};

// VACUNAS
export const TV = 'tblhxDVxzcYcvLeF2';
export const FV = {
  vacuna:    'fldfQlqvtmIKdzSEn', // Vacuna
  paciente:  'fldejAVX0MN6i8NH9', // Paciente (link)
  edadInd:   'flda95fNRsqSlLJLq', // Edad Indicada
  fechaProg: 'fld1DWb8lFSK2ZbGu', // Fecha Programada
  aplicada:  'fldErmKVMpcY5TQ3n', // Aplicada (checkbox)
  // TODO: completar con el field ID real después de crear el campo checkbox
  // "Alerta Enviada" en la tabla VACUNAS de Airtable (paso 2 del plan de
  // implementación — mismo patrón que ya existe en CONTROLES).
  alertaEnv: 'fldTODO_ALERTA_ENVIADA_VACUNAS',
};

// CONTROLES
export const TCo = 'tblmAshZwnYkC3R2b';
export const FCo = {
  tipo:      'fldeGrB1ajh3mPMWd', // Tipo de Control
  paciente:  'fldJIlhw5jrsman5h', // Paciente (link)
  edad:      'fldA6MIPmnzFZy1Zw', // Edad Objetivo
  fechaProg: 'fldvwaQN1q1GVoyHz', // Fecha Programada
  realizado: 'fldv47g3aLd8KMJA8', // Realizado (checkbox)
  alertaEnv: 'fldz2SW9OTkCgYZwH', // Alerta Enviada (checkbox) — ya existe
};

// Criterio de "paciente activo" — mismo que usa index.html para no inventar
// una regla nueva de negocio.
export function esPacienteActivo(estado) {
  return estado === 'Activo' || estado === 'En seguimiento';
}
