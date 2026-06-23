import { describe, it, expect } from 'vitest';
import {
  filterMallas,
  paginate,
  buildPageList,
  countActivas,
  findDuplicate
} from '../../shared/js/mallas/list-utils.js';
import { PAGE_SIZE } from '../../shared/js/mallas/constants.js';

/** Fixture mínimo equivalente al seed de mallas USIL. */
const MALLAS = [
  { id: 'malla-001', unidad: 'Pregrado', carrera: 'Ingeniería de Software', periodo: '2024-01', estado: 'activo' },
  { id: 'malla-002', unidad: 'Postgrado', carrera: 'MBA Executive', periodo: '2023-02', estado: 'activo' },
  { id: 'malla-003', unidad: 'Pregrado', carrera: 'Medicina General', periodo: '2022-01', estado: 'inactivo' },
  { id: 'malla-004', unidad: 'Educación Continua', carrera: 'Diplomado en IA Aplicada', periodo: '2024-02', estado: 'activo' },
  { id: 'malla-005', unidad: 'Pregrado', carrera: 'Administración', periodo: '2024-01', estado: 'activo' },
  { id: 'malla-006', unidad: 'Pregrado', carrera: 'Ingeniería Civil', periodo: '2023-01', estado: 'activo' },
  { id: 'malla-007', unidad: 'Postgrado', carrera: 'Maestría en Salud Pública', periodo: '2024-02', estado: 'inactivo' },
  { id: 'malla-008', unidad: 'Educación Continua', carrera: 'Diplomado en Finanzas', periodo: '2024-01', estado: 'activo' }
];

describe('list-utils', () => {
  it('countActivas cuenta solo mallas activas', () => {
    expect(countActivas(MALLAS)).toBe(6);
  });

  it('countActivas sin argumentos no falla', () => {
    expect(countActivas()).toBe(0);
  });

  it('filterMallas filtra por unidad', () => {
    const result = filterMallas(MALLAS, { unidad: 'Pregrado' });
    expect(result.every((m) => m.unidad === 'Pregrado')).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('paginate divide correctamente', () => {
    const page1 = paginate(MALLAS, 1, PAGE_SIZE);
    expect(page1.items).toHaveLength(4);
    expect(page1.totalPages).toBe(2);
    expect(page1.total).toBe(8);
  });

  it('buildPageList incluye elipsis', () => {
    expect(buildPageList(5, 10)).toContain('…');
  });

  it('findDuplicate detecta carrera + periodo existente', () => {
    const dup = findDuplicate(MALLAS, 'Ingeniería de Software', '2024-01');
    expect(dup).not.toBeNull();
    expect(dup.id).toBe('malla-001');
  });

  it('findDuplicate excluye el id en edición', () => {
    const dup = findDuplicate(MALLAS, 'Ingeniería de Software', '2024-01', 'malla-001');
    expect(dup).toBeNull();
  });
});
