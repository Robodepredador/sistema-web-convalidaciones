/* ============================================================
   sheet-parser.js — importa cursos desde Excel (.xlsx/.xls) o CSV
   Primario: extracción con IA (cualquier modelo activo).
   Fallback:  parsing estructural (findHeaderRow + COLUMN_ALIASES).
   ============================================================ */

// ─── Constantes ───────────────────────────────────────────────────────────────

const CICLO_ROMAN = {
  1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI', 7:'VII',
  8:'VIII', 9:'IX', 10:'X', 11:'XI', 12:'XII', 13:'XIII', 14:'XIV'
};
const ROMAN_VALS = Object.values(CICLO_ROMAN);

const AI_TIMEOUT  = 60_000;
const BATCH_SIZE  = 120;

// ─── Normalización ────────────────────────────────────────────────────────────

const RE_DIACRITICS = /[̀-ͯ]/g;

function normalizeWord(s) {
  return String(s).toLowerCase().normalize('NFD').replace(RE_DIACRITICS, '').replace(/[^a-z0-9#]/g, '');
}

function normalizeCiclo(v) {
  if (v == null || v === '') return 'I';
  if (typeof v === 'number') return CICLO_ROMAN[v] || String(v);
  const m = String(v).match(/\d+/);
  if (m && CICLO_ROMAN[parseInt(m[0], 10)]) return CICLO_ROMAN[parseInt(m[0], 10)];
  const s = String(v).trim().toUpperCase();
  return ROMAN_VALS.includes(s) ? s : String(v).trim() || 'I';
}

function normalizeCond(v) {
  if (!v) return 'Obligatorio';
  return /electiv/i.test(String(v)) ? 'Electivo' : 'Obligatorio';
}

// ─── Auto-código estable ──────────────────────────────────────────────────────

function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

function autoCode(name) {
  const norm    = normalizeWord(name);
  const letters = (norm.match(/[a-z]/g) || []).join('');
  const prefix  = (letters.slice(0, 3) || 'CUR').toUpperCase();
  const num     = 1000 + (hashStr(norm) % 9000);
  return `${prefix}-${num}`;
}

function assignUniqueCode(course, usedCodes) {
  if (course.codigo) { usedCodes.add(course.codigo); return; }
  let code = autoCode(course.nombre);
  let bump = 1;
  const base = code;
  while (usedCodes.has(code)) code = `${base}-${++bump}`;
  usedCodes.add(code);
  course.codigo = code;
}

// ─── Detección de columnas ────────────────────────────────────────────────────

const COLUMN_ALIASES = {
  ciclo:   ['ciclo','cycle','semestre','semester','sem','nivel'],
  ord:     ['ord','orden','order','num','#','nro','n'],
  codigo:  ['codigo','code','cod','clave'],
  nombre:  ['nombre','name','curso','asignatura','materia','descripcion','cursos'],
  cond:    ['cond','condicion','condition','tipo','caracter'],
  cred:    ['cred','creditos','credits','credito','cr','crd'],
  // TH / Total Horas → se guarda en campo t; p y l quedan en 0
  horas:   ['horas','th','ht','totalhoras','horastotales','horassemanales','t','teoria','theory','hsem'],
  prereq:  ['prereq','prerrequisito','prerequisito','prerequisite','pre','prerequisitos','requisito'],
  sunedu:  ['sunedu','clasificacion','clasif'],
  mencion: ['mencion','mention','especializacion','area','linea'],
  credMin: ['credmin','creditosmin','mincred','crmin']
};

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

function detectColumns(headerRow) {
  const colIdx = {};
  Object.keys(COLUMN_ALIASES).forEach(field => {
    colIdx[field] = headerRow.findIndex(h => h && matchField(h, field));
  });
  return colIdx;
}

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const colIdx = detectColumns(rows[i]);
    const hasName  = colIdx.nombre >= 0 || colIdx.codigo >= 0;
    const hasOther = colIdx.ciclo  >= 0 || colIdx.cred   >= 0 || colIdx.horas >= 0;
    if (hasName && hasOther) return { rowIndex: i, colIdx };
  }
  return null;
}

const RE_TOTAL    = /^total(es)?$/i;
const RE_CICLO_NUM = /\b(1[0-4]|[1-9])\b/;

// ─── Mapeo de fila a curso ────────────────────────────────────────────────────

