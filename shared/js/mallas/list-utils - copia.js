/* ============================================================
   LIST-UTILS — Operaciones puras sobre listas de mallas USIL.
   Sin acceso a almacenamiento: reciben los datos ya cargados
   (desde db.getMallasUsil()). Antes vivían en store.js.
   ============================================================ */

/** Cuenta mallas con estado activo. */
export function countActivas(mallas = []) {
  return mallas.filter((m) => m.estado === 'activo').length;
}

/** RF-03: detecta duplicado por carrera + periodo dentro de una lista. */
export function findDuplicate(mallas, carrera, periodo, excludeId = null) {
  return (mallas || []).find(
    (m) => m.carrera === carrera && m.periodo === periodo && m.id !== excludeId
  ) || null;
}

/** Filtra mallas según criterios de la lista. */
export function filterMallas(mallas, { unidad = '', facultad = '', carrera = '' } = {}) {
  return mallas.filter(
    (m) =>
      (!unidad || m.unidad === unidad) &&
      (!facultad || m.facultad === facultad) &&
      (!carrera || m.carrera === carrera)
  );
}

/** Pagina un arreglo. */
export function paginate(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    page: safePage,
    total: items.length
  };
}

/** Genera números de página con elipsis. */
export function buildPageList(current, totalPages) {
  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - current) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return pages;
}
