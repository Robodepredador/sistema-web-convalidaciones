import { describe, it, expect } from 'vitest';
import { escapeHtml, normalizeModalidad, modalidadLabel, formatVersion, periodoYear } from '../../shared/js/mallas/utils.js';

describe('utils', () => {
  it('escapeHtml escapa caracteres peligrosos', () => {
    expect(escapeHtml('<script>"\'&</script>')).toBe('&lt;script&gt;&quot;&#39;&amp;&lt;/script&gt;');
  });

  it('normalizeModalidad mapea valores del wizard', () => {
    expect(normalizeModalidad('Semipresencial')).toBe('hibrido');
    expect(normalizeModalidad('Presencial')).toBe('presencial');
    expect(normalizeModalidad('Virtual')).toBe('virtual');
  });

  it('modalidadLabel devuelve etiqueta legible', () => {
    expect(modalidadLabel('hibrido')).toBe('Semipresencial');
    expect(modalidadLabel('Presencial')).toBe('Presencial');
  });

  it('formatVersion agrega prefijo v', () => {
    expect(formatVersion('4.2.0')).toBe('v4.2.0');
    expect(formatVersion('v1.0')).toBe('v1.0');
  });

  it('periodoYear extrae el año', () => {
    expect(periodoYear('2024-02')).toBe('2024');
    expect(periodoYear('')).toBe('');
  });
});
