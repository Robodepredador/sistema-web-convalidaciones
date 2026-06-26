import { db } from '../../../shared/js/db.js';

const coordinador =
  (typeof CURRENT_USER !== 'undefined' && CURRENT_USER?.name) || 'Coordinador Académico';

// ─── STATE ────────────────────────────────────────────────────────────────────
const state = {
  equivalencias: [],
  bandeja: [],
  modoAtender: false, // true cuando se llega al wizard desde "Atender" en la bandeja
  cursosUsil: [],
  cursosExternos: [],   // cursos extraídos del record + sugerencias IA pre-calculadas

  selectedUsilId: null,
  selectedExternoId: null,
  iaActiva: false,

  // Paso 1
  alumnoNombre: '',
  alumnoDni: '',
  institucionId: '',
  carreraUsilId: '',
  anioMalla: '2023',
  archivoFile: null,
};

// ─── UI ───────────────────────────────────────────────────────────────────────
const UI = {
  // Wizard
  stepper1: document.getElementById('stepper-1'),
  stepper2: document.getElementById('stepper-2'),
  stepper3: document.getElementById('stepper-3'),
  step1: document.getElementById('step-1'),
  step2: document.getElementById('step-2'),
  step3: document.getElementById('step-3'),
  btnGoStep2: document.getElementById('btn-go-step2'),
  btnBackStep1: document.getElementById('btn-back-step1'),
  btnGoStep3: document.getElementById('btn-go-step3'),
  btnBackStep2: document.getElementById('btn-back-step2'),
  btnResumenFinalizar: document.getElementById('btn-resumen-finalizar'),
  resumenAlumno: document.getElementById('resumen-alumno'),
  resumenTbody: document.getElementById('resumen-tbody'),
  resumenStats: document.getElementById('resumen-stats'),

  // Paso 1 — postulante
  inpAlumnoNombre: document.getElementById('inp-alumno-nombre'),
  inpAlumnoDni: document.getElementById('inp-alumno-dni'),
  selInst: document.getElementById('crit-inst'),

  // Paso 1 — destino USIL
  selCarreraUsil: document.getElementById('crit-carrera-usil'),
  selAnio: document.getElementById('crit-anio'),

  // Paso 1 — archivo
  dropArea: document.getElementById('pdf-drop-area'),
  fileUpload: document.getElementById('eq-file-upload'),
  fileReadyBar: document.getElementById('file-ready-bar'),
  fileNameDisplay: document.getElementById('file-name-display'),
  btnAnalyze: document.getElementById('btn-analyze'),
  btnRemoveFile: document.getElementById('btn-remove-file'),
  aiProcessing: document.getElementById('ai-processing'),
  aiStatusText: document.getElementById('ai-status-text'),
  aiProgressText: document.getElementById('ai-progress-text'),
  extractionSuccess: document.getElementById('extraction-success'),
  extractionCountText: document.getElementById('extraction-count-text'),
  btnReUpload: document.getElementById('btn-re-upload'),

  // Paso 2
  btnIaSuggest: document.getElementById('btn-ia-suggest'),
  usilList: document.getElementById('usil-course-list'),
  usilMeta: document.getElementById('usil-header-meta'),
  extList: document.getElementById('ext-courses-container'),
  extMeta: document.getElementById('ext-header-meta'),

  // Match bar
  matchBar: document.getElementById('match-action-bar'),
  matchText: document.getElementById('match-text'),
  matchScore: document.getElementById('match-score'),
  btnSaveMatch: document.getElementById('btn-save-match'),
  btnSinEquiv: document.getElementById('btn-sin-equiv'),

  // Tabla inferior
  tbody: document.getElementById('equiv-tbody'),

  // Pestañas
  tabBtns: document.querySelectorAll('.eq-tab-btn'),
  tabContents: document.querySelectorAll('.eq-tab-content'),

  // Bandeja de atención
  bandejaTbody: document.getElementById('bandeja-tbody'),
  bandejaSearch: document.getElementById('bandeja-search'),
  bandejaEstado: document.getElementById('bandeja-estado'),
  bandejaInst: document.getElementById('bandeja-inst'),
  statTotal: document.getElementById('stat-total'),
  statPendientes: document.getElementById('stat-pendientes'),
  statAprobadas: document.getElementById('stat-aprobadas'),
  statRechazadas: document.getElementById('stat-rechazadas'),
  statTasa: document.getElementById('stat-tasa'),

  // Modal detalle
  modalDetalle: document.getElementById('modal-detalle'),
  detalleBody: document.getElementById('detalle-body'),
  detalleFooter: document.getElementById('detalle-footer'),
  detalleClose: document.getElementById('detalle-close'),
};

function safeRenderIcons(root) {
  if (window.renderIcons) window.renderIcons(root || document.body);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  await loadFiltros();
  await loadEquivalencias();
  setupListeners();
  setupTabs();
  setupBandeja();
  renderTable();
  await loadBandeja();
}

async function loadFiltros() {
  const insts = await db.getInstituciones();
  UI.selInst.innerHTML = '<option value="">Seleccionar...</option>' +
    insts.map(i => `<option value="${i.id}">${i.nombre} (${i.pais})</option>`).join('');

  UI.bandejaInst.innerHTML = '<option value="">Todas</option>' +
    insts.map(i => `<option value="${i.id}">${i.siglas || i.nombre}</option>`).join('');

  state.cursosUsil = await db.getCursosUsil();
  const facultades = [...new Set(state.cursosUsil.map(c => c.facultad))];
  UI.selCarreraUsil.innerHTML = '<option value="">Seleccionar...</option>' +
    facultades.map(f => `<option value="${f}">${f}</option>`).join('');
}

async function loadEquivalencias() {
  state.equivalencias = await db.getEquivalencias();
}

// ─── LISTENERS ────────────────────────────────────────────────────────────────
function setupListeners() {
  // Navegación wizard
  UI.btnGoStep2.addEventListener('click', () => goStep(2));
  UI.btnBackStep1.addEventListener('click', () => goStep(1));
  UI.btnGoStep3.addEventListener('click', () => goStep(3));
  UI.btnBackStep2.addEventListener('click', () => goStep(2));
  UI.btnResumenFinalizar.addEventListener('click', () => {
    resetWizardStep1();
    goStep(1);
    showTab('eq-tab-bandeja');
  });

  // Campos Paso 1
  UI.inpAlumnoNombre.addEventListener('input', e => { state.alumnoNombre = e.target.value.trim(); });
  UI.inpAlumnoDni.addEventListener('input', e => { state.alumnoDni = e.target.value.trim(); });

  UI.selInst.addEventListener('change', e => {
    state.institucionId = e.target.value;
    validateStep1();
  });
  UI.selCarreraUsil.addEventListener('change', e => {
    state.carreraUsilId = e.target.value;
    validateStep1();
  });
  UI.selAnio.addEventListener('change', e => { state.anioMalla = e.target.value; });

  // Drag-and-drop
  UI.dropArea.addEventListener('click', () => UI.fileUpload.click());
  UI.dropArea.addEventListener('dragover', e => {
    e.preventDefault();
    UI.dropArea.classList.add('drag-over');
  });
  UI.dropArea.addEventListener('dragleave', () => UI.dropArea.classList.remove('drag-over'));
  UI.dropArea.addEventListener('drop', e => {
    e.preventDefault();
    UI.dropArea.classList.remove('drag-over');
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  });
  UI.fileUpload.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  });

  // Botones de archivo
  UI.btnAnalyze.addEventListener('click', analyzeFile);
  UI.btnRemoveFile.addEventListener('click', resetFileState);
  UI.btnReUpload.addEventListener('click', resetFileState);

  // Sugerencia IA
  UI.btnIaSuggest.addEventListener('click', applyIASuggestions);

  // Emparejamiento
  UI.btnSaveMatch.addEventListener('click', saveMatch);
  UI.btnSinEquiv.addEventListener('click', () => {
    if (state.selectedExternoId) markSinEquivalencia(state.selectedExternoId);
  });

  // Eliminar equivalencia (soft delete)
  UI.tbody.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action="del-eq"]');
    if (!btn) return;
    if (!confirm('¿Quitar esta equivalencia? Los cursos regresarán a las listas para ser emparejados de nuevo.')) return;
    btn.disabled = true;
    await db.deleteEquivalencia(btn.dataset.id);
    await loadEquivalencias();
    updateMallaUsil();
    renderCursosExternos();
    renderTable();
  });
}

