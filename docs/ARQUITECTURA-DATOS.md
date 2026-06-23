# Arquitectura de Datos (capa mock)

> Estado tras **Fase 0 — Saneamiento**. Resuelve los puntos §7 y §8 de
> `Documentacion_Analisis.md` (unificación de datos, componentización y soft deletes).

## Fuente única: `shared/js/db.js`

Toda la persistencia mock vive en **`shared/js/db.js`**, que expone una **API
asíncrona** (`Promise`-based) simulando latencia de red. Antes existían dos
capas paralelas e incompatibles (`store.js` síncrono para mallas USIL y `db.js`
async para instituciones); se consolidaron en `db.js`.

### Colecciones del seed (`SEED_DATA`)

| Colección | Descripción | Módulo doc |
|-----------|-------------|------------|
| `instituciones` | Instituciones externas (catálogo origen) | 2 |
| `carreras` | Carreras externas por institución | 2 |
| `mallas` | Mallas **externas** por carrera | 2 |
| `mallasUsil` | Mallas **USIL** (catálogo destino) | 3 |
| `cursosUsil` | Cursos USIL de referencia | 3 |
| `cursosExternos` | Cursos de las mallas externas | 6 |
| `equivalencias` | Diccionario curso externo ↔ curso USIL | 6 |

> ⚠️ `mallas` (externas) y `mallasUsil` (destino) son entidades **distintas**:
> no se fusionan, se cruzan por institución/carrera.

### Persistencia y entornos

- **Navegador:** usa `localStorage` (clave `usil_erp_db`), versionado por
  `SEED_VERSION`. Si la versión cambia, se vuelve a sembrar automáticamente.
- **Node / Vitest:** `localStorage` no es funcional (en Node 25 existe pero sin
  `setItem`), así que `db.js` detecta esto y cae a un **store en memoria**.
- **Helpers de test:** `resetDb()` reinicia al seed; `setDbDelay(0)` desactiva la
  latencia simulada (bajo Vitest arranca en 0 automáticamente).

## Funciones puras: `shared/js/mallas/list-utils.js`

Las operaciones que **no tocan almacenamiento** (filtrar, paginar, contar
activas, detectar duplicados) se separaron del store a `list-utils.js`. Reciben
la lista ya cargada con `db.getMallasUsil()`. Esto mantiene `validation.js` puro
y testeable sin mocks.

## Soft Deletes (eliminación lógica)

`deleteInstitucion()` **ya no borra físicamente**: marca `eliminado: true` en la
institución y, en cascada, en sus carreras y mallas. Los getters filtran
`!eliminado` por defecto; `getInstituciones({ incluirEliminadas: true })` permite
recuperar el historial para auditorías (§8).

El flag `eliminado` es independiente del campo de negocio `estado`
(`activo`/`inactivo` en instituciones, `ACTIVA`/`HISTÓRICA`/`BORRADOR` en mallas).

## Componentización CSS

El modal genérico (`.modal-overlay`/`.modal-content`/…) y las tarjetas de
métrica (`.stat-card-vertical`) viven en `shared/css/components.css` y se
reutilizan entre vistas (antes estaban duplicados inline en cada HTML).

## Cómo consumir la capa de datos

```js
import { db } from '../../../shared/js/db.js';

// En el navegador (módulo): cargar datos en DOMContentLoaded
const mallas = await db.getMallasUsil();      // mallas USIL
const insts  = await db.getInstituciones();   // excluye eliminadas
const eqs    = await db.getEquivalencias({ estado: 'APROBADA' });
```
