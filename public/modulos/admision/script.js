import { getUnidades, getFacultades, getCarreras, fillSelectOptions } from '../../../shared/js/mallas/catalog.js';
import { db } from '../../../shared/js/db.js';

const PAGE_SIZE = 10;

const bandejaState = {
  solicitudes: [],
  insts: [],
  estadoFilter: '',
  page: 1,
};

/* ── SECTION NAVIGATION ─────────────────────────────────── */
function showSection(id) {
  document.querySelectorAll('.module-section').forEach(s => s.classList.remove('is-active'));
  document.getElementById(id).classList.add('is-active');

  const actionBtn = document.getElementById('registrar-solicitud');
  if (actionBtn) actionBtn.style.display = id === 'section-registro' ? 'none' : '';
}

/* ── WIZARD STEPPER ─────────────────────────────────────── */
function regGoTo(step) {
  document.querySelectorAll('.wizard-step').forEach(p => p.classList.remove('is-active'));
  document.getElementById(`reg-panel-${step}`).classList.add('is-active');
  updateRegStepper(step);
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* sin scrollTo */ }
}

function updateRegStepper(step) {
  for (let i = 1; i <= 3; i++) {
    const el  = document.getElementById(`reg-step-${i}`);
    const num = el.querySelector('.step__num');
    el.classList.toggle('is-active', i === step);
    el.classList.toggle('is-done',   i < step);
    if (num) {
      if (i < step) {
        num.innerHTML = '<span data-icon="check" aria-hidden="true"></span>';
      } else {
        num.textContent = String(i);
      }
    }
  }
  if (typeof renderIcons === 'function') renderIcons(document.getElementById('reg-stepper'));
}

/* ── BANDEJA: TABLE + PAGINATION ────────────────────────── */
function getFiltered() {
  const { solicitudes, estadoFilter } = bandejaState;
  return estadoFilter
    ? solicitudes.filter(s => s.estado === estadoFilter)
    : solicitudes;
}

function buildBandejaRow(sol) {
  const inst = bandejaState.insts.find(i => i.id === sol.academico.institucionOrigenId);
  const instName = inst ? (inst.siglas || inst.nombre) : 'Desconocida';

  const badgeClass = sol.estado === 'PENDIENTE'   ? 'badge--warning'
                   : sol.estado === 'EN REVISIÓN' ? 'badge--info'
                   : sol.estado === 'APROBADA'    ? 'badge--success' : '';

  const fecha = new Date(sol.fechaRegistro).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return `
    <tr>
      <td style="font-weight:600">${sol.id.split('-')[1].slice(-6)}</td>
      <td>${sol.postulante.nombres} ${sol.postulante.apellidos}</td>
      <td>${sol.postulante.dni}</td>
      <td>${instName}</td>
      <td><span style="max-width:150px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${sol.academico.carreraDestino}">${sol.academico.carreraDestino}</span></td>
      <td style="color:var(--color-text-muted);font-size:var(--fs-sm)">${fecha}</td>
      <td class="col-center"><span class="badge ${badgeClass}">${sol.estado}</span></td>
      <td class="col-right">
        <button class="icon-action" data-icon="eye" data-id="${sol.id}" title="Ver detalle" aria-label="Ver detalle"></button>
      </td>
    </tr>`;
}

function renderBandejaTable() {
  const filtered  = getFiltered();
  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  bandejaState.page = Math.min(bandejaState.page, totalPages);

  const start = (bandejaState.page - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE);

  const tbody = document.getElementById('table-bandeja-body');
  tbody.innerHTML = items.length
    ? items.map(buildBandejaRow).join('')
    : `<tr><td colspan="8" class="table-empty">No hay solicitudes que coincidan con el filtro.</td></tr>`;

  document.getElementById('pagination-bandeja-info').textContent =
    `Mostrando ${items.length} de ${total} solicitudes`;

  renderBandejaPagination(totalPages);
  if (typeof renderIcons === 'function') renderIcons(tbody);
}