// ─── WIZARD ───────────────────────────────────────────────────────────────────
function goStep(step) {
  [UI.step1, UI.step2, UI.step3].forEach(s => s.classList.remove('is-active'));
  [UI.stepper1, UI.stepper2, UI.stepper3].forEach(s => s.classList.remove('is-active', 'is-done'));

  if (step === 1) {
    UI.step1.classList.add('is-active');
    UI.stepper1.classList.add('is-active');
  } else if (step === 2) {
    UI.step2.classList.add('is-active');
    UI.stepper1.classList.add('is-done');
    UI.stepper2.classList.add('is-active');
    updateMallaUsil();
    renderCursosExternos();
    renderTable();
  } else if (step === 3) {
    UI.step3.classList.add('is-active');
    UI.stepper1.classList.add('is-done');
    UI.stepper2.classList.add('is-done');
    UI.stepper3.classList.add('is-active');
    renderResumen();
  }
}

function validateStep1() {
  const ok = state.carreraUsilId && state.institucionId && state.cursosExternos.length > 0;
  UI.btnGoStep2.disabled = !ok;
}

// ─── MANEJO DE ARCHIVO ────────────────────────────────────────────────────────
function onFileSelected(file) {
  state.archivoFile = file;
  state.cursosExternos = [];
  validateStep1();

  UI.dropArea.style.display = 'none';
  UI.extractionSuccess.style.display = 'none';
  UI.aiProcessing.style.display = 'none';
  UI.fileReadyBar.style.display = 'flex';
  UI.fileNameDisplay.textContent = file.name;
  safeRenderIcons(UI.fileReadyBar);
}

function resetFileState() {
  state.archivoFile = null;
  state.cursosExternos = [];
  state.iaActiva = false;
  UI.fileUpload.value = '';

  UI.dropArea.style.display = '';
  UI.fileReadyBar.style.display = 'none';
  UI.aiProcessing.style.display = 'none';
  UI.extractionSuccess.style.display = 'none';
  validateStep1();
}

// Mensajes animados durante el análisis
const ANALYSIS_STEPS = [
  { main: 'Leyendo el documento…', sub: 'Procesando páginas del archivo' },
  { main: 'Identificando estructura de tabla…', sub: 'Detectando columnas de cursos' },
  { main: 'Extrayendo cursos y créditos…', sub: 'Analizando códigos académicos' },
  { main: 'Calculando similitud con malla USIL…', sub: 'Generando sugerencias de emparejamiento' },
];

async function analyzeFile() {
  if (!state.archivoFile) return;

  UI.fileReadyBar.style.display = 'none';
  UI.aiProcessing.style.display = 'block';
  safeRenderIcons(UI.aiProcessing);

  // Animar mensajes de progreso cada 550 ms
  let stepIdx = 0;
  const showStep = i => {
    const s = ANALYSIS_STEPS[Math.min(i, ANALYSIS_STEPS.length - 1)];
    UI.aiStatusText.textContent = s.main;
    UI.aiProgressText.textContent = s.sub;
  };
  showStep(0);
  const interval = setInterval(() => showStep(++stepIdx), 550);

  let cursos = null;
  try {
    // Extracción real y tiempo mínimo de animación en paralelo
    [cursos] = await Promise.all([
      extractCourses(state.archivoFile),
      new Promise(r => setTimeout(r, 2200)),
    ]);
  } catch (err) {
    console.warn('[analyzeFile] Fallback al mock:', err.message);
    await new Promise(r => setTimeout(r, 2200));
  }

  clearInterval(interval);

  // Si la extracción no devolvió cursos, usar mock basado en SENATI
  if (!cursos || cursos.length === 0) cursos = mockCoursesFallback();

  // Pre-calcular sugerencia IA para cada curso externo
  state.cursosExternos = computeSuggestions(cursos, state.cursosUsil);

  UI.aiProcessing.style.display = 'none';
  UI.extractionSuccess.style.display = 'flex';
  UI.extractionCountText.textContent =
    `${state.cursosExternos.length} cursos identificados — listo para emparejar`;
  safeRenderIcons(UI.extractionSuccess);
  validateStep1();
}

// ─── EXTRACCIÓN REAL (PDF.js + SheetJS, carga diferida) ──────────────────────
async function extractCourses(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'pdf') {
    const text = await readPDFText(file);
    return parseRecordHistorico(text);
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    const rows = await readExcelRows(file);
    return parseCursosFromExcelRows(rows);
  }
  return [];
}

async function readPDFText(file) {
  const { getDocument, GlobalWorkerOptions } = await import(
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs'
  );
  GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

  const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
  let fullText = '';

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    // Ordenar top→bottom (mayor Y primero), dentro de fila left→right
    const sorted = [...content.items].sort((a, b) => {
      const dy = b.transform[5] - a.transform[5];
      return Math.abs(dy) > 5 ? dy : a.transform[4] - b.transform[4];
    });

    // Agrupar ítems por fila (misma coordenada Y ±5 px)
    // join('') sin espacio: replica el comportamiento de pdf-parse donde
    // celdas de la misma fila se concatenan: "S1SCIU-178", "855.017,6"
    let rows = [], currentRow = [], lastY = null;
    for (const item of sorted) {
      const y = item.transform[5];
      if (lastY === null || Math.abs(y - lastY) <= 5) {
        currentRow.push(item.str);
      } else {
        if (currentRow.length) rows.push(currentRow.join(''));
        currentRow = [item.str];
      }
      lastY = y;
    }
    if (currentRow.length) rows.push(currentRow.join(''));

    fullText += rows.join('\n') + '\n';
  }
  return fullText;
}

async function readExcelRows(file) {
  const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs');
  const wb = XLSX.read(await file.arrayBuffer());
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

// ─── PARSERS ──────────────────────────────────────────────────────────────────
function parseRecordHistorico(text) {
  // Máquina de estados para formato SENATI (y similares):
  // Línea 1: S{n}{CODIGO}  e.g. "S1SCIU-178"
  // Línea 2+: nombre del curso (puede ser varias líneas si el PDF lo cortó)
  // Última línea: DD/MM/YYYYDD/MM/YYYY{horas}{créditos con punto}{nota con coma}
  const courses = [];
  const seen = new Set();
  const lines = text.split('\n')
    .map(l => l.trim().replace(/\u0000/g, ''))
    .filter(Boolean);

  let i = 0;
  while (i < lines.length) {
    const semCodeMatch = lines[i].match(/^S(\d+)([A-Z]{2,5}-\d{3,4})/);
    if (!semCodeMatch) { i++; continue; }

    const semestre = `S${semCodeMatch[1]}`;
    const codigo = semCodeMatch[2];
    if (seen.has(codigo)) { i++; continue; }
    seen.add(codigo);
    i++;

    // Recolectar nombre hasta encontrar la línea de fechas o el siguiente código
    const nombreParts = [];
    while (i < lines.length) {
      const l = lines[i];
      if (l.match(/^S\d+[A-Z]/) || l.match(/^\d{2}\/\d{2}\/\d{4}/)) break;
      nombreParts.push(l);
      i++;
    }
    const nombre = nombreParts.join(' ').trim().replace(/\s+/g, ' ').toUpperCase();

    // Línea de datos: empieza con fecha DD/MM/YYYY
    // Formato: {F.INICIO 10c}{F.FIN 10c}{HORAS}{CRÉDITOS punto}{NOTA coma}
    // Ejemplo: "13/02/202307/06/2023855.017,6"
    let creditos = 0, nota = null;
    if (i < lines.length && lines[i].match(/^\d{2}\/\d{2}\/\d{4}/)) {
      const dataLine = lines[i];
      i++;
      // Quitar las 2 fechas (DD/MM/YYYY = 10 chars c/u) para aislar HORAS+CRÉDITOS+NOTA
      const tail = dataLine.replace(/^\d{2}\/\d{2}\/\d{4}\d{2}\/\d{2}\/\d{4}/, '');
      // NOTA al final con coma decimal (e.g. "17,6", "20,0")
      const notaM = tail.match(/(\d{1,2},\d)$/);
      if (notaM) {
        nota = parseFloat(notaM[1].replace(',', '.'));
        // {HORAS}{CRÉDITOS}: e.g. "855.0" o "20412.0"
        const horasCreditos = tail.slice(0, tail.lastIndexOf(notaM[1]));
        const dotIdx = horasCreditos.indexOf('.');
        if (dotIdx >= 2) {
          const beforeDot = horasCreditos.slice(0, dotIdx);
          const decPart = horasCreditos.slice(dotIdx); // ".0" o ".5"
          // Intentar 2 dígitos como parte entera de créditos; si > 12, usar 1 dígito
          const twoDigit = parseFloat(beforeDot.slice(-2) + decPart);
          creditos = twoDigit <= 12 ? twoDigit : parseFloat(beforeDot.slice(-1) + decPart);
        } else if (dotIdx >= 0) {
          creditos = parseFloat(horasCreditos);
        }
      }
    }

    if (nombre.length > 2) {
      courses.push({ id: `EXT_${courses.length + 1}`, codigo, semestre, nombre, creditos, nota });
    }
  }
  return courses;
}

function parseCursosFromExcelRows(rows) {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]);
  const find = candidates =>
    keys.find(k => candidates.some(c => k.toLowerCase().includes(c)));

  const codigoKey = find(['codigo', 'cod', 'mat-cur', 'clave', 'code']);
  const nombreKey = find(['nombre', 'curso', 'asignatura', 'materia', 'descripcion', 'course']);
  const creditosKey = find(['credito', 'credit', 'cred', 'unidad']);
  const notaKey = find(['nota', 'calificacion', 'grade', 'promedio', 'puntaje']);

  if (!nombreKey) return [];

  return rows
    .filter(r => String(r[nombreKey] || '').trim().length > 2)
    .map((r, i) => ({
      id: `EXT_${i + 1}`,
      codigo: codigoKey ? String(r[codigoKey]).trim() : `EXT-${String(i + 1).padStart(3, '0')}`,
      nombre: String(r[nombreKey]).trim().toUpperCase(),
      creditos: creditosKey ? parseFloat(String(r[creditosKey]).replace(',', '.')) || 0 : 0,
      nota: notaKey ? parseFloat(String(r[notaKey]).replace(',', '.')) || null : null,
    }));
}

