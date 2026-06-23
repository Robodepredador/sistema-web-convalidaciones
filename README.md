# Sistema de Convalidaciones USIL — ERP Académico

**Stack:** HTML5 + CSS3 + Vanilla JavaScript (sin dependencias)

Mockups interactivos para validar UI/UX antes de migración a **Laravel** (stack objetivo de producción).

---

## Inicio rápido

```bash
cd SISTEMA_WEB
python -m http.server 5500
```

Abre **`http://localhost:5500/`** — redirige automáticamente a Mallas Curriculares.

Alternativas: `start-server.bat`, `npx serve -p 5500`, o Live Server en VS Code.

Guía detallada: [`docs/QUICKSTART.md`](docs/QUICKSTART.md)

---

## Estructura del proyecto

```
SISTEMA_WEB/
├── index.html                      ← entrada (redirect)
├── README.md
├── start-server.bat
├── .env.example
│
├── public/
│   ├── modulos/
│   │   ├── mallas/
│   │   │   ├── index.html
│   │   │   └── script.js
│   │   └── malla-nueva/
│   │       ├── index.html
│   │       └── script.js
│   └── pages/                      ← futuros mockups (dashboard, etc.)
│
├── shared/
│   ├── css/                        ← tokens, base, layout, components, wizard
│   ├── js/                         ← icons, nav-config, app-shell
│   └── assets/
│
└── docs/                           ← documentación técnica
```

---

## Módulos implementados

| URL | Descripción |
|-----|-------------|
| `/` | Redirige a mallas |
| `/public/modulos/mallas/` | Tabla de mallas curriculares USIL (filtros + paginación) |
| `/public/modulos/malla-nueva/` | Wizard de 4 pasos para crear malla |
| `/public/modulos/instituciones/` | Instituciones externas + carreras y mallas (detalle) |
| `/public/modulos/equivalencias/` | Diccionario de equivalencias (CRUD): semáforo IA, memoria institucional, verificar/rechazar |
| `/public/modulos/usuarios/` | Usuarios y Seguridad (CRUD): 6 roles, ámbito por facultad, soft delete |

**Módulos pendientes** (en menú lateral, aún sin mockup): Dashboard, Simulaciones, Convalidaciones, Reportes, Centro IA — irán en `public/pages/` o `public/modulos/`.

> El **Flujo 2 (Copiloto IA por alumno)** del documento depende de Admisión/Postulante (Dependencia 3), por lo que se difiere hasta construir esos módulos. El módulo actual cubre el **diccionario académico (Módulo 6)** completo.

> **Capa de datos:** toda la persistencia mock está unificada en `shared/js/db.js` (API asíncrona). Ver [`docs/ARQUITECTURA-DATOS.md`](docs/ARQUITECTURA-DATOS.md).

---

## Arquitectura

### Web Component `<app-shell>`

El sidebar y topbar son idénticos en todos los módulos:

```html
<app-shell
  active="mallas"
  page-title="Gestión de Mallas Curriculares"
  page-subtitle="Administración y seguimiento de programas académicos vigentes."
  page-action="Nueva Malla Curricular"
  page-action-id="nueva-malla">

  <!-- Contenido del módulo aquí -->

</app-shell>
```

- Menú centralizado en **`shared/js/nav-config.js`**
- `active="<id>"` resalta el ítem del menú
- El botón primario dispara el evento `app-action` (escúchalo desde el JS del módulo)

### Orden de scripts (importa)

```html
<script src="../../../shared/js/icons.js"></script>
<script src="../../../shared/js/nav-config.js"></script>
<script src="../../../shared/js/app-shell.js"></script>
<script src="./script.js"></script>
```

---

## Cómo crear un nuevo módulo

1. Copia la carpeta `public/modulos/mallas/` como plantilla
2. Renombra a `public/modulos/<nombre-modulo>/`
3. Ajusta `index.html`: atributos de `<app-shell>` y contenido interno
4. Edita `script.js` con la lógica y datos mock del módulo
5. Registra el ítem en `shared/js/nav-config.js`:
   ```javascript
   { id: 'nuevo', label: 'Nuevo', icon: 'grid', href: '/public/modulos/nuevo-modulo/' }
   ```

Los datos están en memoria (mock). Cuando exista backend, reemplaza los arrays por `fetch()` a la API.

---

## Documentación

| Archivo | Contenido |
|---------|-----------|
| [`docs/QUICKSTART.md`](docs/QUICKSTART.md) | Guía paso a paso para probar localmente |
| [`docs/ESPECIFICACION.md`](docs/ESPECIFICACION.md) | Requisitos funcionales del ERP |
| [`docs/FLUJO-CU01-mallas.md`](docs/FLUJO-CU01-mallas.md) | Diagrama del wizard de mallas |
| [`docs/NUEVA-ESTRUCTURA.md`](docs/NUEVA-ESTRUCTURA.md) | Guía de arquitectura modular |
| [`docs/ARQUITECTURA-DATOS.md`](docs/ARQUITECTURA-DATOS.md) | Capa de datos unificada (`db.js`), soft deletes |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Despliegue y troubleshooting |
| [`docs/PRUEBAS.md`](docs/PRUEBAS.md) | Checklist de pruebas manuales |
| [`docs/RESUMEN-EJECUTIVO.md`](docs/RESUMEN-EJECUTIVO.md) | Resumen de implementación |

---

## Checklist

- [x] Estructura modular (`public/`, `shared/`, `docs/`)
- [x] Web Component `<app-shell>` funcional
- [x] Módulo Mallas Curriculares completo
- [x] Wizard 4 pasos (Cabecera → Tipo → Cursos → Resumen)
- [x] Validación de formularios, paginación, responsive, accesibilidad
- [x] Tests automatizados (Vitest unitarios + integración DOM; Playwright E2E)
- [ ] Integración con API/Backend
- [ ] Build tool (webpack/vite)

### Ejecutar tests

```bash
npm install
npm test              # unitarios + integración (39 tests)
npm run test:e2e      # E2E con Playwright (requiere Chrome instalado)
npm run test:all      # ambos
```

---

**Stack objetivo (producción):** Laravel  
**Mockups actuales:** HTML + CSS + Vanilla JS