function renderBandejaPagination(totalPages) {
  const container = document.getElementById('pagination-bandeja-pages');
  const { page }  = bandejaState;

  let html = `<button class="page-btn" data-icon="chevronLeft" aria-label="Página anterior"
                ${page === 1 ? 'disabled' : ''} data-go="prev"></button>`;

  buildPageList(page, totalPages).forEach(p => {
    html += p === '…'
      ? `<span class="page-ellipsis">…</span>`
      : `<button class="page-btn ${p === page ? 'is-active' : ''}" data-go="${p}"
           ${p === page ? 'aria-current="page"' : ''}>${p}</button>`;
  });

  html += `<button class="page-btn" data-icon="chevronRight" aria-label="Página siguiente"
             ${page === totalPages ? 'disabled' : ''} data-go="next"></button>`;

  container.innerHTML = html;
  if (typeof renderIcons === 'function') renderIcons(container);
}

function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

function updateStat() {
  const el = document.getElementById('stat-pendientes');
  if (el) el.textContent = bandejaState.solicitudes.filter(s => s.estado === 'PENDIENTE').length;
}

async function loadBandeja() {
  const tbody = document.getElementById('table-bandeja-body');
  tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Cargando solicitudes...</td></tr>`;

  bandejaState.solicitudes = await db.getSolicitudesAdmision();
  bandejaState.insts       = await db.getInstituciones();
  bandejaState.page        = 1;

  updateStat();
  renderBandejaTable();
}

/* ── DETALLE ─────────────────────────────────────────────── */
async function renderDetalle(id) {
  const solicitudes = await db.getSolicitudesAdmision();
  const sol = solicitudes.find(s => s.id === id);
  if (!sol) return;

  const insts    = await db.getInstituciones();
  const inst     = insts.find(i => i.id === sol.academico.institucionOrigenId);
  const carreras = await db.getCarrerasByInstitucion(sol.academico.institucionOrigenId);
  const carrOrig = carreras.find(c => c.id === sol.academico.carreraOrigenId);

  document.getElementById('detalle-titulo').textContent = `#${sol.id.split('-')[1].slice(-6)}`;
  const badgeEl = document.getElementById('detalle-estado');
  badgeEl.textContent = sol.estado;
  badgeEl.className   = 'badge det-nav__badge ' + (
    sol.estado === 'PENDIENTE'   ? 'badge--warning' :
    sol.estado === 'EN REVISIÓN' ? 'badge--info'    :
    sol.estado === 'APROBADA'    ? 'badge--success'  : ''
  );

  const initials = (
    (sol.postulante.nombres?.[0]  ?? '') +
    (sol.postulante.apellidos?.[0] ?? '')
  ).toUpperCase();
  document.getElementById('det-avatar').textContent = initials || '?';

  document.getElementById('det-postulante-nombre').textContent   = `${sol.postulante.nombres} ${sol.postulante.apellidos}`;
  document.getElementById('det-postulante-correo').textContent   = sol.postulante.correo;
  document.getElementById('det-postulante-dni').textContent      = sol.postulante.dni;
  document.getElementById('det-postulante-telefono').textContent = sol.postulante.telefono || '—';
  document.getElementById('det-origen-inst').textContent    = inst     ? inst.nombre     : 'Desconocida';
  document.getElementById('det-origen-carrera').textContent = carrOrig ? carrOrig.nombre : 'Desconocida';
  document.getElementById('det-destino-unidad').textContent   = sol.academico.unidadDestino;
  document.getElementById('det-destino-facultad').textContent = sol.academico.facultadDestino;
  document.getElementById('det-destino-carrera').textContent  = sol.academico.carreraDestino;

  const malla = await db.getMallaUsilById(sol.academico.mallaDestinoId);
  document.getElementById('det-destino-malla').textContent = malla
    ? malla.anioCodigo
    : (sol.academico.mallaDestinoId || '—');

  const setDoc = (elId, ok) => {
    const container = document.getElementById(elId);
    container.classList.toggle('is-ok',      ok);
    container.classList.toggle('is-missing', !ok);
    const badge  = container.querySelector('.det-doc-item__badge');
    badge.className   = `det-doc-item__badge ${ok ? 'is-ok' : 'is-missing'}`;
    badge.textContent = ok ? 'Recibido' : 'Faltante';
    const iconEl = container.querySelector('.det-doc-item__icon');
    iconEl.setAttribute('data-icon', ok ? 'check' : 'file');
    iconEl.innerHTML = '';
    if (typeof renderIcons === 'function') renderIcons(iconEl);
  };
  setDoc('det-doc-dni',       sol.documentos.dni);
  setDoc('det-doc-matricula', sol.documentos.matricula);
  setDoc('det-doc-record',    sol.documentos.record);

  if (typeof renderIcons === 'function') renderIcons();
  showSection('section-detalle');
}

