/* ============================================================
   Centro IA — Gestión de modelos de inteligencia artificial
   ============================================================ */

import {
  PROVIDERS,
  getModels,
  addModel,
  updateModel,
  deleteModel,
  testConnection
} from '../../../shared/js/ia/ai-config.js';

function safeRenderIcons(root) {
  if (typeof renderIcons === 'function') renderIcons(root || document.body);
}

/* ── Secciones ───────────────────────────────────────────── */
function showSection(id) {
  document.querySelectorAll('.module-section').forEach(s => s.classList.remove('is-active'));
  document.getElementById(id).classList.add('is-active');
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
}

/* ── Stat cards ──────────────────────────────────────────── */
function updateStats() {
  const models = getModels();
  document.getElementById('stat-total').textContent   = models.length;
  document.getElementById('stat-activos').textContent = models.filter(m => m.activo).length;
  const vision = models.find(m => m.activo && m.capacidades.includes('vision'));
  document.getElementById('stat-vision').textContent  = vision ? vision.nombre : '—';
}

/* ── Model cards ─────────────────────────────────────────── */
function buildModelCard(m) {
  const providerName = PROVIDERS[m.proveedor]?.name || m.proveedor;
  const estadoActivo = m.activo;
  const capsHtml = m.capacidades.map(c => `
    <span class="cap-chip cap-chip--${c}">${c === 'vision' ? 'Visión' : 'Texto'}</span>
  `).join('');

  const maskedKey = m.apiKey
    ? m.apiKey.slice(0, 8) + '•'.repeat(Math.min(16, m.apiKey.length - 8))
    : '(no configurada)';

  return `
    <div class="model-card" data-model-id="${m.id}">
      <div class="model-card__head">
        <div class="model-card__info">
          <div class="model-card__name">${escapeHtml(m.nombre)}</div>
          <div class="model-card__provider">${escapeHtml(providerName)}</div>
        </div>
        <span class="badge badge--${estadoActivo ? 'active' : 'inactive'}">
          <span class="badge__dot"></span>${estadoActivo ? 'Activo' : 'Inactivo'}
        </span>
      </div>
      <div class="model-card__body">
        <div class="model-card__field">
          <span class="model-card__field-label">Model ID</span>
          <span class="model-card__field-val">${escapeHtml(m.modelId)}</span>
        </div>
        <div class="model-card__field">
          <span class="model-card__field-label">API Key</span>
          <span class="model-card__field-val" style="font-family:monospace">${escapeHtml(maskedKey)}</span>
        </div>
        <div class="model-card__field">
          <span class="model-card__field-label">Capacidades</span>
          <div class="model-card__caps">${capsHtml}</div>
        </div>
      </div>
      <div class="model-card__foot">
        <div class="model-card__actions">
          <button class="btn btn--outline btn--sm" data-action="test" data-id="${m.id}" data-icon="check">Probar</button>
          <button class="btn btn--outline btn--sm" data-action="edit" data-id="${m.id}" data-icon="edit">Editar</button>
          <button class="btn btn--danger btn--sm"  data-action="del"  data-id="${m.id}" data-icon="trash">Eliminar</button>
        </div>
        <span class="test-result" id="test-${m.id}" hidden></span>
      </div>
    </div>`;
}

function renderModels() {
  const models = getModels();
  const container = document.getElementById('models-container');

  if (!models.length) {
    container.innerHTML = `
      <div class="ia-empty">
        <div class="ia-empty__icon"><span data-icon="ai"></span></div>
        <div class="ia-empty__title">Sin modelos configurados</div>
        <div class="ia-empty__desc">Agrega tu primer modelo de IA para habilitar la extracción automática de mallas curriculares desde PDF.</div>
        <button class="btn btn--primary" id="empty-add">Agregar Modelo</button>
      </div>`;
    safeRenderIcons(container);
    document.getElementById('empty-add').addEventListener('click', openAddForm);
    return;
  }

  container.innerHTML = `<div class="models-grid">${models.map(buildModelCard).join('')}</div>`;
  safeRenderIcons(container);
  updateStats();
}

/* ── Formulario ──────────────────────────────────────────── */
function getProviderEndpoint(proveedor) {
  return PROVIDERS[proveedor]?.endpoint || '';
}

function syncProviderFields(proveedor) {
  const endpointInput = document.getElementById('f-endpoint');
  const hint = document.getElementById('f-provider-hint');
  const ep = getProviderEndpoint(proveedor);
  if (ep) endpointInput.value = ep;
  endpointInput.readOnly = proveedor !== 'custom';
  hint.textContent = PROVIDERS[proveedor]?.hint || '';
}

function openAddForm() {
  document.getElementById('form-title').textContent = 'Agregar Modelo de IA';
  document.getElementById('form-model-id').value = '';
  document.getElementById('model-form').reset();
  document.getElementById('cap-vision').checked = true;
  document.getElementById('cap-texto').checked  = true;
  document.getElementById('f-activo').checked   = true;
  document.getElementById('form-test-result').textContent = '';
  syncProviderFields('openrouter');
  showSection('section-form');
}

