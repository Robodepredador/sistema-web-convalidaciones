import { MAX_CYCLES, PERIODO_REGEX } from './constants.js';
import { findDuplicate } from './list-utils.js';

/**
 * Valida cabecera del wizard.
 * @param {object} cabecera
 * @param {object} [opts]
 * @param {string|null} [opts.excludeId] id a excluir del chequeo de duplicado (edición).
 * @param {object[]} [opts.existingMallas] mallas ya cargadas (db.getMallasUsil()) para RF-03.
 * @returns {{ ok: boolean, errors: Record<string, string> }}
 */
export function validateCabeceraFields(cabecera, { excludeId = null, existingMallas = [] } = {}) {
  const errors = {};
  const required = ['unidad', 'facultad', 'carrera', 'periodo', 'version'];

  required.forEach((key) => {
    if (!String(cabecera[key] ?? '').trim()) {
      errors[key] = 'Campo obligatorio';
    }
  });

  if (cabecera.periodo && !PERIODO_REGEX.test(cabecera.periodo.trim())) {
    errors.periodo = 'Formato inválido. Use AAAA-N (ej. 2024-02)';
  }

  if (cabecera.carrera && cabecera.periodo && !errors.periodo) {
    const dup = findDuplicate(existingMallas, cabecera.carrera, cabecera.periodo.trim(), excludeId);
    if (dup) {
      errors.periodo = `Ya existe una malla para ${cabecera.carrera} en ${cabecera.periodo}`;
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

/** RF-07: valida que no haya más de MAX_CYCLES ciclos distintos. */
export function validateCourseCycles(courses) {
  const active = courses.filter((c) => !c._deleted);
  const ciclos = new Set(active.map((c) => String(c.ciclo).trim()).filter(Boolean));
  if (ciclos.size > MAX_CYCLES) {
    return { ok: false, message: `Máximo ${MAX_CYCLES} ciclos permitidos (tiene ${ciclos.size})` };
  }
  return { ok: true, message: '' };
}

/** Valida cursos antes de avanzar al resumen. */
export function validateCourses(courses) {
  const active = courses.filter((c) => !c._deleted);
  if (!active.length) {
    return { ok: false, message: 'Debe registrar al menos un curso' };
  }
  const cycleCheck = validateCourseCycles(courses);
  if (!cycleCheck.ok) return cycleCheck;

  const incomplete = active.some((c) => !c.codigo?.trim() || !c.nombre?.trim() || !c.ciclo?.trim());
  if (incomplete) {
    return { ok: false, message: 'Complete ciclo, código y nombre en todos los cursos' };
  }
  return { ok: true, message: '' };
}

/** Suma créditos de cursos activos. */
export function totalCreditos(courses) {
  return courses
    .filter((c) => !c._deleted)
    .reduce((sum, c) => sum + (Number(c.cred) || 0), 0);
}

/** Agrupa cursos por ciclo respetando orden de aparición. */
export function groupCoursesByCiclo(courses) {
  const active = courses.filter((c) => !c._deleted);
  const grupos = [];
  const idx = {};
  active.forEach((c) => {
    if (!(c.ciclo in idx)) {
      idx[c.ciclo] = grupos.length;
      grupos.push({ ciclo: c.ciclo, items: [] });
    }
    grupos[idx[c.ciclo]].items.push(c);
  });
  return grupos;
}

/** Simula parseo de Excel: devuelve copia de cursos semilla. */
export function mockParseExcel() {
  return [
    { ciclo: 'I', ord: 1, codigo: 'EXL101', nombre: 'Curso importado Excel', cond: 'Obligatorio', cred: 3, t: 2, p: 1, l: 0, prereq: '', sunedu: 'General', mencion: '', credMin: 0 },
    { ciclo: 'II', ord: 1, codigo: 'EXL201', nombre: 'Segundo curso Excel', cond: 'Obligatorio', cred: 4, t: 3, p: 1, l: 0, prereq: 'EXL101', sunedu: 'Específico', mencion: '', credMin: 0 }
  ];
}
