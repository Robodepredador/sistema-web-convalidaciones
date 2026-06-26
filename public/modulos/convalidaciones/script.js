import { db } from '../../../shared/js/db.js';

// ─── STATE ────────────────────────────────────────────────────────────────────
const state = {
  convalidaciones: [],
  convActual: null,
};

// ─── UI ───────────────────────────────────────────────────────────────────────
const UI = {
  sectionBandeja: document.getElementById('section-bandeja'),
  sectionDetalle: document.getElementById('section-detalle'),

  // Bandeja
  bandejaTbody: document.getElementById('bandeja-tbody'),
  filterBusqueda: document.getElementById('filter-busqueda'),
  filterCiclo: document.getElementById('filter-ciclo'),
  filterEstado: document.getElementById('filter-estado'),
  statTotal: document.getElementById('stat-total'),
  statPendiente: document.getElementById('stat-pendiente'),
  statFirmadas: document.getElementById('stat-firmadas'),
  statMem: document.getElementById('stat-mem'),

  // Detalle
  btnVolver: document.getElementById('btn-volver-bandeja'),
  detTitulo: document.getElementById('det-titulo'),
  detEstado: document.getElementById('det-estado'),
  detAlumno: document.getElementById('det-alumno'),
  detDni: document.getElementById('det-dni'),
  detCorreo: document.getElementById('det-correo'),
  detInstitucion: document.getElementById('det-institucion'),
  detCiclo: document.getElementById('det-ciclo'),
  detCarrera: document.getElementById('det-carrera'),
  detMemNum: document.getElementById('det-mem-num'),
  firmaBox: document.getElementById('firma-box'),
  firmaCode: document.getElementById('firma-code'),
  firmaFecha: document.getElementById('firma-fecha'),
  detalleTbody: document.getElementById('detalle-tbody'),
  timeline: document.getElementById('timeline'),

  btnFirmar: document.getElementById('btn-firmar'),
  btnMemorandum: document.getElementById('btn-memorandum'),
  btnImprimir: document.getElementById('btn-imprimir'),

  // Modal firma
  modalFirma: document.getElementById('modal-firma'),
  modalFirmaConfirm: document.getElementById('modal-firma-confirm'),
  modalFirmaCancel: document.getElementById('modal-firma-cancel'),
  modalFirmaClose: document.getElementById('modal-firma-close'),
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function estadoBadgeClass(estado) {
  const map = {
    PENDIENTE_FIRMA: 'badge--warning',
    FIRMADA: 'badge--info',
    MEMORANDUM_EMITIDO: 'badge--success',
    ARCHIVADA: 'badge--neutral',
  };
  return map[estado] || 'badge--warning';
}

function estadoLabel(estado) {
  const labels = {
    PENDIENTE_FIRMA: 'Pendiente de Firma',
    FIRMADA: 'Firmada',
    MEMORANDUM_EMITIDO: 'Memorándum Emitido',
    ARCHIVADA: 'Archivada',
  };
  return labels[estado] || estado;
}

function estadoBadgeHtml(estado) {
  const cls = estadoBadgeClass(estado);
  return `<span class="badge ${cls}"><span class="badge__dot"></span>${estadoLabel(estado)}</span>`;
}

function pctBadge(pct) {
  if (pct == null) return '—';
  const color = pct >= 85 ? 'var(--color-success-text)' : pct >= 70 ? '#b45309' : 'var(--color-error)';
  const bg    = pct >= 85 ? '#dcfce7'                  : pct >= 70 ? '#fef3c7' : '#fee2e2';
  return `<span style="font-weight:700;font-size:12px;color:${color};background:${bg};padding:2px 8px;border-radius:99px;">${pct}%</span>`;
}

function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatFechaHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function safeRender() {
  if (typeof renderIcons === 'function') renderIcons();
}

// ─── BANDEJA ──────────────────────────────────────────────────────────────────
async function loadBandeja() {
  const ciclo  = UI.filterCiclo.value  || undefined;
  const estado = UI.filterEstado.value || undefined;
  const q      = (UI.filterBusqueda.value || '').toLowerCase().trim();

  const all = await db.getConvalidaciones({});
  state.convalidaciones = all;

  UI.statTotal.textContent     = all.length;
  UI.statPendiente.textContent = all.filter(c => c.estado === 'PENDIENTE_FIRMA').length;
  UI.statFirmadas.textContent  = all.filter(c => c.estado === 'FIRMADA').length;
  UI.statMem.textContent       = all.filter(c => c.estado === 'MEMORANDUM_EMITIDO').length;

  let rows = all;
  if (ciclo)  rows = rows.filter(c => c.cicloPostulacion === ciclo);
  if (estado) rows = rows.filter(c => c.estado === estado);
  if (q) {
    rows = rows.filter(c =>
      `${c.alumno?.nombres} ${c.alumno?.apellidos}`.toLowerCase().includes(q) ||
      (c.alumno?.dni || '').includes(q) ||
      (c.carreraUsil || '').toLowerCase().includes(q) ||
      (c.numeroCorrelativo || '').toLowerCase().includes(q)
    );
  }

  renderBandeja(rows);
}

function renderBandeja(rows) {
  if (!rows.length) {
    UI.bandejaTbody.innerHTML =
      '<tr><td colspan="8" class="table-empty">No hay convalidaciones que coincidan con los filtros.</td></tr>';
    return;
  }

  UI.bandejaTbody.innerHTML = rows.map(conv => {
    const nombre = `${conv.alumno?.nombres || ''} ${conv.alumno?.apellidos || ''}`.trim();
    const numMem = conv.numeroCorrelativo
      ? `<span style="font-family:monospace;font-size:12px;color:var(--color-brand-700);font-weight:700;">${conv.numeroCorrelativo}</span>`
      : '<span style="color:var(--color-text-muted);font-style:italic;">Pendiente</span>';
    return `
      <tr>
        <td>${numMem}</td>
        <td>
          <div style="font-weight:600;">${nombre || '—'}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">DNI: ${conv.alumno?.dni || '—'}</div>
          <div style="font-size:11px;color:var(--color-text-muted);">${conv.institucionOrigenNombre || ''}</div>
        </td>
        <td>
          <div style="font-weight:600;font-size:13px;color:var(--color-brand-800);">${conv.carreraUsil || '—'}</div>
        </td>
        <td class="col-center" style="font-weight:600;color:var(--color-brand-700);white-space:nowrap;">${conv.cicloPostulacion || '—'}</td>
        <td class="col-center" style="font-weight:700;color:var(--color-success-text);">${conv.cursosConvalidados ?? '—'}</td>
        <td class="col-center">${estadoBadgeHtml(conv.estado)}</td>
        <td class="col-center">
          <button class="btn btn--primary" style="font-size:var(--fs-sm);padding:5px 16px;white-space:nowrap;"
                  onclick="verDetalle('${conv.id}')">Ver detalle</button>
        </td>
      </tr>`;
  }).join('');

  safeRender();
}

// ─── DETALLE ──────────────────────────────────────────────────────────────────
window.verDetalle = async function (id) {
  const conv = await db.getConvalidacion(id);
  if (!conv) return;
  state.convActual = conv;

  UI.sectionBandeja.classList.remove('is-active');
  UI.sectionDetalle.classList.add('is-active');

  renderDetalle(conv);
};

function renderDetalle(conv) {
  const nombre = `${conv.alumno?.nombres || ''} ${conv.alumno?.apellidos || ''}`.trim();

  UI.detTitulo.textContent = conv.numeroCorrelativo || conv.id;
  UI.detEstado.className = `badge ${estadoBadgeClass(conv.estado)}`;
  UI.detEstado.innerHTML = `<span class="badge__dot"></span>${estadoLabel(conv.estado)}`;

  UI.detAlumno.textContent      = nombre || '—';
  UI.detDni.textContent         = conv.alumno?.dni || '—';
  UI.detCorreo.textContent      = conv.alumno?.correo || '—';
  UI.detInstitucion.textContent = conv.institucionOrigenNombre || '—';
  UI.detCiclo.textContent       = conv.cicloPostulacion || '—';
  UI.detCarrera.textContent     = conv.carreraUsil || '—';

  if (conv.numeroCorrelativo) {
    UI.detMemNum.innerHTML = `<span style="font-family:monospace;font-size:13px;color:var(--color-brand-700);font-weight:700;">${conv.numeroCorrelativo}</span> · ${formatFecha(conv.fechaMemorandum)}`;
  } else {
    UI.detMemNum.textContent = 'Sin memorándum aún';
  }

  // Firma virtual
  if (conv.firmaAlumno) {
    UI.firmaCode.textContent = conv.firmaAlumno;
    UI.firmaFecha.textContent = formatFechaHora(conv.fechaFirma);
    UI.firmaBox.classList.add('is-visible');
  } else {
    UI.firmaBox.classList.remove('is-visible');
  }

  // Tabla snapshot
  const snaps = conv.equivalenciasSnapshot || [];
  UI.detalleTbody.innerHTML = snaps.length ? snaps.map((eq, i) => `
    <tr>
      <td style="color:var(--color-text-muted);font-weight:600;">${i + 1}</td>
      <td style="font-family:monospace;font-size:12px;">${eq.cursoExtCodigo || '—'}</td>
      <td>
        <div style="font-weight:600;font-size:13px;">${eq.cursoExtNombre || '—'}</div>
      </td>
      <td class="col-center" style="color:var(--color-text-muted);">${eq.cursoExtCreditos ?? '—'}</td>
      <td style="font-family:monospace;font-size:12px;">${eq.cursoUsilCodigo || '—'}</td>
      <td>
        <div style="font-weight:600;font-size:13px;color:var(--color-brand-800);">${eq.cursoUsilNombre || '—'}</div>
      </td>
      <td class="col-center" style="font-weight:600;">${eq.cursoUsilCreditos ?? '—'}</td>
      <td class="col-center">${pctBadge(eq.porcentajeSimilitud)}</td>
    </tr>
  `).join('') : '<tr><td colspan="8" class="table-empty">Sin equivalencias en snapshot.</td></tr>';

  // Timeline de auditoría
  const auditoria = conv.auditoria || [];
  const accionLabels = {
    CREADA: 'Convalidación creada',
    ENVIADA_ALUMNO: 'Simulación enviada al alumno',
    FIRMADA: 'Firma del alumno registrada',
    MEMORANDUM_EMITIDO: 'Memorándum emitido',
    ARCHIVADA: 'Expediente archivado',
  };
  const accionesDone = new Set(auditoria.map(a => a.accion));
  const todosLosHitos = ['CREADA', 'ENVIADA_ALUMNO', 'FIRMADA', 'MEMORANDUM_EMITIDO'];

  UI.timeline.innerHTML = todosLosHitos.map(accion => {
    const evento = auditoria.find(a => a.accion === accion);
    const isDone = !!evento;
    const cls = isDone ? 'is-done' : 'is-pending';
    const label = accionLabels[accion] || accion;
    return `
      <div class="timeline-item ${cls}">
        <div class="timeline-item__accion">${label}</div>
        ${isDone ? `
          <div class="timeline-item__meta">
            ${formatFechaHora(evento.timestamp)} · ${evento.usuario}
            ${evento.detalle ? `<br><span style="color:var(--color-text-secondary);">${evento.detalle}</span>` : ''}
          </div>` : `
          <div class="timeline-item__meta" style="color:var(--color-border);">Pendiente</div>`}
      </div>`;
  }).join('');

  // Botones según estado
  UI.btnFirmar.disabled     = conv.estado !== 'PENDIENTE_FIRMA';
  UI.btnMemorandum.disabled = conv.estado !== 'FIRMADA';
  UI.btnImprimir.disabled   = conv.estado !== 'MEMORANDUM_EMITIDO';

  safeRender();
}

// ─── ACCIONES ─────────────────────────────────────────────────────────────────
function abrirModalFirma() {
  UI.modalFirma.classList.remove('hidden');
}

function cerrarModalFirma() {
  UI.modalFirma.classList.add('hidden');
}

async function confirmarFirma() {
  cerrarModalFirma();
  const conv = state.convActual;
  if (!conv) return;
  UI.btnFirmar.disabled = true;
  try {
    await db.firmarConvalidacion(conv.id);
    state.convActual = await db.getConvalidacion(conv.id);
    renderDetalle(state.convActual);
    showToast('Firma del alumno registrada correctamente.');
  } catch (err) {
    console.error(err);
    UI.btnFirmar.disabled = false;
    alert('Error al registrar firma: ' + err.message);
  }
}

async function emitirMemorandum() {
  const conv = state.convActual;
  if (!conv) return;
  UI.btnMemorandum.disabled = true;
  try {
    await db.generarMemorandum(conv.id, {
      aprobadoPor: 'Dr. Alberto Ruiz',
      cargo: 'Director Académico',
    });
    state.convActual = await db.getConvalidacion(conv.id);
    renderDetalle(state.convActual);
    showToast(`Memorándum ${state.convActual.numeroCorrelativo} emitido correctamente.`);
  } catch (err) {
    console.error(err);
    UI.btnMemorandum.disabled = false;
    alert('Error al emitir memorándum: ' + err.message);
  }
}

function imprimirMemorandum(conv) {
  const nombre = `${conv.alumno?.nombres || ''} ${conv.alumno?.apellidos || ''}`.trim();
  const fechaDoc = new Date(conv.fechaMemorandum || new Date()).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const snaps = conv.equivalenciasSnapshot || [];
  const filas = snaps.map((eq, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${eq.cursoExtCodigo || '—'}</td>
      <td>${eq.cursoExtNombre || '—'}</td>
      <td style="text-align:center;">${eq.cursoExtCreditos ?? '—'}</td>
      <td>${eq.cursoUsilCodigo || '—'}</td>
      <td>${eq.cursoUsilNombre || '—'}</td>
      <td style="text-align:center;">${eq.cursoUsilCreditos ?? '—'}</td>
      <td style="text-align:center;">${eq.porcentajeSimilitud != null ? eq.porcentajeSimilitud + '%' : '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${conv.numeroCorrelativo} — USIL</title>
<style>
  body{font-family:Arial,sans-serif;margin:50px;font-size:12px;color:#111;line-height:1.5;}
  .header{text-align:center;margin-bottom:30px;}
  .escudo{font-size:32px;margin-bottom:8px;}
  .inst{font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;}
  .sub{font-size:11px;color:#555;margin-top:4px;}
  .titulo-doc{font-size:14px;font-weight:bold;text-align:center;margin:24px 0 6px;text-decoration:underline;text-transform:uppercase;}
  .num-doc{font-size:13px;font-weight:bold;text-align:center;color:#003e7e;margin-bottom:20px;}
  .divider{border:none;border-top:2px solid #003e7e;margin:16px 0;}
  .encabezado{margin-bottom:16px;font-size:12px;}
  .encabezado tr td:first-child{font-weight:bold;width:80px;padding:3px 12px 3px 0;color:#003e7e;text-transform:uppercase;font-size:10px;}
  table.datos{width:100%;border-collapse:collapse;margin:16px 0;font-size:11px;}
  table.datos th{background:#003e7e;color:#fff;padding:6px 8px;text-align:left;}
  table.datos td{padding:5px 8px;border-bottom:1px solid #e5e7eb;}
  table.datos tr:nth-child(even){background:#f9fafb;}
  .resumen{margin:12px 0;font-size:12px;background:#f0f9ff;border:1px solid #bae6fd;padding:8px 12px;border-radius:4px;}
  .cuerpo{margin-bottom:16px;}
  .firma-digital{background:#f0fdf4;border:1px solid #86efac;padding:8px 12px;border-radius:4px;font-size:10px;margin:16px 0;}
  .firmas{margin-top:60px;display:grid;grid-template-columns:1fr 1fr;gap:80px;}
  .firma-bloque{text-align:center;}
  .firma-linea{border-top:1px solid #374151;padding-top:8px;font-size:11px;}
  .sello{border:2px dashed #003e7e;padding:10px;text-align:center;font-size:10px;color:#003e7e;margin-top:24px;border-radius:4px;}
  @media print{body{margin:30px;}}
</style>
</head>
<body>
<div class="header">
  <div class="escudo">🎓</div>
  <div class="inst">Universidad San Ignacio de Loyola</div>
  <div class="sub">${conv.facultadUsil || 'Coordinación Académica'}</div>
</div>
<hr class="divider">
<div class="titulo-doc">Memorándum de Resolución de Convalidación de Cursos</div>
<div class="num-doc">${conv.numeroCorrelativo || '—'}</div>

<table class="encabezado">
  <tr><td>Lima</td><td>${fechaDoc}</td></tr>
  <tr><td>Para</td><td>Jefatura de Registro Académico — USIL</td></tr>
  <tr><td>De</td><td>${conv.aprobadoPor || '—'}, ${conv.aprobadoCargo || '—'}</td></tr>
  <tr><td>Asunto</td><td><strong>Resolución de Convalidación de Cursos — Postulante ${nombre}</strong></td></tr>
  <tr><td>Ref.</td><td>Solicitud de Admisión por Traslado Externo — ${conv.cicloPostulacion || '—'}</td></tr>
</table>
<hr class="divider">

<div class="cuerpo">
  <p>Por medio del presente, me dirijo a usted para comunicar la <strong>resolución favorable de convalidación de cursos</strong> del siguiente postulante, en el marco de su proceso de traslado externo a nuestra institución:</p>

  <table class="encabezado" style="margin:12px 0;">
    <tr><td>Postulante</td><td><strong>${nombre}</strong></td></tr>
    <tr><td>DNI</td><td>${conv.alumno?.dni || '—'}</td></tr>
    <tr><td>Correo</td><td>${conv.alumno?.correo || '—'}</td></tr>
    <tr><td>Inst. Origen</td><td>${conv.institucionOrigenNombre || '—'}</td></tr>
    <tr><td>Carrera USIL</td><td>${conv.carreraUsil || '—'}</td></tr>
    <tr><td>Ciclo</td><td>${conv.cicloPostulacion || '—'}</td></tr>
  </table>

  <p><strong>Relación de cursos convalidados:</strong></p>

  <table class="datos">
    <thead>
      <tr>
        <th>#</th><th>Cód. Origen</th><th>Curso de Origen</th><th>Cred.</th>
        <th>Cód. USIL</th><th>Equivalente USIL</th><th>Cred.</th><th>Similitud</th>
      </tr>
    </thead>
    <tbody>${filas || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">Sin cursos</td></tr>'}</tbody>
  </table>

  <div class="resumen">
    <strong>Resumen:</strong> ${snaps.length} curso(s) convalidado(s) ·
    ${conv.creditosConvalidados || 0} créditos USIL reconocidos ·
    Avance en malla: ${conv.creditosTotalesMalla > 0 ? Math.round(((conv.creditosConvalidados || 0) / conv.creditosTotalesMalla) * 100) : 0}%
  </div>

  <p>En consecuencia, se solicita a la Jefatura de Registro Académico proceder con el registro oficial de las convalidaciones aprobadas en el sistema académico institucional (INFOSIL).</p>
</div>

${conv.firmaAlumno ? `
<div class="firma-digital">
  <strong>✔ Firma virtual del alumno:</strong> ${conv.firmaAlumno}<br>
  Fecha de aceptación: ${new Date(conv.fechaFirma).toLocaleString('es-PE')}
</div>` : ''}

<div class="firmas">
  <div class="firma-bloque">
    <div class="firma-linea">
      <strong>${conv.coordinadorNombre || '—'}</strong><br>
      ${conv.coordinadorCargo || 'Coordinador Académico'}<br>
      ${conv.facultadUsil || 'USIL'}
    </div>
  </div>
  <div class="firma-bloque">
    <div class="firma-linea">
      <strong>${conv.aprobadoPor || '—'}</strong><br>
      ${conv.aprobadoCargo || 'Director Académico'}<br>
      Universidad San Ignacio de Loyola
    </div>
  </div>
</div>

<div class="sello">
  Documento generado por el Sistema de Convalidaciones USIL<br>
  Ref. ${conv.numeroCorrelativo} · ${new Date().toLocaleString('es-PE')}
</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=950,height=750,scrollbars=yes');
  if (!win) { alert('Permite ventanas emergentes para imprimir.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

// ─── CREAR DESDE SIMULACIÓN ───────────────────────────────────────────────────
async function crearDesdeSimulacion() {
  const sims = await db.getSimulaciones({ estado: 'ENVIADA_ALUMNO' });
  if (!sims.length) {
    alert('No hay simulaciones en estado "Enviada al alumno" para generar una convalidación.');
    return;
  }
  const sim = sims[0];
  const simDetalle = await db.getSimulacion(sim.id);

  const snapshot = (simDetalle._equivalencias || []).map(eq => ({
    id: eq.id,
    cursoExtNombre: eq.cursoExt?.nombre || eq.cursoExtSnapshot?.nombre || '—',
    cursoExtCodigo: eq.cursoExt?.codigo || eq.cursoExtSnapshot?.codigo || '—',
    cursoExtCreditos: eq.cursoExt?.creditos ?? eq.cursoExtSnapshot?.creditos ?? 0,
    cursoUsilNombre: eq.cursoUsil?.nombre || eq.cursoUsilSnapshot?.nombre || '—',
    cursoUsilCodigo: eq.cursoUsil?.codigo || eq.cursoUsilSnapshot?.codigo || '—',
    cursoUsilCreditos: eq.cursoUsil?.creditos ?? eq.cursoUsilSnapshot?.creditos ?? 0,
    porcentajeSimilitud: eq.porcentajeSimilitud,
    estado: eq.estado,
  }));

  await db.createConvalidacion({
    simulacionId: sim.id,
    solicitudAdmisionId: sim.solicitudAdmisionId,
    cicloPostulacion: sim.cicloPostulacion,
    coordinadorId: sim.coordinadorId,
    coordinadorNombre: sim.coordinadorNombre,
    coordinadorCargo: 'Coordinador Académico',
    alumno: sim.alumno,
    carreraUsil: sim.carreraUsil,
    facultadUsil: sim.facultadUsil,
    mallaUsilId: sim.mallaUsilId,
    institucionOrigenId: sim.institucionOrigenId,
    institucionOrigenNombre: sim.institucionOrigenNombre,
    equivalenciasSnapshot: snapshot,
    creditosConvalidados: sim.creditosConvalidados,
    creditosTotalesMalla: sim.creditosTotalesMalla,
    cursosConvalidados: sim.cursosConvalidados,
  });

  showToast('Convalidación creada correctamente.');
  await loadBandeja();
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.querySelector('.toast__msg').textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// ─── LISTENERS ────────────────────────────────────────────────────────────────
function setupListeners() {
  UI.filterBusqueda?.addEventListener('input',  () => loadBandeja());
  UI.filterCiclo?.addEventListener('change',    () => loadBandeja());
  UI.filterEstado?.addEventListener('change',   () => loadBandeja());

  document.getElementById('filter-clear')?.addEventListener('click', () => {
    UI.filterBusqueda.value = '';
    UI.filterCiclo.value    = '';
    UI.filterEstado.value   = '';
    loadBandeja();
  });

  UI.btnVolver?.addEventListener('click', () => {
    UI.sectionDetalle.classList.remove('is-active');
    UI.sectionBandeja.classList.add('is-active');
    loadBandeja();
  });

  UI.btnFirmar?.addEventListener('click', abrirModalFirma);
  UI.modalFirmaConfirm?.addEventListener('click', confirmarFirma);
  UI.modalFirmaCancel?.addEventListener('click', cerrarModalFirma);
  UI.modalFirmaClose?.addEventListener('click', cerrarModalFirma);
  UI.modalFirma?.addEventListener('click', e => {
    if (e.target === UI.modalFirma) cerrarModalFirma();
  });

  UI.btnMemorandum?.addEventListener('click', emitirMemorandum);

  UI.btnImprimir?.addEventListener('click', () => {
    if (state.convActual) imprimirMemorandum(state.convActual);
  });

  document.addEventListener('app-action', async e => {
    if (e.detail?.id === 'nueva-convalidacion') {
      await crearDesdeSimulacion();
    }
  });
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
async function init() {
  await loadBandeja();
  setupListeners();
}

init().catch(err => {
  console.error('Init error:', err);
  alert('Error al inicializar el módulo de Convalidaciones: ' + err.message);
});
