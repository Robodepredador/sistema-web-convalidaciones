import { db } from '../../../shared/js/db.js';

// Módulo 100% local: la similitud y la "extracción" de PDF se calculan en el
// navegador sin dependencias externas, para que el flujo nunca se cuelgue.
const coordinador =
  (typeof CURRENT_USER !== 'undefined' && CURRENT_USER?.name) || 'Coordinador Académico';

const state = {
  equivalencias: [],
  cursosUsil: [],
  cursosExternos: [],
  
  // Selecciones
  selectedUsilId: null,
  selectedExternoId: null,
  
  // Filtros activos (Paso 1)
  institucionId: '',
  carreraExtStr: '',
  versionExt: '',
  carreraUsilId: '',
  anioMalla: '2023',
  
  // Estado del flujo
  isHistoricalReady: false,
  pendingPdfFor: null
};

const UI = {
  // Wizard
  stepper1: document.getElementById('stepper-1'),
  stepper2: document.getElementById('stepper-2'),
  step1: document.getElementById('step-1'),
  step2: document.getElementById('step-2'),
  btnGoStep2: document.getElementById('btn-go-step2'),
  btnBackStep1: document.getElementById('btn-back-step1'),
  
  // Filtros
  selInst: document.getElementById('crit-inst'),
  inpCarreraExt: document.getElementById('crit-carrera-ext'),
  inpVersionExt: document.getElementById('crit-version-ext'),
  selCarreraUsil: document.getElementById('crit-carrera-usil'),
  selAnio: document.getElementById('crit-anio'),
  
  // Link Nueva Institución
  linkNuevaInst: document.getElementById('link-nueva-inst'),
  
  // Modal Institución
  modalInst: document.getElementById('modal-inst'),
  btnSaveInst: document.getElementById('btn-save-inst'),
  btnCancelInst: document.getElementById('btn-cancel-inst'),
  inpInstNombre: document.getElementById('new-inst-nombre'),
  selInstPais: document.getElementById('new-inst-pais'),
  
  // Validation Zone (Paso 1)
  valZone: document.getElementById('step-1-validation-zone'),
  alertReady: document.getElementById('alert-historical-ready'),
  alertMissing: document.getElementById('alert-historical-missing'),
  dropArea: document.getElementById('pdf-drop-area'),
  pdfUpload: document.getElementById('eq-pdf-upload'),
  aiStatus: document.getElementById('ai-status'),
  aiStatusText: document.getElementById('ai-status-text'),
  
  // Listas (Paso 2)
  usilList: document.getElementById('usil-course-list'),
  usilMeta: document.getElementById('usil-header-meta'),
  extList: document.getElementById('ext-courses-container'),
  extMeta: document.getElementById('ext-header-meta'),
  
  // Match Bar
  matchBar: document.getElementById('match-action-bar'),
  matchText: document.getElementById('match-text'),
  matchScore: document.getElementById('match-score'),
  btnSaveMatch: document.getElementById('btn-save-match'),
  
  // Tabla Inferior
  tbody: document.getElementById('equiv-tbody')
};

function safeRenderIcons(root) {
  if (window.renderIcons) window.renderIcons(root || document.body);
}

// -------------------------------------------------------------------
// 1. INICIALIZACIÓN
// -------------------------------------------------------------------
async function init() {
  await loadFiltros();
  await loadEquivalencias();
  
  setupListeners();
  renderTable(); // Muestra vacía por defecto
}

