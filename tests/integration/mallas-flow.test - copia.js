import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

function setupDom(relativePath) {
  const html = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const dom = new JSDOM(html, {
    url: 'http://localhost:5500/public/modulos/malla-nueva/',
    runScripts: 'outside-only'
  });

  const { window } = dom;
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.CustomEvent = window.CustomEvent;
  globalThis.Event = window.Event;
  globalThis.MouseEvent = window.MouseEvent;
  globalThis.renderIcons = vi.fn();

  return { window, dom };
}

/** Deja correr las microtasks pendientes (carga async desde db.js). */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function initWizardModule() {
  setupDom('public/modulos/malla-nueva/index.html');
  await import('../../public/modulos/malla-nueva/script.js');
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  await flush();
}

async function initListModule() {
  setupDom('public/modulos/mallas/index.html');
  await import('../../public/modulos/mallas/script.js');
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  await flush();
}

const CARRERA_TEST = 'INGENIERÍA MECATRÓNICA';

function fillValidCabecera() {
  document.getElementById('cab-unidad').value = 'Pregrado';
  document.getElementById('cab-unidad').dispatchEvent(new window.Event('change'));
  document.getElementById('cab-facultad').value = 'Facultad de Ingeniería e Inteligencia Artificial';
  document.getElementById('cab-facultad').dispatchEvent(new window.Event('change'));
  document.getElementById('cab-carrera').value = CARRERA_TEST;
  document.getElementById('cab-periodo').value = '2025-02';
  document.getElementById('cab-version').value = '1';
}

/** Agrega y completa un curso manual (el seed de cursos es vacío). */
function addManualCourse() {
  document.getElementById('add-row').click();
  const row = document.querySelector('#course-tbody tr:last-child');
  const set = (field, val) => {
    const el = row.querySelector(`[data-field="${field}"]`);
    el.value = val;
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
  };
  set('ciclo', 'I');
  set('codigo', 'C01');
  set('nombre', 'Curso de Prueba');
  set('cred', '4');
}

describe('Integración — lista de mallas (DOM)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renderiza tabla y stat tras init', async () => {
    await initListModule();
    expect(document.getElementById('stat-activas').textContent).toBe('6');
    expect(document.querySelectorAll('#table-body tr').length).toBe(4);
    expect(document.getElementById('pagination-info').textContent).toContain('de 8 mallas');
  });

  it('filtra por unidad al cambiar select', async () => {
    await initListModule();
    document.getElementById('filter-unidad').value = 'Postgrado';
    document.getElementById('filter-unidad').dispatchEvent(new window.Event('change', { bubbles: true }));

    const rows = document.querySelectorAll('#table-body tr');
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => {
      expect(row.querySelector('td').textContent).toBe('Postgrado');
    });
  });
});

describe('Integración — wizard pasos (DOM)', () => {
  beforeEach(() => {
    vi.resetModules();
    if (global.localStorage) global.localStorage.clear();
  });

  it('Paso 1: valida cabecera vacía', async () => {
    await initWizardModule();
    document.getElementById('s1-next').click();
    expect(document.getElementById('panel-1').classList.contains('is-active')).toBe(true);
    expect(document.querySelector('#cab-unidad').closest('.field').classList.contains('has-error')).toBe(true);
  });

  it('Paso 1→2: cabecera válida avanza al tipo', async () => {
    await initWizardModule();
    fillValidCabecera();
    document.getElementById('s1-next').click();
    expect(document.getElementById('panel-2').classList.contains('is-active')).toBe(true);
  });

  it('Paso 2→3: rama manual muestra contexto y tabla', async () => {
    await initWizardModule();
    fillValidCabecera();
    document.getElementById('s1-next').click();
    document.getElementById('s2-next').click();

    expect(document.getElementById('panel-3').classList.contains('is-active')).toBe(true);
    expect(document.getElementById('ctx-title').textContent).toContain(`${CARRERA_TEST} - Plan 2025`);
    expect(document.getElementById('step3-manual').hidden).toBe(false);
    expect(document.querySelectorAll('#course-tbody tr').length).toBeGreaterThan(0);
  });

  it('Paso 3: cambio manual → Excel', async () => {
    await initWizardModule();
    fillValidCabecera();
    document.getElementById('s1-next').click();
    document.getElementById('s2-next').click();
    document.getElementById('s3m-import').click();

    expect(document.getElementById('step3-excel').hidden).toBe(false);
    expect(document.getElementById('step3-manual').hidden).toBe(true);
  });

  it('Paso 3→4: resumen con datos institucionales', async () => {
    await initWizardModule();
    fillValidCabecera();
    document.getElementById('s1-next').click();
    document.getElementById('s2-next').click();
    addManualCourse();
    document.getElementById('s3m-next').click();

    expect(document.getElementById('panel-4').classList.contains('is-active')).toBe(true);
    expect(document.getElementById('summary-institucional').textContent).toContain(CARRERA_TEST);
    expect(document.querySelector('.ciclo-label')).toBeTruthy();
  });

  it('Paso 3 Excel: bloquea continuar sin archivo', async () => {
    await initWizardModule();
    fillValidCabecera();
    document.getElementById('s1-next').click();
    document.getElementById('choice-excel').click();
    document.getElementById('s2-next').click();
    document.getElementById('s3e-next').click();

    expect(document.getElementById('excel-error').textContent).toMatch(/Debe cargar un archivo/);
    expect(document.getElementById('panel-3').classList.contains('is-active')).toBe(true);
  });
});
