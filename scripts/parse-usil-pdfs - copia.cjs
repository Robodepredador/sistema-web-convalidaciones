const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const dataDir = path.join(__dirname, '../data/silabo_cursos_usil');

// Mapeo manual de archivos a cursos de la USIL
const fileToCourseMap = {
  'administracion_para_los_negocios.pdf': {
    codigo: 'USIL-AD100', nombre: 'Administración para los Negocios', creditos: 3, ciclo: 1, facultad: 'Negocios'
  },
  'calculo_de_una_variable.pdf': {
    codigo: 'USIL-MAT102', nombre: 'Cálculo de una Variable', creditos: 4, ciclo: 2, facultad: 'Ingeniería'
  },
  'fundamentos_de_programacion.pdf': {
    codigo: 'USIL-CS101', nombre: 'Fundamentos de Programación', creditos: 4, ciclo: 1, facultad: 'Ingeniería'
  },
  'fundamentos_en_competencias_digitales.pdf': {
    codigo: 'USIL-CS100', nombre: 'Fundamentos en Competencias Digitales', creditos: 3, ciclo: 1, facultad: 'Ingeniería'
  },
  'lenguaje_y_comunicacion_I.pdf': {
    codigo: 'USIL-COM101', nombre: 'Lenguaje y Comunicación I', creditos: 3, ciclo: 1, facultad: 'Humanidades'
  },
  'lenguaje_y_comunicacion_II.pdf': {
    codigo: 'USIL-COM102', nombre: 'Lenguaje y Comunicación II', creditos: 3, ciclo: 2, facultad: 'Humanidades'
  },
  'matematica.pdf': {
    codigo: 'USIL-MAT100', nombre: 'Matemática', creditos: 4, ciclo: 1, facultad: 'Ingeniería'
  },
  'matematica_discreta.pdf': {
    codigo: 'USIL-MAT201', nombre: 'Matemática Discreta', creditos: 4, ciclo: 2, facultad: 'Ingeniería'
  },
  'programacion_orientada_a_objetos_I.pdf': {
    codigo: 'USIL-CS201', nombre: 'Programación Orientada a Objetos I', creditos: 4, ciclo: 2, facultad: 'Ingeniería'
  },
  'realidad_nacional_y_globalizacion.pdf': {
    codigo: 'USIL-HUM201', nombre: 'Realidad Nacional y Globalización', creditos: 3, ciclo: 2, facultad: 'Humanidades'
  }
};

async function processPDFs() {
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.pdf'));
  const cursosExtracted = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(dataDir, file);
    const dataBuffer = fs.readFileSync(filePath);
    
    try {
      const data = await pdf(dataBuffer);
      
      // Limpiar texto (quitar multiples saltos de linea, tabular, etc)
      let text = data.text.replace(/\s+/g, ' ').trim();
      
      // Tomar los primeros 1000 caracteres (suficiente para embeddings semantic)
      // para no saturar el token limit del modelo Xenova/all-MiniLM-L6-v2 (~512 tokens max)
      const temario = text.substring(0, 1500); 

      const courseInfo = fileToCourseMap[file];
      if (courseInfo) {
        cursosExtracted.push({
          id: `U-${i + 1}`,
          ...courseInfo,
          temario: temario
        });
        console.log(`✅ Procesado: ${file}`);
      } else {
        console.log(`⚠️ Archivo sin mapeo: ${file}`);
      }
    } catch (err) {
      console.error(`❌ Error al procesar ${file}:`, err);
    }
  }

  // Escribir a un JSON temporal para luego inyectarlo en db.js
  const outputPath = path.join(__dirname, 'usil_cursos_with_temario.json');
  fs.writeFileSync(outputPath, JSON.stringify(cursosExtracted, null, 2), 'utf8');
  console.log(`\n🎉 Extracción completada. Guardado en: ${outputPath}`);
}

processPDFs();
