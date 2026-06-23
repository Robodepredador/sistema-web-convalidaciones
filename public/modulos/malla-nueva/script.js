/* ============================================================
   CU-01 — Asistente "Creación de Nueva Malla Curricular"
   Flujo de 4 pasos: Cabecera → Tipo → Cursos → Resumen.
   ============================================================ */

import {
  FORMAT_COLUMNS,
  COND_OPTS,
  SUNEDU_OPTS,
  MODALIDAD_MAP
} from '../../../shared/js/mallas/constants.js';
import {
  escapeHtml,
  normalizeModalidad,
  modalidadLabel,
  formatVersion,
  periodoYear
} from '../../../shared/js/mallas/utils.js';
import {
  getUnidades,
  getFacultades,
  getCarreras,
  fillSelectOptions
} from '../../../shared/js/mallas/catalog.js';
import { db } from '../../../shared/js/db.js';
import { SEED_COURSES } from '../../../shared/js/mallas/seed-data.js';
import {
  validateCabeceraFields,
  validateCourses,
  totalCreditos,
  groupCoursesByCiclo,
  mockParseExcel
} from '../../../shared/js/mallas/validation.js';

const params = new URLSearchParams(window.location.search);
const editId = params.get('edit');

/* Se cargan de forma asíncrona en DOMContentLoaded (db.js). */
let editingMalla = null;
let existingMallas = [];

function safeRenderIcons(root) {
  if (typeof renderIcons === 'function') renderIcons(root);
}

const state = {
  step: 1,
  tipo: 'manual',
  editId: null,
  excelUploaded: false,
  cabecera: {},
  courses: SEED_COURSES.map((c) => ({ ...c }))
};

/* ============================================================
   Navegación entre pasos
   ============================================================ */
