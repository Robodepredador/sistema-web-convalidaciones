import { db } from '../../../../shared/js/db.js';

let institucion = null;
let carreras = [];
let currentPage = 1;
const PAGE_SIZE = 10;

const urlParams = new URLSearchParams(window.location.search);
const institucionId = urlParams.get('id');

const tbody = document.getElementById('table-body');
const modal = document.getElementById('modal-carrera');
const form = document.getElementById('form-carrera');

async function init() {
  if (!institucionId) {
    window.location.href = '../';
    return;
  }
  
  await loadData();
  bindEvents();
}

async function loadData() {
  try {
    institucion = await db.getInstitucion(institucionId);
    carreras = await db.getCarrerasByInstitucion(institucionId);
    
    renderHeader();
    renderStats();
    renderTable();
  } catch (e) {
    console.error(e);
    alert('Error al cargar la institución');
    window.location.href = '../';
  }
}

function renderHeader() {
  document.getElementById('inst-logo').textContent = institucion.siglas;
  document.getElementById('inst-name').textContent = institucion.nombre;
  document.getElementById('inst-type').innerHTML = `<span data-icon="building"></span>${institucion.tipo === 'UNIVERSIDAD' ? 'Universidad' : 'Instituto'}`;
  document.getElementById('inst-country').innerHTML = `<span data-icon="globe"></span>${institucion.pais}`;
  document.getElementById('inst-date').innerHTML = `<span data-icon="calendar"></span>Registro: ${new Date(institucion.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  
  if (window.renderIcons) window.renderIcons(document.querySelector('.inst-header'));
}

function renderStats() {
  document.getElementById('stat-carreras').textContent = institucion.totalCarreras || 0;
  document.getElementById('stat-mallas').textContent = institucion.totalMallas || 0;
  document.getElementById('stat-date').textContent = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderTable() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const items = carreras.slice(start, start + PAGE_SIZE);
  
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="table-empty">No hay carreras registradas. Añade la primera carrera.</td></tr>';
    document.getElementById('pagination-info').textContent = 'Mostrando 0 carreras';
    document.getElementById('pagination-pages').innerHTML = '';
    return;
  }
  
  tbody.innerHTML = items.map(c => `
    <tr>
      <td style="font-weight: 500; color: var(--color-brand-800)">${c.codigo}</td>
      <td style="font-weight: 500">${c.nombre}</td>
      <td class="col-center" style="font-weight: 600">${c.totalMallas || 0}</td>
      <td class="col-right">
        <button class="btn btn--outline btn--sm" data-action="ver-mallas" data-id="${c.id}">
          <span class="btn__icon" data-icon="eye"></span>Ver Mallas
        </button>
      </td>
    </tr>
  `).join('');
  
  document.getElementById('pagination-info').textContent = `Mostrando ${start + 1}-${Math.min(start + PAGE_SIZE, carreras.length)} de ${carreras.length} carreras`;
  renderPagination();
  if (window.renderIcons) window.renderIcons(tbody);
}

function renderPagination() {
  const totalPages = Math.ceil(carreras.length / PAGE_SIZE);
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
    window.location.href = '../';
  });

  document.getElementById('btn-delete').addEventListener('click', async () => {
    if (confirm(`¿Estás seguro de eliminar ${institucion.nombre} y todo su contenido?`)) {
      await db.deleteInstitucion(institucion.id);
      window.location.href = '../';
    }
  });

  document.getElementById('pagination-pages').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-go]');
    if (!btn || btn.disabled) return;
    const go = btn.dataset.go;
    const totalPages = Math.ceil(carreras.length / PAGE_SIZE);
    if (go === 'prev') currentPage = Math.max(1, currentPage - 1);
    else if (go === 'next') currentPage = Math.min(totalPages, currentPage + 1);
    else currentPage = Number(go);
    renderTable();
  });

  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="ver-mallas"]');
    if (btn) {
      window.location.href = `../carrera/?inst=${institucionId}&carr=${btn.dataset.id}`;
    }
  });

  // Modal actions
  document.getElementById('btn-new-carrera').addEventListener('click', () => {
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
      await db.createCarrera({
        institucionId: institucionId,
        codigo: document.getElementById('car-codigo').value.trim(),
        nombre: document.getElementById('car-nombre').value.trim()
      });
      
      modal.classList.remove('is-active');
      await loadData();
    } catch (error) {
      alert('Error al guardar carrera');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

function validateForm() {
  clearErrors();
  let valid = true;
  const codigo = document.getElementById('car-codigo').value.trim();
  const nombre = document.getElementById('car-nombre').value.trim();
  
  if (!codigo) { document.getElementById('err-codigo').textContent = 'El código es obligatorio'; valid = false; }
  if (!nombre) { document.getElementById('err-nombre').textContent = 'El nombre es obligatorio'; valid = false; }
  
  return valid;
}

function clearErrors() {
  document.querySelectorAll('.field__error').forEach(el => el.textContent = '');
}

document.addEventListener('DOMContentLoaded', init);