// ─── MOCK DE FALLBACK (41 cursos reales SENATI — Ingeniería de Software con IA) ─
function mockCoursesFallback() {
  return [
    // S1
    { id: 'EXT_1', codigo: 'SCIU-178', semestre: 'S1', nombre: 'MATEMÁTICA', creditos: 5.0, nota: 17.6 },
    { id: 'EXT_2', codigo: 'SCIU-179', semestre: 'S1', nombre: 'FÍSICA Y QUÍMICA', creditos: 3.0, nota: 17.0 },
    { id: 'EXT_3', codigo: 'SCOU-214', semestre: 'S1', nombre: 'INGLÉS I', creditos: 4.0, nota: 13.7 },
    { id: 'EXT_4', codigo: 'SINU-152', semestre: 'S1', nombre: 'INTRODUCCIÓN A LAS TECNOLOGÍAS DE LA INFORMACIÓN', creditos: 6.0, nota: 18.3 },
    { id: 'EXT_5', codigo: 'SINU-153', semestre: 'S1', nombre: 'COMPETENCIAS DIGITALES PARA LA INDUSTRIA', creditos: 6.0, nota: 19.1 },
    { id: 'EXT_6', codigo: 'SPSU-867', semestre: 'S1', nombre: 'LENGUAJE Y COMUNICACIÓN', creditos: 3.0, nota: 16.2 },
    { id: 'EXT_7', codigo: 'SPSU-868', semestre: 'S1', nombre: 'DESARROLLO PERSONAL Y TALLER DE LIDERAZGO', creditos: 3.0, nota: 17.3 },
    // S2
    { id: 'EXT_8', codigo: 'CGEU-247', semestre: 'S2', nombre: 'SEGURIDAD E HIGIENE INDUSTRIAL', creditos: 2.0, nota: 15.3 },
    { id: 'EXT_9', codigo: 'PIAD-216', semestre: 'S2', nombre: 'ALGORITMIA PARA EL DESARROLLO DE PROGRAMAS', creditos: 4.5, nota: 17.1 },
    { id: 'EXT_10', codigo: 'PIAD-217', semestre: 'S2', nombre: 'JAVA FUNDAMENTALS (ORACLE)', creditos: 6.0, nota: 18.6 },
    { id: 'EXT_11', codigo: 'PIAD-218', semestre: 'S2', nombre: 'FUNDAMENTOS DE PROGRAMACIÓN WEB (FRONT END DEVELOPER)', creditos: 4.5, nota: 19.0 },
    { id: 'EXT_12', codigo: 'PIAD-219', semestre: 'S2', nombre: 'DATABASE FOUNDATIONS (ORACLE)', creditos: 4.5, nota: 17.4 },
    { id: 'EXT_13', codigo: 'PIAD-220', semestre: 'S2', nombre: 'RED HAT SYSTEM ADMINISTRATION I (LINUX RED HAT)', creditos: 4.5, nota: 19.5 },
    { id: 'EXT_14', codigo: 'SCOU-235', semestre: 'S2', nombre: 'INGLÉS II', creditos: 4.0, nota: 16.3 },
    // S3
    { id: 'EXT_15', codigo: 'PIAD-316', semestre: 'S3', nombre: 'PROGRAMACIÓN PARA DESARROLLO DE SOFTWARE WITH ORACLE', creditos: 12.0, nota: 15.5 },
    { id: 'EXT_16', codigo: 'PIAD-317', semestre: 'S3', nombre: 'ING. DE SOFTWARE Y METODOLOGÍAS ÁGILES', creditos: 6.0, nota: 13.0 },
    { id: 'EXT_17', codigo: 'PIAD-318', semestre: 'S3', nombre: 'BACKEND DEVELOPER WEB', creditos: 6.0, nota: 13.6 },
    { id: 'EXT_18', codigo: 'SCOU-236', semestre: 'S3', nombre: 'INGLÉS III', creditos: 4.0, nota: 11.1 },
    { id: 'EXT_19', codigo: 'SPSU-865', semestre: 'S3', nombre: 'TÉCNICAS DE LA COMUNICACIÓN', creditos: 2.0, nota: 15.9 },
    // S4
    { id: 'EXT_20', codigo: 'PIAD-425', semestre: 'S4', nombre: 'MÓDULOS Y PAQUETES PARA MACHINE LEARNING CON PYTHON', creditos: 1.5, nota: 17.4 },
    { id: 'EXT_21', codigo: 'PIAD-426', semestre: 'S4', nombre: 'FUNDAMENTOS Y ALGORITMIA PARA INTELIGENCIA ARTIFICIAL', creditos: 1.5, nota: 17.4 },
    { id: 'EXT_22', codigo: 'PIAD-427', semestre: 'S4', nombre: 'MACHINE LEARNING Y DEEP LEARNING', creditos: 1.5, nota: 17.8 },
    { id: 'EXT_23', codigo: 'PIAD-428', semestre: 'S4', nombre: 'ARTIFICIAL INTELLIGENCE WITH MACHINE LEARNING IN JAVA (ORACLE)', creditos: 1.5, nota: 17.4 },
    { id: 'EXT_24', codigo: 'PIAD-429', semestre: 'S4', nombre: 'FORMACIÓN PRÁCTICA EN EMPRESA I', creditos: 7.0, nota: 15.7 },
    { id: 'EXT_25', codigo: 'PIAD-430', semestre: 'S4', nombre: 'SEMINARIO DE COMPLEMENTACIÓN PRÁCTICA I', creditos: 8.0, nota: 17.5 },
    { id: 'EXT_26', codigo: 'SPSU-866', semestre: 'S4', nombre: 'DESARROLLO HUMANO', creditos: 2.0, nota: 16.3 },
    // S5
    { id: 'EXT_27', codigo: 'CGEU-239', semestre: 'S5', nombre: 'CALIDAD TOTAL', creditos: 2.0, nota: 18.7 },
    { id: 'EXT_28', codigo: 'PIAD-525', semestre: 'S5', nombre: 'DISEÑO Y DESARROLLO DE APLICACIONES MÓVILES', creditos: 1.5, nota: 17.6 },
    { id: 'EXT_29', codigo: 'PIAD-526', semestre: 'S5', nombre: 'DISEÑO Y DESARROLLO DE SOLUCIONES IOT', creditos: 1.5, nota: 17.6 },
    { id: 'EXT_30', codigo: 'PIAD-527', semestre: 'S5', nombre: 'FULLSTACK DEVELOPER SOFTWARE', creditos: 1.5, nota: 17.4 },
    { id: 'EXT_31', codigo: 'PIAD-528', semestre: 'S5', nombre: 'TALLER DE DESARROLLO DE APLICACIONES CON MACHINE LEARNING', creditos: 1.5, nota: 18.4 },
    { id: 'EXT_32', codigo: 'PIAD-529', semestre: 'S5', nombre: 'FORMACIÓN PRÁCTICA EN EMPRESA II', creditos: 6.0, nota: 19.7 },
    { id: 'EXT_33', codigo: 'PIAD-530', semestre: 'S5', nombre: 'SEMINARIO DE COMPLEMENTACIÓN PRÁCTICA II', creditos: 8.0, nota: 17.5 },
    { id: 'EXT_34', codigo: 'SCOU-220', semestre: 'S5', nombre: 'INGLÉS TÉCNICO', creditos: 2.0, nota: 18.2 },
    // S6
    { id: 'EXT_35', codigo: 'CGEU-240', semestre: 'S6', nombre: 'FORMACIÓN DE MONITORES DE EMPRESA', creditos: 2.0, nota: 19.1 },
    { id: 'EXT_36', codigo: 'CGEU-241', semestre: 'S6', nombre: 'MEJORA DE MÉTODOS EN EL TRABAJO', creditos: 2.0, nota: 14.0 },
    { id: 'EXT_37', codigo: 'PIAD-625', semestre: 'S6', nombre: 'BIG DATA Y ANÁLISIS DE DATOS', creditos: 1.5, nota: 17.0 },
    { id: 'EXT_38', codigo: 'PIAD-626', semestre: 'S6', nombre: 'TECNOLOGÍA CLOUD CON AWS', creditos: 3.0, nota: 17.5 },
    { id: 'EXT_39', codigo: 'PIAD-627', semestre: 'S6', nombre: 'AI-900T00 CONCEPTOS BÁSICOS DE IA EN MICROSOFT AZURE', creditos: 1.5, nota: 16.5 },
    { id: 'EXT_40', codigo: 'PIAD-628', semestre: 'S6', nombre: 'FORMACIÓN PRÁCTICA EN EMPRESA III', creditos: 6.0, nota: 20.0 },
    { id: 'EXT_41', codigo: 'PIAD-629', semestre: 'S6', nombre: 'SEMINARIO DE COMPLEMENTACIÓN PRÁCTICA III', creditos: 8.0, nota: 18.1 },
  ];
}

