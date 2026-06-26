/* ============================================================
   APP — lógica del módulo de Mallas Curriculares
   Lista con filtros, paginación y navegación al wizard.
   ============================================================ */

import {
  PAGE_SIZE,
  MODALIDAD_LABEL
} from '../../../shared/js/mallas/constants.js';
import { escapeHtml } from '../../../shared/js/mallas/utils.js';
import {
  filterMallas,
  paginate,
  buildPageList,
  countActivas
} from '../../../shared/js/mallas/list-utils.js';
import { db } from '../../../shared/js/db.js';
import { getUnidades, getFacultades, getCarreras } from '../../../shared/js/mallas/catalog.js';
import { groupCoursesByCiclo, totalCreditos } from '../../../shared/js/mallas/validation.js';

const state = {
  unidad: '',
  facultad: '',
  carrera: '',
  page: 1,
  mallas: []
};

function getFiltered() {
  return filterMallas(state.mallas, state);
}

function buildRow(m) {
  const estadoActivo = m.estado === 'activo';
  return `
    <tr>
      <td class="cell-primary">${escapeHtml(m.unidad)}</td>
      <td>${escapeHtml(m.facultad)}</td>
      <td>${escapeHtml(m.carrera)}</td>
      <td class="col-center">
        <span class="tag tag--${escapeHtml(m.modalidad)}">
          <span class="tag__icon" data-icon="${escapeHtml(m.modalidad)}" style="width:12px;height:12px;display:inline-flex"></span>
          ${escapeHtml(MODALIDAD_LABEL[m.modalidad] || m.modalidad)}
        </span>
      </td>
      <td class="col-center">${escapeHtml(m.periodo)}</td>
      <td class="col-center"><span class="chip-version">${escapeHtml(m.version)}</span></td>
      <td class="col-center">
        <span class="badge badge--${estadoActivo ? 'active' : 'inactive'}">
          <span class="badge__dot"></span>${estadoActivo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td class="col-right">
        <button class="icon-action" data-icon="eye" data-view-id="${escapeHtml(m.id)}"
                aria-label="Ver resumen de la malla de ${escapeHtml(m.carrera)}"></button>
      </td>
    </tr>`;
}

function renderTable() {
  const filtered = getFiltered();
  const { items, totalPages, page, total } = paginate(filtered, state.page, PAGE_SIZE);
  state.page = page;

  const tbody = document.getElementById('table-body');
  tbody.innerHTML = items.length
    ? items.map(buildRow).join('')
    : `<tr><td colspan="8" class="table-empty">
         No hay mallas que coincidan con los filtros. Ajusta la búsqueda o registra una nueva malla.
       </td></tr>`;

  document.getElementById('pagination-info').textContent =
    `Mostrando ${items.length} de ${total} mallas curriculares`;

  renderPagination(totalPages);
  safeRenderIcons(tbody);
}

function safeRenderIcons(root) {
  if (typeof renderIcons === 'function') renderIcons(root);
}

function renderPagination(totalPages) {
  const container = document.getElementById('pagination-pages');
  let html = `<button class="page-btn" data-icon="chevronLeft" aria-label="Página anterior"
                ${state.page === 1 ? 'disabled' : ''} data-go="prev"></button>`;

  buildPageList(state.page, totalPages).forEach((p) => {
    html += p === '…'
      ? `<span class="page-ellipsis">…</span>`
      : `<button class="page-btn ${p === state.page ? 'is-active' : ''}" data-go="${p}"
           ${p === state.page ? 'aria-current="page"' : ''}>${p}</button>`;
  });

  html += `<button class="page-btn" data-icon="chevronRight" aria-label="Página siguiente"
             ${state.page === totalPages ? 'disabled' : ''} data-go="next"></button>`;
  container.innerHTML = html;
  safeRenderIcons(container);
}

function populateFilters() {
  fillSelect('filter-unidad', getUnidades());
  fillSelect('filter-facultad', getFacultades(''));
  fillSelect('filter-carrera', getCarreras('', ''));
}

function fillSelect(id, values) {
  const select = document.getElementById(id);
  const placeholder = select.options[0];
  select.innerHTML = '';
  select.appendChild(placeholder);
  values.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
}

function updateCascadeFilters(changed) {
  if (changed === 'unidad') {
    state.facultad = '';
    state.carrera = '';
    fillSelect('filter-facultad', getFacultades(state.unidad));
    fillSelect('filter-carrera', getCarreras(state.unidad, ''));
    document.getElementById('filter-facultad').value = '';
    document.getElementById('filter-carrera').value = '';
  } else if (changed === 'facultad') {
    state.carrera = '';
    fillSelect('filter-carrera', getCarreras(state.unidad, state.facultad));
    document.getElementById('filter-carrera').value = '';
  }
}

function updateStat() {
  const el = document.getElementById('stat-activas');
  if (el) el.textContent = countActivas(state.mallas);
}

