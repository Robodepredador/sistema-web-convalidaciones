# Restructuración del Proyecto USIL ERP

## Estructura actual (implementada)

```
SISTEMA_WEB/
├── README.md                         ← documentación del proyecto
├── index.html                        ← página de entrada (redirige a módulos)
│
├── public/                           ← módulos y páginas estáticas
│   ├── modulos/
│   │   ├── mallas/
│   │   │   ├── index.html           ← vista de Mallas Curriculares
│   │   │   └── script.js            ← lógica del módulo
│   │   └── malla-nueva/
│   │       ├── index.html           ← wizard de crear malla
│   │       └── script.js            ← lógica del wizard
│   │
│   └── pages/                        ← futuras páginas
│       ├── dashboard.html
│       ├── equivalencias.html
│       ├── instituci­ones.html
│       ├── simulaciones.html
│       ├── convalidaciones.html
│       ├── reportes.html
│       ├── usuarios.html
│       └── centro-ia.html
│
├── shared/                           ← recursos compartidos por todos
│   ├── js/
│   │   ├── app-shell.js              ← Web Component de layout maestro
│   │   ├── nav-config.js             ← menú lateral + usuario
│   │   └── icons.js                  ← iconos SVG inline
│   │
│   ├── css/
│   │   ├── tokens.css                ← variables de diseño (fuente única de verdad)
│   │   ├── base.css                  ← reset + estilos globales
│   │   ├── layout.css                ← sidebar, topbar, responsive
│   │   ├── components.css            ← botones, tablas, badges, etc.
│   │   └── wizard.css                ← estilos específicos del asistente
│   │
│   └── assets/
│       ├── images/
│       │   └── logo.svg
│       └── fonts/                    ← si es necesario (ahora desde Google)
│
└── docs/
    ├── ESPECIFICACION.md
    ├── FLUJO-CU01-mallas.md
    ├── QUICKSTART.md
    ├── DEPLOYMENT.md
    ├── PRUEBAS.md
    ├── RESUMEN-EJECUTIVO.md
    └── NUEVA-ESTRUCTURA.md
```

## Cambios Principales

1. **public/modulos/** - Agrupa módulos por feature, cada uno con su HTML + JS
2. **shared/** - Recursos compartidos (JS global, CSS, assets)
3. **docs/** - Documentación técnica
4. **Rutas de imports** - Ajustar `<script src=...>` en cada HTML

## Beneficios

- ✅ Escalable: nuevos módulos = nueva carpeta en `public/modulos/`
- ✅ Mantenible: cada módulo es independiente
- ✅ Claro: `shared/` claramente separado de `public/modulos/`
- ✅ CI/CD ready: estructura estándar para automatización
- ✅ Fácil migración a bundler (webpack/vite) después

## Rutas Relativas Después

```html
<!-- En public/modulos/mallas/index.html -->
<script src="../../../shared/js/icons.js"></script>
<script src="../../../shared/js/nav-config.js"></script>
<script src="../../../shared/js/app-shell.js"></script>
<script src="./script.js"></script>

<!-- O mejor: usar raíz del servidor -->
<script src="/shared/js/icons.js"></script>
```

## Migración completada

La restructuración ya está aplicada. Los archivos legacy en la raíz (`mallas.html`, `css/`, `js/`, etc.) fueron eliminados. Para agregar módulos nuevos, sigue la guía en el README principal.

