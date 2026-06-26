## ⚡ Quick Start - Sistema de Convalidaciones USIL

### 1️⃣ Verificación Previa
```bash
# Verifica que estés en la carpeta correcta
cd c:\Users\LEGION\Desktop\CONVALIDACIONES_USIL\SISTEMA_WEB
dir
# Deberías ver: public/, shared/, docs/, index.html, README.md, etc.
```

### 2️⃣ Iniciar Servidor Local

**Opción A: Python (Recomendado)**
```bash
python -m http.server 5500
# Verás: Serving HTTP on 0.0.0.0 port 5500 (http://0.0.0.0:5500/)
```

**Opción B: Node.js**
```bash
npm install -g serve
serve -p 5500
```

**Opción C: Windows Batch (doble-click)**
```bash
start-server.bat
```

**Opción D: VS Code Live Server**
- Click derecho en `index.html`
- "Open with Live Server"

### 3️⃣ Abrir en Navegador
```
http://localhost:5500/
```

### 4️⃣ Probar Funcionalidades

**Flujo 1: Ver Mallas Curriculares**
1. Abre http://localhost:5500/
2. Se redirige automáticamente a Mallas Curriculares
3. Ves tabla con 8 mallas (paginadas 4 por página)
4. Prueba filtros (Unidad, Facultad, Carrera)
5. Prueba paginación (siguiente página)

**Flujo 2: Crear Nueva Malla (Wizard 4 pasos)**
1. Haz click en botón "Nueva Malla Curricular" (en la tabla de Mallas)
2. Deberías ver Paso 1: Cabecera
   - Completa campos: Unidad, Facultad, Carrera, Modalidad, Periodo, Versión
   - Haz click en "Continuar" (sin completar = error)
3. Deberías ver Paso 2: Tipo
   - "Registro Manual" ya está seleccionado
   - Haz click en "Continuar"
4. Deberías ver Paso 3: Cursos
   - Tabla editable con 15 cursos
   - Prueba: Editar un valor, ver total créditos actualizar
   - Prueba: Click papelera para eliminar fila
   - Prueba: Click "Agregar fila" para nueva fila
   - Haz click en "Continuar a Revisión"
5. Deberías ver Paso 4: Resumen
   - Datos que completaste en Paso 1
   - Estructura curricular por ciclo
   - Botones: Exportar PDF, Exportar Excel, Publicar
   - Haz click en "Publicar Malla Curricular"
6. Deberías ver: Alert "¡Malla curricular publicada!" + Redirige a Mallas
7. Verifica que volviste a la tabla de Mallas

### 5️⃣ Verificar en DevTools (F12)

**Console (Consola)**
- Deberías **NO VER** errores rojos (404, undefined, etc.)
- Mensaje OK: Verde o sin errores

**Network (Red)**
- Verifica que arquivos cargan (status 200)
- No debería haber 404s

**Elements (Elementos)**
- Busca `<app-shell>` (Web Component)
- Busca `<table>` en Paso 3
- Verifica que rutas de `<script src="">` sean relativas

### 6️⃣ Si Algo No Funciona

| Problema | Solución |
|----------|----------|
| "Cannot GET /" | Asegúrate que estés en `c:\Users\LEGION\Desktop\CONVALIDACIONES_USIL\SISTEMA_WEB` |
| Estilos no cargan | DevTools → Network → verifica que CSS tenga status 200 |
| Iconos no aparecen | DevTools → Console → busca "renderIcons" error |
| Tabla no editable | Abre DevTools → Console → busca "Cannot read property" |
| Botones no funcionan | DevTools → Console → búsca "addEventListener" o "not defined" |
| Wizard no avanza | Completa TODOS los campos requeridos antes de click "Continuar" |

### 7️⃣ Documentación Adicional

- **docs/PRUEBAS.md** — 80+ casos de prueba detallados
- **docs/DEPLOYMENT.md** — Guía de despliegue en producción
- **docs/ESPECIFICACION.md** — Requisitos funcionales
- **README.md** — Guía técnica completa
- **docs/RESUMEN-EJECUTIVO.md** — Resumen de lo implementado

### 8️⃣ Estructura de Carpetas

```
SISTEMA_WEB/
├── public/modulos/           ← Módulos (UI)
│   ├── mallas/              ← Gestión de mallas
│   └── malla-nueva/         ← Wizard 4 pasos
├── shared/                   ← Recursos compartidos
│   ├── js/                  ← Web Components
│   ├── css/                 ← Estilos
│   └── assets/              ← Imágenes
├── docs/                     ← Documentación
└── index.html                ← Punto de entrada
```

### 9️⃣ Endpoints Implementados

| URL | Descripción |
|-----|-------------|
| `/` | Redirige a mallas |
| `/public/modulos/mallas/` | Tabla de mallas curriculares |
| `/public/modulos/malla-nueva/` | Wizard de crear malla (4 pasos) |

### 🔟 Tips Pro

- **Devtools → F12** es tu amigo
- **Console tab** para errores JavaScript
- **Network tab** para archivos faltantes
- **Elements tab** para inspeccionar HTML
- **Usa Ctrl+Shift+R** para hard refresh (limpiar caché)
- **Abre `start-server.bat`** haciendo doble-click en Windows

---

**¡Listo para empezar!** 🚀