function openEditForm(id) {
  const model = getModels().find(m => m.id === id);
  if (!model) return;

  document.getElementById('form-title').textContent = 'Editar Modelo de IA';
  document.getElementById('form-model-id').value = model.id;
  document.getElementById('f-nombre').value      = model.nombre;
  document.getElementById('f-proveedor').value   = model.proveedor;
  document.getElementById('f-endpoint').value    = model.endpoint;
  document.getElementById('f-model-id').value    = model.modelId;
  document.getElementById('f-api-key').value     = model.apiKey;
  document.getElementById('cap-vision').checked  = model.capacidades.includes('vision');
  document.getElementById('cap-texto').checked   = model.capacidades.includes('texto');
  document.getElementById('f-activo').checked    = model.activo;
  document.getElementById('f-endpoint').readOnly = model.proveedor !== 'custom';
  document.getElementById('f-provider-hint').textContent = PROVIDERS[model.proveedor]?.hint || '';
  document.getElementById('form-test-result').textContent = '';
  showSection('section-form');
}

function collectFormModel() {
  const caps = [];
  if (document.getElementById('cap-vision').checked) caps.push('vision');
  if (document.getElementById('cap-texto').checked)  caps.push('texto');

  return {
    nombre:      document.getElementById('f-nombre').value.trim(),
    proveedor:   document.getElementById('f-proveedor').value,
    endpoint:    document.getElementById('f-endpoint').value.trim(),
    modelId:     document.getElementById('f-model-id').value.trim(),
    apiKey:      document.getElementById('f-api-key').value.trim(),
    capacidades: caps,
    activo:      document.getElementById('f-activo').checked
  };
}

function validateForm(data) {
  const errors = {};
  if (!data.nombre)   errors['f-nombre']   = 'El nombre es obligatorio';
  if (!data.endpoint) errors['f-endpoint'] = 'El endpoint es obligatorio';
  if (!data.modelId)  errors['f-model-id'] = 'El Model ID es obligatorio';
  if (!data.apiKey)   errors['f-api-key']  = 'La API Key es obligatoria';

  Object.entries(errors).forEach(([id, msg]) => {
    const el = document.querySelector(`[data-error-for="${id}"]`);
    if (el) el.textContent = msg;
    document.getElementById(id)?.closest('.field')?.classList.add('has-error');
  });
  Object.keys(PROVIDERS).forEach(() => {});
  if (!Object.keys(errors).length) {
    document.querySelectorAll('.field.has-error').forEach(f => {
      f.classList.remove('has-error');
      const err = f.querySelector('.field__error');
      if (err) err.textContent = '';
    });
  }
  return Object.keys(errors).length === 0;
}

/* ── Eventos ─────────────────────────────────────────────── */
function bindEvents() {
  // App-action (header button "Agregar Modelo")
  document.addEventListener('app-action', openAddForm);

  // Volver / cancelar
  document.getElementById('form-back').addEventListener('click', () => {
    showSection('section-bandeja');
    renderModels();
  });
  document.getElementById('form-cancel').addEventListener('click', () => {
    showSection('section-bandeja');
    renderModels();
  });

  // Sync endpoint cuando cambia el proveedor
  document.getElementById('f-proveedor').addEventListener('change', e => {
    syncProviderFields(e.target.value);
  });

  // Guardar modelo
  document.getElementById('model-form').addEventListener('submit', e => {
    e.preventDefault();
    const data = collectFormModel();
    if (!validateForm(data)) return;

    const editingId = document.getElementById('form-model-id').value;
    if (editingId) {
      updateModel(editingId, data);
    } else {
      addModel(data);
    }
    showSection('section-bandeja');
    renderModels();
  });

  // Probar conexión desde el formulario
  document.getElementById('form-test').addEventListener('click', async () => {
    const data = collectFormModel();
    const btn = document.getElementById('form-test');
    const result = document.getElementById('form-test-result');
    btn.disabled = true;
    result.textContent = 'Probando...';
    result.className = 'test-inline__result';
    try {
      await testConnection(data);
      result.textContent = '✓ Conexión exitosa';
      result.className = 'test-inline__result test-inline__result--ok';
    } catch (err) {
      result.textContent = '✗ ' + err.message.slice(0, 80);
      result.className = 'test-inline__result test-inline__result--error';
    } finally {
      btn.disabled = false;
    }
  });

  // Delegación en el contenedor de modelos
  document.getElementById('models-container').addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;

    if (action === 'edit') {
      openEditForm(id);
    } else if (action === 'del') {
      const model = getModels().find(m => m.id === id);
      if (!model) return;
      if (!confirm(`¿Eliminar el modelo "${model.nombre}"?\nLas integraciones que lo usen dejarán de funcionar.`)) return;
      deleteModel(id);
      renderModels();
    } else if (action === 'test') {
      const model = getModels().find(m => m.id === id);
      if (!model) return;
      const resultEl = document.getElementById(`test-${id}`);
      resultEl.className = 'test-result test-result--pending';
      resultEl.textContent = 'Probando…';
      resultEl.hidden = false;
      btn.disabled = true;
      try {
        const reply = await testConnection(model);
        resultEl.className = 'test-result test-result--ok';
        resultEl.textContent = '✓ Conectado';
        console.info('[Centro IA] Conexión exitosa. Respuesta:', reply);
      } catch (err) {
        resultEl.className = 'test-result test-result--error';
        resultEl.textContent = '✗ ' + err.message.slice(0, 60);
        console.error('[Centro IA] Error de conexión:', err.message);
      } finally {
        btn.disabled = false;
      }
    }
  });
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
  updateStats();
  renderModels();
  bindEvents();
});
