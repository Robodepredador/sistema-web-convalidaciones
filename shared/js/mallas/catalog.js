import { db } from '../db.js';

export async function getUnidades() {
  const cat = await db.getUsilCatalog();
  return Object.keys(cat);
}

export async function getFacultades(unidad) {
  const cat = await db.getUsilCatalog();
  if (!unidad) {
    const all = new Set();
    Object.values(cat).forEach((facs) => {
      Object.keys(facs).forEach((f) => all.add(f));
    });
    return [...all].sort();
  }
  if (!cat[unidad]) return [];
  return Object.keys(cat[unidad]);
}

export async function getCarreras(unidad, facultad) {
  const cat = await db.getUsilCatalog();
  if (!facultad) {
    const all = new Set();
    const units = unidad ? [unidad] : Object.keys(cat);
    units.forEach((u) => {
      const facs = cat[u] || {};
      Object.entries(facs).forEach(([fac, carreras]) => {
        if (!facultad || fac === facultad) carreras.forEach((c) => all.add(c));
      });
    });
    return [...all].sort();
  }
  if (!unidad) {
    const all = new Set();
    Object.entries(cat).forEach(([, facs]) => {
      if (facs[facultad]) facs[facultad].forEach((c) => all.add(c));
    });
    return [...all].sort();
  }
  const facs = cat[unidad];
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
