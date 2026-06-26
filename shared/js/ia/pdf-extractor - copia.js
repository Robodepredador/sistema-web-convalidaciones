/* ============================================================
   PDF Extractor — renderiza páginas de PDF y extrae cursos
   via un modelo de visión compatible con OpenAI.
   ============================================================ */

const PDFJS_SRC    = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAX_PAGES    = 8;
const SCALE        = 1.2;    // reducido para mantener imágenes < 250 KB
const JPEG_QUALITY = 0.78;
const API_TIMEOUT  = 90_000; // 90 s máximo por página

const CICLO_ROMAN = {
  1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI', 7:'VII',
  8:'VIII', 9:'IX', 10:'X', 11:'XI', 12:'XII', 13:'XIII', 14:'XIV'
};
const ROMAN_VALS = Object.values(CICLO_ROMAN);

function normalizeCiclo(v) {
  if (v == null || v === '') return 'I';
  if (typeof v === 'number') return CICLO_ROMAN[v] || String(v);
  // Extraer el primer numero que aparezca (ej. "Ciclo 3" -> 3)
  const m = String(v).match(/\d+/);
  if (m && CICLO_ROMAN[parseInt(m[0], 10)]) return CICLO_ROMAN[parseInt(m[0], 10)];
  const s = String(v).trim().toUpperCase();
  return ROMAN_VALS.includes(s) ? s : 'I';
}

/* ============================================================
   Sheet parser — Excel (.xlsx/.xls) y CSV
   ============================================================ */

const COLUMN_ALIASES = {
  ciclo:   ['ciclo','cycle','semestre','semester','sem','nivel'],
  ord:     ['ord','orden','order','num','#','nro','n'],
  codigo:  ['codigo','code','cod','clave'],
  nombre:  ['nombre','name','curso','asignatura','materia','descripcion','cursos'],
  cond:    ['cond','condicion','condition','tipo','caracter'],
  cred:    ['cred','creditos','credits','credito','cr','crd'],
  // Total de horas: los planes USIL traen UNA sola columna (TH/Total Horas), no T/P/L.
  // Se aceptan tambien las variantes por tipo y se suman si vienen separadas.
  horas:   ['horas','th','ht','totalhoras','horastotales','horassemanales','t','teoria','theory','hsem'],
  prereq:  ['prereq','prerrequisito','prerequisito','prerequisite','pre','prerequisitos','requisito'],
  sunedu:  ['sunedu','clasificacion','clasif'],
  mencion: ['mencion','mention','especializacion','area','linea'],
  credMin: ['credmin','creditosmin','mincred','crmin']
};

// Campos que se interpretan numéricamente (descartan encabezados de sección)
const RE_DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

function normalizeWord(s) {
  return String(s).toLowerCase().normalize('NFD').replace(RE_DIACRITICS, '').replace(/[^a-z0-9#]/g, '');
}

/** Une todas las palabras de un encabezado en una sola cadena normalizada y también las devuelve sueltas. */
function headerTokens(h) {
  const words = String(h).split(/[\s\-_\/().,:;]+/).map(normalizeWord).filter(Boolean);
  return { full: words.join(''), words };
}

function matchField(headerText, field) {
  const aliases = COLUMN_ALIASES[field] || [field.toLowerCase()];
  const { full, words } = headerTokens(headerText);
  if (aliases.includes(full)) return true;
  return words.some(w => aliases.includes(w));
}

/** Devuelve { [field]: colIdx } para una fila candidata a encabezado. */
function detectColumns(headerRow) {
  const colIdx = {};
  Object.keys(COLUMN_ALIASES).forEach(field => {
    colIdx[field] = headerRow.findIndex(h => h && matchField(h, field));
  });
  return colIdx;
}

/**
 * Localiza la fila de encabezado real: la que mapea al menos "nombre"/"curso"
 * y alguna otra columna conocida (ciclo/credito/codigo). Devuelve { rowIndex, colIdx }.
 */
function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const colIdx = detectColumns(rows[i]);
    const hasName = colIdx.nombre >= 0 || colIdx.codigo >= 0;
    const hasOther = colIdx.ciclo >= 0 || colIdx.cred >= 0 || colIdx.horas >= 0;
    if (hasName && hasOther) return { rowIndex: i, colIdx };
  }
  return null;
}