function goTo(step) {
  state.step = step;
  document.querySelectorAll('.wizard-step').forEach((p) => p.classList.remove('is-active'));
  document.getElementById(`panel-${step}`).classList.add('is-active');
  updateStepper(step);

  const title = document.querySelector('.page-header__title');
  const subtitle = document.querySelector('.page-header__subtitle');
  if (title) {
    title.textContent = step === 4
      ? 'Revisión y Resumen'
      : (state.editId ? 'Edición de Malla Curricular' : 'Creación de Nueva Malla Curricular');
  }
  if (subtitle) {
    subtitle.textContent = step === 4
      ? 'Verifique los datos antes de publicar la malla.'
      : (state.editId
        ? 'Modifique la malla existente sin afectar versiones históricas.'
        : 'Complete los 4 pasos para registrar una nueva malla curricular.');
  }

  try {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch {
    /* entornos sin scrollTo (p. ej. jsdom en tests) */
  }
}

function updateStepper(step) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step-${i}`);
    const num = el.querySelector('.step__num');
    el.classList.toggle('is-active', i === step);
    el.classList.toggle('is-done', i < step);
    if (num) {
      if (i < step) {
        num.innerHTML = '<span data-icon="check" aria-hidden="true"></span>';
      } else {
        num.textContent = String(i);
      }
    }
  }
  safeRenderIcons(document.getElementById('stepper'));
}

/* ============================================================
   Paso 1 — Cabecera (selects en cascada)
   ============================================================ */
function initCabeceraSelects() {
  const unidadEl = document.getElementById('cab-unidad');
  const facultadEl = document.getElementById('cab-facultad');
  const carreraEl = document.getElementById('cab-carrera');

  fillSelectOptions(unidadEl, getUnidades(), editingMalla?.unidad || '');
  fillSelectOptions(facultadEl, getFacultades(unidadEl.value));
  fillSelectOptions(carreraEl, getCarreras(unidadEl.value, facultadEl.value));

  unidadEl.addEventListener('change', () => {
    fillSelectOptions(facultadEl, getFacultades(unidadEl.value));
    fillSelectOptions(carreraEl, []);
  });

  facultadEl.addEventListener('change', () => {
    fillSelectOptions(carreraEl, getCarreras(unidadEl.value, facultadEl.value));
  });

  if (editingMalla) {
    unidadEl.value = editingMalla.unidad;
    unidadEl.dispatchEvent(new Event('change'));
    document.getElementById('cab-facultad').value = editingMalla.facultad;
    document.getElementById('cab-facultad').dispatchEvent(new Event('change'));
    document.getElementById('cab-carrera').value = editingMalla.carrera;

    const modKey = editingMalla.modalidad;
    const radioValue = Object.entries(MODALIDAD_MAP).find(([, v]) => v === modKey)?.[0];
    if (radioValue) {
      const radio = document.querySelector(`input[name="modalidad"][value="${radioValue}"]`);
      if (radio) radio.checked = true;
    }

    document.getElementById('cab-periodo').value = editingMalla.periodo;
    document.getElementById('cab-version').value = String(editingMalla.version).replace(/^v/, '');

    if (editingMalla.courses?.length) {
      state.courses = editingMalla.courses.map((c) => ({ ...c }));
    }
  }
}

function captureCabecera() {
  const val = (id) => document.getElementById(id).value.trim();
  const modalidad = document.querySelector('input[name="modalidad"]:checked');
  state.cabecera = {
    unidad: val('cab-unidad'),
    facultad: val('cab-facultad'),
    carrera: val('cab-carrera'),
    modalidad: modalidad ? normalizeModalidad(modalidad.value) : '',
    periodo: val('cab-periodo'),
    version: val('cab-version')
  };
}

function showCabeceraErrors(errors) {
  const fieldMap = {
    unidad: 'cab-unidad',
    facultad: 'cab-facultad',
    carrera: 'cab-carrera',
    periodo: 'cab-periodo',
    version: 'cab-version'
  };

  Object.entries(fieldMap).forEach(([key, id]) => {
    const field = document.getElementById(id).closest('.field');
    const err = field.querySelector('.field__error');
    if (errors[key]) {
      field.classList.add('has-error');
      if (err) err.textContent = errors[key];
    } else {
      field.classList.remove('has-error');
      if (err) err.textContent = '';
    }
  });
}

function validateCabeceraForm() {
  captureCabecera();
  const result = validateCabeceraFields(state.cabecera, { excludeId: state.editId, existingMallas });
  showCabeceraErrors(result.errors);
  return result.ok;
}

/* ============================================================
   Paso 3 — contexto + columnas Excel + tabla manual
   ============================================================ */
function renderContext() {
  const c = state.cabecera;
  const year = periodoYear(c.periodo);
  document.getElementById('ctx-title').textContent =
    c.carrera ? `${c.carrera}${year ? ' - Plan ' + year : ''}` : 'Nueva Malla';
  document.getElementById('ctx-unidad').textContent = c.unidad || '—';
  document.getElementById('ctx-carrera').textContent = c.carrera || '—';
  document.getElementById('ctx-periodo').textContent = c.periodo || '—';
  document.getElementById('ctx-version').textContent = formatVersion(c.version);
}

function renderFormatList() {
  const cls = { ok: 'format-list__check', opt: 'format-list__check format-list__check--opt' };
  const icon = { ok: 'check', opt: 'info' };
  document.getElementById('format-list').innerHTML = FORMAT_COLUMNS.map((col) => {
    const mark = col.status === 'na'
      ? `<span class="format-list__check--na">—</span>`
      : `<span class="${cls[col.status]}" data-icon="${icon[col.status]}"></span>`;
    return `<div class="format-list__item"><span>${escapeHtml(col.label)}</span>${mark}</div>`;
  }).join('');
  safeRenderIcons(document.getElementById('format-list'));
}

function showStep3Sub() {
  document.getElementById('step3-excel').hidden = state.tipo !== 'excel';
  document.getElementById('step3-manual').hidden = state.tipo !== 'manual';
}

function showCoursesError(message) {
  let el = document.getElementById('courses-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'courses-error';
    el.className = 'field__error courses-error';
    el.setAttribute('role', 'alert');
    document.getElementById('step3-manual').prepend(el);
  }
  el.textContent = message;
  el.hidden = !message;
}

function buildRow(c, i) {
  const opts = (list, sel) => list.map((o) =>
    `<option ${o === sel ? 'selected' : ''}>${escapeHtml(o)}</option>`
  ).join('');
  const cicloOpts = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'Electivo'];

  return `
    <tr data-index="${i}">
      <td class="col-center"><select class="cell-select cell-num" style="padding-right: 18px" data-field="ciclo">${opts(cicloOpts, c.ciclo)}</select></td>
      <td class="col-center"><input class="cell-num" data-field="ord" value="${c.ord}"></td>
      <td><input class="cell-code" data-field="codigo" value="${escapeHtml(c.codigo)}"></td>
      <td><input class="cell-name" data-field="nombre" value="${escapeHtml(c.nombre)}"></td>
      <td><select class="cell-select" data-field="cond">${opts(COND_OPTS, c.cond)}</select></td>
      <td class="col-center"><input class="cell-num" data-field="cred" type="number" min="0" value="${c.cred}"></td>
      <td>
        <div class="hours-group">
          <input class="cell-num" data-field="t" type="number" min="0" value="${c.t}" aria-label="Horas teoría">
          <input class="cell-num" data-field="p" type="number" min="0" value="${c.p}" aria-label="Horas práctica">
          <input class="cell-num" data-field="l" type="number" min="0" value="${c.l}" aria-label="Horas laboratorio">
        </div>
      </td>
      <td>
        <span class="prereq"><span class="prereq__icon" data-icon="search"></span><input data-field="prereq" value="${escapeHtml(c.prereq)}" placeholder="-"></span>
      </td>
      <td><select class="cell-select" data-field="sunedu">${opts(SUNEDU_OPTS, c.sunedu)}</select></td>
      <td><input class="cell-name" data-field="mencion" value="${escapeHtml(c.mencion)}" placeholder="-" style="min-width:80px"></td>
      <td class="col-center"><input class="cell-num" data-field="credMin" type="number" min="0" value="${c.credMin}"></td>
      <td class="col-center"><button class="row-del" data-del="${i}" aria-label="Eliminar fila" data-icon="trash"></button></td>
    </tr>`;
}

function getActiveCourses() {
  return state.courses.filter((c) => !c._deleted);
}

function renderCourses() {
  const tbody = document.getElementById('course-tbody');
  const active = getActiveCourses();

  tbody.innerHTML = active.length
    ? active.map((c, i) => buildRow(c, state.courses.indexOf(c))).join('')
    : `<tr><td colspan="12" class="table-empty">No hay cursos. Añada filas o importe desde Excel.</td></tr>`;

  safeRenderIcons(tbody);
  recalcTotal();
  renderDeletedBanner();
}

function renderDeletedBanner() {
  const deleted = state.courses.filter((c) => c._deleted);
  let banner = document.getElementById('deleted-banner');
  if (!deleted.length) {
    if (banner) banner.remove();
    return;
  }
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'deleted-banner';
    banner.className = 'info-note info-note--warn';
    document.getElementById('step3-manual').querySelector('.course-toolbar').after(banner);
  }
  banner.innerHTML = `<span class="info-note__icon" data-icon="info"></span>
    <span>${deleted.length} curso(s) eliminado(s). <button type="button" class="btn btn--ghost btn--sm" id="restore-deleted">Restaurar todos</button></span>`;
  safeRenderIcons(banner);
  banner.querySelector('#restore-deleted').addEventListener('click', () => {
    state.courses.forEach((c) => { delete c._deleted; });
    renderCourses();
  }, { once: true });
}

function recalcTotal() {
  document.getElementById('course-total').textContent = totalCreditos(state.courses);
}

/* ============================================================
   Paso 4 — Resumen
   ============================================================ */
function buildSummary() {
  const c = state.cabecera;
  const rows = [
    ['Unidad', c.unidad],
    ['Facultad', c.facultad],
    ['Carrera', c.carrera],
    ['Modalidad', modalidadLabel(c.modalidad)],
    ['Periodo', c.periodo],
    ['Versión', formatVersion(c.version)]
  ];
  document.getElementById('summary-institucional').innerHTML = rows.map(([label, value]) =>
    `<div class="summary-row"><span class="summary-row__label">${escapeHtml(label)}</span><span class="summary-row__value">${escapeHtml(value || '—')}</span></div>`
  ).join('');

  document.getElementById('summary-curriculum').innerHTML = groupCoursesByCiclo(state.courses).map((g) => `
    <span class="ciclo-label">Ciclo ${escapeHtml(g.ciclo)}</span>
    ${g.items.map((c) => `
      <div class="course-item">
        <div>
          <div class="course-item__name">${escapeHtml(c.nombre)}</div>
          <div class="course-item__code">${escapeHtml(c.codigo)}</div>
        </div>
        <div class="course-item__meta">
          <span class="cred-chip">${escapeHtml(c.cred)} Cr.</span>
          <span class="cond-badge ${c.cond === 'Obligatorio' ? 'cond-badge--oblig' : 'cond-badge--elec'}">${escapeHtml(c.cond)}</span>
        </div>
      </div>`).join('')}
  `).join('');
}

async function publishMalla() {
  captureCabecera();
  const cabeceraCheck = validateCabeceraFields(state.cabecera, { excludeId: state.editId, existingMallas });
  if (!cabeceraCheck.ok) {
    alert('Error de validación: ' + Object.values(cabeceraCheck.errors).join('\n'));
    goTo(1);
    showCabeceraErrors(cabeceraCheck.errors);
    return;
  }

  const courseCheck = validateCourses(state.courses);
  if (!courseCheck.ok) {
    alert(courseCheck.message);
    goTo(3);
    showCoursesError(courseCheck.message);
    return;
  }

  const payload = {
    unidad: state.cabecera.unidad,
    facultad: state.cabecera.facultad,
    carrera: state.cabecera.carrera,
    modalidad: state.cabecera.modalidad,
    periodo: state.cabecera.periodo,
    version: formatVersion(state.cabecera.version),
    estado: 'activo',
    courses: state.courses.filter((c) => !c._deleted).map((c) => ({ ...c }))
  };

  if (state.editId) {
    await db.updateMallaUsil(state.editId, payload);
  } else {
    await db.createMallaUsil(payload);
  }

  const total = totalCreditos(state.courses);
  alert(`Malla curricular ${state.editId ? 'actualizada' : 'publicada'} correctamente.\n\n${payload.carrera} · ${payload.courses.length} cursos · ${total} créditos.`);
  window.location.href = '../mallas/';
}

/* ============================================================
   Eventos
   ============================================================ */
function bindEvents() {
  document.getElementById('s1-next').addEventListener('click', () => {
    if (!validateCabeceraForm()) return;
    goTo(2);
  });

  document.querySelectorAll('.choice-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.choice-card').forEach((c) => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      state.tipo = card.dataset.tipo;
    });
  });
  document.getElementById('s2-back').addEventListener('click', () => goTo(1));
  document.getElementById('s2-next').addEventListener('click', () => {
    renderContext();
    showStep3Sub();
    goTo(3);
  });

  document.getElementById('s3e-back').addEventListener('click', () => goTo(2));
  document.getElementById('s3e-next').addEventListener('click', () => {
    if (!state.excelUploaded) {
      const err = document.getElementById('excel-error');
      if (err) err.textContent = 'Debe cargar un archivo Excel antes de continuar';
      return;
    }
    const check = validateCourses(state.courses);
    if (!check.ok) {
      document.getElementById('excel-error').textContent = check.message;
      return;
    }
    document.getElementById('excel-error').textContent = '';
    buildSummary();
    goTo(4);
  });
  bindDropzone();

  document.getElementById('s3m-back').addEventListener('click', () => goTo(2));
  document.getElementById('s3m-next').addEventListener('click', () => {
    const check = validateCourses(state.courses);
    if (!check.ok) {
      showCoursesError(check.message);
      return;
    }
    showCoursesError('');
    buildSummary();
    goTo(4);
  });
  document.getElementById('s3m-import').addEventListener('click', () => {
    state.tipo = 'excel';
    showStep3Sub();
  });
  document.getElementById('add-row').addEventListener('click', () => {
    state.courses.push({
      ciclo: '', ord: getActiveCourses().length + 1, codigo: '', nombre: '',
      cond: 'Obligatorio', cred: 0, t: 0, p: 0, l: 0, prereq: '',
      sunedu: 'General', mencion: '', credMin: 0
    });
    renderCourses();
    showCoursesError('');
  });

  const tbody = document.getElementById('course-tbody');
  tbody.addEventListener('input', (e) => {
    const cell = e.target.closest('[data-field]');
    if (!cell) return;
    const tr = e.target.closest('tr');
    if (!tr) return;
    const i = Number(tr.dataset.index);
    state.courses[i][cell.dataset.field] = cell.value;
    if (cell.dataset.field === 'cred') recalcTotal();
  });
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-del]');
    if (!btn) return;
    const i = Number(btn.dataset.del);
    state.courses[i]._deleted = true;
    renderCourses();
  });

  document.getElementById('s4-back').addEventListener('click', () => goTo(3));
  document.getElementById('s4-publish').addEventListener('click', publishMalla);

  ['export-pdf', 'export-excel'].forEach((id) => {
    document.getElementById(id).addEventListener('click', (e) => {
      e.preventDefault();
      alert('Generación de documento disponible cuando exista backend.');
    });
  });

  document.querySelectorAll('.foot-link, .upload-card__head .btn--outline').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      alert('Descarga de plantilla disponible cuando exista backend.');
    });
  });
}

function bindDropzone() {
  const dz = document.getElementById('dropzone');
  const input = document.getElementById('file-input');
  const fileLabel = document.getElementById('dropzone-file');
  const excelError = document.getElementById('excel-error');

  const processFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      if (excelError) excelError.textContent = 'Solo se aceptan archivos .xlsx o .xls';
      return;
    }
    fileLabel.textContent = `Archivo cargado: ${file.name}`;
    fileLabel.hidden = false;
    state.excelUploaded = true;
    state.courses = mockParseExcel().map((c) => ({ ...c }));
    if (excelError) excelError.textContent = '';
  };

  document.getElementById('dropzone-pick').addEventListener('click', () => input.click());
  input.addEventListener('change', () => processFile(input.files[0]));

  ['dragenter', 'dragover'].forEach((ev) =>
    dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('is-drag'); }));
  ['dragleave', 'drop'].forEach((ev) =>
    dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('is-drag'); }));
  dz.addEventListener('drop', (e) => processFile(e.dataTransfer.files[0]));
}

document.addEventListener('DOMContentLoaded', async () => {
  // Carga datos de la capa async antes de inicializar la UI (db.js)
  existingMallas = await db.getMallasUsil();
  if (editId) {
    editingMalla = await db.getMallaUsilById(editId);
    state.editId = editingMalla?.id || null;
  }

  initCabeceraSelects();
  renderFormatList();
  renderCourses();
  bindEvents();
  if (state.editId) goTo(1);
});