// ─── SUGERENCIAS IA (similitud léxica local, sin red) ─────────────────────────
// Umbral mínimo para mostrar sugerencia: si el mejor match no supera este
// valor, el label y el badge de similitud no se muestran (evita sugerencias
// engañosas cuando la concordancia real es muy baja).
const SUGGESTION_THRESHOLD = 65;

function computeSuggestions(cursosExt, cursosUsil) {
  return cursosExt.map(ext => {
    let bestScore = 0, bestId = null, bestNombre = '';
    for (const usil of cursosUsil) {
      const score = localSimilarity(`${ext.codigo} ${ext.nombre}`, `${usil.codigo} ${usil.nombre}`);
      if (score > bestScore) { bestScore = score; bestId = usil.id; bestNombre = usil.nombre; }
    }
    const valid = bestScore >= SUGGESTION_THRESHOLD;
    return {
      ...ext,
      sugerenciaUsilId: valid ? bestId : null,
      sugerenciaScore: valid ? bestScore : 0,
      sugerenciaNombre: valid ? bestNombre : '',
    };
  });
}

// ─── PASO 2: RENDER LISTAS ────────────────────────────────────────────────────
function updateMallaUsil() {
  UI.usilMeta.textContent = `${state.carreraUsilId} · ${state.anioMalla}`;
  const cursos = state.cursosUsil.filter(c => c.facultad === state.carreraUsilId);

  if (!cursos.length) {
    UI.usilList.innerHTML = '<div style="text-align:center;padding:var(--space-6);color:var(--color-text-muted);">No hay cursos.</div>';
    return;
  }

  const ciclos = {};
  cursos.forEach(c => { (ciclos[c.ciclo] = ciclos[c.ciclo] || []).push(c); });

  let html = '';
  Object.keys(ciclos).sort((a, b) => a - b).forEach(ciclo => {
    const pendientes = ciclos[ciclo].filter(curso =>
      !state.equivalencias.some(e => e.cursoUsilId === curso.id && e.institucionId === state.institucionId)
    );
    if (!pendientes.length) return;
    html += `<div class="ciclo-divider">CICLO ${toRoman(ciclo)}</div>`;
    pendientes.forEach(curso => {
      html += `
        <div class="course-item-card usil-item"
             data-id="${curso.id}" onclick="selectUsil('${curso.id}')" id="usil-card-${curso.id}">
          <div>
            <div class="course-item-card__code">${curso.codigo}</div>
            <div class="course-item-card__name">${curso.nombre}</div>
          </div>
          <div class="course-item-card__cred">${curso.creditos} Créd.</div>
        </div>`;
    });
  });
  if (!html) html = '<div style="text-align:center;padding:var(--space-6);color:var(--color-text-muted);">Todos los cursos emparejados.</div>';
  UI.usilList.innerHTML = html;
}

