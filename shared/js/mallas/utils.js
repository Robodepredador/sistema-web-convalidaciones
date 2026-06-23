import { MODALIDAD_MAP, MODALIDAD_DISPLAY } from './constants.js';

/** Escapa HTML para prevenir XSS al inyectar en innerHTML. */
export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
}

/** Convierte valor del radio del wizard a clave interna (presencial|hibrido|virtual). */
export function normalizeModalidad(value) {
  if (!value) return '';
  const lower = String(value).toLowerCase();
  if (lower === 'presencial' || lower === 'virtual' || lower === 'hibrido') return lower;
  return MODALIDAD_MAP[value] || lower;
}

/** Etiqueta legible para resumen y cabecera. */
export function modalidadLabel(keyOrWizardValue) {
  const key = normalizeModalidad(keyOrWizardValue);
  return MODALIDAD_DISPLAY[key] || keyOrWizardValue || '—';
}

/** Formatea versión con prefijo v si no lo tiene. */
export function formatVersion(version) {
  if (!version) return '—';
  const v = String(version).trim();
  return v.startsWith('v') ? v : `v${v}`;
}

/** Extrae el año del periodo académico (AAAA-N → AAAA). */
export function periodoYear(periodo) {
  return (periodo || '').split('-')[0] || '';
}

/** Genera id único para mallas nuevas. */
export function createId() {
  return `malla-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
