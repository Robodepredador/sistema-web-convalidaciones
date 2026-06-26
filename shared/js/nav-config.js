/* ============================================================
   NAVEGACIÓN — fuente única de verdad del menú lateral
   Cada módulo del sistema se declara aquí UNA sola vez.
   <app-shell active="id"> resalta el ítem correspondiente.
   ============================================================ */

const NAV_ITEMS = [
  { id: 'dashboard',      label: 'Dashboard',              icon: 'dashboard', href: '/public/pages/dashboard.html' },
  { id: 'admision',       label: 'Admisión',               icon: 'users',     href: '/public/modulos/admision/' },
  { id: 'mallas',         label: 'Mallas Curriculares',    icon: 'grid',      href: '/public/modulos/mallas/' },
  { id: 'equivalencias',  label: 'Equivalencias',          icon: 'swap',      href: '/public/modulos/equivalencias/' },
  { id: 'instituciones',  label: 'Instituciones Externas', icon: 'building',  href: '/public/modulos/instituciones/' },
  { id: 'simulaciones',   label: 'Simulaciones',           icon: 'chart',     href: '/public/modulos/simulaciones/' },
  { id: 'convalidaciones',label: 'Convalidaciones',        icon: 'doc',       href: '/public/modulos/convalidaciones/' },
  { id: 'reportes',       label: 'Reportes',               icon: 'doc',       href: '/public/modulos/reportes/' },
  { id: 'usuarios',       label: 'Usuarios',               icon: 'users',     href: '/public/modulos/usuarios/' },
  { id: 'centro-ia',      label: 'Centro IA',              icon: 'ai',        href: '/public/modulos/centro-ia/' }
];

const NAV_FOOTER = [
  { id: 'configuracion', label: 'Configuración',  icon: 'settings', href: '/public/pages/configuracion.html' },
  { id: 'logout',        label: 'Cerrar Sesión',  icon: 'logout',   href: '#' }
];

/* Usuario en sesión (mock). Cuando exista auth, vendrá del backend. */
const CURRENT_USER = {
  name: 'Dr. Alberto Ruiz',
  role: 'Administrador Académico',
  avatar: 'https://i.pravatar.cc/80?img=12'
};