const RE_CICLO_NUM = /\b(1[0-4]|[1-9])\b/;       // 1..14
const RE_TOTAL     = /^total(es)?$/i;

function sheetRowToCourse(cols, colIdx) {
  const get = (f, def = '') => {
    const i = colIdx[f];
    return (i !== undefined && i >= 0 && cols[i] !== undefined && cols[i] !== null && String(cols[i]).trim() !== '')
      ? String(cols[i]).trim()
      : def;
  };
  const num = (f) => Number(String(get(f, '0')).replace(',', '.').replace(/[^\d.]/g, '')) || 0;

  const nombre = get('nombre');
  const condRaw = normalizeWord(get('cond'));
  const isElectivoByName = /electivo|electiv/.test(normalizeWord(nombre));
  const cond = (condRaw.includes('electiv') || isElectivoByName) ? 'Electivo' : 'Obligatorio';
  const sunedu = get('sunedu') && normalizeWord(get('sunedu')).includes('espec') ? 'Especifico' : 'General';

  return {
    ciclo:   normalizeCiclo(get('ciclo', 'I')),
    ord:     Number(get('ord')) || 0,
    codigo:  get('codigo'),
    nombre,
    cond,
    cred:    num('cred'),
    horas:   num('horas'),   // total de horas (una sola columna)
    prereq:  get('prereq'),
    sunedu,
    mencion: get('mencion'),
    credMin: num('credMin')
  };
}

let _xlsxLib = null;
async function loadXlsx() {
  if (_xlsxLib) return _xlsxLib;
  if (window.XLSX) { _xlsxLib = window.XLSX; return _xlsxLib; }
  await new Promise((resolve, reject) => {
    const s    = document.createElement('script');
    s.src      = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload   = resolve;
    s.onerror  = () => reject(new Error('No se pudo cargar la librería Excel (SheetJS) desde CDN'));
    document.head.appendChild(s);
  });
  _xlsxLib = window.XLSX;
  return _xlsxLib;
}

/** Lee un CSV detectando codificación (UTF-8 con fallback a Windows-1252) y separador. */
async function readCsvRows(file) {
  const buf = await file.arrayBuffer();
  let text  = new TextDecoder('utf-8').decode(buf);
  // Si aparece el carácter de reemplazo, el archivo está en Latin-1 / Windows-1252
  if (text.includes('�')) {
    text = new TextDecoder('windows-1252').decode(buf);
  }
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (!lines.length) return [];
  // Detectar separador por la línea con más columnas entre las primeras
  const sample = lines.slice(0, 10);
  const sep = [';', ',', '\t'].reduce((best, s) => {
    const max = Math.max(...sample.map(l => l.split(s).length));
    return max > best.count ? { sep: s, count: max } : best;
  }, { sep: ';', count: 0 }).sep;
  const splitLine = l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
  return lines.map(splitLine);
}

/** Hash determinista (djb2) de una cadena → entero sin signo. */
function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Genera un código ESTABLE derivado SOLO del nombre del curso.
 * El mismo curso obtiene siempre el mismo código, sin importar en qué
 * ciclo lo ubique la malla → desacopla código de ciclo.
 */
function autoCode(name) {
  const norm    = normalizeWord(name);                       // solo [a-z0-9]
  const letters = (norm.match(/[a-z]/g) || []).join('');
  const prefix  = (letters.slice(0, 3) || 'CUR').toUpperCase();
  const num     = 1000 + (hashStr(norm) % 9000);             // 4 dígitos deterministas
  return `${prefix}-${num}`;
}

/** Asegura códigos únicos en el lote sin perder el determinismo por nombre. */
function assignUniqueCode(course, usedCodes) {
  if (course.codigo) { usedCodes.add(course.codigo); return; }
  let code = autoCode(course.nombre);
  // Colisión solo si dos nombres distintos generan el mismo código (rarísimo)
  let bump = 1;
  const base = code;
  while (usedCodes.has(code)) code = `${base}-${++bump}`;
  usedCodes.add(code);
  course.codigo = code;
}