async function loadFiltros() {
  const insts = await db.getInstituciones();
  renderInstituciones(insts);
    
  state.cursosUsil = await db.getCursosUsil();
  const carrerasUsil = [...new Set(state.cursosUsil.map(c => c.facultad))];
  UI.selCarreraUsil.innerHTML = '<option value="">Seleccionar...</option>' + 
    carrerasUsil.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderInstituciones(insts) {
  UI.selInst.innerHTML = '<option value="">Seleccionar...</option>' + 
    insts.map(i => `<option value="${i.id}">${i.nombre} (${i.pais})</option>`).join('');
  if (state.institucionId) {
    UI.selInst.value = state.institucionId;
  }
}

async function loadEquivalencias() {
  state.equivalencias = await db.getEquivalencias();
}

// -------------------------------------------------------------------
// 2. LISTENERS Y FLUJO (WIZARD)
// -------------------------------------------------------------------
function setupListeners() {
  // Wizard Navigation
  UI.btnGoStep2.addEventListener('click', () => goStep(2));
  UI.btnBackStep1.addEventListener('click', () => goStep(1));
  
  // Formularios Paso 1
  UI.selCarreraUsil.addEventListener('change', (e) => {
    state.carreraUsilId = e.target.value;
    validateStep1();
  });
  
  UI.selAnio.addEventListener('change', (e) => {
    state.anioMalla = e.target.value;
  });
  
  UI.inpCarreraExt.addEventListener('input', (e) => {
    state.carreraExtStr = e.target.value.trim();
    checkHistoricalData();
    validateStep1();
  });
  
  UI.inpVersionExt.addEventListener('input', (e) => {
    state.versionExt = e.target.value.trim();
    checkHistoricalData();
    validateStep1();
  });
  
  UI.selInst.addEventListener('change', async (e) => {
    state.institucionId = e.target.value;
    await checkHistoricalData();
    validateStep1();
  });
  
  // Modal Institución
  UI.linkNuevaInst.addEventListener('click', (e) => {
    e.preventDefault();
    UI.modalInst.style.display = 'flex';
  });
  
  UI.btnCancelInst.addEventListener('click', () => {
    UI.modalInst.style.display = 'none';
  });
  
  UI.btnSaveInst.addEventListener('click', async () => {
    // Read all fields from the modal
    const nombre = UI.inpInstNombre.value.trim();
    const pais = UI.selInstPais.value;
    const ciudad = document.getElementById('new-inst-ciudad').value.trim();
    const tipo = document.getElementById('new-inst-tipo').value;
    const acred = document.getElementById('new-inst-acred').value;
    
    if (!nombre || !pais || !ciudad) {
      alert("Por favor complete al menos Nombre Oficial, País y Ciudad.");
      return;
    }
    
    // Persistir en la capa de datos (soft state real)
    const newInst = await db.createInstitucion({
      nombre,
      pais,
      ciudad,
      tipo,
      acreditacion: acred,
      siglas: nombre.substring(0, 3).toUpperCase(),
      estado: 'activo'
    });

    // Recargar lista desde db y seleccionar la nueva
    const insts = await db.getInstituciones();
    state.institucionId = newInst.id;
    renderInstituciones(insts);
    
    // Limpiar y cerrar modal
    UI.inpInstNombre.value = '';
    UI.selInstPais.value = '';
    UI.modalInst.style.display = 'none';
    
    // Disparar validaciones (como es nueva, pedirá histórico)
    await checkHistoricalData();
    validateStep1();
  });
  
  // Drag and drop en Paso 1
  UI.dropArea.addEventListener('click', () => UI.pdfUpload.click());
  UI.dropArea.addEventListener('dragover', (e) => { e.preventDefault(); UI.dropArea.classList.add('drag-over'); });
  UI.dropArea.addEventListener('dragleave', () => UI.dropArea.classList.remove('drag-over'));
  UI.dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    UI.dropArea.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePdfUpload(e.dataTransfer.files[0]);
    }
  });
  UI.pdfUpload.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handlePdfUpload(e.target.files[0]);
    }
  });
  
  // Emparejamiento
  UI.btnSaveMatch.addEventListener('click', saveMatch);

  // Eliminar equivalencia desde la tabla (soft delete)
  UI.tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="del-eq"]');
    if (!btn) return;
    if (!confirm('¿Eliminar esta equivalencia? Se conservará en el historial (eliminación lógica).')) return;
    btn.disabled = true;
    await db.deleteEquivalencia(btn.dataset.id);
    await loadEquivalencias();
    updateMallaUsil();
    renderCursosExternos();
    renderTable();
  });
}

function goStep(step) {
  if (step === 1) {
    UI.step1.classList.add('is-active');
    UI.step2.classList.remove('is-active');
    UI.stepper1.classList.add('is-active');
    UI.stepper1.classList.remove('is-done');
    UI.stepper2.classList.remove('is-active');
  } else if (step === 2) {
    UI.step1.classList.remove('is-active');
    UI.step2.classList.add('is-active');
    UI.stepper1.classList.remove('is-active');
    UI.stepper1.classList.add('is-done');
    UI.stepper2.classList.add('is-active');
    
    // Cargar listas al entrar al paso 2
    updateMallaUsil();
    renderCursosExternos();
    renderTable(); // Filtrar tabla para el cruce actual
  }
}