function sheetRowToCourse(cols, colIdx) {
  const get = (f, def = '') => {
    const i = colIdx[f];
    return (i !== undefined && i >= 0 && cols[i] !== undefined && cols[i] !== null && String(cols[i]).trim() !== '')
      ? String(cols[i]).trim()
      : def;
  };
  const num = (f) => Number(String(get(f, '0')).replace(',', '.').replace(/[^\d.]/g, '')) || 0;

  const nombre = get('nombre');
  const cond   = normalizeCond(get('cond'));
  const sunedu = normalizeWord(get('sunedu')).includes('espec') ? 'Específico' : 'General';

  return {
    ciclo:   normalizeCiclo(get('ciclo', 'I')),
    ord:     Number(get('ord')) || 0,
    codigo:  get('codigo'),
    nombre,
    cond,
    cred:    num('cred'),
    t:       num('horas'),  // TH total → campo t; p y l quedan en 0
    p:       0,
    l:       0,
    prereq:  get('prereq'),
    sunedu,
    mencion: get('mencion'),
    credMin: num('credMin')
  };
}

// ─── Lectura de archivos ──────────────────────────────────────────────────────

async function readCsvRows(file) {
  const buf  = await file.arrayBuffer();
  let text   = new TextDecoder('utf-8').decode(buf);
  if (text.includes('�')) {
    text = new TextDecoder('windows-1252').decode(buf);
  }
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (!lines.length) return [];
  const sample = lines.slice(0, 10);
  const sep = [';', ',', '\t'].reduce((best, s) => {
    const max = Math.max(...sample.map(l => l.split(s).length));
    return max > best.count ? { sep: s, count: max } : best;
  }, { sep: ';', count: 0 }).sep;
  const splitLine = l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
  return lines.map(splitLine);
}

async function readRows(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv') {
    return readCsvRows(file);
  }
  const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs');
  const wb   = XLSX.read(await file.arrayBuffer());
  const ws   = wb.Sheets[wb.SheetNames[0]];
  // header:1 → array de arrays (necesario para findHeaderRow)
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
  return data.map(r => r.map(v => (v == null ? '' : String(v))));
}

// ─── Extracción sin IA (regex + estructura) ───────────────────────────────────

function extractByStructure(rows) {
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

  let currentMencion = '';
  const usedCodes = new Set();
  const courses   = [];

  for (const cols of dataRows) {
    const raw = sheetRowToCourse(cols, colIdx);

    if (RE_TOTAL.test(raw.nombre)) continue;

    const cicloCellRaw = (colIdx.ciclo >= 0 ? String(cols[colIdx.ciclo] ?? '') : '').trim();
    const cicloIsNum   = RE_CICLO_NUM.test(cicloCellRaw);

    if (!raw.nombre) {
      if (cicloCellRaw && !cicloIsNum) currentMencion = cicloCellRaw;
      continue;
    }

    if (!cicloIsNum && !raw.cred && !raw.codigo) continue;

    assignUniqueCode(raw, usedCodes);
    if (!raw.ord) raw.ord = courses.filter(c => c.ciclo === raw.ciclo).length + 1;

    if (currentMencion) {
      raw.cond   = 'Electivo';
      if (!raw.mencion) raw.mencion = currentMencion;
    }

    courses.push(raw);
  }

  const detectedFields = Object.entries(colIdx)
    .filter(([, v]) => v >= 0)
    .map(([k]) => k);

  return { courses, detectedFields };
}

// ─── Extracción con IA ────────────────────────────────────────────────────────

const IA_SYSTEM_PROMPT = `Eres un extractor especializado de planes de estudio universitarios peruanos (USIL).
Se te dan filas de un Excel o CSV. Extrae TODOS los cursos y devuelve ÚNICAMENTE un JSON válido:
{
  "cursos": [
    {
      "ciclo": "I",
      "ord": 1,
      "codigo": "MAT101",
      "nombre": "Matemática Básica",
      "cond": "Obligatorio",
      "cred": 4,
      "t": 5,
      "p": 0,
      "l": 0,
      "prereq": "",
      "sunedu": "General",
      "mencion": "",
      "credMin": 0
    }
  ]
}
Reglas:
- ciclo: numeral romano (I a XIV). La columna puede llamarse "Ciclo", "Semestre" o "Nivel".
- nombre: el nombre del curso. La columna puede llamarse "Curso", "Asignatura" o "Materia".
- codigo: SOLO si aparece explícitamente en el archivo. Si no hay, deja "" (NO inventes).
- cred: créditos. La columna puede llamarse "CR", "Cred" o "Créditos".
- t: TOTAL de horas (columna "TH", "Total Horas" o "T"). Si el plan separa T/P/L, suma todas.
- cond: "Electivo" si el curso está bajo una sección de electivos/menciones; si no, "Obligatorio".
- sunedu: "General" o "Específico"
- prereq: prerrequisito(s). Columna "Pre-Requisito" o "Requisito".
- mencion: si el curso pertenece a una línea/mención, pon su nombre; si no, "".
- IGNORA filas de totales/subtotales (ej. "Total", "TOTAL").
- IGNORA filas de encabezado, metadata (Facultad, Carrera, versión), y filas vacías.
- Usa 0 / "" para campos ausentes.`;

