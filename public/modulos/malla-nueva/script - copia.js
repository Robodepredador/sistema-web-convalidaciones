/* ============================================================
   CU-01 — Asistente "Creación de Nueva Malla Curricular"
   Flujo de 4 pasos: Cabecera → Tipo → Cursos → Resumen.
   ============================================================ */

import {
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
  groupCoursesByCiclo
} from '../../../shared/js/mallas/validation.js';
import { getActiveVisionModel, getModels } from '../../../shared/js/ia/ai-config.js';
import { extractFromPdf, parseSheetFile } from '../../../shared/js/ia/pdf-extractor.js';

const params  = new URLSearchParams(window.location.search);
const editId  = params.get('edit');

let editingMalla   = null;
let existingMallas = [];

function safeRenderIcons(root) {
  if (typeof renderIcons === 'function') renderIcons(root);
}

const state = {
  step:     1,
  tipo:     'manual',
  editId:   null,
  cabecera: {},
  courses:  SEED_COURSES.map(c => ({ ...c }))
};

/* ============================================================
   Navegación entre pasos
   ============================================================ */
function goTo(step) {
  state.step = step;
  document.querySelectorAll('.wizard-step').forEach(p => p.classList.remove('is-active'));
  document.getElementById(`panel-${step}`).classList.add('is-active');
  updateStepper(step);

  const title    = document.querySelector('.page-header__title');
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

  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* jsdom */ }
}

function updateStepper(step) {
  for (let i = 1; i <= 4; i++) {
    const el  = document.getElementById(`step-${i}`);
    const num = el.querySelector('.step__num');
    el.classList.toggle('is-active', i === step);
    el.classList.toggle('is-done',   i < step);
    if (num) {
      num.innerHTML = i < step
        ? '<span data-icon="check" aria-hidden="true"></span>'
        : String(i);
    }
  }
  safeRenderIcons(document.getElementById('stepper'));
}

/* ============================================================
   Paso 1 — Cabecera (selects en cascada)
   ============================================================ */
async function initCabeceraSelects() {
  const unidadSelect   = document.getElementById('cab-unidad');
  const facultadSelect = document.getElementById('cab-facultad');
  const carreraSelect  = document.getElementById('cab-carrera');

  fillSelectOptions(unidadSelect, await getUnidades(), editingMalla?.unidad || '');
  fillSelectOptions(facultadSelect, await getFacultades(unidadSelect.value));
  fillSelectOptions(carreraSelect,  await getCarreras(unidadSelect.value, facultadSelect.value));

  unidadSelect.addEventListener('change', async e => {
    const val = e.target.value;
    fillSelectOptions(facultadSelect, await getFacultades(val));
    fillSelectOptions(carreraSelect, []);
    facultadSelect.disabled = !val;
    carreraSelect.disabled  = true;
  });

  facultadSelect.addEventListener('change', async e => {
    const val = e.target.value;
    fillSelectOptions(carreraSelect, await getCarreras(unidadSelect.value, val));
    carreraSelect.disabled = !val;
  });

  if (editingMalla) {
    document.getElementById('cab-facultad').value = editingMalla.facultad;
    document.getElementById('cab-facultad').dispatchEvent(new Event('change'));
    document.getElementById('cab-carrera').value = editingMalla.carrera;

    const modKey   = editingMalla.modalidad;
    const radioVal = Object.entries(MODALIDAD_MAP).find(([, v]) => v === modKey)?.[0];
    if (radioVal) {
      const radio = document.querySelector(`input[name="modalidad"][value="${radioVal}"]`);
      if (radio) radio.checked = true;
    }

    document.getElementById('cab-periodo').value = editingMalla.periodo;
    document.getElementById('cab-version').value = String(editingMalla.version).replace(/^v/, '');

    if (editingMalla.courses?.length) {
      state.courses = editingMalla.courses.map(c => ({ ...c }));
    }
  }
}

function captureCabecera() {
  const val      = id => document.getElementById(id).value.trim();
  const modalidad = document.querySelector('input[name="modalidad"]:checked');
  state.cabecera  = {
    unidad:   val('cab-unidad'),
    facultad: val('cab-facultad'),
    carrera:  val('cab-carrera'),
    modalidad: modalidad ? normalizeModalidad(modalidad.value) : '',
    periodo:  val('cab-periodo'),
    version:  val('cab-version')
  };
}