let checkTimeout;
async function checkHistoricalData() {
  clearTimeout(checkTimeout);
  
  if (!state.institucionId || !state.carreraExtStr || !state.versionExt) {
    UI.valZone.style.display = 'none';
    state.isHistoricalReady = false;
    return;
  }
  
  // Pequeño debounce
  await new Promise(resolve => { checkTimeout = setTimeout(resolve, 300); });
  
  UI.valZone.style.display = 'block';
  UI.alertReady.style.display = 'none';
  UI.alertMissing.style.display = 'none';
  
  // Buscar en la "DB"
  const todosCursosExt = await db.getCursosExternos({ institucionId: state.institucionId });
  
  // Simulamos el filtro por carrera y versión (en un escenario real esto lo hace el backend)
  // Como mock, si la institución es una de las pre-existentes y la versión es "2023", fingiremos que existe.
  // De lo contrario, no existe y requiere PDF.
  state.cursosExternos = todosCursosExt; // Usamos los del mock
  
  // Lógica mock: Si es una institución nueva (su id empieza con INST_), obviamente no tiene cursos
  const isNewInst = state.institucionId.startsWith('INST_');
  const hasHistorical = !isNewInst && todosCursosExt.length > 0 && state.versionExt === '2023';
  
  if (hasHistorical) {
    UI.alertMissing.style.display = 'none';
    UI.alertReady.style.display = 'flex';
    state.isHistoricalReady = true;
  } else {
    UI.alertReady.style.display = 'none';
    UI.alertMissing.style.display = 'flex';
    UI.dropArea.style.display = 'block';
    UI.aiStatus.style.display = 'none';
    state.isHistoricalReady = false; // Requiere PDF
  }
  
  validateStep1();
}

function validateStep1() {
  const isValid = state.carreraUsilId && state.institucionId && state.carreraExtStr && state.versionExt && state.isHistoricalReady;
  UI.btnGoStep2.disabled = !isValid;
}

// -------------------------------------------------------------------
// 3. CARGA DE PDF (extracción simulada, 100% local — sin red)
// -------------------------------------------------------------------
/** Cursos de ejemplo que "extrae" el procesamiento del plan (mock local). */
function cursosDesdePlanMock() {
  return [
    { id: 'EXT_1', codigo: 'EXT-101', nombre: 'Matemática para Ingeniería', creditos: 6 },
    { id: 'EXT_2', codigo: 'EXT-102', nombre: 'Física General', creditos: 5 },
    { id: 'EXT_3', codigo: 'EXT-103', nombre: 'Programación Orientada a Objetos', creditos: 6 },
    { id: 'EXT_4', codigo: 'EXT-104', nombre: 'Estructura de Datos y Algoritmos', creditos: 5 },
    { id: 'EXT_5', codigo: 'EXT-105', nombre: 'Bases de Datos Relacionales', creditos: 5 },
    { id: 'EXT_6', codigo: 'EXT-106', nombre: 'Redes de Computadoras', creditos: 4 }
  ];
}

function handlePdfUpload(file) {
  UI.dropArea.style.display = 'none';
  UI.aiStatus.style.display = 'flex';
  UI.aiStatusText.textContent = `Procesando "${file.name}" y extrayendo cursos…`;

  // Procesamiento simulado local (sin dependencias externas)
  setTimeout(() => {
    state.cursosExternos = cursosDesdePlanMock();
    UI.aiStatus.style.display = 'none';
    UI.alertMissing.style.display = 'none';
    UI.alertReady.style.display = 'flex';
    UI.alertReady.innerHTML = `<span data-icon="check"></span> <div><strong>Plan extraído:</strong> ${state.cursosExternos.length} curso(s) identificados (v.${state.versionExt}).</div>`;
    safeRenderIcons();
    state.isHistoricalReady = true;
    validateStep1();
  }, 1000);
}