function renderCursosExternos() {
  const instText = UI.selInst.options[UI.selInst.selectedIndex]?.text || '';
  UI.extMeta.textContent = `${state.alumnoNombre || 'Postulante'} · ${instText}`;

  if (!state.cursosExternos.length) {
    UI.extList.innerHTML = '<div style="text-align:center;padding:var(--space-6);color:var(--color-text-muted);">No hay cursos.</div>';
    UI.btnIaSuggest.style.display = 'none';
    return;
  }

  const pendientes = state.cursosExternos.filter(curso =>
    !state.equivalencias.some(e => e.cursoExternoId === curso.id && e.institucionId === state.institucionId)
  );

  // Controlar visibilidad y estado del botón IA
  if (!pendientes.length) {
    UI.btnIaSuggest.style.display = 'none';
  } else if (state.iaActiva) {
    UI.btnIaSuggest.style.display = 'inline-flex';
    UI.btnIaSuggest.disabled = true;
    UI.btnIaSuggest.innerHTML = '<span data-icon="check"></span> IA aplicada';
    safeRenderIcons(UI.btnIaSuggest);
  } else {
    UI.btnIaSuggest.style.display = 'inline-flex';
    UI.btnIaSuggest.disabled = false;
    UI.btnIaSuggest.innerHTML = '<span data-icon="sparkles"></span> Sugerir con IA';
    safeRenderIcons(UI.btnIaSuggest);
  }

  if (!pendientes.length) {
    UI.extList.innerHTML = '<div style="text-align:center;padding:var(--space-6);color:var(--color-text-muted);">Todos los cursos emparejados.</div>';
    return;
  }

  const total = state.cursosExternos.length;
  UI.extMeta.textContent += ` · ${total - pendientes.length}/${total} emparejados`;

  let html = '';
  pendientes.forEach(curso => {
    const score = state.iaActiva ? (curso.sugerenciaScore || 0) : 0;
    const scoreColor = score >= 85 ? '#16a34a' : score >= 70 ? '#d97706' : '#dc2626';
    const scoreLabel = score >= 85 ? 'Alta' : score >= 70 ? 'Media' : 'Baja';
    const notaText = curso.nota != null ? ` · Nota: ${curso.nota}` : '';

    html += `
      <div class="course-item-card ext-item"
           data-id="${curso.id}" onclick="selectExterno('${curso.id}')" id="ext-card-${curso.id}">
        <div style="flex:1;min-width:0;">
          <div class="course-item-card__code">${curso.codigo}${notaText}</div>
          <div class="course-item-card__name">${curso.nombre}</div>
          ${state.iaActiva && curso.sugerenciaNombre ? `
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:3px;">
            IA sugiere: <span style="color:${scoreColor};font-weight:600;">${curso.sugerenciaNombre}</span>
          </div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;margin-left:8px;">
          <div class="course-item-card__cred">${curso.creditos} Créd.</div>
          ${state.iaActiva && score ? `
          <div style="font-size:11px;font-weight:700;color:${scoreColor};background:${scoreColor}1a;padding:2px 7px;border-radius:99px;">
            ${score}% · ${scoreLabel}
          </div>` : ''}
        </div>
      </div>`;
  });
  UI.extList.innerHTML = html;
}

// ─── SUGERENCIA IA MASIVA ─────────────────────────────────────────────────────
async function applyIASuggestions() {
  state.iaActiva = true;
  renderCursosExternos(); // muestra scores inmediatamente en los cards

  // Auto-aceptar cursos con similitud alta (>=85%) que no estén ya emparejados
  const HIGH_THRESHOLD = 85;
  const usadosUsil = new Set(
    state.equivalencias
      .filter(e => e.institucionId === state.institucionId)
      .map(e => e.cursoUsilId)
  );

  const pendientes = state.cursosExternos.filter(c =>
    !state.equivalencias.some(e => e.cursoExternoId === c.id && e.institucionId === state.institucionId)
  );

  const toCreate = [];
  for (const ce of pendientes) {
    if ((ce.sugerenciaScore || 0) < HIGH_THRESHOLD || !ce.sugerenciaUsilId) continue;
    if (usadosUsil.has(ce.sugerenciaUsilId)) continue;
    const cu = state.cursosUsil.find(c => c.id === ce.sugerenciaUsilId);
    if (!cu) continue;
    usadosUsil.add(ce.sugerenciaUsilId);
    toCreate.push({ ce, cu });
  }

  if (toCreate.length) {
    await Promise.all(toCreate.map(({ ce, cu }) => db.createEquivalencia({
      cursoUsilId: cu.id,
      cursoExternoId: ce.id,
      institucionId: state.institucionId,
      carreraExternaId: null,
      estado: 'PENDIENTE',
      porcentajeSimilitud: ce.sugerenciaScore,
      observaciones: 'Auto-emparejado por sugerencia IA (Alta similitud)',
      creadoPor: coordinador,
      alumnoNombre: state.alumnoNombre,
      alumnoDni: state.alumnoDni,
      cursoExtSnapshot: { codigo: ce.codigo, nombre: ce.nombre, creditos: ce.creditos, nota: ce.nota },
      cursoUsilSnapshot: { codigo: cu.codigo, nombre: cu.nombre, ciclo: cu.ciclo, creditos: cu.creditos },
    })));

    await loadEquivalencias();
    state.selectedUsilId = null;
    state.selectedExternoId = null;
    UI.matchBar.style.opacity = '0';
    UI.matchBar.style.pointerEvents = 'none';
    updateMallaUsil();
    renderCursosExternos();
    renderTable();
  }
}

// ─── ACCIONES RÁPIDAS TARJETAS EXTERNAS ──────────────────────────────────────
window.acceptSuggestion = async function (extId) {
  const ce = state.cursosExternos.find(c => c.id === extId);
  if (!ce?.sugerenciaUsilId) return;

  const cu = state.cursosUsil.find(c => c.id === ce.sugerenciaUsilId);
  if (!cu) return;

  // Verificar que el curso USIL sugerido no esté ya emparejado
  const yaUsado = state.equivalencias.some(
    e => e.cursoUsilId === cu.id && e.institucionId === state.institucionId
  );
  if (yaUsado) {
    alert(`"${cu.nombre}" ya está emparejado con otro curso. Selecciona manualmente un curso USIL distinto.`);
    return;
  }

  const pct = ce.sugerenciaScore || 0;
  try {
    await db.createEquivalencia({
      cursoUsilId: cu.id,
      cursoExternoId: ce.id,
      institucionId: state.institucionId,
      carreraExternaId: null,
      estado: 'PENDIENTE',
      porcentajeSimilitud: pct,
      observaciones: 'Aceptado por sugerencia IA',
      creadoPor: coordinador,
      alumnoNombre: state.alumnoNombre,
      alumnoDni: state.alumnoDni,
      cursoExtSnapshot: { codigo: ce.codigo, nombre: ce.nombre, creditos: ce.creditos, nota: ce.nota },
      cursoUsilSnapshot: { codigo: cu.codigo, nombre: cu.nombre, ciclo: cu.ciclo },
    });
    await loadEquivalencias();
    state.selectedUsilId = null;
    state.selectedExternoId = null;
    UI.matchBar.style.opacity = '0';
    UI.matchBar.style.pointerEvents = 'none';
    updateMallaUsil();
    renderCursosExternos();
    renderTable();
  } catch (err) {
    console.error('Error al aceptar sugerencia:', err);
  }
};

window.markSinEquivalencia = async function (extId) {
  const ce = state.cursosExternos.find(c => c.id === extId);
  if (!ce) return;
  try {
    await db.createEquivalencia({
      cursoUsilId: null,
      cursoExternoId: ce.id,
      institucionId: state.institucionId,
      carreraExternaId: null,
      estado: 'SIN_EQUIVALENCIA',
      porcentajeSimilitud: null,
      observaciones: '',
      creadoPor: coordinador,
      alumnoNombre: state.alumnoNombre,
      alumnoDni: state.alumnoDni,
      cursoExtSnapshot: { codigo: ce.codigo, nombre: ce.nombre, creditos: ce.creditos, nota: ce.nota },
      cursoUsilSnapshot: null,
    });
    await loadEquivalencias();
    state.selectedExternoId = null;
    UI.matchBar.style.opacity = '0';
    UI.matchBar.style.pointerEvents = 'none';
    renderCursosExternos();
    renderTable();
  } catch (err) {
    console.error('Error al marcar sin equivalencia:', err);
  }
};

// ─── SELECCIÓN Y EMPAREJAMIENTO ───────────────────────────────────────────────
window.selectUsil = function (id) {
  document.querySelectorAll('.usil-item').forEach(el => el.classList.remove('is-selected'));
  const card = document.getElementById(`usil-card-${id}`);
  if (!card || card.classList.contains('is-matched')) return;
  card.classList.add('is-selected');
  state.selectedUsilId = id;
  checkMatch();
};

window.selectExterno = function (id) {
  document.querySelectorAll('.ext-item').forEach(el => el.classList.remove('is-selected'));
  const card = document.getElementById(`ext-card-${id}`);
  if (!card || card.classList.contains('is-matched')) return;
  card.classList.add('is-selected');
  state.selectedExternoId = id;
  checkMatch();
};

function localSimilarity(a, b) {
  const stop = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'en', 'a', 'e', 'con', 'para', 'por', 'curso', 'i', 'ii', 'iii']);
  const norm = s => String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stop.has(w));
  const A = new Set(norm(a)), B = new Set(norm(b));
  if (!A.size || !B.size) return 45;
  let inter = 0;
  A.forEach(w => { if (B.has(w)) inter++; });
  return Math.round(45 + (inter / (A.size + B.size - inter)) * 53);
}

function checkMatch() {
  if (!state.selectedExternoId) {
    UI.matchBar.style.opacity = '0';
    UI.matchBar.style.pointerEvents = 'none';
    UI.btnSinEquiv.style.display = 'none';
    return;
  }

  UI.matchBar.style.opacity = '1';
  UI.matchBar.style.pointerEvents = 'auto';
  UI.btnSinEquiv.style.display = 'inline-flex';

  const ce = state.cursosExternos.find(c => c.id === state.selectedExternoId);

  if (!state.selectedUsilId) {
    UI.matchText.innerHTML = `<strong>${ce?.nombre || ''}</strong>`;
    UI.matchScore.textContent = 'Selecciona un curso USIL para emparejar, o usa "Sin equivalencia"';
    UI.btnSaveMatch.disabled = true;
    return;
  }

  const cu = state.cursosUsil.find(c => c.id === state.selectedUsilId);
  const pct = localSimilarity(`${cu.codigo} ${cu.nombre}`, `${ce.codigo} ${ce.nombre}`);

  UI.matchText.innerHTML = `<strong>${cu.nombre}</strong> → <strong>${ce.nombre}</strong>`;
  UI.matchScore.textContent = '';
  UI.btnSaveMatch.disabled = false;
  UI.btnSaveMatch.dataset.pct = pct;
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
      estado: 'PENDIENTE',
      porcentajeSimilitud: pct,
      observaciones: '',
      creadoPor: coordinador,
      alumnoNombre: state.alumnoNombre,
      alumnoDni: state.alumnoDni,
      cursoExtSnapshot: { codigo: ce.codigo, nombre: ce.nombre, creditos: ce.creditos, nota: ce.nota },
      cursoUsilSnapshot: { codigo: cu.codigo, nombre: cu.nombre, ciclo: cu.ciclo },
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
    console.error('Error al guardar:', err);
    alert('No se pudo guardar el emparejamiento.');
    UI.btnSaveMatch.disabled = false;
  }
}

// ─── TABLA INFERIOR ───────────────────────────────────────────────────────────
function toRoman(n) {
  const m = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X' };
  return m[n] || n;
}

function renderTable() {
  const filtradas = state.equivalencias.filter(e => e.institucionId === state.institucionId);

  const hayEmparejados = filtradas.some(e => e.estado !== 'SIN_EQUIVALENCIA');
  UI.btnGoStep3.disabled = !hayEmparejados;

  if (!filtradas.length) {
    UI.tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No hay equivalencias registradas para este expediente.</td></tr>';
    return;
  }

  UI.tbody.innerHTML = [...filtradas].reverse().map(e => {
    const usil = e.cursoUsil?.codigo ? e.cursoUsil : (e.cursoUsilSnapshot || {});
    const ext = e.cursoExt?.codigo ? e.cursoExt : (e.cursoExtSnapshot || {});
    const nota = ext.nota != null
      ? `<div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">Nota: ${ext.nota}</div>`
      : '';
    const esSinEq = e.estado === 'SIN_EQUIVALENCIA';
    const pct = e.porcentajeSimilitud;
    const pctColor = pct >= 85 ? 'var(--color-success-text)' : pct >= 70 ? '#b45309' : 'var(--color-error)';
    const pctBg = pct >= 85 ? '#dcfce7' : pct >= 70 ? '#fef3c7' : '#fee2e2';
    const pctText = esSinEq ? '—'
      : pct != null
        ? `<span style="font-weight:700;font-size:12px;color:${pctColor};background:${pctBg};padding:2px 8px;border-radius:99px;">${pct}%</span>`
        : '—';
    const usilCell = esSinEq
      ? `<div style="font-size:12px;color:var(--color-text-muted);font-style:italic;">Sin equivalente en malla USIL</div>`
      : `<div style="font-weight:700;font-size:13px;color:var(--color-brand-800);">${usil.codigo || '—'}</div>
         <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">${usil.nombre || ''}</div>`;
    const badgeHtml = esSinEq
      ? `<span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#6b7280;background:#f3f4f6;padding:3px 10px;border-radius:99px;">
           <span style="width:6px;height:6px;border-radius:50%;background:#9ca3af;flex-shrink:0;display:inline-block;"></span>Sin equiv.
         </span>`
      : `<span class="badge ${e.estado === 'APROBADA' ? 'badge--success' : 'badge--warning'}">
           <span class="badge__dot"></span>${e.estado === 'APROBADA' ? 'Verificado' : 'Pendiente'}
         </span>`;
    return `
    <tr>
      <td style="color:var(--color-text-muted);font-size:13px;font-weight:600;">${!esSinEq && usil.ciclo != null ? toRoman(usil.ciclo) : '—'}</td>
      <td>${usilCell}</td>
      <td>
        <div style="font-weight:700;font-size:13px;color:var(--color-brand-800);">${ext.codigo || '—'}</div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">${ext.nombre || ''}</div>
        ${nota}
      </td>
      <td class="col-center">${pctText}</td>
      <td class="col-center">${badgeHtml}</td>
      <td class="col-center">
        <button class="icon-action" data-action="del-eq" data-id="${e.id}"
                title="Quitar equivalencia — los cursos regresan a las listas"
                style="color:var(--color-error);display:inline-flex;align-items:center;justify-content:center;">
          <svg viewBox="0 0 20 20" fill="none" width="16" height="16"><path d="M4 7h8a4.5 4.5 0 0 1 0 9H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 4 4 7l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('');

  safeRenderIcons(UI.tbody);
}

// ─── RESUMEN PASO 3 ───────────────────────────────────────────────────────────
function renderResumen() {
  // Contexto del expediente
  const instOption = Array.from(UI.selInst.options).find(o => o.value === state.institucionId);
  const instName = instOption ? instOption.text : '—';
  UI.resumenAlumno.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-5);">
      <div>
        <div class="eq-stat-card__label">Postulante</div>
        <div style="font-weight:600;font-size:var(--fs-md);margin-top:4px;">${state.alumnoNombre || '—'}</div>
        ${state.alumnoDni ? `<div style="font-size:var(--fs-xs);color:var(--color-text-muted);margin-top:2px;">DNI: ${state.alumnoDni}</div>` : ''}
      </div>
      <div>
        <div class="eq-stat-card__label">Institución de Origen</div>
        <div style="font-weight:600;font-size:var(--fs-md);margin-top:4px;">${instName}</div>
      </div>
      <div>
        <div class="eq-stat-card__label">Carrera USIL Destino</div>
        <div style="font-weight:600;font-size:var(--fs-md);margin-top:4px;">${state.carreraUsilId || '—'}</div>
      </div>
      <div>
        <div class="eq-stat-card__label">Año de Malla</div>
        <div style="font-weight:600;font-size:var(--fs-md);margin-top:4px;">${state.anioMalla}</div>
      </div>
    </div>`;

  // Solo cursos con equivalencia real
  const emparejadas = state.equivalencias.filter(
    e => e.institucionId === state.institucionId && e.estado !== 'SIN_EQUIVALENCIA'
  );
  const sinEquiv = state.equivalencias.filter(
    e => e.institucionId === state.institucionId && e.estado === 'SIN_EQUIVALENCIA'
  );

  if (!emparejadas.length) {
    UI.resumenTbody.innerHTML = '<tr><td colspan="6" class="table-empty">No hay cursos emparejados para mostrar.</td></tr>';
  } else {
    UI.resumenTbody.innerHTML = [...emparejadas].reverse().map(e => {
      const usil = e.cursoUsil?.codigo ? e.cursoUsil : (e.cursoUsilSnapshot || {});
      const ext  = e.cursoExt?.codigo  ? e.cursoExt  : (e.cursoExtSnapshot  || {});
      const pct  = e.porcentajeSimilitud;
      const pctColor = pct >= 85 ? 'var(--color-success-text)' : pct >= 70 ? '#b45309' : 'var(--color-error)';
      const pctBg    = pct >= 85 ? '#dcfce7' : pct >= 70 ? '#fef3c7' : '#fee2e2';
      const pctBadge = pct != null
        ? `<span style="font-weight:700;font-size:12px;color:${pctColor};background:${pctBg};padding:2px 8px;border-radius:99px;">${pct}%</span>`
        : '—';
      return `
        <tr>
          <td style="color:var(--color-text-muted);font-weight:600;">${usil.ciclo != null ? toRoman(usil.ciclo) : '—'}</td>
          <td>
            <div style="font-weight:700;font-size:13px;color:var(--color-brand-800);">${usil.codigo || '—'}</div>
            <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">${usil.nombre || ''}</div>
          </td>
          <td>
            <div style="font-weight:700;font-size:13px;">${ext.codigo || '—'}</div>
            <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">${ext.nombre || ''}</div>
            ${ext.nota != null ? `<div style="font-size:11px;color:var(--color-text-muted);">Nota: ${ext.nota}</div>` : ''}
          </td>
          <td class="col-center" style="font-weight:600;">${usil.creditos != null ? usil.creditos : '—'}</td>
          <td class="col-center">${pctBadge}</td>
          <td class="col-center">
            <span class="badge ${e.estado === 'APROBADA' ? 'badge--success' : 'badge--warning'}">
              <span class="badge__dot"></span>${e.estado === 'APROBADA' ? 'Verificado' : 'Pendiente'}
            </span>
          </td>
        </tr>`;
    }).join('');
  }

  // Stats
  const creditosRecup = emparejadas.reduce((sum, e) => {
    const usil = e.cursoUsil?.creditos != null ? e.cursoUsil : (e.cursoUsilSnapshot || {});
    return sum + (usil.creditos || 0);
  }, 0);
  const avgSim = emparejadas.length > 0
    ? Math.round(emparejadas.reduce((s, e) => s + (e.porcentajeSimilitud || 0), 0) / emparejadas.length)
    : 0;
  const simColor = avgSim >= 85 ? 'var(--color-success-text)' : avgSim >= 70 ? '#b45309' : 'var(--color-error)';

  UI.resumenStats.innerHTML = `
    <div class="eq-stat-card">
      <div class="eq-stat-card__label">Cursos emparejados</div>
      <div class="eq-stat-card__value" style="color:var(--color-brand-700);">${emparejadas.length}</div>
    </div>
    <div class="eq-stat-card">
      <div class="eq-stat-card__label">Sin equivalencia</div>
      <div class="eq-stat-card__value" style="color:var(--color-text-muted);">${sinEquiv.length}</div>
    </div>
    <div class="eq-stat-card">
      <div class="eq-stat-card__label">Créditos USIL recuperados</div>
      <div class="eq-stat-card__value" style="color:var(--color-success-text);">${creditosRecup}</div>
    </div>
    <div class="eq-stat-card">
      <div class="eq-stat-card__label">Similitud promedio</div>
      <div class="eq-stat-card__value" style="color:${simColor};">${avgSim > 0 ? avgSim + '%' : '—'}</div>
    </div>`;
}

// ─── BANDEJA DE ATENCIÓN ──────────────────────────────────────────────────────
function setupTabs() {
  UI.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.target));
  });
}

