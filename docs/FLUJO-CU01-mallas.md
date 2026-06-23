# Flujo lógico — CU-01: Gestión de Mallas Curriculares

> Asistente "Creación de Nueva Malla Curricular" (4 pasos) + vista de lista.
> Cubre RF-01 … RF-07. Basado en los frames de Figma del CU-01 y la SRS.
>
> **Leyenda de origen:** ✅ confirmado por frame de Figma · 🔶 inferido (frame no
> cargado por límite del plan Figma; validar contra `79:1651`, `78:4605`, `79:1804`).

---

## 0. Punto de entrada — Lista de Mallas (`public/modulos/mallas/`) ✅

Pantalla ya implementada. Acciones que disparan el flujo:

- **"Nueva Malla Curricular"** (botón primario / evento `app-action`) → entra al **Paso 1** del asistente.
- **Editar** (ícono por fila) → abre el asistente en modo edición precargado (RF-05).
- **Filtros** (Unidad / Facultad / Carrera) → solo consulta (RF-04), no entra al asistente.

---

## Paso 1 — Cabecera ✅  (frame `78:6413`)  · RF-01

**Sección "Datos Institucionales"** (selects en cascada):
- Unidad de Negocio → al elegir, filtra Facultad.
- Facultad → al elegir, filtra Carrera.
- Carrera.

**Sección "Detalles de Versión":**
- Modalidad: `Presencial` | `Virtual` | `Semipresencial` (radio, una sola).
- Periodo Académico de Inicio: formato `AAAA-N` (ej. `2024-02`).
- Versión de Malla: numérica/selector (ej. `1`).

**Acción `Continuar a Registro de Cursos`** → valida:
1. Todos los campos requeridos completos. Si falta → marca error inline, no avanza.
2. **RF-03 (anti-duplicado):** no debe existir malla para la misma **carrera + año/periodo**.
   - Si existe → mensaje de error y **cancela** (Flujo Alternativo FA1 de la SRS). No avanza.
3. OK → guarda cabecera en estado del asistente y avanza al **Paso 2**.

`Atrás` → vuelve a la lista (descarta borrador, con confirmación si hay datos).

---

## Paso 2 — Tipo ✅  (frame `78:6972`)  · RF-02  · **DECISIÓN**

Dos tarjetas mutuamente excluyentes:

- **A) Importar Malla desde Excel** — carga masiva `.xlsx`. Acción: `Descargar Plantilla Oficial`.
- **B) Registro Manual de Cursos** — alta curso por curso (paso a paso).

> Nota IA: en carga masiva, el motor de IA valida la **coherencia de prerrequisitos**
> antes de confirmar la importación.

**Acción `Continuar`** → bifurca según la tarjeta seleccionada:
- A → **Paso 3-A (Excel)**
- B → **Paso 3-B (Manual)**

---

## Paso 3-A — Cursos / Carga Excel ✅  (frame `79:34`)  · RF-02

Cabecera de contexto (chip): `Carrera - Plan AAAA` · Unidad · Carrera · Periodo · Versión.

- **Carga de Archivo Maestro:** dropzone (arrastrar/soltar o `Seleccionar Archivo`).
  Formatos aceptados: `.xlsx`, `.xls`. Botón `Descargar Plantilla Oficial`.
- **Formato Específico** (columnas obligatorias de la 1ª hoja):
  `Ciclo`, `Orden`, `Código`, `Nombre Curso`, `Condición`, `Créditos`,
  `Teoría / Práctica / Lab`, `Prerrequisito` (validado por IA), `Clasif. SUNEDU`,
  `Mención`, `Créd. Mín.`

**Al subir el archivo:**
1. Parseo del Excel → mapear columnas.
2. Validaciones: columnas presentes, tipos correctos, créditos numéricos,
   **RF-07** ≤ 14 ciclos (10 estándar / 14 Medicina), prerrequisitos existentes (IA).
3. Si hay errores → listar fila/columna/motivo, permanecer en el paso.
4. OK → `Continuar a Revisión` → **Paso 4**.

---

## Paso 3-B — Cursos / Registro Manual 🔶  (frame `79:1651`)  · RF-02, RF-06, RF-07

> Inferido. Formulario dinámico curso por curso reutilizando la tabla del sistema.

- Agregar curso: `Ciclo`, `Código`, `Nombre`, `Condición`, `Créditos`,
  `Teoría/Práctica/Lab`, `Prerrequisito`, `Clasif. SUNEDU`, `Mención`, `Créd. Mín.`
- Agrupación por ciclo (máx. 14 — RF-07).
- Editar / eliminar (soft delete) filas antes de confirmar (RF-06).
- `Continuar a Revisión` → **Paso 4**.

---

## Paso 4 — Resumen / Revisión 🔶  (frames `78:4605`, `79:1804`)  · RF-01, RF-02

> Inferido. Consolidación de cabecera + cursos.

- Muestra: datos de cabecera + cursos agrupados por ciclo, total de créditos y nº de cursos.
- Última oportunidad de volver atrás a corregir (Paso 1/3).
- **Acción `Confirmar / Registrar Malla`:**
  1. Re-valida RF-03 (anti-duplicado) por si cambió algo.
  2. Persiste la malla (estado `activo`) — en mockup: agrega a `MALLAS`.
  3. **Éxito** → toast/confirmación → vuelve a la **lista** con la nueva malla visible.
  4. Error de guardado → permanece en Resumen con el motivo.

---

## Reglas transversales (toda la gestión)

| RF | Regla |
| -- | ----- |
| RF-03 | Único por (carrera + año/periodo). Se valida al entrar al Paso 2 y al confirmar. |
| RF-04 | Lista filtrable por facultad / carrera / año (ya implementado). |
| RF-05 | Editar malla existente sin romper convalidaciones históricas (versiona, no sobrescribe). |
| RF-06 | Soft delete + recuperación de cursos. |
| RF-07 | Hasta 14 ciclos (10 estándar, 14 Medicina). |

## Mapa de estados del asistente

```
LISTA → [1 Cabecera] → (RF-03 ok?) → [2 Tipo] → ┬─ Excel  → [3A Carga] → [4 Resumen] → CONFIRMAR → LISTA
                          │ no                   └─ Manual → [3B Form]  → [4 Resumen] → ┘
                          └→ error duplicado (queda en Paso 1)
Atrás en cualquier paso → paso anterior · Cancelar → LISTA (confirma si hay borrador)
```
