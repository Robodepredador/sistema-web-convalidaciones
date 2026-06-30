import { db } from '../../shared/js/db.js';

// ─── STATE ────────────────────────────────────────────────────────────────────
const state = {
  paso: 1,
  datos: {},
  archivos: [],
  carreraUsilNombre: '',
  facultadNombre: '',
  resultados: null,
};

// ─── NAVEGACIÓN ───────────────────────────────────────────────────────────────
function mostrarPaso(n) {
  document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('is-active'));
  const panel = document.getElementById(`paso-${n}`);
  if (panel) panel.classList.add('is-active');

  const stepperWrap = document.getElementById('stepper-wrap');
  if (stepperWrap) stepperWrap.style.display = n >= 6 ? 'none' : '';

  if (n <= 5) actualizarStepper(n);
  state.paso = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function actualizarStepper(activo) {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`step-ind-${i}`);
    if (!el) continue;
    el.classList.remove('is-active', 'is-done');
    if (i < activo)  el.classList.add('is-done');
    if (i === activo) el.classList.add('is-active');
  }
}

// ─── VALIDACIÓN ───────────────────────────────────────────────────────────────
function limpiarErrores(campos) {
  campos.forEach(id => {
    const el = document.querySelector(`[data-error-for="${id}"]`);
    if (el) el.textContent = '';
    const input = document.getElementById(id);
    if (input) input.closest('.field')?.classList.remove('has-error');
  });
}

function mostrarError(id, msg) {
  const el = document.querySelector(`[data-error-for="${id}"]`);
  if (el) el.textContent = msg;
  const input = document.getElementById(id);
  if (input) input.closest('.field')?.classList.add('has-error');
}

function validarPaso1() {
  const campos = ['p1-nombres', 'p1-apellidos', 'p1-tipo-doc', 'p1-num-doc', 'p1-email', 'p1-telefono'];
  limpiarErrores(campos);
  let ok = true;

  const val = id => document.getElementById(id)?.value.trim() || '';

  if (!val('p1-nombres')) { mostrarError('p1-nombres', 'Ingresa tus nombres'); ok = false; }
  if (!val('p1-apellidos')) { mostrarError('p1-apellidos', 'Ingresa tus apellidos'); ok = false; }
  if (!val('p1-tipo-doc')) { mostrarError('p1-tipo-doc', 'Selecciona un tipo de documento'); ok = false; }
  if (!val('p1-num-doc')) { mostrarError('p1-num-doc', 'Ingresa tu número de documento'); ok = false; }
  if (!val('p1-email') || !val('p1-email').includes('@')) { mostrarError('p1-email', 'Ingresa un correo válido'); ok = false; }
  if (!val('p1-telefono')) { mostrarError('p1-telefono', 'Ingresa tu teléfono'); ok = false; }

  if (ok) {
    state.datos = {
      ...state.datos,
      nombres:   val('p1-nombres'),
      apellidos: val('p1-apellidos'),
      tipoDoc:   val('p1-tipo-doc'),
      numDoc:    val('p1-num-doc'),
      email:     val('p1-email'),
      telefono:  val('p1-telefono'),
    };
  }
  return ok;
}

function validarPaso2() {
  const campos = ['p2-tipo-inst', 'p2-nombre-inst', 'p2-carrera', 'p2-anio-ingreso'];
  limpiarErrores(campos);
  let ok = true;

  const val = id => document.getElementById(id)?.value.trim() || '';

  if (!val('p2-tipo-inst'))    { mostrarError('p2-tipo-inst',    'Selecciona un tipo de institución'); ok = false; }
  if (!val('p2-nombre-inst'))  { mostrarError('p2-nombre-inst',  'Ingresa el nombre de tu institución'); ok = false; }
  if (!val('p2-carrera'))      { mostrarError('p2-carrera',      'Ingresa tu carrera de origen'); ok = false; }
  if (!val('p2-anio-ingreso')) { mostrarError('p2-anio-ingreso', 'Selecciona el año de ingreso'); ok = false; }

  if (ok) {
    state.datos = {
      ...state.datos,
      tipoInstitucion: val('p2-tipo-inst'),
      institucion:     val('p2-nombre-inst'),
      carreraOrigen:   val('p2-carrera'),
      anioIngreso:     val('p2-anio-ingreso'),
      anioEgreso:      val('p2-anio-egreso'),
    };
  }
  return ok;
}

function validarPaso3() {
  // Documentos: al menos 1 archivo requerido para seguir
  if (state.archivos.length === 0) {
    alert('Debes adjuntar al menos un documento (certificado de estudios).');
    return false;
  }
  return true;
}

