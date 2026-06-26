/* ============================================================
   USUARIOS Y SEGURIDAD — Módulo 1
   CRUD de accesos del personal y postulantes, con rol y ámbito
   por facultad. Base de la cadena de dependencias (Dependencia 1).
   ============================================================ */

import { db } from '../../../shared/js/db.js';

const PAGE_SIZE = 8;

/* Roles del sistema (§3 del documento). `scoped` = requiere facultad. */
const ROLES = [
  { value: 'ADMIN',       label: 'Administrador',        tag: 'admin',       scoped: false },
  { value: 'ADMISION',    label: 'Personal de Admisión', tag: 'admision',    scoped: false },
  { value: 'COORDINADOR', label: 'Coordinador Académico',tag: 'coordinador', scoped: true },
  { value: 'DIRECTOR',    label: 'Director de Facultad',  tag: 'director',    scoped: true },
  { value: 'DECANO',      label: 'Decano',               tag: 'decano',      scoped: true },
  { value: 'POSTULANTE',  label: 'Estudiante Postulante', tag: 'postulante',  scoped: false }
];
const ROL_MAP = Object.fromEntries(ROLES.map(r => [r.value, r]));

/* Ámbitos de facultad (taxonomía USIL, coincide con las mallas USIL). */
const FACULTADES = ['Ingeniería y Ciencias', 'Negocios y Economía', 'Ciencias de la Salud'];

const state = { usuarios: [], filtered: [], page: 1, editId: null };

const tbody = document.getElementById('table-body');
const modal = document.getElementById('modal-usuario');
const form = document.getElementById('form-usuario');

function safeRenderIcons(root) { if (window.renderIcons) window.renderIcons(root); }

function initials(u) {
  return `${(u.nombres || '')[0] || ''}${(u.apellidos || '')[0] || ''}`.toUpperCase();
}

function rolTag(rol) {
  const r = ROL_MAP[rol];
  if (!r) return rol;
  return `<span class="rol-tag rol-tag--${r.tag}">${r.label}</span>`;
}

/* ------------------------------------------------------------
   Carga y render
   ------------------------------------------------------------ */
async function loadData() {
  tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Cargando usuarios...</td></tr>';
  const [users, stats] = await Promise.all([db.getUsuarios(), db.getUsuariosStats()]);
  state.usuarios = users;
  applyFilters();
  renderStats(stats);
}

function renderStats(stats) {
  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-activos').textContent = stats.activos;
  document.getElementById('rol-dist').innerHTML = ROLES.map(r => `
    <div class="rol-dist__row">
      <span class="rol-tag rol-tag--${r.tag}">${r.label}</span>
      <span class="rol-dist__count">${stats.porRol[r.value] || 0}</span>
    </div>`).join('');
}

function applyFilters() {
  const q = document.getElementById('filter-busqueda').value.trim().toLowerCase();
  const rol = document.getElementById('filter-rol').value;
  const estado = document.getElementById('filter-estado').value;

  state.filtered = state.usuarios.filter(u => {
    const matchQ = !q ||
      `${u.nombres} ${u.apellidos}`.toLowerCase().includes(q) ||
      (u.correo || '').toLowerCase().includes(q) ||
      (u.dni || '').includes(q);
    return matchQ && (!rol || u.rol === rol) && (!estado || u.estado === estado);
  });
  state.page = 1;
  renderTable();
}

