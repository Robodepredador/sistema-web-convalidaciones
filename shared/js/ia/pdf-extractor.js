/* ============================================================
   PDF Extractor — extrae cursos de un PDF usando:
   1. Texto (pdfjs getTextContent) → LLM texto  [PDFs con texto seleccionable]
   2. Visión (pdfjs render → JPEG) → LLM visión  [PDFs escaneados]
   ============================================================ */

const PDFJS_SRC    = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAX_PAGES        = 12;
const MAX_PAGES_VISION = 8;
const SCALE        = 1.2;
const JPEG_QUALITY = 0.78;
const API_TIMEOUT  = 90_000;

// Un PDF tiene texto real si el promedio de chars por página supera este umbral
const TEXT_CHARS_THRESHOLD = 150;

const CICLO_ROMAN = {
  1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI', 7:'VII',
  8:'VIII', 9:'IX', 10:'X', 11:'XI', 12:'XII', 13:'XIII', 14:'XIV'
};
const ROMAN_VALS = Object.values(CICLO_ROMAN);

// ─── Utilidades ───────────────────────────────────────────────────────────────

const RE_DIACRITICS = /[̀-ͯ]/g;

function normalizeWord(s) {
  return String(s).toLowerCase().normalize('NFD').replace(RE_DIACRITICS, '').replace(/[^a-z0-9]/g, '');
}