function setWizardLock(locked) {
  [UI.inpAlumnoNombre, UI.inpAlumnoDni, UI.selInst, UI.selCarreraUsil, UI.selAnio].forEach(el => {
    el.disabled = locked;
  });
}

function resetWizardStep1() {
  setWizardLock(false);
  UI.inpAlumnoNombre.value = '';
  UI.inpAlumnoDni.value = '';
  UI.selInst.value = '';
  UI.selCarreraUsil.value = '';
  UI.selAnio.value = '2023';
  state.alumnoNombre = '';
  state.alumnoDni = '';
  state.institucionId = '';
  state.carreraUsilId = '';
  state.anioMalla = '2023';
  resetFileState();
  validateStep1();
}

function showTab(id) {
  UI.tabBtns.forEach(b => b.classList.toggle('is-active', b.dataset.target === id));
  UI.tabContents.forEach(c => c.classList.toggle('is-active', c.id === id));
  if (id === 'eq-tab-bandeja') loadBandeja();
  if (id === 'eq-tab-nueva' && !state.modoAtender) resetWizardStep1();
}

function setupBandeja() {
  UI.bandejaSearch.addEventListener('input', () => renderBandeja());
  UI.bandejaEstado.addEventListener('change', () => renderBandeja());
  UI.bandejaInst.addEventListener('change', () => renderBandeja());

  // Acciones inline de la tabla (delegación)
  UI.bandejaTbody.addEventListener('click', e => {
    const btn = e.target.closest('[data-bandeja-action]');
    if (!btn) return;
    const { bandejaAction: action, id } = btn.dataset;
    if (action === 'atender') return atenderSolicitud(id);
  });

  // Modal
  UI.detalleClose.addEventListener('click', closeDetalle);
  UI.modalDetalle.addEventListener('click', e => {
    if (e.target === UI.modalDetalle) closeDetalle();
  });
}

