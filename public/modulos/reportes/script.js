import { db } from '../../../shared/js/db.js';

// ─── STATE ────────────────────────────────────────────────────────────────────
const state = {
  tabActual: 'equivalencias',
  reporteEq: [],
  reporteConv: [],
  reporteAct: null,
};

// ─── HELPERS DE PRESENTACIÓN ──────────────────────────────────────────────────
function barHtml(pct, color = '#003e7e') {
  const label = pct != null ? pct + '%' : '—';
  const textColor = pct >= 70 ? color : pct >= 40 ? '#b45309' : '#dc2626';
  const fillColor = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return `
    <div class="bar-wrap">
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct ?? 0}%;background:${fillColor};"></div>
      </div>
      <span class="bar-label" style="color:${textColor};">${label}</span>
    </div>`;
}

function simBar(pct, color = '#2563eb') {
  return `
    <div class="bar-wrap">
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct ?? 0}%;background:${color};"></div>
      </div>
      <span class="bar-label" style="color:${color};">${pct ?? 0}%</span>
    </div>`;
}

function mesLabel(yyyymm) {
  const [y, m] = yyyymm.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${meses[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

function safeRender() {
  if (typeof renderIcons === 'function') renderIcons();
}

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────
function exportarCSV(headers, rows, nombre) {
  const bom = '﻿'; // UTF-8 BOM para Excel
  const escape = v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ];
  const blob = new Blob([bom + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
}

// ─── PANEL 1: EQUIVALENCIAS ───────────────────────────────────────────────────
async function loadReporteEquivalencias() {
  const rows = await db.getReporteEquivalencias();
  state.reporteEq = rows;

  const totTotal     = rows.reduce((s, r) => s + r.total, 0);
  const totAprobadas = rows.reduce((s, r) => s + r.aprobadas, 0);
  const totPendientes= rows.reduce((s, r) => s + r.pendientes, 0);
  const totRechazadas= rows.reduce((s, r) => s + r.rechazadas, 0);
  const tasaGlobal   = totTotal > 0 ? Math.round((totAprobadas / totTotal) * 100) : 0;

  document.getElementById('eq-total').textContent     = totTotal;
  document.getElementById('eq-aprobadas').textContent = totAprobadas;
  document.getElementById('eq-pendientes').textContent= totPendientes;
  document.getElementById('eq-rechazadas').textContent= totRechazadas;
  document.getElementById('eq-tasa').textContent      = tasaGlobal + '%';

  const tbody = document.getElementById('tbody-eq');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Sin datos de equivalencias.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>
        <div style="font-weight:600;">${r.institucion}</div>
      </td>
      <td style="font-size:13px;color:var(--color-text-muted);">${r.pais}</td>
      <td class="col-center" style="font-weight:700;color:var(--color-brand-700);">${r.total}</td>
      <td class="col-center" style="font-weight:700;color:var(--color-success-text);">${r.aprobadas}</td>
      <td class="col-center" style="color:#b45309;">${r.pendientes}</td>
      <td class="col-center" style="color:var(--color-error);">${r.rechazadas}</td>
      <td>${barHtml(r.tasaAprobacion)}</td>
      <td>${r.similitudPromedio != null ? barHtml(r.similitudPromedio, '#2563eb') : '<span style="color:var(--color-text-muted);">—</span>'}</td>
    </tr>`).join('');

  safeRender();
}

// ─── PANEL 2: CONVALIDACIONES ─────────────────────────────────────────────────
async function loadReporteConvalidaciones() {
  const rows = await db.getReporteConvalidaciones();
  state.reporteConv = rows;

  const totSims    = rows.reduce((s, r) => s + r.simulaciones, 0);
  const totConvs   = rows.reduce((s, r) => s + r.convalidaciones, 0);
  const totMem     = rows.reduce((s, r) => s + r.memEmitido, 0);
  const totCursos  = rows.reduce((s, r) => s + r.cursosTotal, 0);
  const totCreditos= rows.reduce((s, r) => s + r.creditosTotal, 0);

  document.getElementById('conv-sims').textContent    = totSims;
  document.getElementById('conv-total').textContent   = totConvs;
  document.getElementById('conv-mem').textContent     = totMem;
  document.getElementById('conv-cursos').textContent  = totCursos;
  document.getElementById('conv-creditos').textContent= totCreditos;

  const tbody = document.getElementById('tbody-conv');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="table-empty">Sin datos de convalidaciones.</td></tr>';
    return;
  }

  const maxSims = Math.max(...rows.map(r => r.simulaciones), 1);
  tbody.innerHTML = rows.map(r => {
    const pctSims = Math.round((r.simulaciones / maxSims) * 100);
    return `
      <tr>
        <td style="font-weight:700;color:var(--color-brand-700);">${r.ciclo}</td>
        <td class="col-center">${r.simulaciones}</td>
        <td class="col-center" style="font-weight:600;">${r.convalidaciones}</td>
        <td class="col-center" style="color:#b45309;">${r.pendienteFirma}</td>
        <td class="col-center" style="color:var(--color-brand-600);">${r.firmadas}</td>
        <td class="col-center" style="color:var(--color-success-text);font-weight:700;">${r.memEmitido}</td>
        <td class="col-center">${r.cursosTotal}</td>
        <td class="col-center" style="font-weight:700;color:var(--color-success-text);">${r.creditosTotal}</td>
        <td>${simBar(pctSims)}</td>
      </tr>`;
  }).join('');

  safeRender();
}

// ─── PANEL 3: ACTIVIDAD ───────────────────────────────────────────────────────
async function loadReporteActividad() {
  const desde = document.getElementById('act-desde').value || undefined;
  const hasta = document.getElementById('act-hasta').value || undefined;
  const rep = await db.getReporteActividad({ desde, hasta });
  state.reporteAct = rep;

  const { resumen, porMes } = rep;
  document.getElementById('act-sol').textContent     = resumen.solicitudes;
  document.getElementById('act-sim').textContent     = resumen.simulaciones;
  document.getElementById('act-conv').textContent    = resumen.convalidaciones;
  document.getElementById('act-cursos').textContent  = resumen.cursosConvalidados;
  document.getElementById('act-creditos').textContent= resumen.creditosConvalidados;

  // Gráfico de barras mensual
  const chartEl  = document.getElementById('activity-chart');
  const legendEl = document.getElementById('activity-legend');

  if (!porMes.length) {
    chartEl.innerHTML = '<div style="width:100%;text-align:center;color:var(--color-text-muted);font-size:13px;padding:40px 0;">Sin actividad en el período seleccionado.</div>';
    legendEl.innerHTML = '';
  } else {
    const maxVal = Math.max(...porMes.flatMap(m => [m.solicitudes, m.simulaciones, m.convalidaciones]), 1);
    const colors = { solicitudes: '#2563eb', simulaciones: '#f59e0b', convalidaciones: '#22c55e' };

    chartEl.innerHTML = porMes.map(mes => {
      const hSol  = Math.round((mes.solicitudes    / maxVal) * 82);
      const hSim  = Math.round((mes.simulaciones   / maxVal) * 82);
      const hConv = Math.round((mes.convalidaciones / maxVal) * 82);
      return `
        <div class="act-col">
          <div class="act-bar-group">
            <div class="act-bar" style="height:${hSol}px;background:${colors.solicitudes};" title="Solicitudes: ${mes.solicitudes}"></div>
            <div class="act-bar" style="height:${hSim}px;background:${colors.simulaciones};" title="Simulaciones: ${mes.simulaciones}"></div>
            <div class="act-bar" style="height:${hConv}px;background:${colors.convalidaciones};" title="Convalidaciones: ${mes.convalidaciones}"></div>
          </div>
          <div class="act-label">${mesLabel(mes.mes)}</div>
        </div>`;
    }).join('');

    legendEl.innerHTML = Object.entries(colors).map(([k, c]) =>
      `<div style="display:flex;align-items:center;gap:4px;">
        <div style="width:10px;height:10px;border-radius:2px;background:${c};"></div>
        <span style="text-transform:capitalize;">${k}</span>
      </div>`
    ).join('');
  }

  // Tabla detalle mensual
  const tbody = document.getElementById('tbody-act');
  if (!porMes.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Sin datos en el período seleccionado.</td></tr>';
    return;
  }
  const maxV = Math.max(...porMes.flatMap(m => [m.solicitudes, m.simulaciones, m.convalidaciones]), 1);
  tbody.innerHTML = porMes.map(mes => {
    const pSol  = Math.round((mes.solicitudes    / maxV) * 100);
    const pSim  = Math.round((mes.simulaciones   / maxV) * 100);
    const pConv = Math.round((mes.convalidaciones / maxV) * 100);
    const cell = (n, pct, color) => `
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-weight:700;min-width:18px;text-align:right;">${n}</span>
          <div style="flex:1;background:var(--color-border);border-radius:99px;height:8px;overflow:hidden;min-width:60px;">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:99px;"></div>
          </div>
        </div>
      </td>`;
    return `
      <tr>
        <td style="font-weight:700;color:var(--color-brand-700);">${mesLabel(mes.mes)}</td>
        ${cell(mes.solicitudes, pSol, '#2563eb')}
        ${cell(mes.simulaciones, pSim, '#f59e0b')}
        ${cell(mes.convalidaciones, pConv, '#22c55e')}
      </tr>`;
  }).join('');

  safeRender();
}

// ─── EXPORTAR CSV ─────────────────────────────────────────────────────────────
function exportEq() {
  const headers = ['Institución', 'País', 'Total', 'Aprobadas', 'Pendientes', 'Rechazadas', 'Tasa Aprobación %', 'Similitud Promedio %'];
  const rows = state.reporteEq.map(r => [
    r.institucion, r.pais, r.total, r.aprobadas, r.pendientes, r.rechazadas,
    r.tasaAprobacion, r.similitudPromedio ?? '',
  ]);
  exportarCSV(headers, rows, `reporte-equivalencias-${new Date().toISOString().slice(0, 10)}.csv`);
}

function exportConv() {
  const headers = ['Ciclo', 'Simulaciones', 'Convalidaciones', 'Pend. Firma', 'Firmadas', 'Mem. Emitido', 'Cursos Conv.', 'Créditos'];
  const rows = state.reporteConv.map(r => [
    r.ciclo, r.simulaciones, r.convalidaciones, r.pendienteFirma, r.firmadas, r.memEmitido, r.cursosTotal, r.creditosTotal,
  ]);
  exportarCSV(headers, rows, `reporte-convalidaciones-${new Date().toISOString().slice(0, 10)}.csv`);
}

function exportAct() {
  if (!state.reporteAct) return;
  const headers = ['Mes', 'Solicitudes', 'Simulaciones', 'Convalidaciones'];
  const rows = state.reporteAct.porMes.map(m => [mesLabel(m.mes), m.solicitudes, m.simulaciones, m.convalidaciones]);
  exportarCSV(headers, rows, `reporte-actividad-${new Date().toISOString().slice(0, 10)}.csv`);
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
function switchTab(id) {
  document.querySelectorAll('.rep-tab').forEach(t => t.classList.toggle('is-active', t.dataset.tab === id));
  document.querySelectorAll('.rep-panel').forEach(p => p.classList.toggle('is-active', p.id === `panel-${id}`));
  state.tabActual = id;
}

// ─── LISTENERS ────────────────────────────────────────────────────────────────
function setupListeners() {
  document.querySelectorAll('.rep-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      const id = tab.dataset.tab;
      switchTab(id);
      if (id === 'equivalencias'   && !state.reporteEq.length)  await loadReporteEquivalencias();
      if (id === 'convalidaciones' && !state.reporteConv.length) await loadReporteConvalidaciones();
      if (id === 'actividad'       && !state.reporteAct)         await loadReporteActividad();
    });
  });

  document.getElementById('btn-export-eq')?.addEventListener('click',   exportEq);
  document.getElementById('btn-export-conv')?.addEventListener('click',  exportConv);
  document.getElementById('btn-export-act')?.addEventListener('click',   exportAct);

  document.getElementById('btn-act-filter')?.addEventListener('click', loadReporteActividad);
  document.getElementById('btn-act-clear')?.addEventListener('click', () => {
    document.getElementById('act-desde').value = '';
    document.getElementById('act-hasta').value = '';
    loadReporteActividad();
  });
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
async function init() {
  // Cargar el primer panel activo de inmediato; el resto carga al cambiar de tab
  await Promise.all([
    loadReporteEquivalencias(),
    loadReporteConvalidaciones(),
    loadReporteActividad(),
  ]);
  setupListeners();
}

init().catch(err => {
  console.error('Init error:', err);
  alert('Error al inicializar Reportes: ' + err.message);
});