function showCabeceraErrors(errors) {
  const fieldMap = {
    unidad: 'cab-unidad', facultad: 'cab-facultad', carrera: 'cab-carrera',
    periodo: 'cab-periodo', version: 'cab-version'
  };
  Object.entries(fieldMap).forEach(([key, id]) => {
    const field = document.getElementById(id).closest('.field');
    const err   = field.querySelector('.field__error');
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
   Paso 3 — barra de contexto + tabla manual
   ============================================================ */
function renderContext() {
  const c    = state.cabecera;
  const year = periodoYear(c.periodo);
  document.getElementById('ctx-title').textContent =
    c.carrera ? `${c.carrera}${year ? ' - Plan ' + year : ''}` : 'Nueva Malla';
  document.getElementById('ctx-unidad').textContent  = c.unidad  || '—';
  document.getElementById('ctx-carrera').textContent = c.carrera || '—';
  document.getElementById('ctx-periodo').textContent = c.periodo || '—';
  document.getElementById('ctx-version').textContent = formatVersion(c.version);
}

function showStep3Sub() {
  document.getElementById('step3-pdf').hidden    = state.tipo !== 'pdf';
  document.getElementById('step3-manual').hidden = state.tipo !== 'manual';
  if (state.tipo === 'pdf') pdfFlow.reset();
}

function showCoursesError(message) {
  let el = document.getElementById('courses-error');
  if (!el) {
    el = document.createElement('div');
    el.id        = 'courses-error';
    el.className = 'field__error courses-error';
    el.setAttribute('role', 'alert');
    document.getElementById('step3-manual').prepend(el);
  }
  el.textContent = message;
  el.hidden      = !message;
}

function buildRow(c, i) {
  const opts = (list, sel) => list.map(o =>
    `<option ${o === sel ? 'selected' : ''}>${escapeHtml(o)}</option>`
  ).join('');
  const cicloOpts = ['I','II','III','IV','V','VI','VII','VIII','IX','X','Electivo'];

  return `
    <tr data-index="${i}">
      <td class="col-center"><select class="cell-select cell-num" style="padding-right:18px" data-field="ciclo">${opts(cicloOpts, c.ciclo)}</select></td>
      <td><input class="cell-code" data-field="codigo" value="${escapeHtml(c.codigo)}"></td>
      <td><input class="cell-name" data-field="nombre" value="${escapeHtml(c.nombre)}"></td>
      <td><select class="cell-select" data-field="cond">${opts(COND_OPTS, c.cond)}</select></td>
      <td class="col-center"><input class="cell-num" data-field="cred" type="number" min="0" value="${c.cred}"></td>
      <td class="col-center"><input class="cell-num" data-field="horas" type="number" min="0" value="${c.horas ?? 0}" aria-label="Total de horas"></td>
      <td><span class="prereq"><span class="prereq__icon" data-icon="search"></span><input data-field="prereq" value="${escapeHtml(c.prereq)}" placeholder="-"></span></td>
      <td><select class="cell-select" data-field="sunedu">${opts(SUNEDU_OPTS, c.sunedu)}</select></td>
      <td><input class="cell-name" data-field="mencion" value="${escapeHtml(c.mencion)}" placeholder="-" style="min-width:80px"></td>
      <td class="col-center"><input class="cell-num" data-field="credMin" type="number" min="0" value="${c.credMin}"></td>
      <td class="col-center"><button class="row-del" data-del="${i}" aria-label="Eliminar fila" data-icon="trash"></button></td>
    </tr>`;
}

function getActiveCourses() {
  return state.courses.filter(c => !c._deleted);
}

function renderCourses() {
  const tbody  = document.getElementById('course-tbody');
  const active = getActiveCourses();
  tbody.innerHTML = active.length
    ? active.map(c => buildRow(c, state.courses.indexOf(c))).join('')
    : `<tr><td colspan="11" class="table-empty">No hay cursos. Añada filas o use la opción PDF con IA.</td></tr>`;
  safeRenderIcons(tbody);
  recalcTotal();
  renderDeletedBanner();
}

function renderDeletedBanner() {
  const deleted = state.courses.filter(c => c._deleted);
  let banner    = document.getElementById('deleted-banner');
  if (!deleted.length) { if (banner) banner.remove(); return; }
  if (!banner) {
    banner = document.createElement('div');
    banner.id        = 'deleted-banner';
    banner.className = 'info-note info-note--warn';
    document.getElementById('step3-manual').querySelector('.course-toolbar').after(banner);
  }
  banner.innerHTML = `<span class="info-note__icon" data-icon="info"></span>
    <span>${deleted.length} curso(s) eliminado(s). <button type="button" class="btn btn--ghost btn--sm" id="restore-deleted">Restaurar todos</button></span>`;
  safeRenderIcons(banner);
  banner.querySelector('#restore-deleted').addEventListener('click', () => {
    state.courses.forEach(c => { delete c._deleted; });
    renderCourses();
  }, { once: true });
}

function recalcTotal() {
  document.getElementById('course-total').textContent = totalCreditos(state.courses);
}

/* ============================================================
   PDF con IA — flujo inline en el Paso 3
   ============================================================ */
const pdfFlow = {
  _file:      null,
  _fileType:  null,   // 'pdf' | 'excel' | 'csv'
  _extracted: [],

  _el: id => document.getElementById(id),

  showState(id) {
    ['pdf-state-upload', 'pdf-state-processing', 'pdf-state-review']
      .forEach(s => { document.getElementById(s).hidden = s !== id; });
  },

  reset() {
    this._file      = null;
    this._fileType  = null;
    this._extracted = [];

    const titleEl = this._el('ia-dropzone-title');
    const fileEl  = this._el('ia-dropzone-file');
    const inp     = this._el('ia-file-input');
    const btn     = this._el('s3p-extract');
    const errEl   = this._el('pdf-file-error');
    const label   = this._el('s3p-extract-label');
    if (titleEl) titleEl.textContent = 'Arrastra tu archivo aquí';
    if (fileEl)  fileEl.hidden = true;
    if (inp)     inp.value = '';
    if (btn)     btn.disabled = true;
    if (label)   label.textContent = 'Extraer con IA';
    if (errEl)   errEl.textContent = '';

    const model      = getActiveVisionModel();
    const allModels  = getModels();
    const badge      = this._el('pdf-model-badge');
    const noModel    = this._el('pdf-state-nomodel');
    const noModelMsg = noModel?.querySelector('.nomodel-msg');
    if (badge) badge.textContent = model ? `Modelo: ${model.nombre}` : '';
    if (noModel) {
      noModel.hidden = !!model;
      if (!model && noModelMsg) {
        noModelMsg.textContent = allModels.length === 0
          ? 'No hay modelos configurados en Centro IA.'
          : 'Ningún modelo tiene capacidad de visión activa. Edita tu modelo en Centro IA y activa la casilla "Visión (PDF/imágenes)".';
      }
    }

    this.showState('pdf-state-upload');
  },

  setFile(file) {
    if (!file) return;
    const errEl = this._el('pdf-file-error');
    const ext   = file.name.split('.').pop().toLowerCase();
    const isPdf   = ext === 'pdf' || file.type === 'application/pdf';
    const isExcel = ['xlsx', 'xls'].includes(ext);
    const isCsv   = ext === 'csv';

    if (!isPdf && !isExcel && !isCsv) {
      if (errEl) errEl.textContent = 'Formato no soportado. Usa PDF, Excel (.xlsx/.xls) o CSV.';
      return;
    }
    if (errEl) errEl.textContent = '';

    this._file     = file;
    this._fileType = isPdf ? 'pdf' : (isCsv ? 'csv' : 'excel');

    const titleEl = this._el('ia-dropzone-title');
    const fileEl  = this._el('ia-dropzone-file');
    const btn     = this._el('s3p-extract');
    const label   = this._el('s3p-extract-label');
    const badge   = this._el('pdf-model-badge');
    const noModel = this._el('pdf-state-nomodel');

    if (titleEl) titleEl.textContent = `📄 ${file.name}`;
    if (fileEl)  { fileEl.textContent = file.name; fileEl.hidden = false; }
    if (btn)     btn.disabled = false;

    if (isPdf) {
      if (label) label.textContent = 'Extraer con IA';
      const model = getActiveVisionModel();
      if (badge) badge.textContent = model ? `Modelo: ${model.nombre}` : '';
      if (noModel) {
        noModel.hidden = !!model;
        if (!model) {
          const allModels = getModels();
          const msg = noModel.querySelector('.nomodel-msg');
          if (msg) msg.textContent = allModels.length === 0
            ? 'No hay modelos configurados en Centro IA.'
            : 'Ningún modelo tiene capacidad de visión activa. Activa la casilla "Visión" en tu modelo.';
        }
      }
    } else {
      if (label)   label.textContent = `Importar ${isExcel ? 'Excel' : 'CSV'}`;
      if (badge)   badge.textContent = `Importación directa · ${isExcel ? 'Excel' : 'CSV'} · Sin IA`;
      if (noModel) noModel.hidden = true;
    }
  },

  async extract() {
    if (!this._file) return;

    if (this._fileType === 'pdf') {
      const model   = getActiveVisionModel();
      const noModel = this._el('pdf-state-nomodel');
      if (!model) {
        if (noModel) noModel.hidden = false;
        alert('Configura un modelo de visión activo en Centro IA antes de continuar.');
        return;
      }
      if (noModel) noModel.hidden = true;

      this.showState('pdf-state-processing');
      try {
        const courses = await extractFromPdf(this._file, model, ({ phase, page, total }) => {
          const msg = phase === 'render'
            ? `Renderizando página ${page} de ${total}…`
            : `Extrayendo cursos de página ${page} de ${total}… (puede tardar ~30 s por página)`;
          document.getElementById('pdf-progress-text').textContent = msg;
        });
        this._extracted = courses;
        this.renderReview(courses);
      } catch (err) {
        console.error('[PDF IA]', err);
        this.showState('pdf-state-upload');
        const errEl = this._el('pdf-file-error');
        if (errEl) errEl.textContent = `Error: ${err.message}`;
      }

    } else {
      // Excel / CSV — sin IA, procesamiento local
      this.showState('pdf-state-processing');
      const progEl = this._el('pdf-progress-text');
      if (progEl) progEl.textContent = `Procesando archivo ${this._fileType === 'excel' ? 'Excel' : 'CSV'}…`;
      try {
        const courses = await parseSheetFile(this._file);
        this._extracted = courses;
        this.renderReview(courses);
      } catch (err) {
        console.error('[Sheet import]', err);
        this.showState('pdf-state-upload');
        const errEl = this._el('pdf-file-error');
        if (errEl) errEl.textContent = `Error al procesar el archivo: ${err.message}`;
      }
    }
  },

  renderReview(courses) {
    const summary = this._el('pdf-review-summary');
    const tbody   = this._el('pdf-review-tbody');
    const nextBtn = this._el('s3p-next');

    if (summary) {
      const tipo = this._fileType === 'pdf' ? 'PDF' : (this._fileType === 'csv' ? 'CSV' : 'Excel');
      summary.textContent = courses.length
        ? `Se encontraron ${courses.length} curso(s) en el ${tipo}. Revisa antes de continuar.`
        : `No se detectaron cursos en el ${tipo}. Verifica que el archivo tenga encabezados reconocibles (Nombre, Codigo, Creditos…).`;
    }

    if (tbody) {
      tbody.innerHTML = courses.length
        ? courses.map(c => `
            <tr>
              <td class="col-center">${escapeHtml(String(c.ciclo))}</td>
              <td><code>${escapeHtml(c.codigo)}</code></td>
              <td>${escapeHtml(c.nombre)}</td>
              <td class="col-center">${escapeHtml(c.cond)}</td>
              <td class="col-center">${escapeHtml(String(c.cred))}</td>
              <td class="col-center">${escapeHtml(String(c.horas ?? 0))}</td>
            </tr>`).join('')
        : '<tr><td colspan="6" class="table-empty">No se detectaron cursos.</td></tr>';
    }

    if (nextBtn) nextBtn.disabled = !courses.length;
    this.showState('pdf-state-review');
  },

  // Carga los cursos escaneados en la tabla editable para revisión/edición manual.
  accept() {
    if (!this._extracted.length) return;
    state.courses = this._extracted.map(c => ({ ...c }));
    document.getElementById('step3-pdf').hidden    = true;
    document.getElementById('step3-manual').hidden = false;
    renderCourses();
    showCoursesError('');
  },

  bindEvents() {
    this._el('ia-pick-file').addEventListener('click', () => this._el('ia-file-input').click());
    this._el('ia-file-input').addEventListener('change', e => this.setFile(e.target.files[0]));

    const dz = this._el('ia-dropzone');
    if (dz) {
      ['dragenter', 'dragover'].forEach(ev =>
        dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('is-drag'); }));
      ['dragleave', 'drop'].forEach(ev =>
        dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('is-drag'); }));
      dz.addEventListener('drop', e => this.setFile(e.dataTransfer.files[0]));
    }

    const recheckBtn = this._el('pdf-recheck-model');
    if (recheckBtn) recheckBtn.addEventListener('click', () => this.reset());

    const cancelBtn = this._el('s3p-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.reset());

    this._el('s3p-back').addEventListener('click', () => goTo(2));
    this._el('s3p-extract').addEventListener('click', () => this.extract());
    this._el('s3p-retry').addEventListener('click', () => this.reset());
    // Aceptar lleva a la tabla editable (no salta al resumen) para poder editar.
    this._el('s3p-next').addEventListener('click', () => {
      this.accept();
    });
  }
};

