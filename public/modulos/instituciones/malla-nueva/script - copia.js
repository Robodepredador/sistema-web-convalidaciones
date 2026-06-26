import { db } from '../../../../shared/js/db.js';

const urlParams = new URLSearchParams(window.location.search);
const institucionId = urlParams.get('inst');
const carreraId = urlParams.get('carr');

let institucion = null;
let carrera = null;

// Formularios
const anioInput = document.getElementById('cab-anio');
const codigoInput = document.getElementById('cab-codigo');

async function init() {
  if (!institucionId || !carreraId) {
    window.location.href = '../';
    return;
  }
  
  try {
    institucion = await db.getInstitucion(institucionId);
    carrera = await db.getCarrera(carreraId);
    document.getElementById('cab-inst').value = institucion.nombre;
    document.getElementById('cab-carr').value = carrera.nombre;
  } catch (e) {
    console.error(e);
    window.location.href = '../';
    return;
  }
  
  bindEvents();
}

function switchPanel(toStep) {
  document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('is-active'));
  document.getElementById(`panel-${toStep}`).classList.add('is-active');
  
  document.querySelectorAll('.step').forEach((el, index) => {
    if (index + 1 === toStep) {
      el.classList.add('is-active');
    } else {
      el.classList.remove('is-active');
    }
  });
}

function bindEvents() {
  // === PASO 1 ===
  document.getElementById('s1-back').addEventListener('click', () => {
    window.location.href = `../carrera/?inst=${institucionId}&carr=${carreraId}`;
  });

  document.getElementById('s1-next').addEventListener('click', () => {
    document.getElementById('err-anio').textContent = '';
    if (!anioInput.value.trim()) {
      document.getElementById('err-anio').textContent = 'Debe indicar el año o periodo.';
      return;
    }
    switchPanel(2);
  });

  // === PASO 2 ===
  document.getElementById('s2-back').addEventListener('click', () => switchPanel(1));
  
  document.querySelectorAll('.choice-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.choice-card').forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
    });
  });

  document.getElementById('s2-next').addEventListener('click', () => {
    const isAi = document.getElementById('choice-ai').classList.contains('is-selected');
    if (isAi) {
      switchPanel(3);
    } else {
      alert('En este mockup solo se ha implementado el flujo de Importación IA.');
    }
  });

  // === PASO 3 ===
  document.getElementById('s3-back').addEventListener('click', () => switchPanel(2));

  const fileInput = document.getElementById('file-input');
  const dropzone = document.getElementById('dropzone');
  const fileList = document.getElementById('file-list');
  const btnNext3 = document.getElementById('s3-next');
  const msgValid = document.getElementById('msg-valid-file');

  dropzone.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected();
    }
  });

  function handleFileSelected() {
    dropzone.hidden = true;
    fileList.hidden = false;
    btnNext3.disabled = false;
    msgValid.innerHTML = '<span style="color: var(--color-success)"><span data-icon="check" style="width: 14px; margin-right: 4px"></span>Se detectó 1 archivo válido para procesamiento.</span>';
    if (window.renderIcons) window.renderIcons(msgValid);
  }

  document.getElementById('btn-remove-file').addEventListener('click', () => {
    fileInput.value = '';
    dropzone.hidden = false;
    fileList.hidden = true;
    btnNext3.disabled = true;
    msgValid.textContent = 'Esperando archivo...';
  });

  btnNext3.addEventListener('click', () => {
    // Fill Resumen Data
    document.getElementById('res-inst').textContent = institucion.nombre;
    document.getElementById('res-carr').textContent = carrera.nombre;
    document.getElementById('res-anio').textContent = anioInput.value;
    document.getElementById('res-codigo').textContent = codigoInput.value || 'N/A';
    
    // Simulate AI Processing and go to step 4
    btnNext3.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; display: inline-block; animation: spin 1s linear infinite;"></span> Procesando...';
    btnNext3.disabled = true;
    
    setTimeout(() => {
      btnNext3.innerHTML = '<span class="btn__icon" data-icon="cpu"></span>Iniciar Procesamiento IA';
      switchPanel(4);
    }, 1500); // Mock processing time
  });

  // === PASO 4 ===
  document.getElementById('s4-back').addEventListener('click', () => switchPanel(3));
  
  document.getElementById('s4-publish').addEventListener('click', async () => {
    const btn = document.getElementById('s4-publish');
    const originalText = btn.innerHTML;
    btn.textContent = 'Guardando...';
    btn.disabled = true;
    
    try {
      await db.createMalla({
        carreraId: carreraId,
        institucionId: institucionId,
        anioCodigo: anioInput.value.trim(),
        codigoVisible: codigoInput.value.trim() || `TMP-${Math.floor(Math.random()*10000)}`,
        totalCursos: 42,
        creditos: 164,
        estado: 'ACTIVA'
      });
      
      window.location.href = `../carrera/?inst=${institucionId}&carr=${carreraId}`;
    } catch (error) {
      alert('Error al guardar malla');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