/* ── CONTEXT BAR (paso 3) ───────────────────────────────── */
function populateContextBar(instOrigenSelect, carreraDestinoSelect, mallaDestinoSelect) {
  const nom = document.getElementById('nombres').value.trim();
  const ape = document.getElementById('apellidos').value.trim();
  document.getElementById('ctx-postulante').textContent = nom && ape ? `${nom} ${ape}` : '—';

  const instOpt = instOrigenSelect.options[instOrigenSelect.selectedIndex];
  document.getElementById('ctx-inst-origen').textContent =
    instOpt && instOpt.value ? instOpt.text : '—';

  const carreraOpt = carreraDestinoSelect.options[carreraDestinoSelect.selectedIndex];
  document.getElementById('ctx-carrera-destino').textContent =
    carreraOpt && carreraOpt.value ? carreraOpt.text : '—';

  const mallaOpt = mallaDestinoSelect.options[mallaDestinoSelect.selectedIndex];
  document.getElementById('ctx-malla').textContent =
    mallaOpt && mallaOpt.value ? mallaOpt.text : '—';
}

/* ── VALIDATION STEP 1 ──────────────────────────────────── */
function validateStep1() {
  const fields = {
    nombres:   document.getElementById('nombres').value.trim(),
    apellidos: document.getElementById('apellidos').value.trim(),
    dni:       document.getElementById('dni').value.trim(),
    correo:    document.getElementById('correo').value.trim(),
  };
  const errors = {};

  if (!fields.nombres)   errors.nombres   = 'El nombre es requerido.';
  if (!fields.apellidos) errors.apellidos = 'Los apellidos son requeridos.';
  if (!fields.dni)       errors.dni       = 'El DNI / Pasaporte es requerido.';
  if (!fields.correo) {
    errors.correo = 'El correo es requerido.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.correo)) {
    errors.correo = 'Ingresa un correo válido.';
  }

  showFieldErrors({ nombres: '', apellidos: '', dni: '', correo: '' });
  showFieldErrors(errors);
  return Object.keys(errors).length === 0;
}

/* ── VALIDATION STEP 2 ──────────────────────────────────── */
function validateStep2(instOrigenSelect, carreraOrigenSelect, mallaDestinoSelect) {
  const errors = {};
  if (!instOrigenSelect.value)    errors['inst-origen']    = 'Seleccione la institución de origen.';
  if (!carreraOrigenSelect.value) errors['carrera-origen'] = 'Seleccione la carrera de origen.';
  if (!mallaDestinoSelect.value)  errors['malla-destino']  = 'Seleccione la malla destino.';

  showFieldErrors({
    'inst-origen': '', 'carrera-origen': '',
    'unidad-destino': '', 'facultad-destino': '', 'carrera-destino': '', 'malla-destino': ''
  });
  showFieldErrors(errors);
  return Object.keys(errors).length === 0;
}

