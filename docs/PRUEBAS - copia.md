# Pruebas - Sistema de Convalidaciones USIL

## 🧪 Checklist de Pruebas Manuales

### Módulo: Gestión de Mallas Curriculares

#### 1. Carga de página
- [ ] Página carga sin errores en consola
- [ ] Sidebar visible con logo "USIL ERP"
- [ ] Usuario "Dr. Alberto Ruiz" aparece en topbar
- [ ] Menú lateral tiene 9 items
- [ ] Item "Mallas Curriculares" está resaltado en azul

#### 2. Tabla de mallas
- [ ] Tabla carga con 8 filas (mostrando 4 por página)
- [ ] Columnas: Unidad, Facultad, Carrera, Modalidad, Periodo, Versión, Estado, Acciones
- [ ] Iconos de modalidad (presencial, híbrido, virtual) se renderizan correctamente
- [ ] Badges de estado (Activo/Inactivo) con colores correctos
- [ ] Botón editar (icono de lápiz) aparece en la última columna

#### 3. Filtros
- [ ] Select "Unidad de Negocio" tiene opciones: "Pregrado", "Postgrado", "Educación Continua"
- [ ] Select "Facultad" tiene opciones: "Ingeniería y Ciencias", "Negocios y Economía", etc.
- [ ] Select "Carrera" se llena con carreras disponibles
- [ ] Al cambiar filtro, tabla se actualiza automáticamente
- [ ] Botón "Limpiar" borra todos los filtros
- [ ] Botón de lupa (filter) tiene aria-label "Aplicar filtros"

#### 4. Paginación
- [ ] Muestra "Mostrando 4 de X mallas curriculares"
- [ ] Botones "anterior" y "siguiente" funcionan
- [ ] Números de página aparecen con "..." cuando hay muchas
- [ ] Página actual está resaltada en azul
- [ ] No puedo ir a página anterior cuando estoy en 1
- [ ] No puedo ir a página siguiente cuando estoy en la última

#### 5. Stat
- [ ] Card azul muestra "Mallas Activas: 6"
- [ ] El número actualiza si cambio filtros (debería ser correcto)

#### 6. Botón principal
- [ ] Botón "Nueva Malla Curricular" aparece en la cabecera
- [ ] Al hacer click, navega a `/public/modulos/malla-nueva/`

---

### Módulo: Crear Nueva Malla Curricular (Wizard)

#### Paso 1: Cabecera

##### Datos Institucionales
- [ ] Select "Unidad de Negocio": vacío por defecto, opciones correctas
- [ ] Select "Facultad": vacío por defecto, opciones correctas
- [ ] Select "Carrera": vacío por defecto, opciones correctas
- [ ] Mensaje de error si dejo campos vacíos y hago click "Continuar"
- [ ] El error aparece inline bajo cada select

##### Detalles de Versión
- [ ] Radio buttons: "Presencial", "Virtual", "Semipresencial" (seleccionado por defecto)
- [ ] Input "Periodo Académico": placeholder "Ej: 2024-02"
- [ ] Input "Versión de Malla": valor por defecto "1"
- [ ] Validación: error si período está vacío

##### Navegación
- [ ] Botón "Atrás" redirige a `/public/modulos/mallas/`
- [ ] Botón "Continuar a Registro de Cursos" deshabilitado si hay errores
- [ ] Al hacer click y pasar validación, navega al Paso 2

##### Stepper
- [ ] Paso 1 está en círculo azul oscuro con número "1"
- [ ] Resto de pasos en gris con números
- [ ] Líneas entre pasos

#### Paso 2: Tipo

- [ ] Dos tarjetas (choice-cards): "Importar Excel" y "Registro Manual"
- [ ] "Registro Manual" está seleccionado por defecto (borde azul)
- [ ] Nota informativa con icono "info"
- [ ] Botón "Atrás" regresa al Paso 1
- [ ] Botón "Continuar" avanza al Paso 3 mostrando la rama correcta
- [ ] Al cambiar de tarjeta, se cambia la selección

#### Paso 3: Cursos

##### Contexto (Barra superior)
- [ ] Muestra título como "NombreCarrera - Plan 2024"
- [ ] Muestra Unidad, Carrera, Periodo, Versión (con "v" en versión)

