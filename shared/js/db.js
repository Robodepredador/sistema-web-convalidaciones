/* ============================================================
   DB — Simulación de base de datos (SQLite mock) usando localStorage
   Provee una API asíncrona para interactuar con los datos.
   ============================================================ */

const DB_KEY = 'usil_erp_db';

// Datos iniciales para poblar la DB si está vacía
const SEED_DATA = {
  usil_catalog: {
    Pregrado: {
      'Facultad de Ingeniería e Inteligencia Artificial': [
        'INGENIERÍA AGROINDUSTRIAL',
        'INGENIERÍA EMPRESARIAL',
        'INGENIERÍA MECATRÓNICA',
        'INGENIERÍA AMBIENTAL',
        'INGENIERÍA EN CIBERSEGURIDAD',
        'INGENIERÍA DE SISTEMAS DE INFORMACIÓN'
      ],
      'Facultad de Admin. Hotelera, Turismo y Gastronomía': [
        'Administración Hotelera',
        'Turismo',
        'Gastronomía'
      ],
      'Facultad de Ciencias Empresariales': [
        'Administración',
        'Marketing'
      ],
      'Facultad de Arquitectura': [
        'Arquitectura'
      ],
      'Facultad de Comunicación': [
        'Comunicaciones'
      ]
    },
    Postgrado: {
      'Facultad de Ciencias Empresariales': ['MBA Executive'],
      'Facultad de Ingeniería e Inteligencia Artificial': ['Maestría en Sistemas']
    },
    'SIU MIAMI': {
      'Facultad de Ciencias Empresariales': ['Business Administration']
    }
  },
  solicitudes_admision: [
    {
      id: 'SOL-1718912000000',
      postulante: { nombres: 'Ana María', apellidos: 'López Ruiz', dni: '71234567', correo: 'ana.lopez@gmail.com', telefono: '987654321' },
      academico: { institucionOrigenId: '1', carreraOrigenId: '5', unidadDestino: 'Pregrado', facultadDestino: 'Facultad de Ingeniería e Inteligencia Artificial', carreraDestino: 'INGENIERÍA DE SISTEMAS DE INFORMACIÓN', mallaDestinoId: 'm-usil-1' },
      documentos: { dni: true, matricula: true, record: true },
      estado: 'PENDIENTE',
      fechaRegistro: '2023-11-01T10:30:00.000Z'
    },
    {
      id: 'SOL-1718912000001',
      postulante: { nombres: 'Carlos', apellidos: 'Mendoza', dni: '78889999', correo: 'cmendoza@hotmail.com', telefono: '999888777' },
      academico: { institucionOrigenId: '2', carreraOrigenId: '17', unidadDestino: 'Pregrado', facultadDestino: 'Facultad de Ciencias Empresariales', carreraDestino: 'Administración', mallaDestinoId: 'm-usil-2' },
      documentos: { dni: true, matricula: true, record: true },
      estado: 'EN REVISIÓN',
      fechaRegistro: '2023-11-05T14:15:00.000Z'
    }
  ],
  instituciones: [
    { id: '1', nombre: 'Univ. Complutense de Madrid', tipo: 'UNIVERSIDAD', pais: 'España', estado: 'activo', siglas: 'UC', fechaRegistro: '2023-10-14' },
    { id: '2', nombre: 'Tecnológico de Monterrey', tipo: 'UNIVERSIDAD', pais: 'México', estado: 'activo', siglas: 'TEC', fechaRegistro: '2023-10-12' },
    { id: '3', nombre: 'SENATI', tipo: 'INSTITUTO', pais: 'Perú', estado: 'activo', siglas: 'SEN', fechaRegistro: '2023-10-05' },
    { id: '4', nombre: 'Univ. de Buenos Aires', tipo: 'UNIVERSIDAD', pais: 'Argentina', estado: 'activo', siglas: 'UBA', fechaRegistro: '2023-09-28' }
  ],
  carreras: [
    // SENATI
    { id: '1', institucionId: '3', codigo: 'ING-SFW', nombre: 'Ingeniería de Software' },
    { id: '2', institucionId: '3', codigo: 'ADM-NEG', nombre: 'Administración y Negocios' },
    { id: '3', institucionId: '3', codigo: 'DIS-GRF', nombre: 'Diseño Gráfico Digital' },
    { id: '4', institucionId: '3', codigo: 'DER-INT', nombre: 'Derecho Internacional' },
    // Complutense
    { id: '5', institucionId: '1', codigo: 'INF-UC', nombre: 'Ingeniería Informática' },
    { id: '6', institucionId: '1', codigo: 'DER-UC', nombre: 'Derecho' },
    { id: '7', institucionId: '1', codigo: 'MED-UC', nombre: 'Medicina' },
    { id: '8', institucionId: '1', codigo: 'ADM-UC', nombre: 'Administración de Empresas' },
    { id: '9', institucionId: '1', codigo: 'FIL-UC', nombre: 'Filosofía' },
    { id: '10', institucionId: '1', codigo: 'PSI-UC', nombre: 'Psicología' },
    { id: '11', institucionId: '1', codigo: 'ECO-UC', nombre: 'Economía' },
    { id: '12', institucionId: '1', codigo: 'ARQ-UC', nombre: 'Arquitectura' },
    { id: '13', institucionId: '1', codigo: 'COM-UC', nombre: 'Comunicación Social' },
    { id: '14', institucionId: '1', codigo: 'BIO-UC', nombre: 'Biología' },
    { id: '15', institucionId: '1', codigo: 'MAT-UC', nombre: 'Matemáticas' },
    { id: '16', institucionId: '1', codigo: 'QUI-UC', nombre: 'Química' },
    // Monterrey
    { id: '17', institucionId: '2', codigo: 'ING-TEC', nombre: 'Ingeniería de Software' },
    { id: '18', institucionId: '2', codigo: 'NEG-TEC', nombre: 'Administración y Negocios' },
    { id: '19', institucionId: '2', codigo: 'DIG-TEC', nombre: 'Diseño Gráfico Digital' },
    // Buenos Aires
    { id: '20', institucionId: '4', codigo: 'ING-UBA', nombre: 'Ingeniería de Sistemas' },
    { id: '21', institucionId: '4', codigo: 'DER-UBA', nombre: 'Derecho' },
    { id: '22', institucionId: '4', codigo: 'MED-UBA', nombre: 'Medicina' },
    { id: '23', institucionId: '4', codigo: 'ARQ-UBA', nombre: 'Arquitectura' },
    { id: '24', institucionId: '4', codigo: 'ECO-UBA', nombre: 'Economía' },
    { id: '25', institucionId: '4', codigo: 'SOC-UBA', nombre: 'Sociología' },
    { id: '26', institucionId: '4', codigo: 'PSI-UBA', nombre: 'Psicología' },
    { id: '27', institucionId: '4', codigo: 'BIO-UBA', nombre: 'Ciencias Biológicas' }
  ],
  mallas: [
    // SENATI
    { id: '1', carreraId: '1', institucionId: '3', anioCodigo: 'Malla 2024-I', codigoVisible: 'SEN-ISW-24', totalCursos: 42, creditos: 164, fechaRegistro: '2023-10-12', estado: 'ACTIVA' },
    { id: '2', carreraId: '1', institucionId: '3', anioCodigo: 'Malla 2023-II', codigoVisible: 'SEN-ISW-23B', totalCursos: 38, creditos: 150, fechaRegistro: '2023-04-05', estado: 'HISTÓRICA' },
    { id: '3', carreraId: '1', institucionId: '3', anioCodigo: 'Draft - Borrador', codigoVisible: 'TMP-9923', totalCursos: 15, creditos: 60, fechaRegistro: '2024-01-15', estado: 'BORRADOR' },
    { id: '4', carreraId: '2', institucionId: '3', anioCodigo: 'Malla 2024-I', codigoVisible: 'SEN-ADM-24', totalCursos: 48, creditos: 180, fechaRegistro: '2023-10-12', estado: 'ACTIVA' },
    { id: '5', carreraId: '2', institucionId: '3', anioCodigo: 'Malla 2023-I', codigoVisible: 'SEN-ADM-23', totalCursos: 45, creditos: 172, fechaRegistro: '2023-03-10', estado: 'HISTÓRICA' },
    { id: '6', carreraId: '3', institucionId: '3', anioCodigo: 'Malla 2024-I', codigoVisible: 'SEN-DIS-24', totalCursos: 36, creditos: 140, fechaRegistro: '2023-10-12', estado: 'ACTIVA' },
    { id: '7', carreraId: '4', institucionId: '3', anioCodigo: 'Malla 2024-I', codigoVisible: 'SEN-DER-24', totalCursos: 50, creditos: 200, fechaRegistro: '2023-10-12', estado: 'ACTIVA' },
    { id: '8', carreraId: '4', institucionId: '3', anioCodigo: 'Malla 2023-II', codigoVisible: 'SEN-DER-23B', totalCursos: 48, creditos: 195, fechaRegistro: '2023-04-05', estado: 'HISTÓRICA' },
    // Complutense
    { id: '9', carreraId: '5', institucionId: '1', anioCodigo: 'Malla 2024-I', codigoVisible: 'UC-INF-24', totalCursos: 55, creditos: 240, fechaRegistro: '2023-10-14', estado: 'ACTIVA' },
    { id: '10', carreraId: '5', institucionId: '1', anioCodigo: 'Malla 2023-II', codigoVisible: 'UC-INF-23B', totalCursos: 52, creditos: 230, fechaRegistro: '2023-04-10', estado: 'HISTÓRICA' },
    { id: '11', carreraId: '6', institucionId: '1', anioCodigo: 'Malla 2024-I', codigoVisible: 'UC-DER-24', totalCursos: 60, creditos: 260, fechaRegistro: '2023-10-14', estado: 'ACTIVA' },
    { id: '12', carreraId: '7', institucionId: '1', anioCodigo: 'Malla 2024-I', codigoVisible: 'UC-MED-24', totalCursos: 65, creditos: 280, fechaRegistro: '2023-10-14', estado: 'ACTIVA' },
    { id: '13', carreraId: '8', institucionId: '1', anioCodigo: 'Malla 2024-I', codigoVisible: 'UC-ADM-24', totalCursos: 48, creditos: 200, fechaRegistro: '2023-10-14', estado: 'ACTIVA' },
    { id: '14', carreraId: '9', institucionId: '1', anioCodigo: 'Malla 2024-I', codigoVisible: 'UC-FIL-24', totalCursos: 42, creditos: 180, fechaRegistro: '2023-10-14', estado: 'ACTIVA' },
    { id: '15', carreraId: '10', institucionId: '1', anioCodigo: 'Malla 2024-I', codigoVisible: 'UC-PSI-24', totalCursos: 50, creditos: 220, fechaRegistro: '2023-10-14', estado: 'ACTIVA' },
    { id: '16', carreraId: '11', institucionId: '1', anioCodigo: 'Malla 2024-I', codigoVisible: 'UC-ECO-24', totalCursos: 46, creditos: 210, fechaRegistro: '2023-10-14', estado: 'ACTIVA' },
    { id: '17', carreraId: '12', institucionId: '1', anioCodigo: 'Malla 2024-I', codigoVisible: 'UC-ARQ-24', totalCursos: 52, creditos: 230, fechaRegistro: '2023-10-14', estado: 'ACTIVA' },
    { id: '18', carreraId: '13', institucionId: '1', anioCodigo: 'Malla 2024-I', codigoVisible: 'UC-COM-24', totalCursos: 44, creditos: 190, fechaRegistro: '2023-10-14', estado: 'ACTIVA' },
    { id: '19', carreraId: '14', institucionId: '1', anioCodigo: 'Malla 2024-I', codigoVisible: 'UC-BIO-24', totalCursos: 48, creditos: 210, fechaRegistro: '2023-10-14', estado: 'ACTIVA' },
    { id: '20', carreraId: '15', institucionId: '1', anioCodigo: 'Malla 2024-I', codigoVisible: 'UC-MAT-24', totalCursos: 40, creditos: 180, fechaRegistro: '2023-10-14', estado: 'ACTIVA' },
    { id: '21', carreraId: '16', institucionId: '1', anioCodigo: 'Malla 2024-I', codigoVisible: 'UC-QUI-24', totalCursos: 46, creditos: 200, fechaRegistro: '2023-10-14', estado: 'ACTIVA' },
    // Monterrey
    { id: '22', carreraId: '17', institucionId: '2', anioCodigo: 'Malla 2024-I', codigoVisible: 'TEC-ING-24', totalCursos: 52, creditos: 220, fechaRegistro: '2023-10-12', estado: 'ACTIVA' },
    { id: '23', carreraId: '17', institucionId: '2', anioCodigo: 'Malla 2023-II', codigoVisible: 'TEC-ING-23B', totalCursos: 50, creditos: 210, fechaRegistro: '2023-04-08', estado: 'HISTÓRICA' },
    { id: '24', carreraId: '18', institucionId: '2', anioCodigo: 'Malla 2024-I', codigoVisible: 'TEC-NEG-24', totalCursos: 48, creditos: 200, fechaRegistro: '2023-10-12', estado: 'ACTIVA' },
    { id: '25', carreraId: '19', institucionId: '2', anioCodigo: 'Malla 2024-I', codigoVisible: 'TEC-DIG-24', totalCursos: 40, creditos: 180, fechaRegistro: '2023-10-12', estado: 'ACTIVA' },
    // Buenos Aires
    { id: '26', carreraId: '20', institucionId: '4', anioCodigo: 'Malla 2024-I', codigoVisible: 'UBA-ING-24', totalCursos: 54, creditos: 230, fechaRegistro: '2023-09-28', estado: 'ACTIVA' },
    { id: '27', carreraId: '20', institucionId: '4', anioCodigo: 'Malla 2023-II', codigoVisible: 'UBA-ING-23B', totalCursos: 50, creditos: 220, fechaRegistro: '2023-03-15', estado: 'HISTÓRICA' },
    { id: '28', carreraId: '21', institucionId: '4', anioCodigo: 'Malla 2024-I', codigoVisible: 'UBA-DER-24', totalCursos: 58, creditos: 250, fechaRegistro: '2023-09-28', estado: 'ACTIVA' },
    { id: '29', carreraId: '22', institucionId: '4', anioCodigo: 'Malla 2024-I', codigoVisible: 'UBA-MED-24', totalCursos: 62, creditos: 270, fechaRegistro: '2023-09-28', estado: 'ACTIVA' },
    { id: '30', carreraId: '23', institucionId: '4', anioCodigo: 'Malla 2024-I', codigoVisible: 'UBA-ARQ-24', totalCursos: 50, creditos: 220, fechaRegistro: '2023-09-28', estado: 'ACTIVA' },
    { id: '31', carreraId: '24', institucionId: '4', anioCodigo: 'Malla 2024-I', codigoVisible: 'UBA-ECO-24', totalCursos: 44, creditos: 200, fechaRegistro: '2023-09-28', estado: 'ACTIVA' },
    { id: '32', carreraId: '25', institucionId: '4', anioCodigo: 'Malla 2024-I', codigoVisible: 'UBA-SOC-24', totalCursos: 40, creditos: 180, fechaRegistro: '2023-09-28', estado: 'ACTIVA' }
  ],

  /* ============================================================
     CURSOS USIL — Malla interna de referencia
     ============================================================ */
  cursosUsil: [
    {
        "id": "U-1",
        "codigo": "USIL-AD100",
        "nombre": "Administración para los Negocios",
        "creditos": 3,
        "ciclo": 1,
        "facultad": "Negocios",
        "temario": "SILABO Datos del Curso Código: GES51001Curso: ADMINISTRACIÓN PARA LOS NEGOCIOS Área / Programa que Coordina: FAC. CC.EE. ADMINISTRACIONModalidad: Presencial Créditos: 04Horas Lectivas: 64Horas de Aprendizaje Autónomo: 128 Período: 2023-01Fecha de inicio y fin del período: del 20/03/2023 al 08/07/2023 Coordinador del Curso Apellidos y NombresEmailHora de ContactoLugar de Contacto ARAUJO URRUNAGA, SANDRA GABRIELA Docentes del Curso Puede consultar los horarios de cada docente dentro de su INFOSIL, en el menú Desarrollo de Clases, opción Profesores. Sumilla Administración para los Negocios es un curso específico, es de naturaleza teórico, contribuye al desarrollo de la competencia general de gestión de recursos mediante la elaboración de un plan de negocios. Comprende el desarrollo de los siguientes ejes temáticos: Conceptos fundamentales de negocio, el proceso administrativo, la estructuración de un plan de negocio y su vinculación con las diferentes áreas de una organización. El producto acreditable de la asignatura es el plan de negocio. Competencias Profesionales y/o Generales Carrera / Programa Código / DenominaciónNivel de la competenciaAprendizaje esperado Todas las carreras CG Recursos Humanos N1 Reconoce la teoría de gestión y sus componentes de manera aplicada para comprender la lógica empresarial Comprende la importancia de la gestión empresarial para el éxito de las organizaciones, mediante el análisis de estudios de casos y ejemplos reales de la aplicación de la teo"
    },
    {
        "id": "U-2",
        "codigo": "USIL-MAT102",
        "nombre": "Cálculo de una Variable",
        "creditos": 4,
        "ciclo": 2,
        "facultad": "Ingeniería",
        "temario": "SILABO Datos del Curso Código: MAC41017Curso: CÁLCULO DE UNA VARIABLE Área / Programa que Coordina: DIRECCION DE ESTUDIOS GENERALESModalidad: Presencial Créditos: 04Horas Lectivas: 96Horas de Aprendizaje Autónomo: 128 Período: 2023-02Fecha de inicio y fin del período: del 14/08/2023 al 11/12/2023 Coordinador del Curso Apellidos y NombresEmailHora de ContactoLugar de Contacto RIVERO FORTON, YENNY Lunes 3:00 p. m. Facultad de Ingeniería Docentes del Curso Puede consultar los horarios de cada docente dentro de su INFOSIL, en el menú Desarrollo de Clases, opción Profesores. Sumilla Cálculo de una variable es un curso que pertenece al área de formación especializada y es de carácter teórico–práctico. Tiene como propósito contribuir en el desarrollo de la competencia profesional de análisis y resolución de problemas en relación con el abordaje de problemas complejos con base en el razonamiento lógico, la comunicación matemática, la matematización, representación, aplicación de estrategias, desarrollo de cálculos y el uso pertinente de software especializado. Comprende temas relacionados con el concepto de límites, cálculo diferencial, cálculo integral y sus aplicaciones en la ciencia e ingeniería. El producto del curso consiste en la elaboración de un e-portafolio con problemas resueltos y contextualizados en el campo de la ingeniería. Competencias Profesionales y/o Generales Carrera/Programa Código/Denominación de la Competencia Nivel de la competenciaAprendizajes Esperados -INGEN"
    },
    {
        "id": "U-3",
        "codigo": "USIL-CS101",
        "nombre": "Fundamentos de Programación",
        "creditos": 4,
        "ciclo": 1,
        "facultad": "Ingeniería",
        "temario": "SILABO Datos del Curso Código: SFW52042Curso: FUNDAMENTOS DE PROGRAMACIÓN Área / Programa que Coordina: FAC. INGENIERÍA: ING. INFORMATICAModalidad: Presencial Créditos: 03Horas Lectivas: 80Horas de Aprendizaje Autónomo: 96 Período: 2023-01Fecha de inicio y fin del período: del 20/03/2023 al 08/07/2023 Coordinador del Curso Apellidos y NombresEmailHora de ContactoLugar de Contacto SUERE ROJAS, LIZBETH KATTIA Lunes a Viernes de 2:00pm a 6:00pm Campus 1 Pab. C Docentes del Curso Puede consultar los horarios de cada docente dentro de su INFOSIL, en el menú Desarrollo de Clases, opción Profesores. Sumilla Fundamentos de Programación, es un curso que pertenece al área formativa de estudios de especialidad, tiene carácter teórico-práctico, contribuye al desarrollo de la competencia de Conocimiento de Sistemas de información, evalúa sistemas de información dentro de un entorno de gestión de negocios, de sectores de producción o de investigación científica mediante el desarrollo de soluciones basadas en principios de programación. El curso familiariza a los estudiantes con el diseño de algoritmos y la programación estructurada. Comprende: conceptos básicos de programación, estructuras de control secuencial, condicional, repetitiva; funciones, arreglos, recursividad. El producto del curso consiste en la elaboración de un Informe donde plasme la solución de un problema basado en estructuras de control y datos. Competencias Profesionales y/o Generales Carrera/Programa Sigla/ Denominación"
    },
    {
        "id": "U-4",
        "codigo": "USIL-CS100",
        "nombre": "Fundamentos en Competencias Digitales",
        "creditos": 3,
        "ciclo": 1,
        "facultad": "Ingeniería",
        "temario": "SILABO Datos del Curso Código: IIS52043Curso: FUNDAMENTOS EN COMPETENCIAS DIGITALES Área / Programa que Coordina: FAC. ARTES Y HUMANIDADESModalidad: A distancia Créditos: 03Horas Lectivas: 80Horas de Aprendizaje Autónomo: 96 Período: 2023-01Fecha de inicio y fin del período: del 20/03/2023 al 08/07/2023 Coordinador del Curso Apellidos y NombresEmailHora de ContactoLugar de Contacto SUERE ROJAS, LIZBETH KATTIA Lunes a Viernes de 2:00pm a 6:00pm Campus 1 Pab. C Docentes del Curso Puede consultar los horarios de cada docente dentro de su INFOSIL, en el menú Desarrollo de Clases, opción Profesores. Sumilla Fundamentos en Competencias Digitales es un curso que pertenece al área formativa de estudios generales, tiene carácter teórico-práctico, contribuye al desarrollo de la competencia digital mediante la integración de las tecnologías de información y comunicación en el desarrollo de sus actividades preparándolo para desenvolverse en una sociedad digital, valorando el impacto de su uso en el aspecto personal y académico de su especialidad. Comprende de forma transversal los fundamentos de la computación y las TIC con el fin de gestionar información y su alfabetización digital, comunicarse y colaborar usando medios digitales, creando contenidos multimedia, preparándose para hacer uso de las redes con seguridad y solucionando problemas de su especialidad. El producto acreditable del curso es la generación de soluciones en su especialidad aplicando habilidades digitales desarrolladas"
    },
    {
        "id": "U-5",
        "codigo": "USIL-COM101",
        "nombre": "Lenguaje y Comunicación I",
        "creditos": 3,
        "ciclo": 1,
        "facultad": "Humanidades",
        "temario": "SILABO Datos del Curso Código: COM42028Curso: LENGUAJE Y COMUNICACIÓN I Área / Programa que Coordina: FAC. ARTES Y HUMANIDADESModalidad: Presencial Créditos: 04Horas Lectivas: 96Horas de Aprendizaje Autónomo: 128 Período: 2023-01Fecha de inicio y fin del período: del 20/03/2023 al 08/07/2023 Coordinador del Curso Apellidos y NombresEmailHora de ContactoLugar de Contacto SANCHEZ CHAVEZ DE SILVA, NORMA Lunes a viernes de 8:00 a.m. a 4:00 p.m. Campus Fernando Belaúnde, pabellón B, primer piso. Docentes del Curso Puede consultar los horarios de cada docente dentro de su INFOSIL, en el menú Desarrollo de Clases, opción Profesores. Sumilla Lenguaje y Comunicación I es una asignatura del área de formación de estudios generales. Su naturaleza es teórica-práctica. Brinda las bases para el logro de la competencia Comunicación Integral, potenciando habilidades como el análisis, redacción y presentación de un texto académico con una actitud crítica frente a la sociedad y su entorno. Comprende los ejes temáticos de análisis de texto, texto argumentativo y expresión oral. El producto acreditable de la asignatura es un proyecto final y su sustentación. Competencias Profesionales y/o Generales Carrera/Programa Código/Denominación de la Competencia Nivel de la competenciaAprendizajes Esperados Todas las carreras GC Comunicación Integral N1. Elabora textos académicos escritos y comunicaciones orales con una estructura coherente para exponer con eficiencia sus ideas en un entorno académico y/o "
    },
    {
        "id": "U-6",
        "codigo": "USIL-COM102",
        "nombre": "Lenguaje y Comunicación II",
        "creditos": 3,
        "ciclo": 2,
        "facultad": "Humanidades",
        "temario": "SILABO Datos del Curso Código: COM42025Curso: LENGUAJE Y COMUNICACIÓN II Área / Programa que Coordina: FAC. ARTES Y HUMANIDADESModalidad: A distancia Créditos: 04Horas Lectivas: 96Horas de Aprendizaje Autónomo: 128 Período: 2023-02Fecha de inicio y fin del período: del 14/08/2023 al 11/12/2023 Coordinador del Curso Apellidos y NombresEmailHora de ContactoLugar de Contacto SANCHEZ CHAVEZ DE SILVA, NORMA Lunes a viernes de 9:00 a.m. a 5:00 p.m. Campus 1, pabellón B, primer piso Docentes del Curso Puede consultar los horarios de cada docente dentro de su INFOSIL, en el menú Desarrollo de Clases, opción Profesores. Sumilla Lenguaje y Comunicación II es una asignatura del área de formación estudios generales. Su naturaleza es teórica-práctica. Brinda las bases para el logro de la competencia Comunicación Integral, a través de la comprensión y producción de textos escritos y orales acerca de temas polémicos de actualidad y producción cultural con una actitud crítica frente a la sociedad y su entorno. Comprende los ejes temáticos de organización de la información, la argumentación, análisis de la producción cultural y la expresión oral. El producto acreditable de la asignatura es un proyecto final y su sustentación. Competencias Profesionales y/o Generales Carrera/Programa Sigla/ Denominación de la competencia Nivel de la competenciaAprendizajes esperados Todas las carrerasGC Comunicación Integral N1. Elabora textos académicos escritos y comunicaciones orales con una estructura cohe"
    },
    {
        "id": "U-7",
        "codigo": "USIL-MAT100",
        "nombre": "Matemática",
        "creditos": 4,
        "ciclo": 1,
        "facultad": "Ingeniería",
        "temario": "SILABO Datos del Curso Código: MAT42031Curso: MATEMÁTICA Área / Programa que Coordina: DIRECCION DE ESTUDIOS GENERALESModalidad: Presencial Créditos: 04Horas Lectivas: 96Horas de Aprendizaje Autónomo: 128 Período: 2023-01Fecha de inicio y fin del período: del 20/03/2023 al 08/07/2023 Coordinador del Curso Apellidos y NombresEmailHora de ContactoLugar de Contacto CHUQUISENGO CARRASCO, EDISON Lunes a viernes de 7:00 a 16 horas Oficina Facultad de Ciencias Empresariales Docentes del Curso Puede consultar los horarios de cada docente dentro de su INFOSIL, en el menú Desarrollo de Clases, opción Profesores. Sumilla Matemática, es un curso que pertenece al área formativa de estudios generales, tiene carácter teórico-práctico, contribuye al desarrollo de la competencia digital mediante la aplicación del pensamiento matemático para resuelve problemas contextualizados con base en el razonamiento lógico, la comunicación matemática, la matematización, representación, aplicación de estrategias, desarrollo de cálculos y el uso pertinente de software especializado. El curso comprende el desarrollo de los siguientes ejes temáticos: Lógica, ecuaciones e inecuaciones, matrices, funciones reales de variable real, límites y derivadas. El producto del curso consiste en la elaboración de un e-portafolio con problemas contextualizados resueltos. Competencias Profesionales y/o Generales Carrera/ProgramaCódigo/DenominaciónNivel de la competencia Aprendizaje esperado Todas las carreras CG 6 Digital N"
    },
    {
        "id": "U-8",
        "codigo": "USIL-MAT201",
        "nombre": "Matemática Discreta",
        "creditos": 4,
        "ciclo": 2,
        "facultad": "Ingeniería",
        "temario": "SILABO Datos del Curso Código: SFW52045Curso: MATEMÁTICA DISCRETA Área / Programa que Coordina: FAC. INGENIERÍA ING. MECATRÓNICAModalidad: Presencial Créditos: 02Horas Lectivas: 64Horas de Aprendizaje Autónomo: 64 Período: 2023-02Fecha de inicio y fin del período: del 14/08/2023 al 11/12/2023 Coordinador del Curso Apellidos y NombresEmailHora de ContactoLugar de Contacto SUERE ROJAS, LIZBETH KATTIA Lunes a viernes de 2:00 a 6:00 pm Pabellón C, 3er piso Docentes del Curso Puede consultar los horarios de cada docente dentro de su INFOSIL, en el menú Desarrollo de Clases, opción Profesores. Sumilla Matemática Discreta, es un curso que pertenece al área formativa de estudios de especialidad, tiene carácter práctico, contribuye al desarrollo de la competencia trabajo en equipo y digital mediante la aplicación del pensamiento computacional en el desarrollo de soluciones a situaciones problemáticas de la especialidad, proporcionar los fundamentos teóricos necesarios para la computación, estos fundamentos no sólo son útiles para desarrollar la computación desde un punto de vista teórico, son útiles para la práctica de la informática, en particular en aplicaciones tales como verificación, criptografía, métodos formales, entre otros. El curso comprende el desarrollo de los siguientes ejes temáticos: conjuntos, funciones y relaciones, lógica básica, técnicas de demostración, representación de datos. El producto acreditable del curso es un informe de un caso, respecto a la aplicación de "
    },
    {
        "id": "U-9",
        "codigo": "USIL-CS201",
        "nombre": "Programación Orientada a Objetos I",
        "creditos": 4,
        "ciclo": 2,
        "facultad": "Ingeniería",
        "temario": "SILABO Datos del Curso Código: SFW52022Curso: PROGRAMACIÓN ORIENTADA A OBJETOS I Área / Programa que Coordina: FAC. INGENIERÍA: ING. INFORMATICAModalidad: Presencial Créditos: 04Horas Lectivas: 96Horas de Aprendizaje Autónomo: 128 Período: 2023-02Fecha de inicio y fin del período: del 14/08/2023 al 11/12/2023 Coordinador del Curso Apellidos y NombresEmailHora de ContactoLugar de Contacto SUERE ROJAS, LIZBETH KATTIA Lunes a viernes de 2:00 a 6:00 pm Pabellón C, 3er piso Docentes del Curso Puede consultar los horarios de cada docente dentro de su INFOSIL, en el menú Desarrollo de Clases, opción Profesores. Sumilla Programación orientada a objetos I, es un curso que pertenece al área formativa de estudios de especialidad, tiene carácter teórico-práctico, contribuye al desarrollo de las competencias desarrollo de soluciones, uso de herramientas digitales modernas en ingeniería, análisis de datos para la toma de decisiones, experimentación y diseño en Ingeniería, trabajo en equipo multidisciplinario en ingeniería mediante la aplicación de sus conocimientos en el desarrollo de soluciones a situaciones problemáticas de la especialidad aplicando el paradigma de programación orientada a objetos. El curso comprende el desarrollo de los siguientes ejes temáticos: introducción a la programación orientada a objetos, pilares de la programación orientada a objetos, implementación de interfaces gráficas usando programación orientada a objetos. El producto acreditable del curso es la presenta"
    },
    {
        "id": "U-10",
        "codigo": "USIL-HUM201",
        "nombre": "Realidad Nacional y Globalización",
        "creditos": 3,
        "ciclo": 2,
        "facultad": "Humanidades",
        "temario": "SILABO Datos del Curso Código: GLB41005Curso: REALIDAD NACIONAL Y GLOBALIZACIÓN Área / Programa que Coordina: FAC. ARTES Y HUMANIDADESModalidad: Presencial Créditos: 03Horas Lectivas: 64Horas de Aprendizaje Autónomo: 96 Período: 2023-02Fecha de inicio y fin del período: del 14/08/2023 al 11/12/2023 Coordinador del Curso Apellidos y NombresEmailHora de ContactoLugar de Contacto QUINTANA DEL AGUILA, KAREN PAMELA 8:00 am. - 6:00 pm. Pabellón D tercer piso Campus 1 Docentes del Curso Puede consultar los horarios de cada docente dentro de su INFOSIL, en el menú Desarrollo de Clases, opción Profesores. Sumilla Realidad Nacional y Globalización, es un curso que pertenece al área formativa de estudios generales, tiene carácter teórico-práctico, contribuye al desarrollo de la competencia desarrollo humano y sostenible mediante la elaboración de informes, analizando las potencialidades de nuestro país y las principales tendencias del mundo actual, con el marco teórico de las ciencias sociales, las nuevas tecnologías de la información y la comunicación, investigando información actualizada que le permita interpretar críticamente nuestro país megadiverso, plurilingüe y multicultural en el entorno mundial posmoderno. El curso comprende el desarrollo de los siguientes ejes temáticos: la ecología, economía y cultura del Perú, y el impacto de la globalización en estos tres campos. El producto acreditable del curso es la elaboración de un informe del desarrollo de un proyecto final referido a"
    }
,
    // Ingeniería — Ciclo 1-2 (Generales)
    { id: 'U01', codigo: 'USIL-MAT101', nombre: 'Matemática Básica', creditos: 4, ciclo: 1, facultad: 'Ingeniería' },
    { id: 'U02', codigo: 'USIL-FIS101', nombre: 'Física General', creditos: 4, ciclo: 1, facultad: 'Ingeniería' },
    { id: 'U03', codigo: 'USIL-COM101', nombre: 'Comunicación Efectiva', creditos: 3, ciclo: 1, facultad: 'Humanidades' },
    { id: 'U04', codigo: 'USIL-ALG101', nombre: 'Álgebra Lineal', creditos: 4, ciclo: 2, facultad: 'Ingeniería' },
    { id: 'U05', codigo: 'USIL-EST101', nombre: 'Estadística Aplicada', creditos: 3, ciclo: 2, facultad: 'Ingeniería' },
    // Ingeniería — Ciclo 3-4 (Carrera)
    { id: 'U06', codigo: 'USIL-CS201', nombre: 'Desarrollo de Software I', creditos: 5, ciclo: 3, facultad: 'Ingeniería' },
    { id: 'U07', codigo: 'USIL-CS202', nombre: 'Estructura de Datos', creditos: 5, ciclo: 3, facultad: 'Ingeniería' },
    { id: 'U08', codigo: 'USIL-CS203', nombre: 'Base de Datos I', creditos: 4, ciclo: 3, facultad: 'Ingeniería' },
    { id: 'U09', codigo: 'USIL-CS301', nombre: 'Desarrollo de Software II', creditos: 5, ciclo: 4, facultad: 'Ingeniería' },
    { id: 'U10', codigo: 'USIL-CS302', nombre: 'Redes y Comunicaciones', creditos: 4, ciclo: 4, facultad: 'Ingeniería' },
    { id: 'U11', codigo: 'USIL-CS303', nombre: 'Ingeniería de Software', creditos: 5, ciclo: 5, facultad: 'Ingeniería' },
    { id: 'U12', codigo: 'USIL-CS304', nombre: 'Inteligencia Artificial', creditos: 4, ciclo: 5, facultad: 'Ingeniería' },
    { id: 'U13', codigo: 'USIL-CS305', nombre: 'Sistemas Operativos', creditos: 4, ciclo: 4, facultad: 'Ingeniería' },
    // Administración
    { id: 'U14', codigo: 'USIL-AD101', nombre: 'Introducción a la Administración', creditos: 3, ciclo: 1, facultad: 'Negocios' },
    { id: 'U15', codigo: 'USIL-AD201', nombre: 'Contabilidad General', creditos: 4, ciclo: 2, facultad: 'Negocios' },
    { id: 'U16', codigo: 'USIL-AD202', nombre: 'Marketing Estratégico', creditos: 3, ciclo: 3, facultad: 'Negocios' },
    { id: 'U17', codigo: 'USIL-AD301', nombre: 'Gestión Financiera', creditos: 4, ciclo: 4, facultad: 'Negocios' },
    { id: 'U18', codigo: 'USIL-AD302', nombre: 'Gestión de Recursos Humanos', creditos: 3, ciclo: 4, facultad: 'Negocios' },
    // Derecho
    { id: 'U19', codigo: 'USIL-DE101', nombre: 'Introducción al Derecho', creditos: 4, ciclo: 1, facultad: 'Derecho' },
    { id: 'U20', codigo: 'USIL-DE201', nombre: 'Derecho Civil I', creditos: 5, ciclo: 2, facultad: 'Derecho' },
    { id: 'U21', codigo: 'USIL-DE202', nombre: 'Derecho Constitucional', creditos: 4, ciclo: 3, facultad: 'Derecho' },
    { id: 'U22', codigo: 'USIL-DE301', nombre: 'Derecho Penal I', creditos: 5, ciclo: 4, facultad: 'Derecho' },
    // Generales
    { id: 'U23', codigo: 'USIL-GE101', nombre: 'Metodología de la Investigación', creditos: 3, ciclo: 2, facultad: 'Humanidades' },
    { id: 'U24', codigo: 'USIL-GE102', nombre: 'Ética Profesional', creditos: 2, ciclo: 3, facultad: 'Humanidades' },
    { id: 'U25', codigo: 'USIL-GE103', nombre: 'Inglés I', creditos: 3, ciclo: 1, facultad: 'Humanidades' }
  ],

  /* ============================================================
     CURSOS EXTERNOS — de las mallas de instituciones externas
     ============================================================ */
  cursosExternos: [
    // SENATI — ING-SFW (mallaId: 1)
    { id: 'E01', mallaId: '1', institucionId: '3', carreraId: '1', codigo: 'SEN-MAT100', nombre: 'Matemática para Ingeniería', creditos: 5, ciclo: 1 },
    { id: 'E02', mallaId: '1', institucionId: '3', carreraId: '1', codigo: 'SEN-FIS100', nombre: 'Física Aplicada', creditos: 4, ciclo: 1 },
    { id: 'E03', mallaId: '1', institucionId: '3', carreraId: '1', codigo: 'SEN-POO301', nombre: 'Programación Orientada a Objetos', creditos: 6, ciclo: 3 },
    { id: 'E04', mallaId: '1', institucionId: '3', carreraId: '1', codigo: 'SEN-EDD201', nombre: 'Estructuras de Datos y Algoritmos', creditos: 5, ciclo: 3 },
    { id: 'E05', mallaId: '1', institucionId: '3', carreraId: '1', codigo: 'SEN-BDD301', nombre: 'Bases de Datos Relacionales', creditos: 5, ciclo: 4 },
    { id: 'E06', mallaId: '1', institucionId: '3', carreraId: '1', codigo: 'SEN-RED401', nombre: 'Redes de Computadoras', creditos: 4, ciclo: 4 },
    { id: 'E07', mallaId: '1', institucionId: '3', carreraId: '1', codigo: 'SEN-ISW501', nombre: 'Ingeniería del Software', creditos: 5, ciclo: 5 },
    { id: 'E08', mallaId: '1', institucionId: '3', carreraId: '1', codigo: 'SEN-IA501', nombre: 'Inteligencia Artificial Aplicada', creditos: 4, ciclo: 5 },
    { id: 'E09', mallaId: '1', institucionId: '3', carreraId: '1', codigo: 'SEN-EST201', nombre: 'Estadística para Ingeniería', creditos: 4, ciclo: 2 },
    { id: 'E10', mallaId: '1', institucionId: '3', carreraId: '1', codigo: 'SEN-COM100', nombre: 'Comunicación y Redacción', creditos: 3, ciclo: 1 },
    // TEC Monterrey — ING-TEC (mallaId: 22)
    { id: 'E11', mallaId: '22', institucionId: '2', carreraId: '17', codigo: 'TEC-TC1028', nombre: 'Programación Avanzada', creditos: 5, ciclo: 3 },
    { id: 'E12', mallaId: '22', institucionId: '2', carreraId: '17', codigo: 'TEC-TC1031', nombre: 'Estructura de Datos', creditos: 5, ciclo: 3 },
    { id: 'E13', mallaId: '22', institucionId: '2', carreraId: '17', codigo: 'TEC-TC2005', nombre: 'Base de Datos Avanzadas', creditos: 5, ciclo: 4 },
    { id: 'E14', mallaId: '22', institucionId: '2', carreraId: '17', codigo: 'TEC-MA1001', nombre: 'Cálculo Diferencial', creditos: 5, ciclo: 1 },
    { id: 'E15', mallaId: '22', institucionId: '2', carreraId: '17', codigo: 'TEC-FI1001', nombre: 'Física I', creditos: 4, ciclo: 1 },
    // UBA — ING-UBA (mallaId: 26)
    { id: 'E16', mallaId: '26', institucionId: '4', carreraId: '20', codigo: 'UBA-7500', nombre: 'Análisis Matemático I', creditos: 6, ciclo: 1 },
    { id: 'E17', mallaId: '26', institucionId: '4', carreraId: '20', codigo: 'UBA-7501', nombre: 'Álgebra y Geometría', creditos: 5, ciclo: 1 },
    { id: 'E18', mallaId: '26', institucionId: '4', carreraId: '20', codigo: 'UBA-7541', nombre: 'Paradigmas de Programación', creditos: 6, ciclo: 3 },
    // UC — INF-UC (mallaId: 9)
    { id: 'E19', mallaId: '9', institucionId: '1', carreraId: '5', codigo: 'UC-INFO101', nombre: 'Fundamentos de Programación', creditos: 6, ciclo: 1 },
    { id: 'E20', mallaId: '9', institucionId: '1', carreraId: '5', codigo: 'UC-MAT201', nombre: 'Matemática Discreta', creditos: 6, ciclo: 2 }
  ],

  /* ============================================================
     EQUIVALENCIAS — Mapeo Curso Externo → Curso USIL
     ============================================================ */
  equivalencias: [
    // SENATI → USIL (Aprobadas)
    { id: 'EQ01', cursoExternoId: 'E01', cursoUsilId: 'U01', institucionId: '3', carreraExternaId: '1', estado: 'APROBADA', porcentajeSimilitud: 92, observaciones: 'Contenidos altamente compatibles. Diferencia menor en créditos compensada por horas prácticas.', creadoPor: 'Dr. Alberto Ruiz', fechaRegistro: '2023-11-05', fechaAprobacion: '2023-11-10' },
    { id: 'EQ02', cursoExternoId: 'E02', cursoUsilId: 'U02', institucionId: '3', carreraExternaId: '1', estado: 'APROBADA', porcentajeSimilitud: 88, observaciones: 'Sílabos coinciden en un 88%. Lab práctico equivalente.', creadoPor: 'Dr. Alberto Ruiz', fechaRegistro: '2023-11-05', fechaAprobacion: '2023-11-12' },
    { id: 'EQ03', cursoExternoId: 'E03', cursoUsilId: 'U06', institucionId: '3', carreraExternaId: '1', estado: 'APROBADA', porcentajeSimilitud: 85, observaciones: 'POO cubre los temas de Desarrollo de Software I. Créditos superiores.', creadoPor: 'Dra. María López', fechaRegistro: '2023-11-08', fechaAprobacion: '2023-11-15' },
    { id: 'EQ04', cursoExternoId: 'E04', cursoUsilId: 'U07', institucionId: '3', carreraExternaId: '1', estado: 'APROBADA', porcentajeSimilitud: 95, observaciones: 'Contenido prácticamente idéntico.', creadoPor: 'Dra. María López', fechaRegistro: '2023-11-08', fechaAprobacion: '2023-11-15' },
    { id: 'EQ05', cursoExternoId: 'E05', cursoUsilId: 'U08', institucionId: '3', carreraExternaId: '1', estado: 'APROBADA', porcentajeSimilitud: 90, observaciones: 'Equivalencia directa en bases de datos.', creadoPor: 'Dr. Alberto Ruiz', fechaRegistro: '2023-11-10', fechaAprobacion: '2023-11-18' },
    // SENATI → USIL (Pendientes)
    { id: 'EQ06', cursoExternoId: 'E06', cursoUsilId: 'U10', institucionId: '3', carreraExternaId: '1', estado: 'PENDIENTE', porcentajeSimilitud: 78, observaciones: 'Requiere revisión de laboratorios prácticos.', creadoPor: 'Dr. Alberto Ruiz', fechaRegistro: '2023-12-01', fechaAprobacion: null },
    { id: 'EQ07', cursoExternoId: 'E07', cursoUsilId: 'U11', institucionId: '3', carreraExternaId: '1', estado: 'PENDIENTE', porcentajeSimilitud: 82, observaciones: 'Pendiente de revisión por comité académico.', creadoPor: 'Dra. María López', fechaRegistro: '2023-12-05', fechaAprobacion: null },
    // SENATI → USIL (Rechazada)
    { id: 'EQ08', cursoExternoId: 'E10', cursoUsilId: 'U03', institucionId: '3', carreraExternaId: '1', estado: 'RECHAZADA', porcentajeSimilitud: 45, observaciones: 'Sílabos no son compatibles. El enfoque del curso es muy diferente.', creadoPor: 'Dr. Alberto Ruiz', fechaRegistro: '2023-11-20', fechaAprobacion: null },
    // TEC → USIL
    { id: 'EQ09', cursoExternoId: 'E11', cursoUsilId: 'U09', institucionId: '2', carreraExternaId: '17', estado: 'APROBADA', porcentajeSimilitud: 87, observaciones: 'Programación Avanzada del TEC equivale a Desarrollo de Software II.', creadoPor: 'Dra. María López', fechaRegistro: '2023-12-10', fechaAprobacion: '2023-12-15' },
    { id: 'EQ10', cursoExternoId: 'E12', cursoUsilId: 'U07', institucionId: '2', carreraExternaId: '17', estado: 'APROBADA', porcentajeSimilitud: 93, observaciones: 'Estructura de Datos del TEC es equivalente.', creadoPor: 'Dra. María López', fechaRegistro: '2023-12-10', fechaAprobacion: '2023-12-16' },
    { id: 'EQ11', cursoExternoId: 'E14', cursoUsilId: 'U01', institucionId: '2', carreraExternaId: '17', estado: 'PENDIENTE', porcentajeSimilitud: 75, observaciones: 'Cálculo Diferencial cubre parcialmente Matemática Básica. En revisión.', creadoPor: 'Dr. Alberto Ruiz', fechaRegistro: '2024-01-05', fechaAprobacion: null },
    // UBA → USIL
    { id: 'EQ12', cursoExternoId: 'E16', cursoUsilId: 'U01', institucionId: '4', carreraExternaId: '20', estado: 'APROBADA', porcentajeSimilitud: 80, observaciones: 'Análisis Matemático I es más profundo que Matemática Básica.', creadoPor: 'Dr. Alberto Ruiz', fechaRegistro: '2024-01-10', fechaAprobacion: '2024-01-15' },
    { id: 'EQ13', cursoExternoId: 'E17', cursoUsilId: 'U04', institucionId: '4', carreraExternaId: '20', estado: 'APROBADA', porcentajeSimilitud: 88, observaciones: 'Álgebra y Geometría cubre Álgebra Lineal.', creadoPor: 'Dr. Alberto Ruiz', fechaRegistro: '2024-01-10', fechaAprobacion: '2024-01-16' },
    { id: 'EQ14', cursoExternoId: 'E18', cursoUsilId: 'U06', institucionId: '4', carreraExternaId: '20', estado: 'PENDIENTE', porcentajeSimilitud: 72, observaciones: 'Paradigmas de Programación tiene un enfoque diferente. Requiere análisis.', creadoPor: 'Dra. María López', fechaRegistro: '2024-02-01', fechaAprobacion: null }
  ],

  /* ============================================================
     SIMULACIONES — Pre-convalidaciones generadas por el Coordinador
     ============================================================ */
  simulaciones: [
    {
      id: 'SIM-001',
      solicitudAdmisionId: 'SOL-1718912000000',
      cicloPostulacion: '2024-I',
      coordinadorId: 'U-002',
      coordinadorNombre: 'María López',
      alumno: { nombres: 'Ana María', apellidos: 'López Ruiz', dni: '71234567', correo: 'ana.lopez@gmail.com' },
      carreraUsil: 'INGENIERÍA DE SISTEMAS DE INFORMACIÓN',
      facultadUsil: 'Facultad de Ingeniería e Inteligencia Artificial',
      mallaUsilId: 'm-usil-1',
      institucionOrigenId: '3',
      institucionOrigenNombre: 'SENATI',
      equivalenciasIds: ['EQ01', 'EQ02', 'EQ03', 'EQ04', 'EQ05'],
      creditosConvalidados: 23,
      creditosTotalesMalla: 160,
      cursosConvalidados: 5,
      cursosSinEquivalencia: 2,
      cursosTotalesOrigen: 10,
      estado: 'GENERADA',
      fechaCreacion: '2024-01-15T10:00:00.000Z',
      fechaEnvio: null,
      observacionesCoordinador: 'Expediente revisado. 5 equivalencias aprobadas con alta similitud de contenido.'
    },
    {
      id: 'SIM-002',
      solicitudAdmisionId: 'SOL-1718912000001',
      cicloPostulacion: '2024-II',
      coordinadorId: 'U-003',
      coordinadorNombre: 'Jorge Díaz',
      alumno: { nombres: 'Carlos', apellidos: 'Mendoza', dni: '78889999', correo: 'cmendoza@hotmail.com' },
      carreraUsil: 'Administración',
      facultadUsil: 'Facultad de Ciencias Empresariales',
      mallaUsilId: 'm-usil-2',
      institucionOrigenId: '2',
      institucionOrigenNombre: 'Tecnológico de Monterrey',
      equivalenciasIds: ['EQ09', 'EQ10', 'EQ11'],
      creditosConvalidados: 10,
      creditosTotalesMalla: 180,
      cursosConvalidados: 2,
      cursosSinEquivalencia: 1,
      cursosTotalesOrigen: 5,
      estado: 'ENVIADA_ALUMNO',
      fechaCreacion: '2024-03-08T11:00:00.000Z',
      fechaEnvio: '2024-03-10T09:00:00.000Z',
      observacionesCoordinador: '2 equivalencias aprobadas. Cálculo Diferencial queda pendiente de revisión.'
    },
    {
      id: 'SIM-003',
      solicitudAdmisionId: 'SOL-1718912000000',
      cicloPostulacion: '2024-II',
      coordinadorId: 'U-002',
      coordinadorNombre: 'María López',
      alumno: { nombres: 'Ana María', apellidos: 'López Ruiz', dni: '71234567', correo: 'ana.lopez@gmail.com' },
      carreraUsil: 'INGENIERÍA DE SISTEMAS DE INFORMACIÓN',
      facultadUsil: 'Facultad de Ingeniería e Inteligencia Artificial',
      mallaUsilId: 'm-usil-1',
      institucionOrigenId: '3',
      institucionOrigenNombre: 'SENATI',
      equivalenciasIds: ['EQ06', 'EQ07'],
      creditosConvalidados: 9,
      creditosTotalesMalla: 160,
      cursosConvalidados: 2,
      cursosSinEquivalencia: 0,
      cursosTotalesOrigen: 4,
      estado: 'BORRADOR',
      fechaCreacion: '2024-05-20T15:30:00.000Z',
      fechaEnvio: null,
      observacionesCoordinador: ''
    }
  ],

  /* ============================================================
     CONVALIDACIONES — Actos administrativos oficiales de convalidación
     Estado: PENDIENTE_FIRMA → FIRMADA → MEMORANDUM_EMITIDO → ARCHIVADA
     ============================================================ */
  convalidaciones: [
    {
      id: 'CONV-001',
      simulacionId: 'SIM-001',
      solicitudAdmisionId: 'SOL-1718912000000',
      cicloPostulacion: '2024-I',
      coordinadorId: 'U-002',
      coordinadorNombre: 'María López',
      coordinadorCargo: 'Coordinadora Académica',
      alumno: { nombres: 'Ana María', apellidos: 'López Ruiz', dni: '71234567', correo: 'ana.lopez@gmail.com' },
      carreraUsil: 'INGENIERÍA DE SISTEMAS DE INFORMACIÓN',
      facultadUsil: 'Facultad de Ingeniería e Inteligencia Artificial',
      mallaUsilId: 'm-usil-1',
      institucionOrigenId: '3',
      institucionOrigenNombre: 'SENATI',
      equivalenciasSnapshot: [
        { id: 'EQ01', cursoExtNombre: 'Matemática para Ingeniería', cursoExtCodigo: 'SEN-MAT100', cursoExtCreditos: 5, cursoUsilNombre: 'Matemática Básica', cursoUsilCodigo: 'USIL-MAT101', cursoUsilCreditos: 4, porcentajeSimilitud: 92, estado: 'APROBADA' },
        { id: 'EQ02', cursoExtNombre: 'Física Aplicada', cursoExtCodigo: 'SEN-FIS100', cursoExtCreditos: 4, cursoUsilNombre: 'Física General', cursoUsilCodigo: 'USIL-FIS101', cursoUsilCreditos: 4, porcentajeSimilitud: 88, estado: 'APROBADA' },
        { id: 'EQ03', cursoExtNombre: 'Programación Orientada a Objetos', cursoExtCodigo: 'SEN-POO301', cursoExtCreditos: 6, cursoUsilNombre: 'Desarrollo de Software I', cursoUsilCodigo: 'USIL-CS201', cursoUsilCreditos: 5, porcentajeSimilitud: 85, estado: 'APROBADA' },
        { id: 'EQ04', cursoExtNombre: 'Estructuras de Datos y Algoritmos', cursoExtCodigo: 'SEN-EDD201', cursoExtCreditos: 5, cursoUsilNombre: 'Estructura de Datos', cursoUsilCodigo: 'USIL-CS202', cursoUsilCreditos: 5, porcentajeSimilitud: 95, estado: 'APROBADA' },
        { id: 'EQ05', cursoExtNombre: 'Bases de Datos Relacionales', cursoExtCodigo: 'SEN-BDD301', cursoExtCreditos: 5, cursoUsilNombre: 'Base de Datos I', cursoUsilCodigo: 'USIL-CS203', cursoUsilCreditos: 4, porcentajeSimilitud: 90, estado: 'APROBADA' }
      ],
      creditosConvalidados: 23,
      creditosTotalesMalla: 160,
      cursosConvalidados: 5,
      estado: 'PENDIENTE_FIRMA',
      firmaAlumno: null,
      fechaFirma: null,
      numeroCorrelativo: null,
      fechaMemorandum: null,
      aprobadoPor: null,
      aprobadoCargo: null,
      auditoria: [
        { accion: 'CREADA', usuario: 'María López', timestamp: '2024-01-15T10:00:00.000Z', detalle: 'Convalidación generada a partir de Simulación SIM-001' },
        { accion: 'ENVIADA_ALUMNO', usuario: 'María López', timestamp: '2024-01-16T09:30:00.000Z', detalle: 'Simulación enviada al alumno para revisión' }
      ],
      fechaCreacion: '2024-01-15T10:00:00.000Z'
    },
    {
      id: 'CONV-002',
      simulacionId: 'SIM-002',
      solicitudAdmisionId: 'SOL-1718912000001',
      cicloPostulacion: '2024-II',
      coordinadorId: 'U-003',
      coordinadorNombre: 'Jorge Díaz',
      coordinadorCargo: 'Coordinador Académico',
      alumno: { nombres: 'Carlos', apellidos: 'Mendoza', dni: '78889999', correo: 'cmendoza@hotmail.com' },
      carreraUsil: 'Administración',
      facultadUsil: 'Facultad de Ciencias Empresariales',
      mallaUsilId: 'm-usil-2',
      institucionOrigenId: '2',
      institucionOrigenNombre: 'Tecnológico de Monterrey',
      equivalenciasSnapshot: [
        { id: 'EQ09', cursoExtNombre: 'Programación Avanzada', cursoExtCodigo: 'TEC-TC1028', cursoExtCreditos: 5, cursoUsilNombre: 'Desarrollo de Software II', cursoUsilCodigo: 'USIL-CS302', cursoUsilCreditos: 5, porcentajeSimilitud: 87, estado: 'APROBADA' },
        { id: 'EQ10', cursoExtNombre: 'Estructura de Datos', cursoExtCodigo: 'TEC-TC1031', cursoUsilNombre: 'Estructura de Datos', cursoExtCreditos: 5, cursoUsilCodigo: 'USIL-CS202', cursoUsilCreditos: 5, porcentajeSimilitud: 93, estado: 'APROBADA' }
      ],
      creditosConvalidados: 10,
      creditosTotalesMalla: 180,
      cursosConvalidados: 2,
      estado: 'FIRMADA',
      firmaAlumno: 'Carlos Mendoza',
      fechaFirma: '2024-03-15T10:00:00.000Z',
      numeroCorrelativo: null,
      fechaMemorandum: null,
      aprobadoPor: null,
      aprobadoCargo: null,
      auditoria: [
        { accion: 'CREADA', usuario: 'Jorge Díaz', timestamp: '2024-03-10T12:00:00.000Z', detalle: 'Convalidación generada a partir de Simulación SIM-002' },
        { accion: 'FIRMADA', usuario: 'Carlos Mendoza', timestamp: '2024-03-15T10:00:00.000Z', detalle: 'Alumno registró firma de conformidad' }
      ],
      fechaCreacion: '2024-03-10T12:00:00.000Z'
    },
    {
      id: 'CONV-003',
      simulacionId: 'SIM-001',
      solicitudAdmisionId: 'SOL-1718912000000',
      cicloPostulacion: '2023-II',
      coordinadorId: 'U-002',
      coordinadorNombre: 'María López',
      coordinadorCargo: 'Coordinadora Académica',
      alumno: { nombres: 'Ana María', apellidos: 'López Ruiz', dni: '71234567', correo: 'ana.lopez@gmail.com' },
      carreraUsil: 'INGENIERÍA DE SISTEMAS DE INFORMACIÓN',
      facultadUsil: 'Facultad de Ingeniería e Inteligencia Artificial',
      mallaUsilId: 'm-usil-1',
      institucionOrigenId: '3',
      institucionOrigenNombre: 'SENATI',
      equivalenciasSnapshot: [
        { id: 'EQ01', cursoExtNombre: 'Matemática para Ingeniería', cursoExtCodigo: 'SEN-MAT100', cursoExtCreditos: 5, cursoUsilNombre: 'Matemática Básica', cursoUsilCodigo: 'USIL-MAT101', cursoUsilCreditos: 4, porcentajeSimilitud: 92, estado: 'APROBADA' },
        { id: 'EQ03', cursoExtNombre: 'Programación Orientada a Objetos', cursoExtCodigo: 'SEN-POO301', cursoExtCreditos: 6, cursoUsilNombre: 'Desarrollo de Software I', cursoUsilCodigo: 'USIL-CS201', cursoUsilCreditos: 5, porcentajeSimilitud: 85, estado: 'APROBADA' },
        { id: 'EQ04', cursoExtNombre: 'Estructuras de Datos y Algoritmos', cursoExtCodigo: 'SEN-EDD201', cursoExtCreditos: 5, cursoUsilNombre: 'Estructura de Datos', cursoUsilCodigo: 'USIL-CS202', cursoUsilCreditos: 5, porcentajeSimilitud: 95, estado: 'APROBADA' }
      ],
      creditosConvalidados: 14,
      creditosTotalesMalla: 160,
      cursosConvalidados: 3,
      estado: 'MEMORANDUM_EMITIDO',
      firmaAlumno: 'Ana María López Ruiz',
      fechaFirma: '2023-12-10T09:00:00.000Z',
      numeroCorrelativo: 'CONV-2023-048',
      fechaMemorandum: '2023-12-12T11:00:00.000Z',
      aprobadoPor: 'María López',
      aprobadoCargo: 'Coordinadora Académica',
      auditoria: [
        { accion: 'CREADA', usuario: 'María López', timestamp: '2023-12-05T10:00:00.000Z', detalle: 'Convalidación generada a partir de Simulación SIM-001 (ciclo 2023-II)' },
        { accion: 'FIRMADA', usuario: 'Ana María López Ruiz', timestamp: '2023-12-10T09:00:00.000Z', detalle: 'Alumna registró firma de conformidad' },
        { accion: 'MEMORANDUM_EMITIDO', usuario: 'María López', timestamp: '2023-12-12T11:00:00.000Z', detalle: 'Memorándum CONV-2023-048 emitido y enviado a Registro Académico' }
      ],
      fechaCreacion: '2023-12-05T10:00:00.000Z'
    }
  ],

  /* ============================================================
     MALLAS USIL — Catálogo destino (planes de estudio internos USIL)
     Módulo 3. Antes vivían en shared/js/mallas/seed-data.js (store.js).
     ============================================================ */
  mallasUsil: [
    // Mallas destino referenciadas por solicitudes_admision (admisión / equivalencias)
    { id: 'm-usil-1', unidad: 'Pregrado', facultad: 'Facultad de Ingeniería e Inteligencia Artificial', carrera: 'INGENIERÍA DE SISTEMAS DE INFORMACIÓN', modalidad: 'PRESENCIAL', periodo: '2024-1', version: 'v1.0', codigoVisible: 'USIL-ISI-24', anioCodigo: 'Malla 2024-I', estado: 'activo' },
    { id: 'm-usil-2', unidad: 'Pregrado', facultad: 'Facultad de Ciencias Empresariales', carrera: 'Administración', modalidad: 'PRESENCIAL', periodo: '2024-1', version: 'v1.0', codigoVisible: 'USIL-ADM-24', anioCodigo: 'Malla 2024-I', estado: 'activo' },
    // Mallas del módulo de gestión de mallas
    { id: 'malla-001', unidad: 'Pregrado', facultad: 'Ingeniería y Ciencias', carrera: 'Ingeniería de Software', modalidad: 'presencial', periodo: '2024-01', version: 'v4.2.0', estado: 'activo' },
    { id: 'malla-002', unidad: 'Postgrado', facultad: 'Negocios y Economía', carrera: 'MBA Executive', modalidad: 'hibrido', periodo: '2023-02', version: 'v2.1.5', estado: 'activo' },
    { id: 'malla-003', unidad: 'Pregrado', facultad: 'Ciencias de la Salud', carrera: 'Medicina General', modalidad: 'presencial', periodo: '2022-01', version: 'v5.0.1', estado: 'inactivo' },
    { id: 'malla-004', unidad: 'Educación Continua', facultad: 'Ingeniería y Ciencias', carrera: 'Diplomado en IA Aplicada', modalidad: 'virtual', periodo: '2024-02', version: 'v1.0.0', estado: 'activo' },
    { id: 'malla-005', unidad: 'Pregrado', facultad: 'Negocios y Economía', carrera: 'Administración', modalidad: 'presencial', periodo: '2024-01', version: 'v3.1.0', estado: 'activo' },
    { id: 'malla-006', unidad: 'Pregrado', facultad: 'Ingeniería y Ciencias', carrera: 'Ingeniería Civil', modalidad: 'presencial', periodo: '2023-01', version: 'v2.4.0', estado: 'activo' },
    { id: 'malla-007', unidad: 'Postgrado', facultad: 'Ciencias de la Salud', carrera: 'Maestría en Salud Pública', modalidad: 'hibrido', periodo: '2024-02', version: 'v1.2.0', estado: 'inactivo' },
    { id: 'malla-008', unidad: 'Educación Continua', facultad: 'Negocios y Economía', carrera: 'Diplomado en Finanzas', modalidad: 'virtual', periodo: '2024-01', version: 'v1.0.0', estado: 'activo' }
  ],

  /* ============================================================
     USUARIOS Y SEGURIDAD — Módulo 1
     Personal interno y postulantes. Rol + ámbito por facultad.
     (Las contraseñas no se almacenan en el mock por seguridad.)
     ============================================================ */
  usuarios: [
    { id: 'U-001', nombres: 'Alberto', apellidos: 'Ruiz', dni: '40123456', correo: 'alberto.ruiz@usil.edu.pe', rol: 'ADMIN', facultad: '', estado: 'activo', fechaRegistro: '2023-08-01' },
    { id: 'U-002', nombres: 'María', apellidos: 'López', dni: '41234567', correo: 'maria.lopez@usil.edu.pe', rol: 'COORDINADOR', facultad: 'Ingeniería y Ciencias', estado: 'activo', fechaRegistro: '2023-08-10' },
    { id: 'U-003', nombres: 'Jorge', apellidos: 'Díaz', dni: '42345678', correo: 'jorge.diaz@usil.edu.pe', rol: 'COORDINADOR', facultad: 'Negocios y Economía', estado: 'activo', fechaRegistro: '2023-09-05' },
    { id: 'U-004', nombres: 'Lucía', apellidos: 'Fernández', dni: '43456789', correo: 'lucia.fernandez@usil.edu.pe', rol: 'ADMISION', facultad: '', estado: 'activo', fechaRegistro: '2023-09-12' },
    { id: 'U-005', nombres: 'Roberto', apellidos: 'Salas', dni: '44567890', correo: 'roberto.salas@usil.edu.pe', rol: 'DIRECTOR', facultad: 'Ingeniería y Ciencias', estado: 'activo', fechaRegistro: '2023-07-20' },
    { id: 'U-006', nombres: 'Carmen', apellidos: 'Vega', dni: '45678901', correo: 'carmen.vega@usil.edu.pe', rol: 'DECANO', facultad: 'Ciencias de la Salud', estado: 'activo', fechaRegistro: '2023-07-15' },
    { id: 'U-007', nombres: 'Andrés', apellidos: 'Mora', dni: '70123456', correo: 'andres.mora@gmail.com', rol: 'POSTULANTE', facultad: '', estado: 'activo', fechaRegistro: '2024-02-01' },
    { id: 'U-008', nombres: 'Pedro', apellidos: 'Ramos', dni: '46789012', correo: 'pedro.ramos@usil.edu.pe', rol: 'ADMISION', facultad: '', estado: 'inactivo', fechaRegistro: '2023-06-30' }
  ]
};

