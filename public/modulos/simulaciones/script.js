import { db } from '../../../shared/js/db.js';

const coordinador =
  (typeof CURRENT_USER !== 'undefined' && CURRENT_USER?.name) || 'Coordinador Académico';

// ─── STATE ────────────────────────────────────────────────────────────────────
const state = {
  simulaciones: [],
  simulacionActual: null,
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
  statGeneradas: document.getElementById('stat-generadas'),
  statEnviadas: document.getElementById('stat-enviadas'),
  statAprobadas: document.getElementById('stat-aprobadas'),

  // Detalle
  btnVolver: document.getElementById('btn-volver-bandeja'),
  detTitulo: document.getElementById('det-titulo'),
  detEstado: document.getElementById('det-estado'),
  detAlumno: document.getElementById('det-alumno'),
  detDni: document.getElementById('det-dni'),
  detCorreo: document.getElementById('det-correo'),
  detInstitucion: document.getElementById('det-institucion'),
  detCiclo: document.getElementById('det-ciclo'),
  detCarreraUsil: document.getElementById('det-carrera-usil'),
  detFecha: document.getElementById('det-fecha'),
  detObservaciones: document.getElementById('det-observaciones'),
  obsBox: document.getElementById('obs-box'),
  detalleTbody: document.getElementById('detalle-tbody'),
  detalleStats: document.getElementById('detalle-stats'),
  btnEnviar: document.getElementById('btn-enviar-alumno'),
  btnImprimir: document.getElementById('btn-imprimir'),
};

// ─── HELPERS DE PRESENTACIÓN ──────────────────────────────────────────────────
function estadoBadgeClass(estado) {
  const map = {
    BORRADOR: 'badge--info',
    GENERADA: 'badge--warning',
    ENVIADA_ALUMNO: 'badge--warning',
    APROBADA_COORD: 'badge--success',
    RECHAZADA: 'badge--danger',
  };
  return map[estado] || 'badge--warning';
}

function estadoLabel(estado) {
  const labels = {
    BORRADOR: 'Borrador',
    GENERADA: 'Generada',
    ENVIADA_ALUMNO: 'Enviada al alumno',
    APROBADA_COORD: 'Aprobada',
    RECHAZADA: 'Rechazada',
  };
  return labels[estado] || estado;
}

function estadoBadgeHtml(estado) {
  const cls = estadoBadgeClass(estado);
  const label = estadoLabel(estado);
  return `<span class="badge ${cls}"><span class="badge__dot"></span>${label}</span>`;
}

function pctBadgeHtml(pct) {
  if (pct == null) return '<span style="color:var(--color-text-muted);">—</span>';
  const color = pct >= 85 ? 'var(--color-success-text)' : pct >= 70 ? '#b45309' : 'var(--color-error)';
  const bg    = pct >= 85 ? '#dcfce7'                  : pct >= 70 ? '#fef3c7' : '#fee2e2';
  return `<span style="font-weight:700;font-size:12px;color:${color};background:${bg};padding:2px 8px;border-radius:99px;">${pct}%</span>`;
}

function avanceBadge(sim) {
  const pct = sim.creditosTotalesMalla > 0
    ? Math.round((sim.creditosConvalidados / sim.creditosTotalesMalla) * 100)
    : 0;
  const color = pct >= 50 ? 'var(--color-success-text)' : pct >= 25 ? '#b45309' : 'var(--color-error)';
  const bg    = pct >= 50 ? '#dcfce7'                  : pct >= 25 ? '#fef3c7' : '#fee2e2';
  return `<span style="font-weight:700;font-size:12px;color:${color};background:${bg};padding:2px 8px;border-radius:99px;">${pct}% malla</span>`;
}

function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function safeRender() {
  if (typeof renderIcons === 'function') renderIcons();
}

// ─── BANDEJA ──────────────────────────────────────────────────────────────────
async function loadBandeja() {
  const ciclo   = UI.filterCiclo.value   || undefined;
  const estado  = UI.filterEstado.value  || undefined;
  const q       = (UI.filterBusqueda.value || '').toLowerCase().trim();

  const all = await db.getSimulaciones({});
  state.simulaciones = all;

  // Stats sobre el total sin filtros
  UI.statTotal.textContent     = all.length;
  UI.statGeneradas.textContent = all.filter(s => s.estado === 'GENERADA').length;
  UI.statEnviadas.textContent  = all.filter(s => s.estado === 'ENVIADA_ALUMNO').length;
  UI.statAprobadas.textContent = all.filter(s => s.estado === 'APROBADA_COORD').length;

  // Filtros de cliente
  let rows = all;
  if (ciclo)  rows = rows.filter(s => s.cicloPostulacion === ciclo);
  if (estado) rows = rows.filter(s => s.estado === estado);
  if (q) {
    rows = rows.filter(s =>
      `${s.alumno?.nombres} ${s.alumno?.apellidos}`.toLowerCase().includes(q) ||
      (s.alumno?.dni || '').includes(q) ||
      (s.carreraUsil || '').toLowerCase().includes(q)
    );
  }

  renderBandeja(rows);
}