function normalizeCiclo(v) {
  if (v == null || v === '') return 'I';
  if (typeof v === 'number') return CICLO_ROMAN[v] || String(v);
  const m = String(v).match(/\d+/);
  if (m && CICLO_ROMAN[parseInt(m[0], 10)]) return CICLO_ROMAN[parseInt(m[0], 10)];
  const s = String(v).trim().toUpperCase();
  return ROMAN_VALS.includes(s) ? s : 'I';
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

// ─── Normalización de cursos extraídos por IA ─────────────────────────────────

function normalizeCourse(c) {
  return {
    ciclo:   normalizeCiclo(c.ciclo),
    ord:     Number(c.ord)    || 0,
    codigo:  String(c.codigo  || ''),
    nombre:  String(c.nombre  || ''),
    cond:    ['Obligatorio', 'Electivo'].includes(c.cond) ? c.cond : 'Obligatorio',
    cred:    Number(c.cred)   || 0,
    t:       Number(c.t)      || 0,
    p:       Number(c.p)      || 0,
    l:       Number(c.l)      || 0,
    prereq:  String(c.prereq  || ''),
    sunedu:  ['General', 'Específico'].includes(c.sunedu) ? c.sunedu : 'General',
    mencion: String(c.mencion || ''),
    credMin: Number(c.credMin || 0)
  };
}

function deduplicateAndAssignCodes(courses) {
  const seen      = new Set();
  const usedCodes = new Set();
  const unique = courses.filter(c => {
    const key = `${c.ciclo}|${normalizeWord(c.nombre)}`;
    if (!c.nombre) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.forEach((c, idx) => {
    assignUniqueCode(c, usedCodes);
    if (!c.ord) c.ord = unique.filter(x => x.ciclo === c.ciclo && unique.indexOf(x) <= idx).length;
  });
  return unique;
}

// ─── PDF.js ───────────────────────────────────────────────────────────────────

let _pdfjsLib = null;

async function loadPdfJs() {
  if (_pdfjsLib) return _pdfjsLib;
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
    _pdfjsLib = window.pdfjsLib;
    return _pdfjsLib;
  }
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PDFJS_SRC;
    s.onload = resolve;
    s.onerror = () => reject(new Error('No se pudo cargar PDF.js desde CDN'));
    document.head.appendChild(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  _pdfjsLib = window.pdfjsLib;
  return _pdfjsLib;
}

// ─── Path 1: Extracción de texto ──────────────────────────────────────────────

/**
 * Extrae el texto de cada página del PDF.
 * Devuelve { pages: string[], isTextBased: boolean }
 */
async function extractTextPages(file, onProgress) {
  const lib   = await loadPdfJs();
  const buf   = await file.arrayBuffer();
  const pdf   = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
  const total = Math.min(pdf.numPages, MAX_PAGES);
  const pages = [];

  for (let p = 1; p <= total; p++) {
    onProgress?.({ phase: 'text', page: p, total });
    const page    = await pdf.getPage(p);
    const content = await page.getTextContent();
    const text    = content.items.map(item => item.str).join(' ');
    pages.push(text);
  }

  const avgChars = pages.reduce((s, t) => s + t.length, 0) / (pages.length || 1);
  const isTextBased = avgChars >= TEXT_CHARS_THRESHOLD;

  return { pages, isTextBased };
}

const TEXT_SYSTEM_PROMPT = `Eres un extractor especializado de planes de estudio universitarios peruanos (USIL).
Se te da el texto extraído de un PDF de plan de estudios.
Extrae TODOS los cursos y devuelve ÚNICAMENTE un JSON válido sin texto adicional:
{
  "cursos": [
    {
      "ciclo": "I",
      "ord": 1,
      "codigo": "",
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
- ciclo: numeral romano (I a XIV). Las columnas pueden llamarse "Ciclo", "Semestre" o "Nivel".
- nombre: nombre del curso. Columna "Curso", "Asignatura" o "Materia".
- codigo: SOLO si aparece explícitamente en el texto. Si no hay, deja "" (NO inventes).
- cred: créditos. Columna "CR", "Cred" o "Créditos".
- t: TOTAL de horas (columna "TH", "Total Horas"). Si el plan separa T/P/L, suma todas en t.
- cond: "Electivo" si el curso está bajo una sección de electivos/menciones; si no, "Obligatorio".
- sunedu: "General" o "Específico".
- prereq: columna "Pre-Requisito" o "Requisito".
- mencion: si el curso pertenece a una línea/mención, pon su nombre; si no, "".
- IGNORA filas de totales/subtotales (ej. "Total", "TOTAL"), encabezados repetidos y metadata.
- Usa 0 / "" para campos ausentes.
- Si no encuentras cursos devuelve {"cursos": []}.`;

async function callTextApi(text, model) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${model.apiKey}`
  };
  if (model.proveedor === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'USIL ERP - PDF Text Extraction';
  }

  let res;
  try {
    res = await fetch(model.endpoint, {
      method: 'POST',
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({
        model: model.modelId,
        messages: [
          { role: 'system', content: TEXT_SYSTEM_PROMPT },
          { role: 'user',   content: `Extrae los cursos de este plan de estudios:\n\n${text}` }
        ],
        max_tokens: 8192,
        temperature: 0.1
      })
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Tiempo de espera agotado (90 s). Intenta con un PDF de menos páginas.');
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
  return (parsed.cursos || []).map(normalizeCourse);
}

// ─── Path 2: Extracción por visión ────────────────────────────────────────────

export async function renderPdfPages(file, onProgress) {
  const lib   = await loadPdfJs();
  const buf   = await file.arrayBuffer();
  const pdf   = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
  const total = Math.min(pdf.numPages, MAX_PAGES_VISION);
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

const VISION_SYSTEM_PROMPT = `Eres un extractor especializado de mallas curriculares universitarias peruanas.
Analiza la imagen del documento y extrae TODOS los cursos que aparezcan en tablas o listados.
Devuelve ÚNICAMENTE un JSON válido sin texto adicional:
{
  "cursos": [
    {
      "ciclo": 1,
      "ord": 1,
      "codigo": "",
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
- ciclo: número entero (1-14) que indica el semestre/ciclo.
- ord: orden del curso dentro del ciclo. Si no figura, deja 0.
- nombre: nombre del curso. Columna "Curso", "Asignatura" o "Materia".
- codigo: SOLO si aparece explícitamente. Si no hay, deja "" (NO inventes).
- cond: "Electivo" si aparece bajo una sección de electivos/menciones; si no, "Obligatorio".
- cred: créditos. Columna "CR", "Cred" o "Créditos".
- t: TOTAL de horas (columna "TH", "Total Horas"). Si el plan separa T/P/L, suma todas en t.
- p: horas de práctica separadas (si existen; si no, 0).
- l: horas de laboratorio separadas (si existen; si no, 0).
- prereq: columna "Pre-Requisito" o "Requisito".
- mencion: si el curso pertenece a una línea/mención, pon su nombre; si no, "".
- sunedu: "General" o "Específico".
- IGNORA filas de totales/subtotales y encabezados repetidos.
- Si no hay tabla de cursos visible devuelve {"cursos": []}.`;

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
            { type: 'text',      text: VISION_SYSTEM_PROMPT },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }],
        max_tokens: 4096,
        temperature: 0.1
      })
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Tiempo de espera agotado (90 s). Intenta con un PDF de menos páginas.');
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
  return (parsed.cursos || []).map(normalizeCourse);
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Extrae cursos de un PDF.
 * Intenta primero extracción por texto (PDF seleccionable); si el PDF es
 * escaneado (pocas letras por página), cae al path de visión.
 */
export async function extractFromPdf(file, model, onProgress) {
  // 1. Intentar extracción por texto
  const { pages: textPages, isTextBased } = await extractTextPages(file, ({ page, total }) => {
    onProgress?.({ phase: 'render', page, total });
  });

  if (isTextBased) {
    try {
      onProgress?.({ phase: 'extract', page: 1, total: 1 });
      const fullText = textPages.join('\n\n--- página siguiente ---\n\n');
      const courses  = await callTextApi(fullText, model);
      if (courses.length > 0) {
        console.info(`[PDF text] ${courses.length} cursos extraídos por texto.`);
        return deduplicateAndAssignCodes(courses);
      }
      console.warn('[PDF text] El modelo no encontró cursos en el texto. Intentando con visión.');
    } catch (e) {
      console.warn('[PDF text] Error en extracción por texto, cayendo a visión:', e.message);
    }
  }

  // 2. Fallback: visión (PDF escaneado o texto fallido)
  const imagePages = await renderPdfPages(file, onProgress);
  const allCourses = [];

  for (let i = 0; i < imagePages.length; i++) {
    onProgress?.({ phase: 'extract', page: i + 1, total: imagePages.length });
    try {
      const courses = await callVisionApi(imagePages[i], model);
      allCourses.push(...courses);
    } catch (e) {
      console.warn(`[PDF vision] Página ${i + 1} sin resultado:`, e.message);
    }
  }

  return deduplicateAndAssignCodes(allCourses);
}