// -------------------------------------------------------------------
// 4. LÓGICA DE LISTAS Y EMPAREJAMIENTO (PASO 2)
// -------------------------------------------------------------------
function updateMallaUsil() {
  UI.usilMeta.textContent = `${state.carreraUsilId} (${state.anioMalla})`;
  const cursos = state.cursosUsil.filter(c => c.facultad === state.carreraUsilId);
  
  if (cursos.length === 0) {
    UI.usilList.innerHTML = '<div style="text-align: center; padding: var(--space-6);">No hay cursos.</div>';
    return;
  }
  
  const ciclos = {};
  cursos.forEach(c => {
    if (!ciclos[c.ciclo]) ciclos[c.ciclo] = [];
    ciclos[c.ciclo].push(c);
  });
  
  let html = '';
  Object.keys(ciclos).sort((a,b) => parseInt(a) - parseInt(b)).forEach(ciclo => {
    html += `<div class="ciclo-divider">CICLO ${toRoman(ciclo)}</div>`;
    ciclos[ciclo].forEach(curso => {
      const isMatched = state.equivalencias.some(e => e.cursoUsilId === curso.id && e.estado === 'APROBADA' && e.institucionId === state.institucionId);
      html += `
        <div class="course-item-card usil-item ${isMatched ? 'is-matched' : ''}" data-id="${curso.id}" onclick="selectUsil('${curso.id}')" id="usil-card-${curso.id}">
          <div>
            <div class="course-item-card__code">${curso.codigo}</div>
            <div class="course-item-card__name">${curso.nombre}</div>
          </div>
          <div class="course-item-card__cred">${curso.creditos} Créd.</div>
        </div>
      `;
    });
  });
  
  UI.usilList.innerHTML = html;
}

function toRoman(num) {
  const map = {1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI', 7:'VII', 8:'VIII', 9:'IX', 10:'X'};
  return map[num] || num;
}

function renderCursosExternos() {
  const instText = UI.selInst.options[UI.selInst.selectedIndex]?.text || 'Institución Nueva';
  UI.extMeta.textContent = `${instText} - ${state.carreraExtStr} (v.${state.versionExt})`;
  
  if (state.cursosExternos.length === 0) {
    UI.extList.innerHTML = '<div style="text-align: center; padding: var(--space-6);">No hay cursos.</div>';
    return;
  }
  
  let html = '';
  state.cursosExternos.forEach(curso => {
    const isMatched = state.equivalencias.some(e => e.cursoExternoId === curso.id && e.estado === 'APROBADA' && e.institucionId === state.institucionId);
    html += `
      <div class="course-item-card ext-item ${isMatched ? 'is-matched' : ''}" data-id="${curso.id}" onclick="selectExterno('${curso.id}')" id="ext-card-${curso.id}">
        <div>
          <div class="course-item-card__code">${curso.codigo}</div>
          <div class="course-item-card__name">${curso.nombre}</div>
        </div>
        <div class="course-item-card__cred">${curso.creditos} ECTS</div>
      </div>
    `;
  });
  
  UI.extList.innerHTML = html;
}

window.selectUsil = function(id) {
  document.querySelectorAll('.usil-item').forEach(el => el.classList.remove('is-selected'));
  const card = document.getElementById(`usil-card-${id}`);
  if (!card || card.classList.contains('is-matched')) return;
  card.classList.add('is-selected');
  state.selectedUsilId = id;
  checkMatch();
};

window.selectExterno = function(id) {
  document.querySelectorAll('.ext-item').forEach(el => el.classList.remove('is-selected'));
  const card = document.getElementById(`ext-card-${id}`);
  if (!card || card.classList.contains('is-matched')) return;
  card.classList.add('is-selected');
  state.selectedExternoId = id;
  checkMatch();
};

/** Similitud léxica local determinista (sin red): solapamiento de términos. */
function localSimilarity(a, b) {
  const stop = new Set(['de','del','la','las','los','el','y','en','a','e','con','para','por','curso','i','ii','iii']);
  const norm = (s) => String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));
  const A = new Set(norm(a));
  const B = new Set(norm(b));
  if (!A.size || !B.size) return 45;
  let inter = 0;
  A.forEach((w) => { if (B.has(w)) inter++; });
  const jaccard = inter / (A.size + B.size - inter);
  // Escala a un rango legible 45–98%
  return Math.round(45 + jaccard * 53);
}

