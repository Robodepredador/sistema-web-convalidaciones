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

function showSection(id) {
  document.querySelectorAll('.module-section').forEach(s => s.classList.remove('is-active'));
  document.getElementById(id).classList.add('is-active');
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
}

function groupByCiclo(courses) {
  const groups = {};
  (courses || []).forEach(c => {
    const k = c.ciclo != null ? String(c.ciclo) : '?';
    if (!groups[k]) groups[k] = [];
    groups[k].push(c);
  });
  return Object.entries(groups).sort((a, b) => Number(a[0]) - Number(b[0]));
}

async function renderDetalle(mallaId) {
  showSection('section-detalle');
  const container = document.getElementById('detalle-content');
  container.innerHTML = '<p style="padding:var(--space-6);color:var(--color-text-muted)">Cargando detalle...</p>';

  const malla = await db.getMallaUsilById(mallaId);
  if (!malla) {
    container.innerHTML = '<p style="padding:var(--space-6);color:var(--color-error)">No se encontró la malla.</p>';
    return;
  }

  const estadoActivo = malla.estado === 'activo';
  const groups = groupByCiclo(malla.courses);
  const totalCredits = (malla.courses || []).reduce((sum, c) => sum + (Number(c.cred) || 0), 0);

  const cycleHTML = groups.map(([ciclo, cursos]) => {
    const cycleCredits = cursos.reduce((s, c) => s + (Number(c.cred) || 0), 0);
    const rows = cursos.map(c => `
      <tr>
        <td class="col-center">${escapeHtml(String(c.ord ?? ''))}</td>
        <td><code>${escapeHtml(c.codigo || '')}</code></td>
        <td class="cell-primary">${escapeHtml(c.nombre || '')}</td>
        <td class="col-center">${escapeHtml(c.cond || '')}</td>
        <td class="col-center">${escapeHtml(String(c.cred ?? ''))}</td>
        <td class="col-center">${escapeHtml(String(c.t ?? 0))}/${escapeHtml(String(c.p ?? 0))}/${escapeHtml(String(c.l ?? 0))}</td>
        <td>${escapeHtml(c.prereq || '—')}</td>
        <td class="col-center">${escapeHtml(c.sunedu || '')}</td>
        <td class="col-center">${escapeHtml(c.mencion || '—')}</td>
        <td class="col-center">${escapeHtml(String(c.credMin ?? '—'))}</td>
      </tr>`).join('');

    return `
      <div class="cycle-section">
        <div class="cycle-section__header">
          <span class="cycle-badge">Ciclo ${escapeHtml(ciclo)}</span>
          <span class="cycle-section__meta">${cursos.length} curso${cursos.length !== 1 ? 's' : ''} · ${cycleCredits} créditos</span>
        </div>
        <div class="card table-container">
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-center">#</th>
                  <th>Código</th>
                  <th>Nombre del Curso</th>
                  <th class="col-center">Condición</th>
                  <th class="col-center">Créd.</th>
                  <th class="col-center">T / P / L</th>
                  <th>Prerrequisito</th>
                  <th class="col-center">SUNEDU</th>
                  <th class="col-center">Mención</th>
                  <th class="col-center">Créd. Mín.</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="det-nav">
      <button class="btn btn--ghost" id="det-back" data-icon="chevronLeft">Volver</button>
      <div class="det-nav__info">
        <span class="det-nav__label">Detalle de Malla Curricular</span>
        <span class="det-nav__title">${escapeHtml(malla.carrera)}</span>
      </div>
      <button class="btn btn--danger" id="det-delete" data-icon="trash" data-malla-id="${escapeHtml(malla.id)}">
        Eliminar Malla
      </button>
    </div>

    <div class="malla-meta-card">
      <div class="meta-field">
        <span class="meta-field__label">Unidad de Negocio</span>
        <span class="meta-field__val">${escapeHtml(malla.unidad)}</span>
      </div>
      <div class="meta-field">
        <span class="meta-field__label">Facultad</span>
        <span class="meta-field__val">${escapeHtml(malla.facultad)}</span>
      </div>
      <div class="meta-field">
        <span class="meta-field__label">Carrera</span>
        <span class="meta-field__val">${escapeHtml(malla.carrera)}</span>
      </div>
      <div class="meta-field">
        <span class="meta-field__label">Modalidad</span>
        <span class="meta-field__val">
          <span class="tag tag--${escapeHtml(malla.modalidad)}">
            <span class="tag__icon" data-icon="${escapeHtml(malla.modalidad)}" style="width:12px;height:12px;display:inline-flex"></span>
            ${escapeHtml(MODALIDAD_LABEL[malla.modalidad] || malla.modalidad)}
          </span>
        </span>
      </div>
      <div class="meta-field">
        <span class="meta-field__label">Periodo</span>
        <span class="meta-field__val">${escapeHtml(malla.periodo)}</span>
      </div>
      <div class="meta-field">
        <span class="meta-field__label">Versión</span>
        <span class="meta-field__val"><span class="chip-version">${escapeHtml(malla.version)}</span></span>
      </div>
      <div class="meta-field">
        <span class="meta-field__label">Estado</span>
        <span class="meta-field__val">
          <span class="badge badge--${estadoActivo ? 'active' : 'inactive'}">
            <span class="badge__dot"></span>${estadoActivo ? 'Activo' : 'Inactivo'}
          </span>
        </span>
      </div>
      <div class="meta-field">
        <span class="meta-field__label">Total Créditos</span>
        <span class="meta-field__val">${totalCredits}</span>
      </div>
    </div>

    ${groups.length ? cycleHTML : '<p class="table-empty" style="padding:var(--space-6)">Esta malla no tiene cursos registrados.</p>'}
  `;

  safeRenderIcons(container);

  document.getElementById('det-back').addEventListener('click', () => showSection('section-bandeja'));
  document.getElementById('det-delete').addEventListener('click', () => deleteMalla(malla.id, malla.carrera));
}

async function deleteMalla(id, carrera) {
  const confirmed = confirm(`¿Eliminar la malla de "${carrera}"?\n\nEsta acción marcará la malla como eliminada y no podrá deshacerse.`);
  if (!confirmed) return;
  await db.updateMallaUsil(id, { eliminado: true });
  state.mallas = state.mallas.filter(m => m.id !== id);
  updateStat();
  showSection('section-bandeja');
  renderTable();
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
                aria-label="Ver detalle de malla de ${escapeHtml(m.carrera)}"></button>
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

async function populateFilters() {
  fillSelect('filter-unidad', await getUnidades());
  fillSelect('filter-facultad', await getFacultades(''));
  fillSelect('filter-carrera', await getCarreras('', ''));
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

async function updateCascadeFilters(changed) {
  if (changed === 'unidad') {
    state.facultad = '';
    state.carrera = '';
    fillSelect('filter-facultad', await getFacultades(state.unidad));
    fillSelect('filter-carrera', await getCarreras(state.unidad, ''));
    document.getElementById('filter-facultad').value = '';
    document.getElementById('filter-carrera').value = '';
  } else if (changed === 'facultad') {
    state.carrera = '';
    fillSelect('filter-carrera', await getCarreras(state.unidad, state.facultad));
    document.getElementById('filter-carrera').value = '';
  }
}

function updateStat() {
  const el = document.getElementById('stat-activas');
  if (el) el.textContent = countActivas(state.mallas);
}

function bindEvents() {
  document.getElementById('filter-unidad').addEventListener('change', async (e) => {
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
    renderDetalle(btn.dataset.viewId);
  });

  document.addEventListener('app-action', () => {
    window.location.href = '../malla-nueva/';
  });
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
