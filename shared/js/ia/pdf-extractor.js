/* ============================================================
   PDF Extractor — renderiza páginas de PDF y extrae cursos
   via un modelo de visión compatible con OpenAI.
   ============================================================ */

const PDFJS_SRC    = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAX_PAGES    = 8;
const SCALE        = 1.2;    // reducido para mantener imágenes < 250 KB y no saturar el API
const JPEG_QUALITY = 0.78;
const API_TIMEOUT  = 90_000; // 90 s máximo por página

const CICLO_ROMAN = { 1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI', 7:'VII', 8:'VIII', 9:'IX', 10:'X' };

function normalizeCiclo(v) {
  if (v == null || v === '') return 'I';
  if (typeof v === 'number') return CICLO_ROMAN[v] || String(v);
  const n = parseInt(v, 10);
  if (!isNaN(n) && CICLO_ROMAN[n]) return CICLO_ROMAN[n];
  return String(v); // ya es romano o 'Electivo'
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

export async function renderPdfPages(file, onProgress) {
  const lib = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
  const total = Math.min(pdf.numPages, MAX_PAGES);
  const pages = [];

  for (let p = 1; p <= total; p++) {
    onProgress?.({ phase: 'render', page: p, total });
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: SCALE });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
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
      "nombre": "Matemática Básica",
      "cond": "Obligatorio",
      "cred": 4,
      "t": 3,
      "p": 2,
      "l": 0,
      "prereq": "",
      "sunedu": "General",
      "mencion": "",
      "credMin": 0
    }
  ]
}
Reglas:
- ciclo: número entero (1-10) que indica el semestre
- ord: orden del curso dentro del ciclo
- cond: "Obligatorio" o "Electivo"
- sunedu: "General" o "Específico"
- Si un campo no figura en el documento usa su valor por defecto (0 para números, "" para texto)
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
      throw new Error('Tiempo de espera agotado (90 s). El servidor IA no respondió a tiempo. Intenta con un PDF de menos páginas o verifica tu conexión.');
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
    ord:     Number(c.ord)    || 1,
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
  }));
}

export async function extractFromPdf(file, model, onProgress) {
  const pages = await renderPdfPages(file, onProgress);
  const allCourses = [];

  for (let i = 0; i < pages.length; i++) {
    onProgress?.({ phase: 'extract', page: i + 1, total: pages.length });
    try {
      const courses = await callVisionApi(pages[i], model);
      allCourses.push(...courses);
    } catch (e) {
      console.warn(`Página ${i + 1} sin resultado:`, e.message);
    }
  }

  // Deduplicar por código (conservar primera aparición)
  const seen = new Set();
  return allCourses.filter(c => {
    if (!c.codigo) return true;
    if (seen.has(c.codigo)) return false;
    seen.add(c.codigo);
    return true;
  });
}
