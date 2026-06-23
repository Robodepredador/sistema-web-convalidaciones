import { describe, it, expect } from 'vitest';
import { getUnidades, getFacultades, getCarreras } from '../../shared/js/mallas/catalog.js';

const FAC_ING = 'Facultad de Ingeniería e Inteligencia Artificial';

describe('catalog', () => {
  it('getUnidades devuelve las unidades de negocio', () => {
    expect(getUnidades()).toEqual(['Pregrado', 'Postgrado', 'SIU MIAMI']);
  });

  it('getFacultades filtra por unidad', () => {
    const facs = getFacultades('Pregrado');
    expect(facs).toContain(FAC_ING);
    expect(facs).not.toContain('Administración'); // es carrera, no facultad
  });

  it('getFacultades sin unidad devuelve todas', () => {
    expect(getFacultades('').length).toBeGreaterThanOrEqual(3);
  });

  it('getCarreras en cascada', () => {
    const carreras = getCarreras('Pregrado', FAC_ING);
    expect(carreras).toContain('INGENIERÍA DE SISTEMAS DE INFORMACIÓN');
    expect(carreras).toContain('INGENIERÍA MECATRÓNICA');
  });
});