function validarPaso4() {
  const campos = ['p4-facultad', 'p4-carrera'];
  limpiarErrores(campos);
  let ok = true;

  const facultad = document.getElementById('p4-facultad')?.value;
  const carrera  = document.getElementById('p4-carrera')?.value;

  if (!facultad) { mostrarError('p4-facultad', 'Selecciona una facultad'); ok = false; }
  if (!carrera)  { mostrarError('p4-carrera', 'Selecciona una carrera'); ok = false; }

  if (ok) {
    state.datos = {
      ...state.datos,
      facultadUsil: facultad,
      carreraUsil:  carrera,
    };
    state.carreraUsilNombre = carrera;
    state.facultadNombre    = facultad;
  }
  return ok;
}

// ─── PASO 2: DROPDOWNS DE AÑO ─────────────────────────────────────────────────
function poblarAnios() {
  const anioActual = new Date().getFullYear();
  ['p2-anio-ingreso', 'p2-anio-egreso'].forEach((id, i) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    if (i === 1) sel.innerHTML = '<option value="">No egresé aún</option>';
    else sel.innerHTML = '<option value="">Seleccionar…</option>';
    for (let y = anioActual; y >= 1990; y--) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      sel.appendChild(opt);
    }
  });
}

// ─── PASO 2: DATALIST DE INSTITUCIONES ────────────────────────────────────────
async function poblarInstDatalist() {
  try {
    const insts = await db.getInstituciones();
    const dl = document.getElementById('inst-datalist');
    if (!dl) return;
    dl.innerHTML = '';
    insts.forEach(inst => {
      const opt = document.createElement('option');
      opt.value = inst.nombre;
      dl.appendChild(opt);
    });
  } catch (_) {}
}

// ─── PASO 3: DRAG & DROP ──────────────────────────────────────────────────────
function setupDragDrop() {
  const zone = document.getElementById('upload-zone');
  const input = document.getElementById('file-input');
  const btnSel = document.getElementById('btn-select-files');
  if (!zone || !input) return;

  btnSel?.addEventListener('click', e => { e.stopPropagation(); input.click(); });
  zone.addEventListener('click', () => input.click());

  zone.addEventListener('dragenter', e => { e.preventDefault(); zone.classList.add('is-drag'); });
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('is-drag'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('is-drag'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('is-drag');
    agregarArchivos([...e.dataTransfer.files]);
  });
  input.addEventListener('change', () => {
    agregarArchivos([...input.files]);
    input.value = '';
  });
}

function agregarArchivos(nuevos) {
  const validos = nuevos.filter(f => {
    const ext = f.name.split('.').pop().toLowerCase();
    return ['pdf','jpg','jpeg','png'].includes(ext) && f.size <= 10 * 1024 * 1024;
  });
  if (validos.length < nuevos.length) {
    alert('Solo se aceptan archivos PDF, JPG o PNG de máximo 10 MB.');
  }
  state.archivos = [...state.archivos, ...validos];
  renderFileList();
}

function renderFileList() {
  const ul = document.getElementById('file-list');
  if (!ul) return;
  if (!state.archivos.length) { ul.innerHTML = ''; return; }
  ul.innerHTML = state.archivos.map((f, i) => `
    <li class="upload-file-item">
      <span class="upload-file-item__name">${f.name}</span>
      <span class="upload-file-item__size">${(f.size / 1024).toFixed(0)} KB</span>
      <button class="upload-file-item__del" data-idx="${i}" title="Eliminar">&times;</button>
    </li>`).join('');
  ul.querySelectorAll('.upload-file-item__del').forEach(btn => {
    btn.addEventListener('click', () => {
      state.archivos.splice(Number(btn.dataset.idx), 1);
      renderFileList();
    });
  });
}

// ─── PASO 4: DROPDOWNS ENCADENADOS ───────────────────────────────────────────
async function poblarFacultades() {
  try {
    const catalog = await db.getUsilCatalog();
    const unidad  = catalog['Pregrado'] || {};
    const selFac  = document.getElementById('p4-facultad');
    if (!selFac) return;
    selFac.innerHTML = '<option value="">Seleccionar facultad…</option>';
    Object.keys(unidad).forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      selFac.appendChild(opt);
    });
  } catch (_) {}
}

async function onFacultadChange() {
  const selFac    = document.getElementById('p4-facultad');
  const selCarr   = document.getElementById('p4-carrera');
  const infoPanel = document.getElementById('p4-info');
  const facultad  = selFac?.value;

  if (!selCarr) return;
  selCarr.innerHTML = '<option value="">Seleccionar carrera…</option>';
  selCarr.disabled = !facultad;
  if (infoPanel) infoPanel.style.display = 'none';

  if (!facultad) return;

  try {
    const catalog   = await db.getUsilCatalog();
    const carreras  = catalog['Pregrado']?.[facultad] || [];
    carreras.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      selCarr.appendChild(opt);
    });
    selCarr.disabled = false;
  } catch (_) {}
}