function renderTable() {
  const total = state.filtered.length;
  const start = (state.page - 1) * PAGE_SIZE;
  const items = state.filtered.slice(start, start + PAGE_SIZE);

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No hay usuarios que coincidan con los filtros.</td></tr>';
    document.getElementById('pagination-info').textContent = 'Mostrando 0 usuarios';
    document.getElementById('pagination-pages').innerHTML = '';
    return;
  }

  tbody.innerHTML = items.map(u => {
    const activo = u.estado === 'activo';
    return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="user-avatar">${initials(u)}</div>
            <div>
              <div class="user-cell__name">${u.nombres} ${u.apellidos}</div>
              <div class="user-cell__mail">${u.correo || ''}</div>
            </div>
          </div>
        </td>
        <td>${u.dni || '—'}</td>
        <td>${rolTag(u.rol)}</td>
        <td>${u.facultad || '<span style="opacity:.6">Global</span>'}</td>
        <td class="col-center">
          <span class="badge badge--${activo ? 'success' : 'inactive'}"><span class="badge__dot"></span>${activo ? 'Activo' : 'Inactivo'}</span>
        </td>
        <td class="col-right">
          <div style="display:inline-flex;gap:var(--space-1);">
            <button class="icon-action" data-action="editar" data-icon="edit" data-id="${u.id}" title="Editar" aria-label="Editar"></button>
            <button class="icon-action" data-action="eliminar" data-icon="trash" data-id="${u.id}" title="Eliminar" aria-label="Eliminar"></button>
          </div>
        </td>
      </tr>`;
  }).join('');

  document.getElementById('pagination-info').textContent =
    `Mostrando ${start + 1}-${Math.min(start + PAGE_SIZE, total)} de ${total} usuarios`;
  renderPagination(total);
  safeRenderIcons(tbody);
}

function renderPagination(total) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const container = document.getElementById('pagination-pages');
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = `<button class="page-btn" data-icon="chevronLeft" ${state.page === 1 ? 'disabled' : ''} data-go="prev"></button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === state.page ? 'is-active' : ''}" data-go="${i}">${i}</button>`;
  }
  html += `<button class="page-btn" data-icon="chevronRight" ${state.page === totalPages ? 'disabled' : ''} data-go="next"></button>`;
  container.innerHTML = html;
  safeRenderIcons(container);
}

/* ------------------------------------------------------------
   Selects
   ------------------------------------------------------------ */
function populateSelects() {
  document.getElementById('filter-rol').insertAdjacentHTML('beforeend',
    ROLES.map(r => `<option value="${r.value}">${r.label}</option>`).join(''));
  document.getElementById('u-rol').insertAdjacentHTML('beforeend',
    ROLES.map(r => `<option value="${r.value}">${r.label}</option>`).join(''));
  document.getElementById('u-facultad').insertAdjacentHTML('beforeend',
    FACULTADES.map(f => `<option value="${f}">${f}</option>`).join(''));
}

function onRolChange() {
  const rol = document.getElementById('u-rol').value;
  const scoped = ROL_MAP[rol]?.scoped;
  document.getElementById('field-facultad').hidden = !scoped;
  if (!scoped) document.getElementById('u-facultad').value = '';
}

/* ------------------------------------------------------------
   Modal crear / editar
   ------------------------------------------------------------ */
function clearErrors() {
  document.querySelectorAll('#form-usuario .field__error').forEach(el => (el.textContent = ''));
}

function openCreate() {
  state.editId = null;
  form.reset();
  clearErrors();
  document.getElementById('field-facultad').hidden = true;
  document.getElementById('field-estado').hidden = true;
  document.getElementById('modal-title').textContent = 'Nuevo Usuario';
  document.getElementById('modal-save').textContent = 'Guardar Usuario';
  modal.classList.add('is-active');
}

function openEdit(id) {
  const u = state.usuarios.find(x => x.id === id);
  if (!u) return;
  state.editId = id;
  form.reset();
  clearErrors();
  document.getElementById('u-nombres').value = u.nombres || '';
  document.getElementById('u-apellidos').value = u.apellidos || '';
  document.getElementById('u-dni').value = u.dni || '';
  document.getElementById('u-correo').value = u.correo || '';
  document.getElementById('u-rol').value = u.rol;
  onRolChange();
  document.getElementById('u-facultad').value = u.facultad || '';
  document.getElementById('u-estado').value = u.estado || 'activo';
  document.getElementById('field-estado').hidden = false;
  document.getElementById('modal-title').textContent = 'Editar Usuario';
  document.getElementById('modal-save').textContent = 'Guardar cambios';
  modal.classList.add('is-active');
}