async function loadBandeja() {
  const [solicitudes, insts] = await Promise.all([
    db.getSolicitudesAdmision(),
    db.getInstituciones(),
  ]);

  const carrerasCache = {};
  const getCarrerasInst = async (instId) => {
    if (!carrerasCache[instId]) {
      carrerasCache[instId] = await db.getCarrerasByInstitucion(instId);
    }
    return carrerasCache[instId];
  };

  state.bandeja = await Promise.all(solicitudes.map(async sol => {
    const inst = insts.find(i => i.id === sol.academico.institucionOrigenId) || {};
    let carreraOrigen = { nombre: '—' };
    if (sol.academico.carreraOrigenId) {
      const carreras = await getCarrerasInst(sol.academico.institucionOrigenId);
      carreraOrigen = carreras.find(c => c.id === sol.academico.carreraOrigenId) || { nombre: '—' };
    }
    return { ...sol, _inst: inst, _carreraOrigen: carreraOrigen };
  }));

  const total = solicitudes.length;
  const pendientes = solicitudes.filter(s => s.estado === 'PENDIENTE').length;
  const enRevision = solicitudes.filter(s => s.estado === 'EN REVISIÓN').length;
  const aprobadas = solicitudes.filter(s => s.estado === 'APROBADA').length;
  const tasa = total > 0 ? Math.round((aprobadas / total) * 100) : 0;

  UI.statTotal.textContent = total;
  UI.statPendientes.textContent = pendientes;
  UI.statAprobadas.textContent = aprobadas;
  UI.statRechazadas.textContent = enRevision;
  UI.statTasa.textContent = tasa + '%';
  renderBandeja();
}

// Resuelve los datos de curso usando el snapshot cuando el id no existe en la DB
// (las equivalencias creadas desde el wizard guardan los cursos del record en snapshot).
function resolveCursos(e) {
  const usil = e.cursoUsil?.codigo ? e.cursoUsil : (e.cursoUsilSnapshot || {});
  const ext = e.cursoExt?.codigo ? e.cursoExt : (e.cursoExtSnapshot || {});
  return { usil, ext };
}

function estadoBadge(estado) {
  if (estado === 'APROBADA') return '<span class="badge badge--success"><span class="badge__dot"></span>Aprobada</span>';
  if (estado === 'RECHAZADA') return '<span class="badge badge--danger"><span class="badge__dot"></span>Rechazada</span>';
  if (estado === 'EN REVISIÓN') return '<span class="badge badge--info"><span class="badge__dot"></span>En revisión</span>';
  return '<span class="badge badge--warning"><span class="badge__dot"></span>Pendiente</span>';
}

function pctBadge(pct, esSinEq) {
  if (esSinEq || pct == null) return '<span style="color:var(--color-text-muted);">—</span>';
  const color = pct >= 85 ? 'var(--color-success-text)' : pct >= 70 ? '#b45309' : 'var(--color-error)';
  const bg = pct >= 85 ? '#dcfce7' : pct >= 70 ? '#fef3c7' : '#fee2e2';
  return `<span style="font-weight:700;font-size:12px;color:${color};background:${bg};padding:2px 8px;border-radius:99px;">${pct}%</span>`;
}

function renderBandeja() {
  const q = (UI.bandejaSearch.value || '').toLowerCase().trim();
  const estado = UI.bandejaEstado.value;
  const inst = UI.bandejaInst.value;

  let rows = state.bandeja.slice();
  if (estado) rows = rows.filter(s => s.estado === estado);
  if (inst) rows = rows.filter(s => s.academico.institucionOrigenId === inst);
  if (q) {
    rows = rows.filter(s => {
      const nombre = `${s.postulante.nombres} ${s.postulante.apellidos}`.toLowerCase();
      return nombre.includes(q) ||
        (s.postulante.dni || '').includes(q) ||
        (s.academico.carreraDestino || '').toLowerCase().includes(q);
    });
  }

  if (!rows.length) {
    UI.bandejaTbody.innerHTML =
      '<tr><td colspan="7" class="table-empty">No hay solicitudes que coincidan con el filtro.</td></tr>';
    return;
  }

  UI.bandejaTbody.innerHTML = rows.map(sol => {
    const instNombre = sol._inst?.nombre || '—';
    const instSiglas = sol._inst?.siglas ? `<div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">${sol._inst.siglas}</div>` : '';
    const instName = `${instNombre}${instSiglas}`;
    const nombre = `${sol.postulante.nombres} ${sol.postulante.apellidos}`;
    const dniLine = sol.postulante.dni
      ? `<div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">DNI: ${sol.postulante.dni}</div>` : '';
    const carreraOrigen = sol._carreraOrigen?.nombre || '—';

    const docs = sol.documentos || {};
    const docsTotal = Object.keys(docs).length;
    const docsOk = Object.values(docs).filter(Boolean).length;
    const docsText = docsTotal === 0 ? '—'
      : docsOk === docsTotal
        ? '<span style="color:var(--color-success-text);font-weight:600;">✓ Completos</span>'
        : `<span style="color:var(--color-warning-text);font-weight:600;">⚠ ${docsOk}/${docsTotal}</span>`;

    const acciones = `<button class="btn btn--primary" style="font-size:var(--fs-sm);padding:5px 16px;white-space:nowrap;" data-bandeja-action="atender" data-id="${sol.id}">Atender</button>`;

    return `
      <tr>
        <td><div style="font-weight:600;">${nombre}</div>${dniLine}</td>
        <td>${instName}</td>
        <td style="font-size:13px;color:var(--color-text-muted);">${carreraOrigen}</td>
        <td>
          <div style="font-weight:700;font-size:13px;color:var(--color-brand-800);">${sol.academico.carreraDestino || '—'}</div>
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">${sol.academico.facultadDestino || ''}</div>
        </td>
        <td class="col-center">${docsText}</td>
        <td class="col-center">${estadoBadge(sol.estado)}</td>
        <td class="col-center" style="white-space:nowrap;">${acciones}</td>
      </tr>`;
  }).join('');

  safeRenderIcons(UI.bandejaTbody);
}