export async function parseSheetFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  let rows;

  if (ext === 'csv') {
    rows = await readCsvRows(file);
  } else {
    const lib  = await loadXlsx();
    const buf  = await file.arrayBuffer();
    const wb   = lib.read(new Uint8Array(buf), { type: 'array' });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const data = lib.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
    rows = data.map(r => r.map(v => (v == null ? '' : String(v))));
  }

  if (rows.length < 2) return [];

  // 1) Encontrar la fila de encabezado real (ignora metadata: Facultad, Carrera, Plan…)
  const header = findHeaderRow(rows);
  if (!header) {
    const preview = rows.slice(0, 6).map(r => r.filter(Boolean).join(' | ')).filter(Boolean).join('\n');
    throw new Error(
      `No se encontró una fila de encabezados reconocible.\n` +
      `Se necesita una fila con columnas tipo "Ciclo", "Curso/Nombre" y "Créditos".\n\n` +
      `Primeras filas del archivo:\n${preview}`
    );
  }

  const { rowIndex, colIdx } = header;
  const dataRows = rows.slice(rowIndex + 1);

  // 2) Parsear cada fila, descartando totales, subtotales y encabezados de sección
  let currentMencion = '';
  const usedCodes = new Set();
  const courses = [];

  for (const cols of dataRows) {
    const raw = sheetRowToCourse(cols, colIdx);

    // Fila de subtotal / total (ej. ";;Total;22;34;")
    if (RE_TOTAL.test(raw.nombre)) continue;

    // Encabezado de sección de electivos: el nombre va vacío pero hay texto
    // en la columna de ciclo que NO es numérico (ej. "Analítica de datos no estructurados").
    const cicloCellRaw = (colIdx.ciclo >= 0 ? String(cols[colIdx.ciclo] ?? '') : '').trim();
    const cicloIsNum = RE_CICLO_NUM.test(cicloCellRaw);
    if (!raw.nombre) {
      if (cicloCellRaw && !cicloIsNum) currentMencion = cicloCellRaw; // recordar la mención/línea
      continue;
    }

    // Curso válido: requiere nombre y un ciclo numérico
    if (!cicloIsNum && !raw.cred) continue;

    // Código ESTABLE derivado del nombre (no del ciclo)
    assignUniqueCode(raw, usedCodes);
    if (!raw.ord) raw.ord = courses.filter(c => c.ciclo === raw.ciclo).length + 1;
    // Cursos dentro de una sección de electivos heredan mención y condición
    if (currentMencion) {
      raw.cond    = 'Electivo';
      if (!raw.mencion) raw.mencion = currentMencion;
    }
    courses.push(raw);
  }

  console.info(
    `[Sheet import] encabezado en fila ${rowIndex + 1}; ${courses.length} cursos importados.`,
    Object.fromEntries(Object.entries(colIdx).filter(([, v]) => v >= 0).map(([k, v]) => [k, rows[rowIndex][v]]))
  );

  if (!courses.length) {
    throw new Error('Se reconocieron los encabezados pero no se encontraron filas de cursos válidas.');
  }

  return courses;
}

let _pdfjsLib = null;