async function callTextApi(rows, model, fromIndex) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${model.apiKey}`
  };
  if (model.proveedor === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'USIL ERP - Sheet Extraction';
  }

  const userMsg = `Extrae los cursos de estas ${rows.length} filas (desde la fila ${fromIndex + 1}):\n${JSON.stringify(rows)}`;

  let res;
  try {
    res = await fetch(model.endpoint, {
      method: 'POST',
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({
        model: model.modelId,
        messages: [
          { role: 'system', content: IA_SYSTEM_PROMPT },
          { role: 'user',   content: userMsg }
        ],
        max_tokens: 8192,
        temperature: 0.1
      })
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Tiempo de espera agotado (60 s). Intenta con un archivo más pequeño.');
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
  return parsed.cursos || [];
}

function normalizeCourseFromAI(c) {
  return {
    ciclo:   normalizeCiclo(c.ciclo),
    ord:     parseInt(c.ord)     || 1,
    codigo:  String(c.codigo  || '').trim(),
    nombre:  String(c.nombre  || '').trim(),
    cond:    normalizeCond(c.cond),
    cred:    parseFloat(c.cred)  || 0,
    t:       parseInt(c.t)       || 0,
    p:       parseInt(c.p)       || 0,
    l:       parseInt(c.l)       || 0,
    prereq:  String(c.prereq  || '').trim(),
    sunedu:  ['General', 'Específico'].includes(c.sunedu) ? c.sunedu : 'General',
    mencion: String(c.mencion || '').trim(),
    credMin: parseInt(c.credMin) || 0,
  };
}

async function extractWithAI(rows, model, onProgress) {
  const allRaw = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    onProgress?.({ batch: Math.floor(i / BATCH_SIZE) + 1, total: Math.ceil(rows.length / BATCH_SIZE) });
    const batchResult = await callTextApi(batch, model, i);
    allRaw.push(...batchResult);
  }

  const seen     = new Set();
  const usedCodes = new Set();
  const courses  = allRaw
    .map(normalizeCourseFromAI)
    .filter(c => {
      if (!c.nombre && !c.codigo) return false;
      const key = `${c.ciclo}|${normalizeWord(c.nombre)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  // Generar códigos para los cursos sin código (la IA puede dejarlos vacíos)
  courses.forEach(c => assignUniqueCode(c, usedCodes));

  return courses;
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * @param {File}   file      — .xlsx, .xls o .csv
 * @param {object|null} model — modelo de IA (getAnyActiveModel()). null → solo estructural.
 * @param {Function} onProgress — ({ batch, total }) mientras procesa con IA
 * @returns {{ courses, detectedFields, usedAI }}
 */
export async function parseSheetFile(file, model = null, onProgress = null) {
  const rows = await readRows(file);
  if (!rows.length) return { courses: [], detectedFields: [], usedAI: false };

  if (model) {
    try {
      const courses = await extractWithAI(rows, model, onProgress);
      if (courses.length > 0) {
        return { courses, detectedFields: Object.keys(COLUMN_ALIASES), usedAI: true };
      }
      console.warn('[sheet-parser] IA no encontró cursos, usando parser estructural.');
    } catch (e) {
      console.warn('[sheet-parser] IA falló, usando parser estructural:', e.message);
    }
  }

  const { courses, detectedFields } = extractByStructure(rows);
  return { courses, detectedFields, usedAI: false };
}

export const ACCEPTED_SHEET_EXTENSIONS = '.xlsx,.xls,.csv';
export const ACCEPTED_SHEET_LABEL      = 'Excel (.xlsx, .xls) o CSV (.csv)';