##### Rama Manual (por defecto seleccionada)
- [ ] Tabla visible con columnas: Ciclo, Ord., Código, Nombre, Cond., Créd., Horas (T/P/L), Prereq., Clasif. SUNEDU, Mención, Créd. Mín.
- [ ] Tabla cargada con 15 cursos de ejemplo
- [ ] Campos son inputs editables (puedo cambiar valores)
- [ ] Select "Condición" funciona (Obligatorio/Electivo)
- [ ] Select "Clasificación SUNEDU" funciona
- [ ] Total Créditos en vivo: actualiza al cambiar valores
- [ ] Botón "+ Añadir Fila" agrega una fila nueva al final
- [ ] Botón de papelera elimina la fila (aparece en última columna)
- [ ] Botón "Importar Excel" cambia a rama Excel

##### Rama Excel
- [ ] Dropzone visible con icono de upload
- [ ] Puedo arrastar archivo al dropzone
- [ ] Botón "Seleccionar Archivo" abre file picker
- [ ] Aceptar solo .xlsx y .xls
- [ ] Tabla de columnas esperadas:
  - Ciclo ✓
  - Orden ✓
  - Código ✓
  - Nombre Curso ✓
  - Condición ✓
  - Créditos ✓
  - Teoría/Práctica/Lab ✓
  - Prerrequisito ℹ (opcional, validado por IA)
  - Clasif. SUNEDU ✓
  - Mención — (no aplica)
  - Créd. Mín. ✓

##### Navegación Paso 3
- [ ] Botón "Atrás" regresa al Paso 2
- [ ] Botón "Continuar a Revisión" avanza al Paso 4

#### Paso 4: Resumen

##### Card 1: Datos Institucionales
- [ ] Muestra tabla con:
  - Unidad: [valor del paso 1]
  - Facultad: [valor del paso 1]
  - Carrera: [valor del paso 1]
  - Modalidad: [valor del paso 1]
  - Periodo: [valor del paso 1]
  - Versión: v[valor del paso 1]

##### Card 2: Estructura Curricular
- [ ] Cursos agrupados por ciclo (Ciclo I, Ciclo II, etc.)
- [ ] Cada curso muestra:
  - Nombre del curso
  - Código del curso
  - Créditos (Cr.)
  - Condición (Obligatorio/Electivo)
- [ ] Botón "Exportar PDF": click → alert "Generación de documento disponible cuando exista backend"
- [ ] Botón "Exportar Excel": click → alert "Generación de documento disponible cuando exista backend"

##### Navegación Paso 4
- [ ] Botón "Atrás" regresa al Paso 3
- [ ] Botón "Publicar Malla Curricular": 
  - Click → alert con número de cursos y créditos totales
  - Redirige a `/public/modulos/mallas/`

---

## 🔒 Seguridad

- [ ] Consola sin errores XSS
- [ ] Datos con caracteres especiales (<, >, ", ') se escapan correctamente
- [ ] Usuario con nombre malicioso no ejecuta scripts

---

## ♿ Accesibilidad

- [ ] Tab navega por elementos en orden lógico
- [ ] Botones tienen `aria-label` descriptivos
- [ ] Menú activo tiene `aria-current="page"`
- [ ] Inputs tienen labels asociados

---

## 📱 Responsive

### Desktop (1366px)
- [ ] Sidebar fijo a la izquierda
- [ ] Contenido en columnas múltiples
- [ ] Todos los elementos visibles

### Tablet (1024px)
- [ ] Sidebar colapsable
- [ ] Botón hamburguesa en topbar
- [ ] Grid de 2 columnas → 1 columna
- [ ] Tabla con scroll horizontal

### Móvil (375px)
- [ ] Sidebar colapsado por defecto
- [ ] Click hamburguesa abre sidebar
- [ ] Una columna
- [ ] Tabla con scroll horizontal
- [ ] Botones apilados

---

## 🔗 Navegación

- [ ] Desde Mallas → botón "Nueva Malla" → Wizard Paso 1
- [ ] Wizard Paso 1 → "Atrás" → Mallas
- [ ] Wizard Paso 4 → "Publicar" → Mallas
- [ ] Menú lateral: click en "Mallas Curriculares" → `/public/modulos/mallas/`

---

## ⚠️ Casos Edge

- [ ] Crear tabla con 1 solo curso → total créditos = créditos del curso
- [ ] Crear tabla con 0 cursos → total créditos = 0
- [ ] Eliminar todas las filas → mensaje "No hay cursos"
- [ ] Nombres de carrera muy largos → no rompen el layout
- [ ] 100+ cursos → paginación maneja bien

---

## 📝 Notas de Testing

**Fecha de Testing:** _______________  
**Tester:** _______________  
**Navegador:** _______________  
**Resolución:** _______________  

**Bugs Encontrados:**
1. 
2. 
3. 

**Observaciones:**
- 
- 