function renderBandeja(rows) {
  if (!rows.length) {
    UI.bandejaTbody.innerHTML =
      '<tr><td colspan="7" class="table-empty">No hay simulaciones que coincidan con los filtros.</td></tr>';
    return;
  }

  UI.bandejaTbody.innerHTML = rows.map(sim => {
    const nombre = `${sim.alumno?.nombres || ''} ${sim.alumno?.apellidos || ''}`.trim();
    const dniLine = sim.alumno?.dni
      ? `<div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">DNI: ${sim.alumno.dni}</div>`
      : '';
    return `
      <tr>
        <td>
          <div style="font-weight:600;">${nombre || '—'}</div>${dniLine}
        </td>
        <td style="font-size:13px;color:var(--color-text-secondary);">${sim.institucionOrigenNombre || '—'}</td>
        <td>
          <div style="font-weight:600;font-size:13px;color:var(--color-brand-800);">${sim.carreraUsil || '—'}</div>
        </td>
        <td class="col-center" style="font-weight:600;color:var(--color-brand-700);white-space:nowrap;">${sim.cicloPostulacion || '—'}</td>
        <td class="col-center">${avanceBadge(sim)}</td>
        <td class="col-center">${estadoBadgeHtml(sim.estado)}</td>
        <td class="col-center">
          <button class="btn btn--primary" style="font-size:var(--fs-sm);padding:5px 16px;white-space:nowrap;"
                  onclick="verDetalle('${sim.id}')">Ver detalle</button>
        </td>
      </tr>`;
  }).join('');

  safeRender();
}

// ─── DETALLE ──────────────────────────────────────────────────────────────────
window.verDetalle = async function (id) {
  const sim = await db.getSimulacion(id);
  if (!sim) return;
  state.simulacionActual = sim;

  UI.sectionBandeja.classList.remove('is-active');
  UI.sectionDetalle.classList.add('is-active');

  renderDetalle(sim);
};