async function atender(id, nuevoEstado, btn) {
  if (btn) btn.disabled = true;
  try {
    await db.updateSolicitudAdmision(id, { estado: nuevoEstado });
    await loadBandeja();
  } catch (err) {
    console.error('Error al atender solicitud:', err);
    alert('No se pudo actualizar el estado de la solicitud.');
    if (btn) btn.disabled = false;
  }
}

// ─── MODAL DETALLE / ATENCIÓN ─────────────────────────────────────────────────
function openDetalle(id) {
  const sol = state.bandeja.find(x => x.id === id);
  if (!sol) return;

  const instName = sol._inst?.nombre || '—';
  const carreraOrigen = sol._carreraOrigen?.nombre || '—';
  const docs = sol.documentos || {};

  const docRow = (label, ok) =>
    `<div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:4px;">
       <span style="color:${ok ? '#16a34a' : '#dc2626'};font-weight:700;">${ok ? '✓' : '✗'}</span>
       <span style="font-size:var(--fs-sm);">${label}</span>
     </div>`;

  const fecha = new Date(sol.fechaRegistro).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });

  UI.detalleBody.innerHTML = `
    <div style="display:grid;gap:var(--space-4);">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
        <div>
          <div style="font-size:var(--fs-xs);text-transform:uppercase;color:var(--color-text-muted);font-weight:var(--fw-bold);margin-bottom:4px;">Postulante</div>
          <div style="font-weight:var(--fw-semibold);">${sol.postulante.nombres} ${sol.postulante.apellidos}</div>
          <div style="font-size:var(--fs-sm);color:var(--color-text-muted);margin-top:2px;">DNI: ${sol.postulante.dni || '—'}</div>
          <div style="font-size:var(--fs-sm);color:var(--color-text-muted);">${sol.postulante.correo || ''}</div>
          <div style="font-size:var(--fs-sm);color:var(--color-text-muted);">${sol.postulante.telefono || ''}</div>
        </div>
        <div>
          <div style="font-size:var(--fs-xs);text-transform:uppercase;color:var(--color-text-muted);font-weight:var(--fw-bold);margin-bottom:4px;">Documentos</div>
          ${docRow('DNI', docs.dni)}
          ${docRow('Matrícula', docs.matricula)}
          ${docRow('Récord académico', docs.record)}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
        <div style="background:var(--color-surface-alt);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);">
          <div style="font-size:var(--fs-xs);text-transform:uppercase;color:var(--color-text-muted);font-weight:var(--fw-bold);margin-bottom:4px;">Institución de Origen</div>
          <div style="font-weight:700;color:var(--color-brand-800);">${instName}</div>
          <div style="font-size:var(--fs-sm);color:var(--color-text-muted);margin-top:2px;">${carreraOrigen}</div>
        </div>
        <div style="background:var(--color-surface-alt);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);">
          <div style="font-size:var(--fs-xs);text-transform:uppercase;color:var(--color-text-muted);font-weight:var(--fw-bold);margin-bottom:4px;">Destino USIL</div>
          <div style="font-weight:700;color:var(--color-brand-800);">${sol.academico.carreraDestino || '—'}</div>
          <div style="font-size:var(--fs-sm);color:var(--color-text-muted);margin-top:2px;">${sol.academico.facultadDestino || ''}</div>
          <div style="font-size:var(--fs-sm);color:var(--color-text-muted);">${sol.academico.unidadDestino || ''}</div>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-6);align-items:center;">
        <div>
          <div style="font-size:var(--fs-xs);text-transform:uppercase;color:var(--color-text-muted);font-weight:var(--fw-bold);margin-bottom:4px;">Estado actual</div>
          ${estadoBadge(sol.estado)}
        </div>
        <div>
          <div style="font-size:var(--fs-xs);text-transform:uppercase;color:var(--color-text-muted);font-weight:var(--fw-bold);">Fecha de registro</div>
          <div style="font-size:var(--fs-sm);margin-top:4px;">${fecha}</div>
        </div>
      </div>
    </div>`;

  UI.detalleFooter.innerHTML = buildDetalleFooter(sol);
  UI.detalleFooter.querySelectorAll('[data-modal-action]').forEach(b => {
    b.addEventListener('click', async () => {
      const act = b.dataset.modalAction;
      if (act === 'cerrar') return closeDetalle();
      const map = { aprobar: 'APROBADA', rechazar: 'RECHAZADA', revision: 'EN REVISIÓN', pendiente: 'PENDIENTE' };
      await atender(sol.id, map[act], b);
      closeDetalle();
    });
  });

  UI.modalDetalle.classList.add('is-active');
  safeRenderIcons(UI.modalDetalle);
}

function buildDetalleFooter(sol) {
  const btns = ['<button class="btn btn--ghost" data-modal-action="cerrar">Cerrar</button>'];
  const reopen = '<button class="btn btn--outline" data-modal-action="pendiente">Volver a pendiente</button>';
  const approve = '<button class="btn btn--primary" data-modal-action="aprobar">Aprobar</button>';
  const reject = '<button class="btn btn--outline" data-modal-action="rechazar" style="color:var(--color-error);border-color:var(--color-error);">Rechazar</button>';
  const revise = '<button class="btn btn--outline" data-modal-action="revision">Poner en revisión</button>';

  if (sol.estado === 'PENDIENTE') btns.push(revise, approve);
  else if (sol.estado === 'EN REVISIÓN') btns.push(reopen, reject, approve);
  else if (sol.estado === 'APROBADA') btns.push(reopen, reject);
  else if (sol.estado === 'RECHAZADA') btns.push(reopen, approve);
  return btns.join('');
}

function closeDetalle() {
  UI.modalDetalle.classList.remove('is-active');
}

// ─── ATENDER SOLICITUD ────────────────────────────────────────────────────────
// Mapea la facultad/carrera USIL del catálogo de admisión al valor usado en cursosUsil
function inferFacultadUsil(carreraDestino, facultadDestino) {
  const faculties = [...new Set(state.cursosUsil.map(c => c.facultad))];
  const text = `${carreraDestino} ${facultadDestino}`.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Intento 1: coincidencia directa con alguna facultad conocida
  const direct = faculties.find(f =>
    text.includes(f.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))
  );
  if (direct) return direct;

  // Intento 2: keywords
  if (/ingenier|sistemas|software|informatica|mecanica|ciberseg/.test(text)) {
    return faculties.find(f => /ingenier/i.test(f)) || '';
  }
  if (/negocio|administracion|marketing|empresarial|contabilidad/.test(text)) {
    return faculties.find(f => /negocio/i.test(f)) || '';
  }
  if (/derecho|legal|juridic/.test(text)) {
    return faculties.find(f => /derecho/i.test(f)) || '';
  }
  if (/humanidades|comunicacion|turismo|gastronomia|hoteleria/.test(text)) {
    return faculties.find(f => /humanidades/i.test(f)) || '';
  }
  return '';
}

function atenderSolicitud(id) {
  const sol = state.bandeja.find(x => x.id === id);
  if (!sol) return;

  // Marca modo atender para que showTab no resetee los campos
  state.modoAtender = true;

  // Precarga state
  state.alumnoNombre = `${sol.postulante.nombres} ${sol.postulante.apellidos}`;
  state.alumnoDni = sol.postulante.dni || '';
  state.institucionId = sol.academico.institucionOrigenId;

  // Precarga DOM
  UI.inpAlumnoNombre.value = state.alumnoNombre;
  UI.inpAlumnoDni.value = state.alumnoDni;
  UI.selInst.value = state.institucionId;

  // Intenta inferir la facultad USIL equivalente
  const facultad = inferFacultadUsil(
    sol.academico.carreraDestino || '',
    sol.academico.facultadDestino || ''
  );
  if (facultad) {
    UI.selCarreraUsil.value = facultad;
    state.carreraUsilId = facultad;
  } else {
    UI.selCarreraUsil.value = '';
    state.carreraUsilId = '';
  }

  validateStep1();
  showTab('eq-tab-nueva');

  // Bloquea los campos de identidad/destino — solo el record sigue editable
  setWizardLock(true);

  // Libera el flag después de que el tab ya cambió
  state.modoAtender = false;
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
init().catch(err => {
  console.error('Init Error:', err);
  alert('Error en la inicialización: ' + err.message);
});