function onCarreraChange() {
  const carrera  = document.getElementById('p4-carrera')?.value;
  const facultad = document.getElementById('p4-facultad')?.value;
  const infoPanel = document.getElementById('p4-info');
  if (!infoPanel) return;
  if (!carrera) { infoPanel.style.display = 'none'; return; }
  document.getElementById('p4-carrera-nombre').textContent = carrera;
  document.getElementById('p4-facultad-nombre').textContent = facultad;
  infoPanel.style.display = '';
}

// ─── PASO 5: RESUMEN ──────────────────────────────────────────────────────────
function renderResumen() {
  const d = state.datos;
  const grid = document.getElementById('confirm-grid');
  if (!grid) return;

  const iconPerson = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
  const iconInst   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
  const iconCarr   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`;
  const iconDoc    = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;

  const fila = (label, value) => `
    <div class="confirm-row">
      <span class="confirm-row__label">${label}</span>
      <span class="confirm-row__value">${value || '—'}</span>
    </div>`;

  grid.innerHTML = `
    <div class="confirm-card">
      <div class="confirm-card__title">${iconPerson} Datos personales</div>
      ${fila('Nombre', `${d.nombres} ${d.apellidos}`)}
      ${fila('Documento', `${d.tipoDoc}: ${d.numDoc}`)}
      ${fila('Email', d.email)}
      ${fila('Teléfono', d.telefono)}
    </div>
    <div class="confirm-card">
      <div class="confirm-card__title">${iconInst} Institución de origen</div>
      ${fila('Tipo', d.tipoInstitucion)}
      ${fila('Institución', d.institucion)}
      ${fila('Carrera', d.carreraOrigen)}
      ${fila('Período', `${d.anioIngreso}${d.anioEgreso ? ' — ' + d.anioEgreso : ''}`)}
    </div>
    <div class="confirm-card">
      <div class="confirm-card__title">${iconCarr} Carrera destino USIL</div>
      ${fila('Facultad', d.facultadUsil)}
      ${fila('Carrera', d.carreraUsil)}
    </div>
    <div class="confirm-card">
      <div class="confirm-card__title">${iconDoc} Documentos cargados</div>
      ${state.archivos.length
        ? state.archivos.map(f => fila('', f.name)).join('')
        : fila('', '<span style="color:var(--color-text-muted)">Sin archivos adjuntos</span>')}
    </div>`;
}

// ─── PASO 6: ANIMACIÓN PROCESANDO ─────────────────────────────────────────────
function animarProcesando(onDone) {
  const bar  = document.getElementById('proc-bar');
  const steps = ['proc-s1','proc-s2','proc-s3','proc-s4','proc-s5'];
  let pct = 0;

  const avanzar = (i) => {
    if (i >= steps.length) {
      if (bar) bar.style.width = '100%';
      setTimeout(onDone, 600);
      return;
    }
    const prev = steps[i - 1];
    if (prev) {
      const el = document.getElementById(prev);
      if (el) { el.classList.remove('is-active'); el.classList.add('is-done'); }
    }
    const cur = document.getElementById(steps[i]);
    if (cur) cur.classList.add('is-active');

    pct = Math.round(((i + 1) / steps.length) * 95);
    if (bar) bar.style.width = pct + '%';

    setTimeout(() => avanzar(i + 1), 800);
  };

  avanzar(0);
}

// ─── PASO 7: RESULTADOS ───────────────────────────────────────────────────────
function renderResultados() {
  const r = state.resultados;
  if (!r) return;

  const { id, resumen, equivalenciasPreliminares } = r;

  document.getElementById('result-id').textContent = id;
  document.getElementById('result-pct').textContent = resumen.pctConvalidable + '%';
  document.getElementById('result-sub').textContent =
    `${resumen.convalidables} de ${resumen.total} cursos tienen equivalente en la malla USIL`;

  const statsEl = document.getElementById('result-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="result-stat">
        <div class="result-stat__val" style="color:var(--color-brand-800);">${resumen.total}</div>
        <div class="result-stat__label">Cursos analizados</div>
      </div>
      <div class="result-stat">
        <div class="result-stat__val" style="color:var(--color-success-text);">${resumen.convalidables}</div>
        <div class="result-stat__label">Convalidables</div>
      </div>
      <div class="result-stat">
        <div class="result-stat__val" style="color:var(--color-brand-500);">${resumen.creditosEstimados}</div>
        <div class="result-stat__label">Créditos estimados</div>
      </div>`;
  }

  const tbody = document.getElementById('result-tbody');
  if (!tbody) return;

  if (!equivalenciasPreliminares?.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="padding:40px;text-align:center;color:var(--color-text-muted);">No se encontraron equivalencias preliminares.</td></tr>';
    return;
  }

  tbody.innerHTML = equivalenciasPreliminares.map(eq => {
    const pct = eq.similitud;
    const color = pct >= 70 ? '#22c55e' : pct >= 45 ? '#f59e0b' : '#ef4444';
    const badge = pct >= 70 ? '#dcfce7' : pct >= 45 ? '#fef3c7' : '#fee2e2';
    const textBadge = pct >= 70 ? '#15803d' : pct >= 45 ? '#b45309' : '#b91c1c';
    const label = pct >= 70 ? 'Probable' : pct >= 45 ? 'Posible' : 'Baja similitud';
    return `
      <tr style="border-bottom:1px solid var(--color-border-subtle);">
        <td style="padding:10px 12px;font-weight:500;">${eq.cursoExt}</td>
        <td style="padding:10px 12px;">${eq.cursoUsil}</td>
        <td style="padding:10px 12px;text-align:center;color:var(--color-text-muted);">${eq.creditosUsil}</td>
        <td style="padding:10px 12px;text-align:center;">
          <div style="display:flex;align-items:center;gap:6px;justify-content:center;">
            <div style="width:48px;height:6px;background:var(--color-border);border-radius:99px;overflow:hidden;">
              <div style="width:${pct}%;height:100%;background:${color};border-radius:99px;"></div>
            </div>
            <span style="font-weight:600;font-size:13px;color:${color};">${pct}%</span>
          </div>
        </td>
        <td style="padding:10px 12px;text-align:center;">
          <span style="background:${badge};color:${textBadge};font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;">
            ${label}
          </span>
        </td>
      </tr>`;
  }).join('');
}

