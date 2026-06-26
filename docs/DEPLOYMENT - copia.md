# 🚀 Guía de Despliegue - Sistema de Convalidaciones USIL

## 1. Estructura Reorganizada ✅

El proyecto ha sido reorganizado en una estructura modular y escalable:

```
SISTEMA_WEB/
├── public/modulos/         ← Módulos del ERP
│   ├── mallas/             ← Gestión de Mallas Curriculares
│   └── malla-nueva/        ← Wizard de crear malla (4 pasos)
│
├── shared/                 ← Recursos compartidos
│   ├── js/                 ← Web Components y configuración
│   ├── css/                ← Design tokens y estilos
│   └── assets/             ← Imágenes
│
├── docs/                   ← Documentación
└── index.html              ← Redirige a /public/modulos/mallas/
```

---

## 2. Archivos y ubicaciones

### Recursos compartidos (`shared/`)
- `shared/js/icons.js` — iconos SVG inline
- `shared/js/nav-config.js` — menú lateral y usuario en sesión
- `shared/js/app-shell.js` — Web Component de layout
- `shared/css/*.css` — design tokens y estilos globales

### Módulos (`public/modulos/`)
- `public/modulos/mallas/index.html` + `script.js`
- `public/modulos/malla-nueva/index.html` + `script.js`

### Documentación (`docs/`)
- `ESPECIFICACION.md`, `FLUJO-CU01-mallas.md`, `NUEVA-ESTRUCTURA.md`
- `QUICKSTART.md`, `PRUEBAS.md`, `RESUMEN-EJECUTIVO.md`, `DEPLOYMENT.md`

---

## 3. Correcciones de Seguridad ✅

### XSS Prevention
- ✅ Función `escapeHTML()` en `shared/js/icons.js`
- ✅ Sanitización en `shared/js/app-shell.js` (usuario)
- ✅ Sanitización en `public/modulos/mallas/script.js` (datos de tabla)
- ✅ Sanitización en `public/modulos/malla-nueva/script.js` (tabla editable)

### Cambios principales
```javascript
// ❌ ANTES (vulnerable)
<div>${user.name}</div>

// ✅ AHORA (seguro)
<div></div>
userNameEl.textContent = user.name;
```

---

## 4. Verificación Local

### Opción 1: Python
```bash
cd c:\Users\LEGION\Desktop\CONVALIDACIONES_USIL\SISTEMA_WEB
python -m http.server 5500
```

### Opción 2: Node.js
```bash
npx serve -p 5500
```

### Opción 3: VS Code Live Server
- Instalar extensión "Live Server"
- Click derecho en `index.html` → "Open with Live Server"

**URL:** `http://localhost:5500/`

---

## 5. Pruebas Manuales

Ver `docs/PRUEBAS.md` para checklist completo.

**Flujos críticos a probar:**

### Flujo 1: Mallas Curriculares
1. Carga página → tabla con 8 mallas
2. Aplica filtro → tabla se actualiza
3. Click paginación → navega entre páginas
4. Click "Nueva Malla Curricular" → wizard paso 1

### Flujo 2: Wizard (4 pasos)
1. **Paso 1:** Completa datos, haz click "Continuar"
2. **Paso 2:** Elige "Registro Manual", haz click "Continuar"
3. **Paso 3:** Edita tabla, agrega/elimina filas, haz click "Continuar a Revisión"
4. **Paso 4:** Revisa resumen, haz click "Publicar Malla Curricular"
5. Debería redirigir a Mallas y mostrar alert de éxito

---

## 6. Rutas y Navegación

### Rutas principales
```
/                                    → Redirige a /public/modulos/mallas/
/public/modulos/mallas/              ← Gestión de Mallas Curriculares
/public/modulos/malla-nueva/         ← Wizard de crear malla
/public/pages/                       ← Futuras páginas (placeholders)
```

### Navegación dentro de módulos
- `../../../shared/js/icons.js`       (desde cualquier módulo)
- `../../../shared/css/tokens.css`    (desde cualquier módulo)
- `../mallas/`                         (desde malla-nueva a mallas)
- `../malla-nueva/`                    (desde mallas a malla-nueva)

---

## 7. Funcionalidades Implementadas

### ✅ Completadas
- [x] Tabla paginada de mallas (4 items/página)
- [x] Filtros por Unidad, Facultad, Carrera
- [x] Stat: total de mallas activas
- [x] Wizard de 4 pasos
  - [x] Paso 1: Validación de datos institucionales
  - [x] Paso 2: Selección entre Excel y Manual
  - [x] Paso 3: Tabla editable (manual) o upload (Excel)
  - [x] Paso 4: Resumen y publicación
- [x] Seguridad: XSS prevention
- [x] Accesibilidad: ARIA labels, foco visible
- [x] Responsive: móvil, tablet, desktop

### ⏳ Pendientes
- [ ] Integración con API/Backend (cambiar mock data por fetch)
- [ ] Tests automatizados (Jest, Vitest)
- [ ] Build tool (Webpack, Vite)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Almacenamiento en base de datos (Laravel)

---

## 8. Próximos Pasos (Roadmap)

### Corto plazo (1-2 semanas)
1. **Tests manuales exhaustivos** (ver `docs/PRUEBAS.md`)
2. **Feedback de UX/UI** de stakeholders
3. **Ajustes visuales** basados en feedback

### Mediano plazo (2-4 semanas)
1. **Integración con API** (endpoints de prueba)
2. **Tests automatizados** (al menos 50% de cobertura)
3. **Documentación técnica** completa (JSDoc, etc.)

### Largo plazo (1-2 meses)
1. **Migración a Laravel** backend
2. **Build tool** (Vite para desarrollo, producción)
3. **CI/CD** con GitHub Actions
4. **Deploy** a servidor de USIL

---

## 9. Troubleshooting

### Problema: "Módulos no cargan"
**Solución:** Verifica que el servidor esté sirviendo desde la raíz del proyecto. Las rutas relativas deben funcionar.

### Problema: "Estilos no se aplican"
**Solución:** Abre DevTools (F12) → Elements → verifica que `<link rel="stylesheet" href="...">` apunta a `shared/css/`.

### Problema: "Iconos no aparecen"
**Solución:** Verifica que `icons.js` esté cargado y que `renderIcons()` se llame después de `<app-shell>`.

### Problema: "Errores en consola"
**Solución:** 
1. Abre DevTools (F12)
2. Click en la pestaña Console
3. Busca errores de 404 (archivos no encontrados)
4. Verifica rutas relativas en `<script src="...">` y `<link href="...">`

---

## 10. Contacto y Soporte

**Mantenedor:** Copilot (AI Assistant)  
**Última actualización:** 2024-06-22  
**Versión:** 1.0.0  

---

## ✅ Checklist Final

- [x] Proyecto reorganizado en estructura modular
- [x] Todos los módulos funcionan con nuevas rutas
- [x] Seguridad: XSS prevention implementada
- [x] Accesibilidad: ARIA labels y navegación mejorada
- [x] Documentación actualizada (README, PRUEBAS, DEPLOYMENT)
- [x] Wizard completo con 4 pasos funcionales
- [ ] Deploy en servidor (pendiente)
- [ ] Backend integrado (pendiente)

**¡Listo para pruebas en entorno local!**