function checkMatch() {
  if (!(state.selectedUsilId && state.selectedExternoId)) {
    UI.matchBar.style.opacity = '0';
    UI.matchBar.style.pointerEvents = 'none';
    return;
  }

  const cu = state.cursosUsil.find(c => c.id === state.selectedUsilId);
  const ce = state.cursosExternos.find(c => c.id === state.selectedExternoId);

  UI.matchBar.style.opacity = '1';
  UI.matchBar.style.pointerEvents = 'auto';
  UI.btnSaveMatch.disabled = true;
  UI.matchText.innerHTML = `Comparando: <strong>${cu.nombre}</strong> vs <strong>${ce.nombre}</strong>`;
  UI.matchScore.textContent = 'Calculando similitud…';

  const pct = localSimilarity(`${cu.codigo} ${cu.nombre}`, `${ce.codigo} ${ce.nombre}`);
  const color = pct >= 85 ? 'var(--color-success-text)'
    : pct >= 70 ? 'var(--color-warning-text)'
    : 'var(--color-error)';

  // Pequeño retardo solo para feedback visual (sin red)
  setTimeout(() => {
    UI.matchScore.innerHTML = `Similitud semántica: <strong style="color: ${color}">${pct}%</strong>`;
    UI.btnSaveMatch.disabled = false;
    UI.btnSaveMatch.dataset.pct = pct;
  }, 350);
}

async function saveMatch() {
  if (!state.selectedUsilId || !state.selectedExternoId) return;

  const cu = state.cursosUsil.find(c => c.id === state.selectedUsilId);
  const ce = state.cursosExternos.find(c => c.id === state.selectedExternoId);
  const pct = Number(UI.btnSaveMatch.dataset.pct) || 0;

  UI.btnSaveMatch.disabled = true;
  try {
    await db.createEquivalencia({
      cursoUsilId: cu.id,
      cursoExternoId: ce.id,
      institucionId: state.institucionId,
      carreraExternaId: null,
      estado: pct >= 85 ? 'APROBADA' : 'PENDIENTE',
      porcentajeSimilitud: pct,
      observaciones: '',
      creadoPor: coordinador,
      // Snapshots: para cursos extraídos de PDF que no están en el catálogo,
      // así sobreviven al enriquecido de db.getEquivalencias.
      cursoExtSnapshot: { codigo: ce.codigo, nombre: ce.nombre },
      cursoUsilSnapshot: { codigo: cu.codigo, nombre: cu.nombre, ciclo: cu.ciclo }
    });

    await loadEquivalencias();
    state.selectedUsilId = null;
    state.selectedExternoId = null;
    updateMallaUsil();
    renderCursosExternos();
    UI.matchBar.style.opacity = '0';
    UI.matchBar.style.pointerEvents = 'none';
    renderTable();
  } catch (err) {
    console.error('Error al guardar emparejamiento:', err);
    alert('No se pudo guardar el emparejamiento.');
    UI.btnSaveMatch.disabled = false;
  }
}

function renderTable() {
  // Filtrar por institución actual y carrera USIL (para mostrar solo el cruce actual)
  const filtradas = state.equivalencias.filter(e => 
    (e.institucionId === state.institucionId)
  );
  
  if (filtradas.length === 0) {
    UI.tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No hay equivalencias registradas para este cruce.</td></tr>';
    return;
  }
  
  UI.tbody.innerHTML = filtradas.map(e => {
    const usil = (e.cursoUsil && e.cursoUsil.codigo) ? e.cursoUsil : (e.cursoUsilSnapshot || {});
    const ext = (e.cursoExt && e.cursoExt.codigo) ? e.cursoExt : (e.cursoExtSnapshot || {});
    return `
    <tr>
      <td>${usil.ciclo != null ? toRoman(usil.ciclo) : '—'}</td>
      <td>
        <div style="font-weight: bold; font-size: 13px;">${usil.codigo || '—'}</div>
        <div>${usil.nombre || ''}</div>
      </td>
      <td>
        <div style="font-weight: bold; font-size: 13px;">${ext.codigo || '—'}</div>
        <div>${ext.nombre || ''}</div>
      </td>
      <td class="col-center">${e.porcentajeSimilitud != null ? e.porcentajeSimilitud + '%' : '—'}</td>
      <td class="col-center">
        <span class="badge ${e.estado === 'APROBADA' ? 'badge--success' : 'badge--warning'}">
          <span class="badge__dot"></span>${e.estado === 'APROBADA' ? 'Verificado' : 'Pendiente'}
        </span>
      </td>
      <td class="col-center">
        <button class="icon-action" data-action="del-eq" data-id="${e.id}" title="Eliminar"><span data-icon="trash"></span></button>
      </td>
    </tr>`;
  }).reverse().join('');

  safeRenderIcons(UI.tbody);
}

// Boot
init().catch(err => {
  console.error("Init Error:", err);
  alert("Error en la inicialización: " + err.message);
});