async function loadPdfJs() {
  if (_pdfjsLib) return _pdfjsLib;
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    _pdfjsLib = window.pdfjsLib;
    return _pdfjsLib;
  }
  await new Promise((resolve, reject) => {
    const s    = document.createElement('script');
    s.src      = PDFJS_SRC;
    s.onload   = resolve;
    s.onerror  = () => reject(new Error('No se pudo cargar PDF.js desde CDN'));
    document.head.appendChild(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  _pdfjsLib = window.pdfjsLib;
  return _pdfjsLib;
}

export async function renderPdfPages(file, onProgress) {
  const lib   = await loadPdfJs();
  const buf   = await file.arrayBuffer();
  const pdf   = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
  const total = Math.min(pdf.numPages, MAX_PAGES);
  const pages = [];

  for (let p = 1; p <= total; p++) {
    onProgress?.({ phase: 'render', page: p, total });
    const page     = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: SCALE });
    const canvas   = document.createElement('canvas');
    canvas.width   = viewport.width;
    canvas.height  = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    pages.push(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
  }
  return pages;
}

const SYSTEM_PROMPT = `Eres un extractor especializado de mallas curriculares universitarias peruanas.
Analiza la imagen del documento y extrae TODOS los cursos que aparezcan en tablas o listados.
Devuelve ÚNICAMENTE un JSON válido sin texto adicional:
{
  "cursos": [
    {
      "ciclo": 1,
      "ord": 1,
      "codigo": "MAT101",
      "nombre": "Matematica Basica",
      "cond": "Obligatorio",
      "cred": 4,
      "horas": 5,
      "prereq": "",
      "sunedu": "General",
      "mencion": "",
      "credMin": 0
    }
  ]
}
Reglas:
- ciclo: numero entero (1-14) que indica el semestre/ciclo. Las columnas suelen llamarse "Ciclo" o "Nivel".
- ord: orden del curso dentro del ciclo (1, 2, 3...). Si no figura, deja 0.
- nombre: nombre del curso. La columna puede llamarse "Curso", "Asignatura" o "Materia".
- codigo: codigo del curso SOLO si aparece explicitamente. Si no hay codigo, deja "" (NO lo inventes).
- cond: "Electivo" si el curso aparece como electivo o bajo una seccion de electivos/menciones; si no, "Obligatorio".
- cred: creditos. La columna suele llamarse "CR", "Cred" o "Creditos".
- horas: TOTAL de horas del curso (ej. columna "TH", "Total Horas" o "Horas"). Es un solo numero. Si el plan separa teoria/practica/laboratorio, suma todas las horas en este campo.
- prereq: prerrequisito(s). La columna puede llamarse "Pre-Requisito" o "Requisito".
- mencion: si el curso pertenece a una linea/mencion/especialidad, pon su nombre; si no, "".
- sunedu: "General" o "Especifico"
- IGNORA filas de totales o subtotales (ej. "Total", "TOTAL", sumatorias de creditos).
- Si un campo no figura usa su valor por defecto (0 para numeros, "" para texto)
- Si no hay tabla de cursos visible devuelve {"cursos": []}`;

async function callVisionApi(imageBase64, model) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${model.apiKey}`
  };
  if (model.proveedor === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'USIL ERP - Malla Extraction';
  }

  let res;
  try {
    res = await fetch(model.endpoint, {
      method: 'POST',
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({
        model: model.modelId,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: SYSTEM_PROMPT },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }],
        max_tokens: 4096,
        temperature: 0.1
      })
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado (90 s). El servidor IA no respondio a tiempo. Intenta con un PDF de menos paginas.');
    }
    throw err;
  }
  clearTimeout(timer);

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data    = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const match   = content.match(/\{[\s\S]*\}/);
  if (!match) return [];

  let parsed;
  try { parsed = JSON.parse(match[0]); } catch { return []; }

  return (parsed.cursos || []).map(c => ({
    ciclo:   normalizeCiclo(c.ciclo),
    ord:     Number(c.ord)    || 0,
    codigo:  String(c.codigo  || ''),
    nombre:  String(c.nombre  || ''),
    cond:    ['Obligatorio', 'Electivo'].includes(c.cond) ? c.cond : 'Obligatorio',
    cred:    Number(c.cred)   || 0,
    // Total de horas: si la IA las separa en t/p/l, se suman; si trae una sola, igual funciona.
    horas:   (Number(c.t) || 0) + (Number(c.p) || 0) + (Number(c.l) || 0) || Number(c.horas) || 0,
    prereq:  String(c.prereq  || ''),
    sunedu:  ['General', 'Especifico'].includes(c.sunedu) ? c.sunedu : 'General',
    mencion: String(c.mencion || ''),
    credMin: Number(c.credMin || 0)
  }));
}

export async function extractFromPdf(file, model, onProgress) {
  const pages      = await renderPdfPages(file, onProgress);
  const allCourses = [];

  for (let i = 0; i < pages.length; i++) {
    onProgress?.({ phase: 'extract', page: i + 1, total: pages.length });
    try {
      const courses = await callVisionApi(pages[i], model);
      allCourses.push(...courses);
    } catch (e) {
      console.warn(`[PDF IA] Pagina ${i + 1} sin resultado:`, e.message);
      throw e; // propagar para que el caller muestre el error
    }
  }

  // Deduplicar por nombre+ciclo (los planes pueden no traer codigo)
  const seen   = new Set();
  const unique = allCourses.filter(c => {
    const key = `${c.ciclo}|${normalizeWord(c.nombre)}`;
    if (!c.nombre) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Código ESTABLE por nombre + orden cuando el plan no los trae (la validación los exige)
  const usedCodes = new Set();
  unique.forEach((c, idx) => {
    assignUniqueCode(c, usedCodes);
    if (!c.ord) c.ord = unique.filter(x => x.ciclo === c.ciclo && unique.indexOf(x) <= idx).length;
  });

  return unique;
}
