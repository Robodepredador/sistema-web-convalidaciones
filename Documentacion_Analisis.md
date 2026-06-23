# DOCUMENTACIÓN INTEGRADORA - SISTEMA DE CONVALIDACIONES USIL (MVP)

## 1. Contexto Inicial y Visión del Proyecto
El proyecto nace de la necesidad de transformar un proceso de traslado externo que actualmente es manual, desorganizado y lento (con una duración de 15 a 25 días hábiles), en una plataforma web centralizada y automatizada. La meta principal es reducir la carga operativa y los errores en un 80%, logrando que el trámite tome entre 5 y 10 días hábiles.

Inicialmente, el sistema planteaba módulos de gestión de mallas y un asistente de IA para agilizar las equivalencias, con una interacción limitada para los estudiantes y una carga masiva de datos en segundo plano.

## 2. Evolución y Validaciones (Definiciones del MVP)
Durante la fase de análisis y diseño técnico, se validaron y ajustaron las siguientes estrategias para asegurar el éxito del Producto Mínimo Viable (MVP):

* **Enfoque de Infraestructura MVP:** Se descartó el uso de colas en segundo plano complejas (Jobs/Redis) para el procesamiento de archivos. El sistema operará de forma síncrona o por lotes desde el frontend, haciéndolo compatible con un VPS básico o shared hosting.
* **El Portal del Postulante ("Activo"):** Se descartó la idea de un enlace público pasivo (Magic Link). El postulante ahora debe registrarse e iniciar sesión obligatoriamente para iniciar el trámite, subir sus documentos de procedencia (DNI, certificados, sílabos) y aceptar o rechazar la propuesta final. Esto permite medir la conversión desde el día cero.
* **La IA como "Copiloto" (Human-in-the-Loop):** La Inteligencia Artificial será estrictamente interna e invisible para el estudiante. Funciona como un asistente exclusivo para el Coordinador Académico a través de la extracción de datos de PDFs, un semáforo de similitud semántica y alertas de memoria institucional. El humano siempre toma la decisión final.
* **Firma Virtual:** Se validó el uso de un **Acuerdo Clickwrap** (casilla de términos y condiciones que genera un hash de seguridad, fecha, hora e IP) como método oficial de firma para la aceptación de la convalidación, evitando integraciones costosas en la fase inicial.

## 3. Ecosistema de Usuarios (Roles)
El sistema gestiona 6 actores clave:
1.  **Estudiante Postulante:** Actor activo. Se registra, sube sus documentos, monitorea el trámite y acepta la propuesta de convalidación definitiva.
2.  **Personal de Admisión:** Primer filtro. Valida los datos del estudiante, verifica la integridad de los documentos y mide las métricas de conversión de solicitudes.
3.  **Coordinador Académico:** Tomador de decisiones. Evalúa las equivalencias apoyándose en la IA, arma la propuesta y aprueba el cruce de cursos.
4.  **Director de Facultad:** Actor supervisor. Audita los tiempos de respuesta y supervisa el trabajo de los coordinadores a su cargo.
5.  **Decano:** Nivel macroscópico. Acceso de solo lectura a reportes gerenciales, embudos y métricas globales.
6.  **Administrador:** Gestiona los accesos, roles y configuración de la plataforma.

## 4. Arquitectura de Módulos (CRUD y Entidades)

### Módulo 1: Seguridad y Gestión de Usuarios
* **Información:** Accesos de personal interno y postulantes (Nombres, DNI, Correo, Contraseña cifrada).
* **Gestión:** Asignación de roles y permisos por carrera/facultad.

### Módulo 2: Gestión de Instituciones Externas (Catálogo Origen)
* **Información:** Instituciones de procedencia (Universidad/Instituto), nombre, carreras externas asociadas y estado (soft deletes).

### Módulo 3: Gestión de Mallas Curriculares USIL (Catálogo Destino)
* **Información:** Unidad de negocio, Facultad, Carrera, Periodo (AAAA-0N), Versión.
* **Cursos USIL:** Código, nombre, ciclo, créditos y prerrequisitos.

### Módulo 4: Portal Público (Postulante)
* **Información:** Interfaz para el estudiante. Incluye registro y un *wizard* para la carga clasificada de documentos (URL de DNI, URL de certificado de notas, DJ temporal, constancia de primera matrícula y PDFs de Sílabos).