function renderDetalle(sim) {
  const nombre = `${sim.alumno?.nombres || ''} ${sim.alumno?.apellidos || ''}`.trim();

  UI.detTitulo.textContent = sim.id;
  UI.detEstado.className = `badge ${estadoBadgeClass(sim.estado)}`;
  UI.detEstado.innerHTML = `<span class="badge__dot"></span>${estadoLabel(sim.estado)}`;

  UI.detAlumno.textContent      = nombre || '—';
  UI.detDni.textContent         = sim.alumno?.dni || '—';
  UI.detCorreo.textContent      = sim.alumno?.correo || '—';
  UI.detInstitucion.textContent = sim.institucionOrigenNombre || '—';
  UI.detCiclo.textContent       = sim.cicloPostulacion || '—';
  UI.detCarreraUsil.textContent = sim.carreraUsil || '—';
  UI.detFecha.textContent       = formatFecha(sim.fechaCreacion);

  if (sim.observacionesCoordinador) {
    UI.detObservaciones.textContent = sim.observacionesCoordinador;
    UI.obsBox.classList.add('has-content');
  } else {
    UI.obsBox.classList.remove('has-content');
  }

  // Tabla comparativa
  const eqs = sim._equivalencias || [];
  UI.detalleTbody.innerHTML = eqs.length ? eqs.map((eq, i) => {
    const usil = eq.cursoUsil?.codigo ? eq.cursoUsil : (eq.cursoUsilSnapshot || {});
    const ext  = eq.cursoExt?.codigo  ? eq.cursoExt  : (eq.cursoExtSnapshot  || {});
    const esSinEq = eq.estado === 'SIN_EQUIVALENCIA';

    const usilCell = esSinEq
      ? `<span style="color:var(--color-text-muted);font-style:italic;">Sin equivalente en malla USIL</span>`
      : `<div style="font-weight:700;font-size:13px;color:var(--color-brand-800);">${usil.codigo || '—'}</div>
         <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">${usil.nombre || ''}</div>`;

    return `
      <tr>
        <td style="color:var(--color-text-muted);font-weight:600;">${i + 1}</td>
        <td>
          <div style="font-weight:700;font-size:13px;">${ext.codigo || '—'}</div>
          <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">${ext.nombre || ''}</div>
        </td>
        <td class="col-center" style="color:var(--color-text-muted);">${ext.creditos ?? '—'}</td>
        <td>${usilCell}</td>
        <td class="col-center" style="font-weight:600;">${esSinEq ? '—' : (usil.creditos ?? '—')}</td>
        <td class="col-center">${esSinEq ? '<span style="color:var(--color-text-muted);">—</span>' : pctBadgeHtml(eq.porcentajeSimilitud)}</td>
        <td class="col-center">${estadoBadgeHtml(eq.estado)}</td>
      </tr>`;
  }).join('') : '<tr><td colspan="7" class="table-empty">No hay equivalencias registradas para esta simulación.</td></tr>';

  // Stats
  const creditosConv = sim.creditosConvalidados || 0;
  const totalCred    = sim.creditosTotalesMalla  || 0;
  const pctMalla = totalCred > 0 ? Math.round((creditosConv / totalCred) * 100) : 0;
  const pctColor = pctMalla >= 50 ? 'var(--color-success-text)' : pctMalla >= 25 ? '#b45309' : 'var(--color-error)';

  UI.detalleStats.innerHTML = `
    <div class="det-stat-card">
      <div class="det-stat-card__label">Cursos convalidados</div>
      <div class="det-stat-card__value" style="color:var(--color-brand-700);">${sim.cursosConvalidados ?? 0}</div>
    </div>
    <div class="det-stat-card">
      <div class="det-stat-card__label">Sin equivalencia</div>
      <div class="det-stat-card__value" style="color:var(--color-text-muted);">${sim.cursosSinEquivalencia ?? 0}</div>
    </div>
    <div class="det-stat-card">
      <div class="det-stat-card__label">Créditos recuperados</div>
      <div class="det-stat-card__value" style="color:var(--color-success-text);">${creditosConv}</div>
    </div>
    <div class="det-stat-card">
      <div class="det-stat-card__label">Avance en malla</div>
      <div class="det-stat-card__value" style="color:${pctColor};">${pctMalla}%</div>
    </div>`;

  // Botón enviar
  UI.btnEnviar.disabled = sim.estado !== 'GENERADA';

  safeRender();
}

// ─── ACCIONES ─────────────────────────────────────────────────────────────────
async function enviarAlAlumno() {
  const sim = state.simulacionActual;
  if (!sim) return;
  UI.btnEnviar.disabled = true;
  try {
    await db.enviarSimulacionAlAlumno(sim.id);
    state.simulacionActual = await db.getSimulacion(sim.id);
    renderDetalle(state.simulacionActual);
    showToast('Simulación enviada al alumno correctamente.');
  } catch (err) {
    console.error(err);
    UI.btnEnviar.disabled = false;
    alert('No se pudo enviar la simulación: ' + err.message);
  }
}