// Versión del seed — si cambia, resetea la DB local
const SEED_VERSION = 13;

/* ------------------------------------------------------------
   Almacenamiento — usa localStorage en el navegador y un
   fallback en memoria cuando no existe o está incompleto
   (p. ej. Node en tests, donde localStorage no tiene setItem).
   ------------------------------------------------------------ */
const hasLocalStorage = (() => {
  try {
    return typeof localStorage !== 'undefined' &&
      typeof localStorage.getItem === 'function' &&
      typeof localStorage.setItem === 'function';
  } catch {
    return false;
  }
})();

let memoryDb = null;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function seedData() {
  return clone(SEED_DATA);
}

function getRawData() {
  if (!hasLocalStorage) {
    if (!memoryDb) memoryDb = seedData();
    return memoryDb;
  }
  const storedVersion = localStorage.getItem(DB_KEY + '_version');
  const data = localStorage.getItem(DB_KEY);
  if (!data || storedVersion !== String(SEED_VERSION)) {
    localStorage.setItem(DB_KEY, JSON.stringify(SEED_DATA));
    localStorage.setItem(DB_KEY + '_version', String(SEED_VERSION));
    return seedData();
  }
  return JSON.parse(data);
}

function setRawData(data) {
  if (!hasLocalStorage) {
    memoryDb = data;
    return;
  }
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

/** Reinicia la DB a los datos semilla (principalmente para tests). */
export function resetDb() {
  memoryDb = hasLocalStorage ? null : seedData();
  if (hasLocalStorage) {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(DB_KEY + '_version');
  }
}

// Simula retardo de red/base de datos. Configurable: 0 desactiva la espera (tests).
// Bajo Vitest arranca en 0 para que los tests no esperen timers reales.
let DELAY_MS = (typeof process !== 'undefined' && process.env && process.env.VITEST) ? 0 : 200;

/** Ajusta el retardo simulado de la DB. setDbDelay(0) lo desactiva en tests. */
export function setDbDelay(ms) {
  DELAY_MS = Math.max(0, Number(ms) || 0);
}

const delay = (ms = DELAY_MS) =>
  ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve();

export const db = {
  // --- Instituciones ---
  async getInstituciones({ incluirEliminadas = false } = {}) {
    await delay();
    const data = getRawData();
    return data.instituciones
      .filter(inst => incluirEliminadas || !inst.eliminado)
      .map(inst => {
        const totalCarreras = data.carreras.filter(c => c.institucionId === inst.id && !c.eliminado).length;
        const totalMallas = data.mallas.filter(m => m.institucionId === inst.id && !m.eliminado).length;
        return { ...inst, totalCarreras, totalMallas };
      });
  },

  async getInstitucion(id) {
    await delay();
    const data = getRawData();
    const inst = data.instituciones.find(i => i.id === id && !i.eliminado);
    if (!inst) throw new Error('Institución no encontrada');
    const totalCarreras = data.carreras.filter(c => c.institucionId === inst.id && !c.eliminado).length;
    const totalMallas = data.mallas.filter(m => m.institucionId === inst.id && !m.eliminado).length;
    return { ...inst, totalCarreras, totalMallas };
  },

  async createInstitucion(inst) {
    await delay(500);
    const data = getRawData();
    const newInst = { ...inst, id: Date.now().toString(), fechaRegistro: new Date().toISOString() };
    data.instituciones.push(newInst);
    setRawData(data);
    return newInst;
  },

  /**
   * Eliminación LÓGICA (soft delete): marca la institución y, en cascada,
   * sus carreras y mallas como eliminado:true. Preserva el historial para
   * auditorías (doc §8) en lugar de borrar físicamente los registros.
   */
  async deleteInstitucion(id) {
    await delay();
    const data = getRawData();
    data.instituciones.forEach(i => { if (i.id === id) i.eliminado = true; });
    data.carreras.forEach(c => { if (c.institucionId === id) c.eliminado = true; });
    data.mallas.forEach(m => { if (m.institucionId === id) m.eliminado = true; });
    setRawData(data);
  },

  // --- Carreras ---
  async getCarrerasByInstitucion(institucionId) {
    await delay();
    const data = getRawData();
    return data.carreras
      .filter(c => c.institucionId === institucionId && !c.eliminado)
      .map(c => {
        const totalMallas = data.mallas.filter(m => m.carreraId === c.id && !m.eliminado).length;
        return { ...c, totalMallas };
      });
  },

  async getCarrera(id) {
    await delay();
    const data = getRawData();
    const carrera = data.carreras.find(c => c.id === id && !c.eliminado);
    if (!carrera) throw new Error('Carrera no encontrada');
    return carrera;
  },

  async createCarrera(carrera) {
    await delay(500);
    const data = getRawData();
    const newCarrera = { ...carrera, id: Date.now().toString() };
    data.carreras.push(newCarrera);
    setRawData(data);
    return newCarrera;
  },

  // --- Mallas ---
  async getMallasByCarrera(carreraId) {
    await delay();
    const data = getRawData();
    return data.mallas.filter(m => m.carreraId === carreraId && !m.eliminado);
  },

  async createMalla(malla) {
    await delay(1000);
    const data = getRawData();
    const newMalla = { ...malla, id: Date.now().toString(), fechaRegistro: new Date().toISOString() };
    data.mallas.push(newMalla);
    setRawData(data);
    return newMalla;
  },

  // --- Cursos USIL ---
  async getCursosUsil(filtros = {}) {
    await delay();
    const data = getRawData();
    let cursos = data.cursosUsil || [];
    if (filtros.facultad) cursos = cursos.filter(c => c.facultad === filtros.facultad);
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      cursos = cursos.filter(c => c.nombre.toLowerCase().includes(q) || c.codigo.toLowerCase().includes(q));
    }
    return cursos;
  },

  async getFacultadesUsil() {
    await delay(50);
    const data = getRawData();
    return [...new Set((data.cursosUsil || []).map(c => c.facultad))].sort();
  },

  // --- Cursos Externos ---
  async getCursosExternos(filtros = {}) {
    await delay();
    const data = getRawData();
    let cursos = data.cursosExternos || [];
    if (filtros.institucionId) cursos = cursos.filter(c => c.institucionId === filtros.institucionId);
    if (filtros.carreraId) cursos = cursos.filter(c => c.carreraId === filtros.carreraId);
    if (filtros.mallaId) cursos = cursos.filter(c => c.mallaId === filtros.mallaId);
    return cursos;
  },

  // --- Equivalencias ---
  async getEquivalencias(filtros = {}) {
    await delay();
    const data = getRawData();
    // Soft delete: excluye eliminadas salvo que se pidan explícitamente (§8)
    let eqs = (data.equivalencias || []).filter(e => filtros.incluirEliminadas || !e.eliminado);

    // Enriquecer con datos de cursos e instituciones
    eqs = eqs.map(eq => {
      const cursoExt = (data.cursosExternos || []).find(c => c.id === eq.cursoExternoId) || {};
      const cursoUsil = (data.cursosUsil || []).find(c => c.id === eq.cursoUsilId) || {};
      const inst = data.instituciones.find(i => i.id === eq.institucionId) || {};
      const carrera = data.carreras.find(c => c.id === eq.carreraExternaId) || {};
      return { ...eq, cursoExt, cursoUsil, institucion: inst, carreraExterna: carrera };
    });

    // Filtrar
    if (filtros.institucionId) eqs = eqs.filter(e => e.institucionId === filtros.institucionId);
    if (filtros.carreraId) eqs = eqs.filter(e => e.carreraExternaId === filtros.carreraId);
    if (filtros.estado) eqs = eqs.filter(e => e.estado === filtros.estado);
    if (filtros.excluirDescartes) eqs = eqs.filter(e => !e.esDescarte);
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      eqs = eqs.filter(e =>
        (e.cursoExt.nombre || '').toLowerCase().includes(q) ||
        (e.cursoUsil.nombre || '').toLowerCase().includes(q) ||
        (e.cursoExt.codigo || '').toLowerCase().includes(q) ||
        (e.cursoUsil.codigo || '').toLowerCase().includes(q)
      );
    }

    return eqs;
  },

  async getEquivalencia(id) {
    await delay();
    const data = getRawData();
    const eq = (data.equivalencias || []).find(e => e.id === id && !e.eliminado);
    if (!eq) return null;
    const cursoExt = (data.cursosExternos || []).find(c => c.id === eq.cursoExternoId) || {};
    const cursoUsil = (data.cursosUsil || []).find(c => c.id === eq.cursoUsilId) || {};
    const inst = data.instituciones.find(i => i.id === eq.institucionId) || {};
    const carrera = data.carreras.find(c => c.id === eq.carreraExternaId) || {};
    return { ...eq, cursoExt, cursoUsil, institucion: inst, carreraExterna: carrera };
  },

  async getEquivalenciasStats() {
    await delay(50);
    const data = getRawData();
    const eqs = (data.equivalencias || []).filter(e => !e.eliminado);
    const total = eqs.length;
    const aprobadas = eqs.filter(e => e.estado === 'APROBADA').length;
    const pendientes = eqs.filter(e => e.estado === 'PENDIENTE').length;
    const rechazadas = eqs.filter(e => e.estado === 'RECHAZADA').length;
    const tasa = total > 0 ? Math.round((aprobadas / total) * 100) : 0;
    return { total, aprobadas, pendientes, rechazadas, tasa };
  },

  async createEquivalencia(eq) {
    await delay(800);
    const data = getRawData();
    const newEq = {
      ...eq,
      id: 'EQ' + Date.now(),
      fechaRegistro: new Date().toISOString(),
      fechaAprobacion: eq.estado === 'APROBADA' ? new Date().toISOString() : null
    };
    if (!data.equivalencias) data.equivalencias = [];
    data.equivalencias.push(newEq);
    setRawData(data);
    return newEq;
  },

  async updateEquivalenciaEstado(id, nuevoEstado) {
    await delay(500);
    const data = getRawData();
    const eq = (data.equivalencias || []).find(e => e.id === id);
    if (!eq) throw new Error('Equivalencia no encontrada');
    eq.estado = nuevoEstado;
    if (nuevoEstado === 'APROBADA') eq.fechaAprobacion = new Date().toISOString();
    else eq.fechaAprobacion = null;
    setRawData(data);
    return eq;
  },

  /** Edición general (curso USIL, similitud, observaciones, estado). */
  async updateEquivalencia(id, updates) {
    await delay(500);
    const data = getRawData();
    const idx = (data.equivalencias || []).findIndex(e => e.id === id);
    if (idx === -1) return null;
    const prev = data.equivalencias[idx];
    const merged = { ...prev, ...updates };
    // Mantener coherente la fecha de aprobación con el estado resultante
    if (merged.estado === 'APROBADA') {
      merged.fechaAprobacion = prev.fechaAprobacion || new Date().toISOString();
    } else {
      merged.fechaAprobacion = null;
    }
    data.equivalencias[idx] = merged;
    setRawData(data);
    return merged;
  },

  /** Eliminación lógica (soft delete) de una equivalencia (§8). */
  async deleteEquivalencia(id) {
    await delay();
    const data = getRawData();
    const eq = (data.equivalencias || []).find(e => e.id === id);
    if (!eq) return false;
    eq.eliminado = true;
    setRawData(data);
    return true;
  },

  async getMallasActivasByInstitucion(institucionId) {
    await delay();
    const data = getRawData();
    return data.mallas.filter(m => m.institucionId === institucionId && m.estado === 'ACTIVA' && !m.eliminado);
  },

  // --- Mallas USIL (catálogo destino, módulo 3) ---
  async getMallasUsil() {
    await delay();
    const data = getRawData();
    return (data.mallasUsil || []).filter(m => !m.eliminado);
  },

  async getMallaUsilById(id) {
    await delay();
    const data = getRawData();
    return (data.mallasUsil || []).find(m => m.id === id && !m.eliminado) || null;
  },

  async createMallaUsil(malla) {
    await delay();
    const data = getRawData();
    if (!data.mallasUsil) data.mallasUsil = [];
    const entry = {
      ...malla,
      id: malla.id || `malla-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      estado: malla.estado || 'activo'
    };
    data.mallasUsil.unshift(entry);
    setRawData(data);
    return entry;
  },

  async updateMallaUsil(id, updates) {
    await delay();
    const data = getRawData();
    const idx = (data.mallasUsil || []).findIndex(m => m.id === id);
    if (idx === -1) return null;
    data.mallasUsil[idx] = { ...data.mallasUsil[idx], ...updates };
    setRawData(data);
    return data.mallasUsil[idx];
  },

  // --- Usuarios y Seguridad (módulo 1) ---
  async getUsuarios(filtros = {}) {
    await delay();
    const data = getRawData();
    let users = (data.usuarios || []).filter(u => filtros.incluirEliminados || !u.eliminado);
    if (filtros.rol) users = users.filter(u => u.rol === filtros.rol);
    if (filtros.facultad) users = users.filter(u => u.facultad === filtros.facultad);
    if (filtros.estado) users = users.filter(u => u.estado === filtros.estado);
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      users = users.filter(u =>
        `${u.nombres} ${u.apellidos}`.toLowerCase().includes(q) ||
        (u.correo || '').toLowerCase().includes(q) ||
        (u.dni || '').includes(q)
      );
    }
    return users;
  },

  async getUsuario(id) {
    await delay();
    const data = getRawData();
    return (data.usuarios || []).find(u => u.id === id && !u.eliminado) || null;
  },

  async getUsuariosStats() {
    await delay(50);
    const data = getRawData();
    const users = (data.usuarios || []).filter(u => !u.eliminado);
    const porRol = {};
    users.forEach(u => { porRol[u.rol] = (porRol[u.rol] || 0) + 1; });
    return {
      total: users.length,
      activos: users.filter(u => u.estado === 'activo').length,
      inactivos: users.filter(u => u.estado === 'inactivo').length,
      porRol
    };
  },

  async createUsuario(usuario) {
    await delay(500);
    const data = getRawData();
    if (!data.usuarios) data.usuarios = [];
    const newUser = {
      ...usuario,
      id: 'U-' + Date.now(),
      estado: usuario.estado || 'activo',
      fechaRegistro: new Date().toISOString()
    };
    data.usuarios.push(newUser);
    setRawData(data);
    return newUser;
  },

  async updateUsuario(id, updates) {
    await delay(500);
    const data = getRawData();
    const idx = (data.usuarios || []).findIndex(u => u.id === id);
    if (idx === -1) return null;
    data.usuarios[idx] = { ...data.usuarios[idx], ...updates };
    setRawData(data);
    return data.usuarios[idx];
  },

  async deleteUsuario(id) {
    await delay();
    const data = getRawData();
    const u = (data.usuarios || []).find(x => x.id === id);
    if (!u) return false;
    u.eliminado = true;
    setRawData(data);
    return true;
  },

  // --- Admision ---
  async getSolicitudesAdmision() {
    await delay();
    const data = getRawData();
    return (data.solicitudes_admision || []).sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
  },

  async createSolicitudAdmision(solicitud) {
    await delay(600);
    const data = getRawData();
    if (!data.solicitudes_admision) data.solicitudes_admision = [];
    const newSolicitud = {
      ...solicitud,
      id: 'SOL-' + Date.now(),
      estado: 'PENDIENTE',
      fechaRegistro: new Date().toISOString()
    };
    data.solicitudes_admision.push(newSolicitud);
    setRawData(data);
    return newSolicitud;
  },

  async updateSolicitudAdmision(id, updates) {
    await delay(500);
    const data = getRawData();
    const idx = (data.solicitudes_admision || []).findIndex(s => s.id === id);
    if (idx === -1) return null;
    data.solicitudes_admision[idx] = { ...data.solicitudes_admision[idx], ...updates };
    setRawData(data);
    return data.solicitudes_admision[idx];
  },

  async deleteSolicitudAdmision(id) {
    await delay(300);
    const data = getRawData();
    const idx = (data.solicitudes_admision || []).findIndex(s => s.id === id);
    if (idx !== -1) { data.solicitudes_admision[idx].eliminado = true; setRawData(data); }
  },

  // --- Simulaciones ---
  async getSimulaciones(filtros = {}) {
    await delay();
    const data = getRawData();
    let sims = (data.simulaciones || []).filter(s => !s.eliminado);
    if (filtros.estado) sims = sims.filter(s => s.estado === filtros.estado);
    if (filtros.cicloPostulacion) sims = sims.filter(s => s.cicloPostulacion === filtros.cicloPostulacion);
    if (filtros.coordinadorId) sims = sims.filter(s => s.coordinadorId === filtros.coordinadorId);
    if (filtros.carreraUsil) sims = sims.filter(s => s.carreraUsil === filtros.carreraUsil);
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      sims = sims.filter(s =>
        `${s.alumno?.nombres} ${s.alumno?.apellidos}`.toLowerCase().includes(q) ||
        (s.alumno?.dni || '').includes(q) ||
        (s.carreraUsil || '').toLowerCase().includes(q)
      );
    }
    return sims.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
  },

  async getSimulacion(id) {
    await delay();
    const data = getRawData();
    const sim = (data.simulaciones || []).find(s => s.id === id && !s.eliminado);
    if (!sim) return null;
    // Enriquecer con equivalencias
    const eqs = (sim.equivalenciasIds || []).map(eqId => {
      const eq = (data.equivalencias || []).find(e => e.id === eqId) || {};
      const cursoExt = (data.cursosExternos || []).find(c => c.id === eq.cursoExternoId) || {};
      const cursoUsil = (data.cursosUsil || []).find(c => c.id === eq.cursoUsilId) || {};
      return { ...eq, cursoExt, cursoUsil };
    });
    return { ...sim, _equivalencias: eqs };
  },

  async createSimulacion(simData) {
    await delay(600);
    const data = getRawData();
    if (!data.simulaciones) data.simulaciones = [];
    const newSim = {
      ...simData,
      id: 'SIM-' + Date.now(),
      estado: simData.estado || 'GENERADA',
      fechaCreacion: new Date().toISOString(),
      fechaEnvio: null,
    };
    data.simulaciones.unshift(newSim);
    setRawData(data);
    return newSim;
  },

  async updateSimulacion(id, updates) {
    await delay(400);
    const data = getRawData();
    const idx = (data.simulaciones || []).findIndex(s => s.id === id);
    if (idx === -1) return null;
    data.simulaciones[idx] = { ...data.simulaciones[idx], ...updates };
    setRawData(data);
    return data.simulaciones[idx];
  },

  async enviarSimulacionAlAlumno(id) {
    await delay(400);
    const data = getRawData();
    const idx = (data.simulaciones || []).findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Simulación no encontrada');
    data.simulaciones[idx].estado = 'ENVIADA_ALUMNO';
    data.simulaciones[idx].fechaEnvio = new Date().toISOString();
    setRawData(data);
    return data.simulaciones[idx];
  },

  async deleteSimulacion(id) {
    await delay(300);
    const data = getRawData();
    const idx = (data.simulaciones || []).findIndex(s => s.id === id);
    if (idx !== -1) { data.simulaciones[idx].eliminado = true; setRawData(data); }
  },

  // --- Convalidaciones ---
  async getConvalidaciones(filtros = {}) {
    await delay();
    const data = getRawData();
    let convs = (data.convalidaciones || []).filter(c => !c.eliminado);
    if (filtros.estado)           convs = convs.filter(c => c.estado === filtros.estado);
    if (filtros.cicloPostulacion) convs = convs.filter(c => c.cicloPostulacion === filtros.cicloPostulacion);
    if (filtros.coordinadorId)    convs = convs.filter(c => c.coordinadorId === filtros.coordinadorId);
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      convs = convs.filter(c =>
        `${c.alumno?.nombres} ${c.alumno?.apellidos}`.toLowerCase().includes(q) ||
        (c.alumno?.dni || '').includes(q) ||
        (c.carreraUsil || '').toLowerCase().includes(q) ||
        (c.numeroCorrelativo || '').toLowerCase().includes(q)
      );
    }
    return convs.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
  },

  async getConvalidacion(id) {
    await delay();
    const data = getRawData();
    return (data.convalidaciones || []).find(c => c.id === id && !c.eliminado) || null;
  },

  async createConvalidacion(convData) {
    await delay(600);
    const data = getRawData();
    if (!data.convalidaciones) data.convalidaciones = [];
    const now = new Date().toISOString();
    const newConv = {
      ...convData,
      id: 'CONV-' + Date.now(),
      estado: convData.estado || 'PENDIENTE_FIRMA',
      firmaAlumno: null,
      fechaFirma: null,
      numeroCorrelativo: null,
      fechaMemorandum: null,
      aprobadoPor: null,
      aprobadoCargo: null,
      auditoria: [{ accion: 'CREADA', usuario: convData.coordinadorNombre || 'Sistema', timestamp: now, detalle: 'Convalidación generada desde simulación' }],
      fechaCreacion: now,
    };
    data.convalidaciones.unshift(newConv);
    setRawData(data);
    return newConv;
  },

  async updateConvalidacion(id, updates) {
    await delay(400);
    const data = getRawData();
    const idx = (data.convalidaciones || []).findIndex(c => c.id === id);
    if (idx === -1) return null;
    data.convalidaciones[idx] = { ...data.convalidaciones[idx], ...updates };
    setRawData(data);
    return data.convalidaciones[idx];
  },

  async firmarConvalidacion(id) {
    await delay(500);
    const data = getRawData();
    const idx = (data.convalidaciones || []).findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Convalidación no encontrada');
    const conv = data.convalidaciones[idx];
    if (conv.estado !== 'PENDIENTE_FIRMA') throw new Error('Solo se puede firmar una convalidación en estado PENDIENTE_FIRMA');
    const now = new Date().toISOString();
    const firma = 'FIRMA-' + Math.random().toString(36).slice(2, 10).toUpperCase() + '-' + Date.now();
    conv.estado = 'FIRMADA';
    conv.firmaAlumno = firma;
    conv.fechaFirma = now;
    conv.auditoria = [...(conv.auditoria || []), { accion: 'FIRMADA', usuario: conv.alumno?.nombres + ' ' + conv.alumno?.apellidos, timestamp: now, detalle: 'Alumno aceptó y firmó virtualmente el expediente' }];
    setRawData(data);
    return data.convalidaciones[idx];
  },

  async generarMemorandum(id, { aprobadoPor = 'Dr. Alberto Ruiz', cargo = 'Director Académico' } = {}) {
    await delay(600);
    const data = getRawData();
    const idx = (data.convalidaciones || []).findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Convalidación no encontrada');
    const conv = data.convalidaciones[idx];
    if (conv.estado !== 'FIRMADA') throw new Error('Solo se puede emitir memorándum de una convalidación FIRMADA');
    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const emitidas = (data.convalidaciones || []).filter(c => c.numeroCorrelativo).length;
    const num = String(emitidas + 1).padStart(3, '0');
    const correlativo = `MEM-${num}-${year}-USIL`;
    conv.estado = 'MEMORANDUM_EMITIDO';
    conv.numeroCorrelativo = correlativo;
    conv.fechaMemorandum = now;
    conv.aprobadoPor = aprobadoPor;
    conv.aprobadoCargo = cargo;
    conv.auditoria = [...(conv.auditoria || []), { accion: 'MEMORANDUM_EMITIDO', usuario: aprobadoPor, timestamp: now, detalle: `Memorándum ${correlativo} emitido y enviado a Registro Académico` }];
    setRawData(data);
    return data.convalidaciones[idx];
  },

  async deleteConvalidacion(id) {
    await delay(300);
    const data = getRawData();
    const idx = (data.convalidaciones || []).findIndex(c => c.id === id);
    if (idx !== -1) { data.convalidaciones[idx].eliminado = true; setRawData(data); }
  },

  // --- Reportes ---
  async getReporteEquivalencias(filtros = {}) {
    await delay(100);
    const data = getRawData();
    const eqs  = (data.equivalencias || []).filter(e => !e.eliminado && !e.esDescarte);
    const insts = data.instituciones || [];

    const byInst = {};
    eqs.forEach(eq => {
      const id = eq.institucionId;
      if (!byInst[id]) {
        const inst = insts.find(i => i.id === id) || {};
        byInst[id] = { institucionId: id, institucion: inst.nombre || id, pais: inst.pais || '—', total: 0, aprobadas: 0, pendientes: 0, rechazadas: 0, similitudTotal: 0, similitudCount: 0 };
      }
      const r = byInst[id];
      r.total++;
      if (eq.estado === 'APROBADA')   r.aprobadas++;
      if (eq.estado === 'PENDIENTE')  r.pendientes++;
      if (eq.estado === 'RECHAZADA')  r.rechazadas++;
      if (eq.porcentajeSimilitud != null) { r.similitudTotal += eq.porcentajeSimilitud; r.similitudCount++; }
    });

    return Object.values(byInst)
      .map(r => ({
        ...r,
        tasaAprobacion: r.total > 0 ? Math.round((r.aprobadas / r.total) * 100) : 0,
        similitudPromedio: r.similitudCount > 0 ? Math.round(r.similitudTotal / r.similitudCount) : null,
      }))
      .sort((a, b) => b.total - a.total);
  },

  async getReporteConvalidaciones(filtros = {}) {
    await delay(100);
    const data = getRawData();
    const convs = (data.convalidaciones || []).filter(c => !c.eliminado);
    const sims  = (data.simulaciones   || []).filter(s => !s.eliminado);

    const byCiclo = {};
    [...convs, ...sims].forEach(item => {
      const ciclo = item.cicloPostulacion || 'Sin ciclo';
      if (!byCiclo[ciclo]) {
        byCiclo[ciclo] = { ciclo, simulaciones: 0, convalidaciones: 0, pendienteFirma: 0, firmadas: 0, memEmitido: 0, creditosTotal: 0, cursosTotal: 0 };
      }
      const r = byCiclo[ciclo];
      if ('estado' in item && item.equivalenciasSnapshot) {
        // es convalidación
        r.convalidaciones++;
        if (item.estado === 'PENDIENTE_FIRMA') r.pendienteFirma++;
        if (item.estado === 'FIRMADA')          r.firmadas++;
        if (item.estado === 'MEMORANDUM_EMITIDO') r.memEmitido++;
        r.creditosTotal += item.creditosConvalidados || 0;
        r.cursosTotal   += item.cursosConvalidados   || 0;
      } else {
        r.simulaciones++;
      }
    });

    return Object.values(byCiclo).sort((a, b) => b.ciclo.localeCompare(a.ciclo));
  },

  async getReporteActividad(filtros = {}) {
    await delay(100);
    const data  = getRawData();
    const desde = filtros.desde ? new Date(filtros.desde) : null;
    const hasta = filtros.hasta ? new Date(filtros.hasta) : null;

    const inRango = fecha => {
      if (!fecha) return false;
      const d = new Date(fecha);
      if (desde && d < desde) return false;
      if (hasta && d > hasta) return false;
      return true;
    };

    const solicitudes    = (data.solicitudes_admision || []).filter(s => inRango(s.fechaRegistro));
    const simulaciones   = (data.simulaciones         || []).filter(s => !s.eliminado && inRango(s.fechaCreacion));
    const convalidaciones = (data.convalidaciones     || []).filter(c => !c.eliminado && inRango(c.fechaCreacion));

    // Agrupar por mes (YYYY-MM)
    const byMes = {};
    const registrar = (col, fecha, key) => {
      const mes = fecha ? fecha.slice(0, 7) : null;
      if (!mes) return;
      if (!byMes[mes]) byMes[mes] = { mes, solicitudes: 0, simulaciones: 0, convalidaciones: 0 };
      byMes[mes][key]++;
    };
    solicitudes.forEach(s    => registrar(solicitudes,    s.fechaRegistro,  'solicitudes'));
    simulaciones.forEach(s   => registrar(simulaciones,   s.fechaCreacion,  'simulaciones'));
    convalidaciones.forEach(c => registrar(convalidaciones, c.fechaCreacion, 'convalidaciones'));

    return {
      resumen: {
        solicitudes: solicitudes.length,
        simulaciones: simulaciones.length,
        convalidaciones: convalidaciones.length,
        creditosConvalidados: convalidaciones.reduce((s, c) => s + (c.creditosConvalidados || 0), 0),
        cursosConvalidados: convalidaciones.reduce((s, c) => s + (c.cursosConvalidados || 0), 0),
      },
      porMes: Object.values(byMes).sort((a, b) => a.mes.localeCompare(b.mes)),
    };
  },

  // --- USIL Catalog ---
  async getUsilCatalog() {
    await delay();
    const data = getRawData();
    return data.usil_catalog || {};
  },

  async addUsilUnidad(unidad) {
    await delay();
    const data = getRawData();
    if (!data.usil_catalog) data.usil_catalog = {};
    if (!data.usil_catalog[unidad]) {
      data.usil_catalog[unidad] = {};
      setRawData(data);
    }
    return data.usil_catalog;
  },

  async addUsilFacultad(unidad, facultad) {
    await delay();
    const data = getRawData();
    if (!data.usil_catalog) data.usil_catalog = {};
    if (!data.usil_catalog[unidad]) data.usil_catalog[unidad] = {};
    if (!data.usil_catalog[unidad][facultad]) {
      data.usil_catalog[unidad][facultad] = [];
      setRawData(data);
    }
    return data.usil_catalog;
  },

  async addUsilCarrera(unidad, facultad, carrera) {
    await delay();
    const data = getRawData();
    if (!data.usil_catalog) data.usil_catalog = {};
    if (!data.usil_catalog[unidad]) data.usil_catalog[unidad] = {};
    if (!data.usil_catalog[unidad][facultad]) data.usil_catalog[unidad][facultad] = [];
    if (!data.usil_catalog[unidad][facultad].includes(carrera)) {
      data.usil_catalog[unidad][facultad].push(carrera);
      setRawData(data);
    }
    return data.usil_catalog;
  },

  // --- Portal Externo: simulación desde landing page ---
  async createSimulacionExterna({ datos, archivosNombres = [] }) {
    await delay(200);
    const data = getRawData();
    if (!data.simulaciones) data.simulaciones = [];

    // Buscar malla USIL de la carrera elegida para generar equivalencias mock
    const cursosUsil = data.cursosUsil || [];
    const carreraLower = (datos.carreraUsil || '').toLowerCase();
    const facultadLower = (datos.facultadUsil || '').toLowerCase();

    // Cursos USIL de la facultad/carrera seleccionada (filtra por facultad aproximada)
    let cursosTarget = cursosUsil.filter(c =>
      (c.facultad || '').toLowerCase().includes(facultadLower.split(' ')[1] || facultadLower) ||
      (c.facultad || '').toLowerCase().includes('ingeniería') && facultadLower.includes('ingeniería')
    );
    if (!cursosTarget.length) cursosTarget = cursosUsil.slice(0, 12);
    cursosTarget = cursosTarget.slice(0, 10);

    // Cursos de origen simulados (basados en la carrera de origen del postulante)
    const carreraOrigenLower = (datos.carreraOrigen || '').toLowerCase();
    const cursosOrigenMock = [
      'Algoritmos y Programación', 'Estructuras de Datos', 'Base de Datos',
      'Matemática Discreta', 'Cálculo I', 'Álgebra Lineal',
      'Programación Orientada a Objetos', 'Redes de Computadoras',
      'Ingeniería de Software', 'Sistemas Operativos',
    ].filter((_, i) => {
      // Seleccionar aleatoriamente ~70% de cursos para simular variabilidad
      return ((i * 7 + carreraOrigenLower.length) % 10) < 8;
    });

    // Calcular similitud de cada curso origen con cada curso USIL
    function similitudLexica(a, b) {
      const tok = s => new Set(s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').split(/\W+/).filter(w => w.length > 2));
      const A = tok(a), B = tok(b);
      const inter = [...A].filter(x => B.has(x)).length;
      const union = new Set([...A, ...B]).size;
      return union ? Math.round(45 + (inter / union) * 55) : 45;
    }

    // Para cada curso de origen, encontrar el mejor match en USIL
    const equivalencias = cursosOrigenMock.map(cursoExt => {
      let mejor = null, mejorSim = 0;
      cursosTarget.forEach(cu => {
        const sim = similitudLexica(cursoExt, cu.nombre);
        if (sim > mejorSim) { mejorSim = sim; mejor = cu; }
      });
      return {
        cursoExt,
        cursoUsil:    mejor ? mejor.nombre : '—',
        cursoUsilId:  mejor ? mejor.id : null,
        creditosUsil: mejor ? mejor.creditos : 0,
        similitud:    mejorSim,
      };
    });

    const convalidables = equivalencias.filter(e => e.similitud >= 60).length;
    const creditosEst   = equivalencias
      .filter(e => e.similitud >= 60)
      .reduce((s, e) => s + e.creditosUsil, 0);
    const pctConvalidable = equivalencias.length
      ? Math.round((convalidables / equivalencias.length) * 100)
      : 0;

    const id = 'SIM-EXT-' + Date.now();
    const sim = {
      id,
      origen:        'EXTERNA',
      estado:        'RECIBIDA',
      fechaCreacion: new Date().toISOString(),
      cicloPostulacion: null,
      alumnoNombre:  `${datos.nombres} ${datos.apellidos}`,
      alumnoDni:     datos.numDoc,
      alumnoCorreo:  datos.email,
      alumnoTelefono: datos.telefono,
      tipoDoc:       datos.tipoDoc,
      institucionNombre: datos.institucion,
      tipoInstitucion:   datos.tipoInstitucion,
      carreraOrigen:     datos.carreraOrigen,
      anioIngreso:       datos.anioIngreso,
      anioEgreso:        datos.anioEgreso || null,
      facultadUsil:      datos.facultadUsil,
      carreraUsilDestino: datos.carreraUsil,
      archivosAdjuntos:  archivosNombres,
      equivalenciasPreliminares: equivalencias,
      cursosConvalidados:  convalidables,
      creditosConvalidados: creditosEst,
      eliminado: false,
    };

    data.simulaciones.push(sim);
    setRawData(data);

    return {
      id,
      equivalenciasPreliminares: equivalencias,
      resumen: {
        total:             equivalencias.length,
        convalidables,
        creditosEstimados: creditosEst,
        pctConvalidable,
      },
    };
  },
};
