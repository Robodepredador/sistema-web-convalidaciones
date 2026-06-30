/* ============================================================
   IA Config — gestión de modelos de IA en localStorage
   ============================================================ */

const STORAGE_KEY = 'usil_ia_models_v1';

export const PROVIDERS = {
  openrouter: {
    name: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    hint: 'API key en openrouter.ai → Keys'
  },
  together: {
    name: 'Together AI',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    hint: 'API key en api.together.xyz → Settings'
  },
  nvidia: {
    name: 'NVIDIA NIM',
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    hint: 'API key en build.nvidia.com → API Keys'
  },
  custom: {
    name: 'Personalizado',
    endpoint: '',
    hint: 'Ingresa el endpoint compatible con OpenAI'
  }
};

export function getModels() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveModels(models) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

export function getActiveVisionModel() {
  return getModels().find(m => m.activo && m.capacidades.includes('vision')) || null;
}

// Cualquier modelo activo — para tareas de texto (no requiere visión)
export function getAnyActiveModel() {
  return getModels().find(m => m.activo) || null;
}

export function addModel(data) {
  const models = getModels();
  const model = { ...data, id: `model_${Date.now()}` };
  models.push(model);
  saveModels(models);
  return model;
}

export function updateModel(id, updates) {
  const models = getModels();
  const idx = models.findIndex(m => m.id === id);
  if (idx === -1) return false;
  models[idx] = { ...models[idx], ...updates };
  saveModels(models);
  return true;
}

export function deleteModel(id) {
  saveModels(getModels().filter(m => m.id !== id));
}

export async function testConnection(model) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${model.apiKey}`
  };
  if (model.proveedor === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'USIL ERP - Connection Test';
  }

  const res = await fetch(model.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model.modelId,
      messages: [{ role: 'user', content: 'Reply with just "OK".' }],
      max_tokens: 5
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[ai-config] Respuesta API:', res.status, text);
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || 'OK';
}