// ─── ENVIAR SIMULACIÓN ────────────────────────────────────────────────────────
async function enviarSimulacion() {
  mostrarPaso(6);
  const archivosNombres = state.archivos.map(f => f.name);

  animarProcesando(async () => {
    try {
      const result = await db.createSimulacionExterna({
        datos:           state.datos,
        archivosNombres,
      });
      state.resultados = result;
      renderResultados();
      mostrarPaso(7);
    } catch (err) {
      console.error('Error al crear simulación:', err);
      alert('Ocurrió un error al procesar la simulación. Inténtalo nuevamente.');
      mostrarPaso(5);
    }
  });
}

// ─── LISTENERS ────────────────────────────────────────────────────────────────
function setupListeners() {
  document.getElementById('btn-paso1-sig')?.addEventListener('click', () => {
    if (validarPaso1()) mostrarPaso(2);
  });

  document.getElementById('btn-paso2-ant')?.addEventListener('click', () => mostrarPaso(1));
  document.getElementById('btn-paso2-sig')?.addEventListener('click', () => {
    if (validarPaso2()) mostrarPaso(3);
  });

  document.getElementById('btn-paso3-ant')?.addEventListener('click', () => mostrarPaso(2));
  document.getElementById('btn-paso3-sig')?.addEventListener('click', () => {
    if (validarPaso3()) mostrarPaso(4);
  });

  document.getElementById('btn-paso4-ant')?.addEventListener('click', () => mostrarPaso(3));
  document.getElementById('btn-paso4-sig')?.addEventListener('click', () => {
    if (validarPaso4()) { renderResumen(); mostrarPaso(5); }
  });

  document.getElementById('p4-facultad')?.addEventListener('change', onFacultadChange);
  document.getElementById('p4-carrera')?.addEventListener('change', onCarreraChange);

  document.getElementById('btn-paso5-ant')?.addEventListener('click', () => mostrarPaso(4));
  document.getElementById('btn-enviar-sim')?.addEventListener('click', enviarSimulacion);

  document.getElementById('btn-nueva-sim')?.addEventListener('click', () => {
    state.paso = 1;
    state.datos = {};
    state.archivos = [];
    state.resultados = null;
    state.carreraUsilNombre = '';
    renderFileList();
    mostrarPaso(1);
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  poblarAnios();
  setupDragDrop();
  setupListeners();
  await Promise.all([
    poblarInstDatalist(),
    poblarFacultades(),
  ]);
  mostrarPaso(1);
}

init().catch(err => console.error('Init error:', err));
