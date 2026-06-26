/**
 * Catálogo institucional en cascada: Unidad → Facultad → Carrera.
 * Usado en filtros de lista y paso 1 del wizard.
 */
export const INSTITUTIONAL_CATALOG = {
  Pregrado: {
    'Facultad de Ingeniería e Inteligencia Artificial': [
      'INGENIERÍA AGROINDUSTRIAL',
      'INGENIERÍA EMPRESARIAL',
      'INGENIERÍA MECATRÓNICA',
      'INGENIERÍA AMBIENTAL',
      'INGENIERÍA EN CIBERSEGURIDAD',
      'INGENIERÍA DE SISTEMAS DE INFORMACIÓN'
    ],
    'Facultad de Admin. Hotelera, Turismo y Gastronomía': [
      'Administración Hotelera',
      'Turismo',
      'Gastronomía'
    ],
    'Facultad de Ciencias Empresariales': [
      'Administración',
      'Marketing'
    ],
    'Facultad de Arquitectura': [
      'Arquitectura'
    ],
    'Facultad de Comunicación': [
      'Comunicaciones'
    ]
  },
  Postgrado: {
    'Facultad de Ciencias Empresariales': ['MBA Executive'],
    'Facultad de Ingeniería e Inteligencia Artificial': ['Maestría en Sistemas']
  },
  'SIU MIAMI': {
    'Facultad de Ciencias Empresariales': ['Business Administration']
  }
};

export function getUnidades() {
  return Object.keys(INSTITUTIONAL_CATALOG);
}

export function getFacultades(unidad) {
  if (!unidad) {
    const all = new Set();
    Object.values(INSTITUTIONAL_CATALOG).forEach((facs) => {
      Object.keys(facs).forEach((f) => all.add(f));
    });
    return [...all].sort();
  }
  if (!INSTITUTIONAL_CATALOG[unidad]) return [];
  return Object.keys(INSTITUTIONAL_CATALOG[unidad]);
}

export function getCarreras(unidad, facultad) {
  if (!facultad) {
    const all = new Set();
    const units = unidad ? [unidad] : Object.keys(INSTITUTIONAL_CATALOG);
    units.forEach((u) => {
      const facs = INSTITUTIONAL_CATALOG[u] || {};
      Object.entries(facs).forEach(([fac, carreras]) => {
        if (!facultad || fac === facultad) carreras.forEach((c) => all.add(c));
      });
    });
    return [...all].sort();
  }
  if (!unidad) {
    const all = new Set();
    Object.entries(INSTITUTIONAL_CATALOG).forEach(([, facs]) => {
      if (facs[facultad]) facs[facultad].forEach((c) => all.add(c));
    });
    return [...all].sort();
  }
  const facs = INSTITUTIONAL_CATALOG[unidad];
  return facs?.[facultad] ? [...facs[facultad]] : [];
}

/** Rellena un <select> conservando la primera opción placeholder. */
export function fillSelectOptions(selectEl, values, selected = '') {
  if (!selectEl) return;
  const placeholder = selectEl.options[0];
  selectEl.innerHTML = '';
  if (placeholder) selectEl.appendChild(placeholder);
  values.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    if (v === selected) opt.selected = true;
    selectEl.appendChild(opt);
  });
}
