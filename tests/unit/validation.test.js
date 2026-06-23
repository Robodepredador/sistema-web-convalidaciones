import { describe, it, expect } from 'vitest';
import {
  validateCabeceraFields,
  validateCourses,
  validateCourseCycles,
  totalCreditos,
  groupCoursesByCiclo,
  mockParseExcel
} from '../../shared/js/mallas/validation.js';
import { SEED_COURSES } from '../../shared/js/mallas/seed-data.js';

/** Mallas existentes para el chequeo de duplicados RF-03. */
const EXISTING = [
  { id: 'malla-001', carrera: 'Ingeniería de Software', periodo: '2024-01', estado: 'activo' }
];

describe('validation', () => {
  it('validateCabeceraFields rechaza campos vacíos', () => {
    const result = validateCabeceraFields({});
    expect(result.ok).toBe(false);
    expect(result.errors.unidad).toBeDefined();
  });

  it('validateCabeceraFields valida formato de periodo', () => {
    const result = validateCabeceraFields({
      unidad: 'Pregrado',
      facultad: 'Ingeniería y Ciencias',
      carrera: 'Nueva Test',
      periodo: '2024',
      version: '1'
    });
    expect(result.ok).toBe(false);
    expect(result.errors.periodo).toMatch(/Formato inválido/);
  });

  it('validateCabeceraFields detecta duplicado RF-03', () => {
    const result = validateCabeceraFields({
      unidad: 'Pregrado',
      facultad: 'Ingeniería y Ciencias',
      carrera: 'Ingeniería de Software',
      periodo: '2024-01',
      version: '1'
    }, { existingMallas: EXISTING });
    expect(result.ok).toBe(false);
    expect(result.errors.periodo).toMatch(/Ya existe una malla/);
  });

  it('validateCabeceraFields permite edición sin falso duplicado', () => {
    const result = validateCabeceraFields({
      unidad: 'Pregrado',
      facultad: 'Ingeniería y Ciencias',
      carrera: 'Ingeniería de Software',
      periodo: '2024-01',
      version: '2'
    }, { excludeId: 'malla-001', existingMallas: EXISTING });
    expect(result.ok).toBe(true);
  });

  it('validateCourses exige al menos un curso activo', () => {
    const deleted = SEED_COURSES.map((c) => ({ ...c, _deleted: true }));
    expect(validateCourses(deleted).ok).toBe(false);
  });

  it('validateCourseCycles limita a 14 ciclos', () => {
    const courses = Array.from({ length: 15 }, (_, i) => ({
      ciclo: String(i + 1), codigo: `C${i}`, nombre: `Curso ${i}`, _deleted: false
    }));
    expect(validateCourseCycles(courses).ok).toBe(false);
  });

  it('totalCreditos ignora cursos eliminados', () => {
    const courses = [
      { cred: 4, _deleted: false },
      { cred: 3, _deleted: true }
    ];
    expect(totalCreditos(courses)).toBe(4);
  });

  it('groupCoursesByCiclo agrupa por ciclo', () => {
    const cursos = [
      { ciclo: 'I', codigo: 'A1', nombre: 'Curso A1' },
      { ciclo: 'I', codigo: 'A2', nombre: 'Curso A2' },
      { ciclo: 'II', codigo: 'B1', nombre: 'Curso B1' }
    ];
    const groups = groupCoursesByCiclo(cursos);
    expect(groups.some((g) => g.ciclo === 'I')).toBe(true);
    expect(groups.find((g) => g.ciclo === 'I')?.items.length).toBe(2);
  });

  it('mockParseExcel devuelve cursos simulados', () => {
    expect(mockParseExcel()).toHaveLength(2);
  });
});