function bindEvents() {
  document.getElementById('filter-unidad').addEventListener('change', (e) => {
    state.unidad = e.target.value;
    state.page = 1;
    updateCascadeFilters('unidad');
    renderTable();
  });
  document.getElementById('filter-facultad').addEventListener('change', (e) => {
    state.facultad = e.target.value;
    state.page = 1;
    updateCascadeFilters('facultad');
    renderTable();
  });
  document.getElementById('filter-carrera').addEventListener('change', (e) => {
    state.carrera = e.target.value;
    state.page = 1;
    renderTable();
  });

  document.getElementById('filter-apply').addEventListener('click', () => {
    state.page = 1;
    renderTable();
  });

  document.getElementById('filter-clear').addEventListener('click', () => {
    state.unidad = state.facultad = state.carrera = '';
    state.page = 1;
    ['filter-unidad', 'filter-facultad', 'filter-carrera'].forEach((id) => {
      document.getElementById(id).value = '';
    });
    populateFilters();
    renderTable();
  });

  document.getElementById('pagination-pages').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-go]');
    if (!btn || btn.disabled) return;
    const go = btn.dataset.go;
    const totalPages = Math.max(1, Math.ceil(getFiltered().length / PAGE_SIZE));
    if (go === 'prev') state.page = Math.max(1, state.page - 1);
    else if (go === 'next') state.page = Math.min(totalPages, state.page + 1);
    else state.page = Number(go);
    renderTable();
  });

  document.getElementById('table-body').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view-id]');
    if (!btn) return;
    showResumen(btn.dataset.viewId);
  });

  document.getElementById('resumen-back').addEventListener('click', showLista);

  document.addEventListener('app-action', () => {
    window.location.href = '../malla-nueva/';
  });
}

/* ============================================================
   Vista de resumen de una malla (solo lectura)
   ============================================================ */
let currentMallaId = null;

function showSection(id) {
  document.querySelectorAll('.module-section').forEach((s) => s.classList.remove('is-active'));
  document.getElementById(id).classList.add('is-active');
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
  
  const btnNuevaMalla = document.getElementById('nueva-malla');
  if (btnNuevaMalla) {
    btnNuevaMalla.style.display = id === 'section-resumen' ? 'none' : '';
  }
}

function showLista() {
  currentMallaId = null;
  showSection('section-lista');
}

async function showResumen(id) {
  const malla = await db.getMallaUsilById(id);
  if (!malla) { alert('No se encontró la malla seleccionada.'); return; }
  currentMallaId = id;

  document.getElementById('resumen-title').textContent =
    `${malla.carrera}${malla.version ? ' · ' + malla.version : ''}`;

  const rows = [
    ['Unidad',    malla.unidad],
    ['Facultad',  malla.facultad],
    ['Carrera',   malla.carrera],
    ['Modalidad', MODALIDAD_LABEL[malla.modalidad] || malla.modalidad],
    ['Periodo',   malla.periodo],
    ['Versión',   malla.version],
    ['Estado',    malla.estado === 'activo' ? 'Activo' : 'Inactivo']
  ];
  document.getElementById('resumen-institucional').innerHTML = rows.map(([label, value]) =>
    `<div class="summary-row">
       <span class="summary-row__label">${escapeHtml(label)}</span>
       <span class="summary-row__value">${escapeHtml(value || '—')}</span>
     </div>`
  ).join('');

  const courses = Array.isArray(malla.courses)
    ? malla.courses.filter((c) => !c._deleted)
    : [];

  const totalCredEl = document.getElementById('resumen-total-cred');
  totalCredEl.textContent = courses.length ? `${totalCreditos(courses)} créditos` : '';

  const curriculum = document.getElementById('resumen-curriculum');
  curriculum.innerHTML = courses.length
    ? groupCoursesByCiclo(courses).map((g) => `
        <span class="ciclo-label">Ciclo ${escapeHtml(g.ciclo)}</span>
        ${g.items.map((c) => `
          <div class="course-item">
            <div>
              <div class="course-item__name">${escapeHtml(c.nombre)}</div>
              <div class="course-item__code">${escapeHtml(c.codigo)}</div>
            </div>
            <div class="course-item__meta">
              <span class="cred-chip">${escapeHtml(String(c.cred))} Cr.</span>
              <span class="cond-badge ${c.cond === 'Obligatorio' ? 'cond-badge--oblig' : 'cond-badge--elec'}">${escapeHtml(c.cond)}</span>
            </div>
          </div>`).join('')}
      `).join('')
    : `<div class="table-empty" style="padding:var(--space-8)">
         Esta malla no tiene cursos registrados. Usa "Editar malla" para agregarlos.
       </div>`;

  showSection('section-resumen');
  safeRenderIcons(document.getElementById('section-resumen'));
}

async function loadData() {
  const tbody = document.getElementById('table-body');
  if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Cargando mallas curriculares...</td></tr>`;
  state.mallas = await db.getMallasUsil();
}

document.addEventListener('DOMContentLoaded', async () => {
  populateFilters();
  bindEvents();
  await loadData();
  updateStat();
  renderTable();
});