/* ============================================================
   Paso 4 — Resumen
   ============================================================ */
function buildSummary() {
  const c    = state.cabecera;
  const rows = [
    ['Unidad',    c.unidad],
    ['Facultad',  c.facultad],
    ['Carrera',   c.carrera],
    ['Modalidad', modalidadLabel(c.modalidad)],
    ['Periodo',   c.periodo],
    ['Versión',   formatVersion(c.version)]
  ];
  document.getElementById('summary-institucional').innerHTML = rows.map(([label, value]) =>
    `<div class="summary-row">
       <span class="summary-row__label">${escapeHtml(label)}</span>
       <span class="summary-row__value">${escapeHtml(value || '—')}</span>
     </div>`
  ).join('');

  document.getElementById('summary-curriculum').innerHTML = groupCoursesByCiclo(state.courses).map(g => `
    <span class="ciclo-label">Ciclo ${escapeHtml(g.ciclo)}</span>
    ${g.items.map(c => `
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
    unidad:   state.cabecera.unidad,
    facultad: state.cabecera.facultad,
    carrera:  state.cabecera.carrera,
    modalidad: state.cabecera.modalidad,
    periodo:  state.cabecera.periodo,
    version:  formatVersion(state.cabecera.version),
    estado:   'activo',
    courses:  state.courses.filter(c => !c._deleted).map(c => ({ ...c }))
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

  document.querySelectorAll('.choice-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.choice-card').forEach(c => c.classList.remove('is-selected'));
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

  pdfFlow.bindEvents();

  document.getElementById('s3m-back').addEventListener('click', () => goTo(2));
  document.getElementById('s3m-next').addEventListener('click', () => {
    const check = validateCourses(state.courses);
    if (!check.ok) { showCoursesError(check.message); return; }
    showCoursesError('');
    buildSummary();
    goTo(4);
  });

  document.getElementById('add-row').addEventListener('click', () => {
    state.courses.push({
      ciclo: 'I', ord: getActiveCourses().length + 1, codigo: '', nombre: '',
      cond: 'Obligatorio', cred: 0, horas: 0,
      prereq: '', sunedu: 'General', mencion: '', credMin: 0
    });
    renderCourses();
    showCoursesError('');
  });

  const tbody = document.getElementById('course-tbody');
  tbody.addEventListener('input', e => {
    const cell = e.target.closest('[data-field]');
    if (!cell) return;
    const tr = e.target.closest('tr');
    if (!tr)   return;
    const i   = Number(tr.dataset.index);
    state.courses[i][cell.dataset.field] = cell.value;
    if (cell.dataset.field === 'cred') recalcTotal();
  });
  tbody.addEventListener('click', e => {
    const btn = e.target.closest('[data-del]');
    if (!btn) return;
    state.courses[Number(btn.dataset.del)]._deleted = true;
    renderCourses();
  });

  document.getElementById('s4-back').addEventListener('click', () => goTo(3));
  document.getElementById('s4-publish').addEventListener('click', publishMalla);

  ['export-pdf', 'export-excel'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      e.preventDefault();
      alert('Generación de documento disponible cuando exista backend.');
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  existingMallas = await db.getMallasUsil();
  if (editId) {
    editingMalla = await db.getMallaUsilById(editId);
    state.editId = editingMalla?.id || null;
  }

  await initCabeceraSelects();
  renderCourses();
  bindEvents();
  if (state.editId) goTo(1);
});
