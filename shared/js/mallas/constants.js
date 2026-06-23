/** Constantes compartidas del módulo de mallas curriculares. */

export const PAGE_SIZE = 4;
export const MAX_CYCLES = 14;
export const STORAGE_KEY = 'usil_mallas_v1';

export const MODALIDAD_LABEL = {
  presencial: 'PRESENCIAL',
  hibrido: 'HÍBRIDO',
  virtual: 'VIRTUAL'
};

/** Valores del wizard → clave interna para tags/iconos. */
export const MODALIDAD_MAP = {
  Presencial: 'presencial',
  Virtual: 'virtual',
  Semipresencial: 'hibrido'
};

/** Clave interna → etiqueta legible en resumen. */
export const MODALIDAD_DISPLAY = {
  presencial: 'Presencial',
  hibrido: 'Semipresencial',
  virtual: 'Virtual'
};

export const PERIODO_REGEX = /^\d{4}-0[12]$/;

export const FORMAT_COLUMNS = [
  { label: 'Ciclo', status: 'ok' },
  { label: 'Orden', status: 'ok' },
  { label: 'Código', status: 'ok' },
  { label: 'Nombre Curso', status: 'ok' },
  { label: 'Condición', status: 'ok' },
  { label: 'Créditos', status: 'ok' },
  { label: 'Teoría / Práctica / Lab', status: 'ok' },
  { label: 'Prerrequisito', status: 'opt' },
  { label: 'Clasif. SUNEDU', status: 'ok' },
  { label: 'Mención', status: 'na' },
  { label: 'Créd. Mín.', status: 'ok' }
];

export const COND_OPTS = ['Obligatorio', 'Electivo'];
export const SUNEDU_OPTS = ['General', 'Específico'];
