/* ============================================================
   ICONOS — SVG inline reutilizables
   Se inyectan por nombre con data-icon="nombre".
   Trazo currentColor para heredar el color del contexto.
   ============================================================ */

const ICONS = {
  plus: '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  dashboard: '<svg viewBox="0 0 20 20" fill="none"><rect x="2.5" y="2.5" width="6" height="6" rx="1.2" stroke="currentColor" stroke-width="1.5"/><rect x="11.5" y="2.5" width="6" height="6" rx="1.2" stroke="currentColor" stroke-width="1.5"/><rect x="2.5" y="11.5" width="6" height="6" rx="1.2" stroke="currentColor" stroke-width="1.5"/><rect x="11.5" y="11.5" width="6" height="6" rx="1.2" stroke="currentColor" stroke-width="1.5"/></svg>',
  grid: '<svg viewBox="0 0 20 20" fill="none"><rect x="2.5" y="2.5" width="15" height="15" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 7.5h15M7.5 2.5v15" stroke="currentColor" stroke-width="1.5"/></svg>',
  swap: '<svg viewBox="0 0 20 20" fill="none"><path d="M4 7h11l-3-3M16 13H5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  building: '<svg viewBox="0 0 20 20" fill="none"><path d="M3 17h14M5 17V5l5-2 5 2v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 8h.01M12 8h.01M8 11h.01M12 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  chart: '<svg viewBox="0 0 20 20" fill="none"><path d="M3 17V3M3 17h14M7 13v-3M11 13V7M15 13v-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  doc: '<svg viewBox="0 0 20 20" fill="none"><path d="M5 2.5h6l4 4V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 2.5V6.5h4M7.5 11h5M7.5 14h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  users: '<svg viewBox="0 0 22 20" fill="none"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 17a5.5 5.5 0 0 1 11 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M15 4a3 3 0 0 1 0 5.5M16 17a5.5 5.5 0 0 0-2-4.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  ai: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 6.5v7M6.5 10h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="10" r="1.6" fill="currentColor"/></svg>',
  settings: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 1.5v2M10 16.5v2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M1.5 10h2M16.5 10h2M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  logout: '<svg viewBox="0 0 20 20" fill="none"><path d="M12 3.5H4.5A.5.5 0 0 0 4 4v12a.5.5 0 0 0 .5.5H12M9 10h8m0 0-3-3m3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bell: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5c0 4-1.5 5-1.5 5h12s-1.5-1-1.5-5A4.5 4.5 0 0 0 10 2.5ZM8.5 16.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  help: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 7.5a2 2 0 1 1 2.7 1.9c-.5.2-.7.6-.7 1.1v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="14" r="0.9" fill="currentColor"/></svg>',
  filter: '<svg viewBox="0 0 18 12" fill="none"><path d="M1 1.5h16M4 6h10M7 10.5h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  edit: '<svg viewBox="0 0 20 20" fill="none"><path d="M13.5 3.5l3 3L7 16l-3.5.5L4 13l9.5-9.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  presencial: '<svg viewBox="0 0 14 11" fill="none"><rect x="1" y="1" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M5 10.5h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
  hibrido: '<svg viewBox="0 0 10 12" fill="none"><path d="M5 1v10M2 4l3-3 3 3M2 8l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  virtual: '<svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/><path d="M1 6h10M6 1c1.5 1.3 2.3 3.1 2.3 5S7.5 9.7 6 11M6 1C4.5 2.3 3.7 4.1 3.7 6S4.5 9.7 6 11" stroke="currentColor" stroke-width="1.2"/></svg>',
  chevronLeft: '<svg viewBox="0 0 8 12" fill="none"><path d="M6 1L1 6l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chevronRight: '<svg viewBox="0 0 8 12" fill="none"><path d="M2 1l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  menu: '<svg viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 18a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17 9.5a3.5 3.5 0 0 1-.5 7H7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 15v-5M9.5 12 12 9.5 14.5 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 15V4M8 8l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none"><path d="M8 6h12M8 12h12M8 18h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  search: '<svg viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5.5" stroke="currentColor" stroke-width="1.5"/><path d="M17 17l-3.7-3.7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  trash: '<svg viewBox="0 0 20 20" fill="none"><path d="M3.5 5.5h13M8 5.5V3.8a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8v1.7M5.5 5.5l.7 10a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9l.7-10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 10.3l2.3 2.3 4.7-4.9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  download: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 3v9M6.5 8.5 10 12l3.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.5 16h13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  info: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 9v4.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="10" cy="6.4" r="0.95" fill="currentColor"/></svg>',
  send: '<svg viewBox="0 0 20 20" fill="none"><path d="M17.5 2.5 9 11M17.5 2.5l-5.4 15-2.9-6.6-6.6-2.9 14.9-5.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  eye: '<svg viewBox="0 0 20 20" fill="none"><path d="M1.5 10s3-6 8.5-6 8.5 6 8.5 6-3 6-8.5 6S1.5 10 1.5 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>',
  globe: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 10h15M10 2.5c2 2.2 3 4.8 3 7.5s-1 5.3-3 7.5M10 2.5c-2 2.2-3 4.8-3 7.5s1 5.3 3 7.5" stroke="currentColor" stroke-width="1.5"/></svg>',
  calendar: '<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  clock: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v4.5l3 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  mail: '<svg viewBox="0 0 20 20" fill="none"><rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 6l7.5 5 7.5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  phone: '<svg viewBox="0 0 20 20" fill="none"><path d="M5 3.5h2.5L9 7 7.3 8.2a9 9 0 0 0 4.5 4.5L13 11l3.5 1.5V15a1.5 1.5 0 0 1-1.5 1.5A12 12 0 0 1 3.5 5 1.5 1.5 0 0 1 5 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  user: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 17.5a7 7 0 0 1 14 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  star: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 2.5l2.3 4.7 5.2.8-3.8 3.6.9 5.2L10 14.4l-4.6 2.4.9-5.2-3.8-3.6 5.2-.8L10 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  book: '<svg viewBox="0 0 20 20" fill="none"><path d="M3 3.5h5a2 2 0 0 1 2 2v11a1.5 1.5 0 0 0-1.5-1.5H3V3.5ZM17 3.5h-5a2 2 0 0 0-2 2v11a1.5 1.5 0 0 1 1.5-1.5H17V3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  cpu: '<svg viewBox="0 0 20 20" fill="none"><rect x="4.5" y="4.5" width="11" height="11" rx="1.5" stroke="currentColor" stroke-width="1.5"/><rect x="7.5" y="7.5" width="5" height="5" rx=".5" stroke="currentColor" stroke-width="1.2"/><path d="M7.5 2v2.5M12.5 2v2.5M7.5 15.5V18M12.5 15.5V18M2 7.5h2.5M15.5 7.5H18M2 12.5h2.5M15.5 12.5H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  file: '<svg viewBox="0 0 20 20" fill="none"><path d="M5 2.5h6l4 4V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 2.5V6.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  arrowLeft: '<svg viewBox="0 0 20 20" fill="none"><path d="M16 10H4M9 5l-5 5 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
};

/* Sanitiza strings para evitar XSS */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = String(str || '');
  return div.innerHTML;
}

/* Sustituye cada elemento con [data-icon] por su SVG correspondiente */
function renderIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const name = el.getAttribute('data-icon');
    if (ICONS[name]) {
      el.innerHTML = ICONS[name];
    }
  });
}