### Módulo 5: Bandeja de Admisión (Solicitudes)
* **Información:** Tablero Kanban/Bandeja de expedientes.
* **Operaciones:** Validar documentalmente con estados "Aprobado (Check)" o "Rechazado (X)". Remisión de expedientes al área académica.

### Módulo 6: Equivalencias (Diccionario Académico e IA)
* **Información:** Registro del cruce entre el curso externo y el curso USIL.
* **Operaciones:** Emparejamiento manual, cálculo de % de similitud por IA, y etiquetado de "Equivalencia Verificada" (feedback loop para la IA).

### Módulo 7: Simulación y Convalidación (Resultados)
* **Información:** Tabla comparativa por alumno, estado del trámite y generación del PDF preliminar.
* **Cierre:** Metadatos de la firma Clickwrap del estudiante, generación de Memorándum formal y trazabilidad de quién cerró el trámite.

### Módulo 8: Dashboards y Reportes
* **Información:** Embudos de conversión (Admisión), tiempos de respuesta (Directores) y reportes de volumen (Decanos). Exportación a Excel.

## 5. Flujos Principales de Negocio

### Flujo 1: Ingreso y Validación (Admisión)
1. El postulante se registra en su portal, indica su modalidad (Instituto/Universidad) y sube sus documentos en el wizard. 
2. Si no tiene certificado oficial, marca una "Declaración Jurada" para subir un récord simple.
3. El expediente llega a la "Bandeja de Admisión".
4. Admisión revisa cada documento. Si hay error, alerta al estudiante. Si todo es correcto, aprueba y remite el expediente al Coordinador Académico.

### Flujo 2: Evaluación Académica (Copiloto IA)
1. El Coordinador ingresa a la vista de "Gestionar Equivalencias".
2. El sistema muestra la malla USIL y los PDFs adjuntos del alumno.
3. El Coordinador usa la IA: hace clic en "Analizar PDF adjunto" para extraer los temas.
4. Si la universidad de origen ya fue evaluada antes, la "Memoria Institucional" sugiere las equivalencias históricas.
5. Al emparejar, un "Semáforo Semántico" muestra el % de similitud.
6. El Coordinador decide (aprueba/rechaza), generando la simulación comparativa.

### Flujo 3: Cierre y Confirmación
1. El sistema genera un PDF preliminar que se muestra en el portal del postulante.
2. El estudiante revisa la propuesta.
3. Si acepta, firma virtualmente mediante el Acuerdo Clickwrap.
4. El sistema registra la firma, cambia el estado a "Convalidado", guarda la "Equivalencia Verificada" para entrenar a la IA, y genera el memorándum oficial.

## 6. Dependencias de Módulos (Ruta Crítica)
El sistema tiene una dependencia secuencial estricta. Un módulo no puede operar sin la base de datos del anterior:
* **Dependencia 1:** No se pueden crear *Mallas USIL* sin haber configurado los *Usuarios y Roles* (Seguridad).
* **Dependencia 2:** No se puede iniciar el *Registro de Postulantes* sin las *Instituciones Externas* creadas (para que el alumno elija de dónde viene) y las *Mallas USIL* (para que elija a qué carrera va).
* **Dependencia 3:** El *Coordinador (Equivalencias)* depende estrictamente de que *Admisión* haya aprobado el expediente documental.
* **Dependencia 4:** El *Asistente de IA* depende de que existan *Equivalencias* previas confirmadas para tener precisión.

## 7. Puntos Técnicos a Considerar (Mockups en Vanilla JS)
* **Unificación de Datos:** Antes de desarrollar nuevas vistas, se debe consolidar la base de datos mock (`store.js` y `db.js`) en una sola fuente asíncrona (`db.js`) para cruzar mallas e instituciones.
* **Componentización:** Extraer estilos inline hacia archivos CSS compartidos para escalar las vistas del postulante y los tableros de admisión de manera ordenada.
* **Soft Deletes:** Todas las entidades (Mallas, Instituciones, Equivalencias) deben manejarse con eliminaciones lógicas (`estado: inactivo`) para preservar el historial de decisiones y evitar inconsistencias en auditorías futuras.