function abrirImpresion(sim) {
  const nombre = `${sim.alumno?.nombres || ''} ${sim.alumno?.apellidos || ''}`.trim();
  const fechaDoc = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });

  const eqs    = (sim._equivalencias || []).filter(e => e.estado !== 'SIN_EQUIVALENCIA');
  const sinEqs = (sim._equivalencias || []).filter(e => e.estado === 'SIN_EQUIVALENCIA');

  const filas = eqs.map((eq, i) => {
    const usil = eq.cursoUsil?.codigo ? eq.cursoUsil : (eq.cursoUsilSnapshot || {});
    const ext  = eq.cursoExt?.codigo  ? eq.cursoExt  : (eq.cursoExtSnapshot  || {});
    return `<tr>
      <td>${i + 1}</td>
      <td>${ext.codigo || '—'}</td>
      <td>${ext.nombre || ''}</td>
      <td style="text-align:center;">${ext.creditos ?? '—'}</td>
      <td>${usil.codigo || '—'}</td>
      <td>${usil.nombre || ''}</td>
      <td style="text-align:center;">${usil.creditos ?? '—'}</td>
      <td style="text-align:center;">${eq.porcentajeSimilitud != null ? eq.porcentajeSimilitud + '%' : '—'}</td>
    </tr>`;
  }).join('');

  const filasSinEq = sinEqs.map((eq, i) => {
    const ext = eq.cursoExt?.codigo ? eq.cursoExt : (eq.cursoExtSnapshot || {});
    return `<tr>
      <td>${i + 1}</td>
      <td>${ext.codigo || '—'}</td>
      <td>${ext.nombre || ''}</td>
      <td style="text-align:center;">${ext.creditos ?? '—'}</td>
      <td colspan="4" style="color:#6b7280;font-style:italic;">Sin equivalente en malla USIL</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Simulación ${sim.id} — USIL</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;font-size:12px;color:#111;}
  .header{text-align:center;margin-bottom:20px;}
  .header h1{font-size:15px;font-weight:bold;margin:0 0 4px;}
  .header p{margin:2px 0;font-size:11px;color:#555;}
  .badge-doc{display:inline-block;background:#fef3c7;color:#92400e;border:1px solid #d97706;
    padding:2px 10px;border-radius:99px;font-size:11px;font-weight:bold;margin-top:6px;}
  .divider{border:none;border-top:2px solid #003e7e;margin:14px 0 10px;}
  .meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;}
  .meta-item .lbl{font-size:10px;text-transform:uppercase;color:#555;font-weight:bold;}
  .meta-item .val{font-size:12px;font-weight:600;}
  table{width:100%;border-collapse:collapse;margin-top:10px;font-size:11px;}
  th{background:#003e7e;color:#fff;padding:5px 7px;text-align:left;}
  td{padding:4px 7px;border-bottom:1px solid #e5e7eb;}
  tr:nth-child(even){background:#f9fafb;}
  .section-title{font-size:12px;font-weight:bold;color:#003e7e;margin:16px 0 4px;}
  .summary{margin-top:10px;font-size:11px;color:#374151;}
  .obs{background:#fffbeb;border:1px solid #d97706;padding:7px 10px;border-radius:4px;
    margin-top:12px;font-size:11px;}
  .nota{background:#fee2e2;border:1px solid #f87171;padding:7px 10px;border-radius:4px;
    margin-top:10px;font-size:11px;}
  .footer{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:80px;}
  .firma{border-top:1px solid #374151;padding-top:8px;text-align:center;font-size:11px;}
  @media print{body{margin:20px;}}
</style>
</head>
<body>
<div class="header">
  <h1>UNIVERSIDAD SAN IGNACIO DE LOYOLA</h1>
  <p>Coordinación Académica — ${sim.facultadUsil || 'Facultad'}</p>
  <p>SIMULACIÓN DE CONVALIDACIÓN DE CURSOS</p>
  <span class="badge-doc">⚠ DOCUMENTO PRELIMINAR — NO OFICIAL</span>
</div>
<hr class="divider">
<div class="meta">
  <div class="meta-item"><div class="lbl">Postulante</div><div class="val">${nombre || '—'}</div></div>
  <div class="meta-item"><div class="lbl">DNI / Pasaporte</div><div class="val">${sim.alumno?.dni || '—'}</div></div>
  <div class="meta-item"><div class="lbl">Correo</div><div class="val">${sim.alumno?.correo || '—'}</div></div>
  <div class="meta-item"><div class="lbl">Institución de Origen</div><div class="val">${sim.institucionOrigenNombre || '—'}</div></div>
  <div class="meta-item"><div class="lbl">Carrera Destino USIL</div><div class="val">${sim.carreraUsil || '—'}</div></div>
  <div class="meta-item"><div class="lbl">Ciclo de Postulación</div><div class="val">${sim.cicloPostulacion || '—'}</div></div>
  <div class="meta-item"><div class="lbl">Generada por</div><div class="val">${sim.coordinadorNombre || '—'}</div></div>
  <div class="meta-item"><div class="lbl">Fecha</div><div class="val">${fechaDoc}</div></div>
  <div class="meta-item"><div class="lbl">ID Simulación</div><div class="val">${sim.id}</div></div>
</div>
<hr class="divider">

<div class="section-title">CURSOS CON EQUIVALENCIA (${eqs.length})</div>
<table>
  <thead><tr>
    <th>#</th><th>Cód. Origen</th><th>Curso de Origen</th><th>Cred.</th>
    <th>Cód. USIL</th><th>Equivalente USIL</th><th>Cred.</th><th>Similitud</th>
  </tr></thead>
  <tbody>${filas || '<tr><td colspan="8" style="text-align:center;color:#9ca3af;">Sin equivalencias registradas</td></tr>'}</tbody>
</table>

${sinEqs.length ? `
<div class="section-title">CURSOS SIN EQUIVALENCIA (${sinEqs.length})</div>
<table>
  <thead><tr>
    <th>#</th><th>Cód. Origen</th><th>Curso de Origen</th><th>Cred.</th><th colspan="4">Observación</th>
  </tr></thead>
  <tbody>${filasSinEq}</tbody>
</table>` : ''}

<div class="summary">
  <strong>Resumen:</strong>&nbsp;
  ${eqs.length} curso(s) convalidado(s) ·
  ${sim.creditosConvalidados ?? 0} créditos USIL recuperados ·
  ${sinEqs.length} curso(s) sin equivalencia ·
  Avance en malla: ${sim.creditosTotalesMalla > 0 ? Math.round(((sim.creditosConvalidados ?? 0) / sim.creditosTotalesMalla) * 100) : 0}%
</div>

${sim.observacionesCoordinador ? `<div class="obs"><strong>Observaciones del Coordinador:</strong> ${sim.observacionesCoordinador}</div>` : ''}

<div class="nota">
  Este documento es una <strong>simulación preliminar</strong> generada por el sistema de convalidaciones USIL.
  No tiene carácter oficial. La convalidación definitiva se confirmará mediante memorándum institucional
  una vez el postulante acepte los términos y el Coordinador Académico lo apruebe formalmente.
</div>

<div class="footer">
  <div class="firma">
    <p><strong>${sim.coordinadorNombre || 'Coordinador Académico'}</strong></p>
    <p>Coordinador Académico</p>
    <p>${sim.facultadUsil || 'USIL'}</p>
  </div>
  <div class="firma">
    <p><strong>${nombre || '—'}</strong></p>
    <p>Postulante</p>
    <p>DNI: ${sim.alumno?.dni || '—'}</p>
  </div>
</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=950,height=750,scrollbars=yes');
  if (!win) { alert('Por favor permite ventanas emergentes para abrir la vista de impresión.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

// ─── CREAR DESDE EXPEDIENTE ───────────────────────────────────────────────────
async function crearDesdeExpediente() {
  const solicitudes = await db.getSolicitudesAdmision();
  const sol = solicitudes.find(s => s.estado !== 'RECHAZADA');
  if (!sol) {
    alert('No hay solicitudes activas para generar una simulación.');
    return;
  }

  const eqs      = await db.getEquivalencias({ institucionId: sol.academico.institucionOrigenId, excluirDescartes: true });
  const aprobadas = eqs.filter(e => e.estado === 'APROBADA');
  const sinEq     = eqs.filter(e => e.estado === 'SIN_EQUIVALENCIA' || e.esDescarte);

  const creditosConv = aprobadas.reduce((s, e) => {
    const cred = e.cursoUsil?.creditos ?? e.cursoUsilSnapshot?.creditos ?? 0;
    return s + cred;
  }, 0);

  const insts = await db.getInstituciones();
  const inst  = insts.find(i => i.id === sol.academico.institucionOrigenId);

  await db.createSimulacion({
    solicitudAdmisionId: sol.id,
    cicloPostulacion: '2025-I',
    coordinadorId: 'U-002',
    coordinadorNombre: coordinador,
    alumno: sol.postulante,
    carreraUsil: sol.academico.carreraDestino,
    facultadUsil: sol.academico.facultadDestino,
    mallaUsilId: sol.academico.mallaDestinoId,
    institucionOrigenId: sol.academico.institucionOrigenId,
    institucionOrigenNombre: inst?.nombre || '—',
    equivalenciasIds: aprobadas.map(e => e.id),
    creditosConvalidados: creditosConv,
    creditosTotalesMalla: 160,
    cursosConvalidados: aprobadas.length,
    cursosSinEquivalencia: sinEq.length,
    cursosTotalesOrigen: eqs.length,
    estado: 'GENERADA',
    observacionesCoordinador: '',
  });

  showToast('Simulación generada correctamente.');
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

  UI.btnEnviar?.addEventListener('click', enviarAlAlumno);

  UI.btnImprimir?.addEventListener('click', () => {
    if (state.simulacionActual) abrirImpresion(state.simulacionActual);
  });

  // Botón de cabecera del app-shell ("Nueva Simulación")
  document.addEventListener('app-action', async (e) => {
    if (e.detail?.id === 'nueva-simulacion') {
      await crearDesdeExpediente();
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
  alert('Error al inicializar el módulo de Simulaciones: ' + err.message);
});
