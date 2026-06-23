import { db } from '../../../shared/js/db.js';

let instituciones = [];
let filtered = [];
let currentPage = 1;
const PAGE_SIZE = 10;

// Elementos DOM
const tbody = document.getElementById('table-body');
const modal = document.getElementById('modal-institucion');
const form = document.getElementById('form-institucion');

async function init() {
  await loadData();
  bindEvents();
}

async function loadData() {
  tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Cargando instituciones...</td></tr>';
  instituciones = await db.getInstituciones();
  filtered = [...instituciones];
  updateStats();
  renderTable();
}

function updateStats() {
  document.getElementById('stat-inst').textContent = instituciones.length;

  const totalCarreras = instituciones.reduce((acc, inst) => acc + (inst.totalCarreras || 0), 0);
  document.getElementById('stat-carr').textContent = totalCarreras;

  const totalMallas = instituciones.reduce((acc, inst) => acc + (inst.totalMallas || 0), 0);
  document.getElementById('stat-mallas').textContent = totalMallas;
}

function renderTable() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE);

  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No se encontraron instituciones.</td></tr>';
    document.getElementById('pagination-info').textContent = 'Mostrando 0 instituciones';
    document.getElementById('pagination-pages').innerHTML = '';
    return;
  }

  tbody.innerHTML = items.map(inst => {
    const isActivo = inst.estado === 'activo';
    return `
      <tr>
        <td>
          <span class="tag tag--${inst.tipo.toLowerCase()}">
            ${inst.tipo === 'UNIVERSIDAD' ? 'Universidad' : 'Instituto'}
          </span>
        </td>
        <td>
          <div class="inst-name-cell">
            <div class="inst-avatar">${inst.siglas}</div>
            <span style="font-weight: 500">${inst.nombre}</span>
          </div>
        </td>
        <td>${inst.pais}</td>
        <td class="col-center" style="font-weight: 600">${inst.totalCarreras || 0}</td>
        <td class="col-center" style="font-weight: 600">${inst.totalMallas || 0}</td>
        <td>${new Date(inst.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
        <td class="col-right">
          <button class="icon-action" data-icon="eye" data-id="${inst.id}" aria-label="Ver detalle"></button>
        </td>
      </tr>
    `;
  }).join('');

  document.getElementById('pagination-info').textContent = `Mostrando ${start + 1}-${Math.min(start + PAGE_SIZE, filtered.length)} de ${filtered.length} instituciones`;
  renderPagination();
  if (window.renderIcons) window.renderIcons(tbody);
}

function renderPagination() {
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const container = document.getElementById('pagination-pages');
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `<button class="page-btn" data-icon="chevronLeft" ${currentPage === 1 ? 'disabled' : ''} data-go="prev"></button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'is-active' : ''}" data-go="${i}">${i}</button>`;
  }
  html += `<button class="page-btn" data-icon="chevronRight" ${currentPage === totalPages ? 'disabled' : ''} data-go="next"></button>`;

  container.innerHTML = html;
  if (window.renderIcons) window.renderIcons(container);
}

function bindEvents() {
  // Filtros
  document.getElementById('filter-apply').addEventListener('click', () => {
    const qNombre = document.getElementById('filter-nombre').value.toLowerCase();
    const qTipo = document.getElementById('filter-tipo').value;
    const qEstado = document.getElementById('filter-estado').value;

    filtered = instituciones.filter(inst => {
      const matchName = inst.nombre.toLowerCase().includes(qNombre) || inst.siglas.toLowerCase().includes(qNombre);
      const matchTipo = qTipo ? inst.tipo === qTipo : true;
      const matchEstado = qEstado ? inst.estado === qEstado : true;
      return matchName && matchTipo && matchEstado;
    });
    currentPage = 1;
    renderTable();
  });

  document.getElementById('filter-clear').addEventListener('click', () => {
    document.getElementById('filter-nombre').value = '';
    document.getElementById('filter-tipo').value = '';
    document.getElementById('filter-estado').value = '';
    filtered = [...instituciones];
    currentPage = 1;
    renderTable();
  });

  // Paginación
  document.getElementById('pagination-pages').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-go]');
    if (!btn || btn.disabled) return;
    const go = btn.dataset.go;
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    if (go === 'prev') currentPage = Math.max(1, currentPage - 1);
    else if (go === 'next') currentPage = Math.min(totalPages, currentPage + 1);
    else currentPage = Number(go);

    renderTable();
  });

  // Navegación a Detalle
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-id]');
    if (btn) {
      window.location.href = `./detalle/?id=${btn.dataset.id}`;
    }
  });

  // Modal Nueva Institución
  document.addEventListener('app-action', () => {
    form.reset();
    clearErrors();
    modal.classList.add('is-active');
  });

  document.getElementById('modal-close').addEventListener('click', () => modal.classList.remove('is-active'));
  document.getElementById('modal-cancel').addEventListener('click', () => modal.classList.remove('is-active'));

  document.getElementById('modal-save').addEventListener('click', async () => {
    if (!validateForm()) return;

    const btn = document.getElementById('modal-save');
    const originalText = btn.textContent;
    btn.textContent = 'Guardando...';
    btn.disabled = true;

    try {
      await db.createInstitucion({
        nombre: document.getElementById('inst-nombre').value.trim(),
        siglas: document.getElementById('inst-siglas').value.trim(),
        tipo: document.getElementById('inst-tipo').value,
        pais: document.getElementById('inst-pais').value,
        estado: 'activo'
      });

      modal.classList.remove('is-active');
      await loadData();
    } catch (error) {
      alert('Error al guardar institución');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

function validateForm() {
  clearErrors();
  let valid = true;
  const nombre = document.getElementById('inst-nombre').value.trim();
  const siglas = document.getElementById('inst-siglas').value.trim();
  const tipo = document.getElementById('inst-tipo').value;
  const pais = document.getElementById('inst-pais').value;

  if (!nombre) { document.getElementById('err-nombre').textContent = 'El nombre es obligatorio'; valid = false; }
  if (!siglas) { document.getElementById('err-siglas').textContent = 'Las siglas son obligatorias'; valid = false; }
  if (!tipo) { document.getElementById('err-tipo').textContent = 'El tipo es obligatorio'; valid = false; }
  if (!pais) { document.getElementById('err-pais').textContent = 'El país es obligatorio'; valid = false; }

  return valid;
}

function clearErrors() {
  document.querySelectorAll('.field__error').forEach(el => el.textContent = '');
}

document.addEventListener('DOMContentLoaded', init);
