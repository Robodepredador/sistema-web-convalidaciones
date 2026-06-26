import { db } from '../../../../shared/js/db.js';

const urlParams = new URLSearchParams(window.location.search);
const institucionId = urlParams.get('inst');
const carreraId = urlParams.get('carr');

let institucion = null;
let carrera = null;
let mallas = [];
let filtered = [];
let currentPage = 1;
const PAGE_SIZE = 5;

const tbody = document.getElementById('table-body');

async function init() {
  if (!institucionId || !carreraId) {
    window.location.href = '../';
    return;
  }
  
  await loadData();
  bindEvents();
}

async function loadData() {
  try {
    institucion = await db.getInstitucion(institucionId);
    carrera = await db.getCarrera(carreraId);
    mallas = await db.getMallasByCarrera(carreraId);
    filtered = [...mallas];
    
    renderHeader();
    renderStats();
    renderTable();
  } catch (e) {
    console.error(e);
    alert('Error al cargar datos');
    window.location.href = '../';
  }
}

function renderHeader() {
  document.getElementById('bc-inst').textContent = institucion.siglas || institucion.nombre;
  document.getElementById('bc-carr').textContent = carrera.nombre;
  
  // Rellenar años en el select
  const selectYear = document.getElementById('filter-year');
  const years = [...new Set(mallas.map(m => {
    const match = m.anioCodigo.match(/\d{4}/);
    return match ? match[0] : null;
  }).filter(Boolean))].sort((a,b) => b-a);
  
  years.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    selectYear.appendChild(opt);
  });
  
  if (window.renderIcons) window.renderIcons(document.body);
}

function renderStats() {
  const totCursos = mallas.reduce((acc, m) => acc + (m.totalCursos || 0), 0);
  const totCreditos = mallas.reduce((acc, m) => acc + (m.creditos || 0), 0);
  document.getElementById('tot-cursos').textContent = totCursos;
  document.getElementById('tot-creditos').textContent = totCreditos;
}

function getEstadoBadge(estado) {
  const es = estado.toUpperCase();
  let color = 'gray';
  if (es === 'ACTIVA') color = 'success';
  if (es === 'HISTÓRICA') color = 'neutral';
  if (es === 'BORRADOR') color = 'warning';
  
  return `<span class="badge badge--${color}">
            ${color === 'success' || color === 'warning' ? '<span class="badge__dot"></span>' : ''}
            ${estado}
          </span>`;
}

function renderTable() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE);
  
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No hay mallas registradas.</td></tr>';
    document.getElementById('pagination-info').textContent = 'Mostrando 0 mallas';
    document.getElementById('pagination-pages').innerHTML = '';
    return;
  }
  
  tbody.innerHTML = items.map(m => `
    <tr>
      <td>
        <div style="font-weight: 600; color: var(--color-brand-800)">${m.anioCodigo}</div>
        <div style="font-size: var(--fs-xs); color: var(--color-text)">${m.codigoVisible}</div>
      </td>
      <td class="col-center" style="font-weight: 500">${m.totalCursos} Cursos</td>
      <td>${new Date(m.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
      <td class="col-center">${getEstadoBadge(m.estado)}</td>
      <td class="col-right">
        <button class="icon-action" data-icon="eye" aria-label="Ver malla"></button>
      </td>
    </tr>
  `).join('');
  
  document.getElementById('pagination-info').textContent = `Mostrando ${start + 1}-${Math.min(start + PAGE_SIZE, filtered.length)} de ${filtered.length} mallas`;
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
  document.getElementById('btn-back').addEventListener('click', () => {
    window.location.href = `../detalle/?id=${institucionId}`;
  });

  document.getElementById('filter-year').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) {
      filtered = mallas.filter(m => m.anioCodigo.includes(val));
    } else {
      filtered = [...mallas];
    }
    currentPage = 1;
    renderTable();
  });

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

}

document.addEventListener('DOMContentLoaded', init);