function showFieldErrors(errors) {
  Object.entries(errors).forEach(([fieldId, msg]) => {
    const input = document.getElementById(fieldId);
    if (!input) return;
    const field = input.closest('.field');
    const errEl = field?.querySelector('.field__error');
    if (msg) {
      field?.classList.add('has-error');
      if (errEl) errEl.textContent = msg;
    } else {
      field?.classList.remove('has-error');
      if (errEl) errEl.textContent = '';
    }
  });
}

/* ── RESET WIZARD ───────────────────────────────────────── */
async function resetWizard(form, uploadedDocs, reloadCarrerasOrigen, reloadFacultadesDestino, reloadCarrerasDestino) {
  form.reset();
  await reloadCarrerasOrigen(null);
  await reloadFacultadesDestino(null);
  await reloadCarrerasDestino(null, null);

  document.getElementById('malla-destino').innerHTML = '<option value="">Seleccione primero carrera</option>';
  document.getElementById('malla-destino').disabled = true;

  ['dni', 'matricula', 'record'].forEach(docId => {
    const row     = document.getElementById(`doc-row-${docId}`);
    const labelEl = document.getElementById(`file-label-${docId}`);
    const iconEl  = row.querySelector('.doc-row__icon');
    const btnEl   = row.querySelector('.doc-row__btn');
    const fileIn  = document.getElementById(`file-input-${docId}`);

    row.classList.remove('is-uploaded');
    labelEl.textContent = 'Sin archivo seleccionado';
    iconEl.setAttribute('data-icon', 'file');
    iconEl.innerHTML = '';
    btnEl.innerHTML = '<span class="btn__icon" data-icon="upload"></span>Seleccionar';
    fileIn.value = '';
    uploadedDocs[docId] = null;
    if (typeof renderIcons === 'function') renderIcons(row);
  });

  showFieldErrors({
    nombres: '', apellidos: '', dni: '', correo: '',
    'inst-origen': '', 'carrera-origen': '',
    'unidad-destino': '', 'facultad-destino': '', 'carrera-destino': '', 'malla-destino': ''
  });

  regGoTo(1);
}

/* ── INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof renderIcons === 'function') renderIcons();

  /* DOM refs */
  const instOrigenSelect      = document.getElementById('inst-origen');
  const carreraOrigenSelect   = document.getElementById('carrera-origen');
  const unidadDestinoSelect   = document.getElementById('unidad-destino');
  const facultadDestinoSelect = document.getElementById('facultad-destino');
  const carreraDestinoSelect  = document.getElementById('carrera-destino');
  const mallaDestinoSelect    = document.getElementById('malla-destino');
  const btnRegistrar          = document.getElementById('btn-submit');
  const form                  = document.getElementById('form-admision');
  const toast                 = document.getElementById('toast');
  const tableBandejaBody      = document.getElementById('table-bandeja-body');

  const uploadedDocs = { dni: null, matricula: null, record: null };

  /* ── CASCADE SELECTS ──────────────────────────────────── */
  const reloadInstituciones = async () => {
    instOrigenSelect.innerHTML = '<option value="">Seleccione Institución</option>';
    const all = await db.getInstituciones();
    all.filter(i => i.estado === 'activo').forEach(inst => {
      const o = document.createElement('option');
      o.value = inst.id;
      o.textContent = inst.nombre;
      instOrigenSelect.appendChild(o);
    });
  };

  const reloadCarrerasOrigen = async (instId) => {
    if (!instId) {
      carreraOrigenSelect.innerHTML = '<option value="">Seleccione primero institución</option>';
      carreraOrigenSelect.disabled = true;
      return;
    }
    carreraOrigenSelect.disabled = false;
    carreraOrigenSelect.innerHTML = '<option value="">Seleccione Carrera</option>';
    const carreras = await db.getCarrerasByInstitucion(instId);
    carreras.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.nombre;
      carreraOrigenSelect.appendChild(o);
    });
  };

  const reloadFacultadesDestino = async (unidad) => {
    if (!unidad) { fillSelectOptions(facultadDestinoSelect, []); facultadDestinoSelect.disabled = true; return; }
    facultadDestinoSelect.disabled = false;
    fillSelectOptions(facultadDestinoSelect, await getFacultades(unidad));
  };

  const reloadCarrerasDestino = async (unidad, facultad) => {
    if (!facultad) { fillSelectOptions(carreraDestinoSelect, []); carreraDestinoSelect.disabled = true; return; }
    carreraDestinoSelect.disabled = false;
    fillSelectOptions(carreraDestinoSelect, await getCarreras(unidad, facultad));
  };

  fillSelectOptions(unidadDestinoSelect, await getUnidades());
  await reloadInstituciones();

  instOrigenSelect.addEventListener('change', async (e) => reloadCarrerasOrigen(e.target.value));

  unidadDestinoSelect.addEventListener('change', async (e) => {
    const val = e.target.value;
    await reloadFacultadesDestino(val);
    await reloadCarrerasDestino(val, null);
    mallaDestinoSelect.innerHTML = '<option value="">Seleccione primero carrera</option>';
    carreraDestinoSelect.disabled = true;
    mallaDestinoSelect.disabled = true;
  });

  facultadDestinoSelect.addEventListener('change', async (e) => {
    await reloadCarrerasDestino(unidadDestinoSelect.value, e.target.value);
    mallaDestinoSelect.innerHTML = '<option value="">Seleccione primero carrera</option>';
    mallaDestinoSelect.disabled = true;
  });

  carreraDestinoSelect.addEventListener('change', async (e) => {
    const val = e.target.value;
    mallaDestinoSelect.innerHTML = '<option value="">Seleccione Malla Destino</option>';
    if (val) {
      mallaDestinoSelect.disabled = false;
      const mallas  = await db.getMallasUsil();
      const activas = mallas.filter(m => m.carrera === val && m.estado === 'activo');
      activas.forEach(m => {
        const o = document.createElement('option');
        o.value = m.id;
        o.textContent = `${m.version} - ${m.periodo}`;
        mallaDestinoSelect.appendChild(o);
      });
      if (!activas.length) mallaDestinoSelect.innerHTML = '<option value="">No hay mallas activas</option>';
    } else {
      mallaDestinoSelect.disabled = true;
      mallaDestinoSelect.innerHTML = '<option value="">Seleccione primero carrera</option>';
    }
  });

  /* ── SECTION BUTTONS ──────────────────────────────────── */
  document.addEventListener('app-action', () => {
    regGoTo(1);
    showSection('section-registro');
  });

  document.getElementById('reg-cancel').addEventListener('click', () => showSection('section-bandeja'));
  document.getElementById('btn-volver-bandeja').addEventListener('click', () => showSection('section-bandeja'));

  /* ── WIZARD NAVIGATION ────────────────────────────────── */
  document.getElementById('reg-s1-next').addEventListener('click', () => {
    if (!validateStep1()) return;
    regGoTo(2);
  });

  document.getElementById('reg-s2-back').addEventListener('click', () => regGoTo(1));

  document.getElementById('reg-s2-next').addEventListener('click', () => {
    if (!validateStep2(instOrigenSelect, carreraOrigenSelect, mallaDestinoSelect)) return;
    populateContextBar(instOrigenSelect, carreraDestinoSelect, mallaDestinoSelect);
    regGoTo(3);
  });

  document.getElementById('reg-s3-back').addEventListener('click', () => regGoTo(2));

  /* ── BANDEJA FILTER ───────────────────────────────────── */
  document.getElementById('filter-estado').addEventListener('change', (e) => {
    bandejaState.estadoFilter = e.target.value;
    bandejaState.page = 1;
    renderBandejaTable();
  });

  document.getElementById('filter-clear').addEventListener('click', () => {
    bandejaState.estadoFilter = '';
    bandejaState.page = 1;
    document.getElementById('filter-estado').value = '';
    renderBandejaTable();
  });

  /* ── BANDEJA PAGINATION ───────────────────────────────── */
  document.getElementById('pagination-bandeja-pages').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-go]');
    if (!btn || btn.disabled) return;
    const go = btn.dataset.go;
    const totalPages = Math.max(1, Math.ceil(getFiltered().length / PAGE_SIZE));
    if (go === 'prev')      bandejaState.page = Math.max(1, bandejaState.page - 1);
    else if (go === 'next') bandejaState.page = Math.min(totalPages, bandejaState.page + 1);
    else                    bandejaState.page = Number(go);
    renderBandejaTable();
  });

  /* ── BANDEJA ROW → DETALLE ────────────────────────────── */
  tableBandejaBody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-id]');
    if (btn) renderDetalle(btn.dataset.id);
  });

  /* ── FILE UPLOAD ──────────────────────────────────────── */
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        alert('El archivo no debe superar 2 MB. Comprime o reduce el documento e inténtalo de nuevo.');
        input.value = '';
        return;
      }

      const docId   = input.dataset.doc;
      const dataUrl = await fileToDataUrl(file);
      uploadedDocs[docId] = { nombre: file.name, tipo: file.type, dataUrl };

      const row     = document.getElementById(`doc-row-${docId}`);
      const labelEl = document.getElementById(`file-label-${docId}`);
      const iconEl  = row.querySelector('.doc-row__icon');
      const btnEl   = row.querySelector('.doc-row__btn');

      row.classList.add('is-uploaded');
      labelEl.textContent = file.name;
      iconEl.setAttribute('data-icon', 'check');
      iconEl.innerHTML = '';
      if (typeof renderIcons === 'function') renderIcons(iconEl);
      btnEl.innerHTML = '<span class="btn__icon" data-icon="upload"></span>Cambiar';
      if (typeof renderIcons === 'function') renderIcons(btnEl);
    });
  });

  /* ── FORM SUBMIT ──────────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!uploadedDocs.dni || !uploadedDocs.matricula || !uploadedDocs.record) {
      alert('Adjunta los tres documentos requeridos antes de registrar.');
      return;
    }

    const solicitud = {
      postulante: {
        nombres:   document.getElementById('nombres').value.trim(),
        apellidos: document.getElementById('apellidos').value.trim(),
        dni:       document.getElementById('dni').value.trim(),
        correo:    document.getElementById('correo').value.trim(),
        telefono:  document.getElementById('telefono').value.trim(),
      },
      academico: {
        institucionOrigenId: instOrigenSelect.value,
        carreraOrigenId:     carreraOrigenSelect.value,
        unidadDestino:       unidadDestinoSelect.value,
        facultadDestino:     facultadDestinoSelect.value,
        carreraDestino:      carreraDestinoSelect.value,
        mallaDestinoId:      mallaDestinoSelect.value,
      },
      documentos: {
        dni:       uploadedDocs.dni      || null,
        matricula: uploadedDocs.matricula || null,
        record:    uploadedDocs.record    || null,
      }
    };

    const origHtml = btnRegistrar.innerHTML;
    btnRegistrar.textContent = 'Registrando...';
    btnRegistrar.disabled = true;

    try {
      await db.createSolicitudAdmision(solicitud);

      toast.classList.remove('hidden');
      setTimeout(async () => {
        toast.classList.add('hidden');
        await resetWizard(form, uploadedDocs, reloadCarrerasOrigen, reloadFacultadesDestino, reloadCarrerasDestino);
        await loadBandeja();
        showSection('section-bandeja');
      }, 2000);

    } catch (err) {
      console.error(err);
      alert('Hubo un error al registrar la solicitud.');
    } finally {
      btnRegistrar.innerHTML = origHtml;
      btnRegistrar.disabled = false;
      if (typeof renderIcons === 'function') renderIcons(btnRegistrar);
    }
  });

  /* ── LOAD ─────────────────────────────────────────────── */
  await loadBandeja();
});