function closeModal() {
  modal.classList.remove('is-active');
  state.editId = null;
}

function validate() {
  let ok = true;
  const set = (id, msg) => { document.getElementById(id).textContent = msg; if (msg) ok = false; };
  const v = (id) => document.getElementById(id).value.trim();

  set('err-nombres', v('u-nombres') ? '' : 'Ingrese los nombres');
  set('err-apellidos', v('u-apellidos') ? '' : 'Ingrese los apellidos');
  set('err-dni', /^\d{8}$/.test(v('u-dni')) ? '' : 'El DNI debe tener 8 dígitos');
  set('err-correo', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('u-correo')) ? '' : 'Correo no válido');
  const rol = v('u-rol');
  set('err-rol', rol ? '' : 'Seleccione un rol');
  if (rol && ROL_MAP[rol]?.scoped) {
    set('err-facultad', v('u-facultad') ? '' : 'Seleccione la facultad de ámbito');
  } else {
    set('err-facultad', '');
  }
  return ok;
}

async function save() {
  if (!validate()) return;
  const v = (id) => document.getElementById(id).value.trim();
  const rol = v('u-rol');
  const payload = {
    nombres: v('u-nombres'),
    apellidos: v('u-apellidos'),
    dni: v('u-dni'),
    correo: v('u-correo'),
    rol,
    facultad: ROL_MAP[rol]?.scoped ? v('u-facultad') : ''
  };

  const btn = document.getElementById('modal-save');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Guardando…';
  try {
    if (state.editId) {
      payload.estado = document.getElementById('u-estado').value;
      await db.updateUsuario(state.editId, payload);
    } else {
      payload.estado = 'activo';
      await db.createUsuario(payload);
    }
    closeModal();
    await loadData();
  } catch {
    alert('No se pudo guardar el usuario.');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}

/* ------------------------------------------------------------
   Acciones de tabla
   ------------------------------------------------------------ */
async function onTableClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'editar') return openEdit(id);
  if (action === 'eliminar') {
    const u = state.usuarios.find(x => x.id === id);
    if (!confirm(`¿Eliminar al usuario ${u?.nombres} ${u?.apellidos}? Se conservará en el historial (eliminación lógica).`)) return;
    btn.disabled = true;
    await db.deleteUsuario(id);
    await loadData();
  }
}

/* ------------------------------------------------------------
   Init
   ------------------------------------------------------------ */
function bindEvents() {
  document.getElementById('filter-apply').addEventListener('click', applyFilters);
  document.getElementById('filter-busqueda').addEventListener('keydown', (e) => { if (e.key === 'Enter') applyFilters(); });
  document.getElementById('filter-rol').addEventListener('change', applyFilters);
  document.getElementById('filter-estado').addEventListener('change', applyFilters);
  document.getElementById('filter-clear').addEventListener('click', () => {
    document.getElementById('filter-busqueda').value = '';
    document.getElementById('filter-rol').value = '';
    document.getElementById('filter-estado').value = '';
    applyFilters();
  });

  document.getElementById('pagination-pages').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-go]');
    if (!btn || btn.disabled) return;
    const totalPages = Math.ceil(state.filtered.length / PAGE_SIZE);
    const go = btn.dataset.go;
    if (go === 'prev') state.page = Math.max(1, state.page - 1);
    else if (go === 'next') state.page = Math.min(totalPages, state.page + 1);
    else state.page = Number(go);
    renderTable();
  });

  tbody.addEventListener('click', onTableClick);

  document.addEventListener('app-action', openCreate);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('u-rol').addEventListener('change', onRolChange);
  document.getElementById('modal-save').addEventListener('click', save);
}

document.addEventListener('DOMContentLoaded', async () => {
  populateSelects();
  bindEvents();
  await loadData();
});
