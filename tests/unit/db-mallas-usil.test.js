import { describe, it, expect, beforeEach } from 'vitest';
import { db, resetDb, setDbDelay } from '../../shared/js/db.js';

describe('db — mallas USIL (capa async unificada)', () => {
  beforeEach(() => {
    setDbDelay(0);
    resetDb();
  });

  it('getMallasUsil devuelve los datos semilla', async () => {
    const mallas = await db.getMallasUsil();
    expect(mallas).toHaveLength(8);
  });

  it('getMallaUsilById encuentra por id', async () => {
    const malla = await db.getMallaUsilById('malla-001');
    expect(malla?.carrera).toBe('Ingeniería de Software');
  });

  it('getMallaUsilById devuelve null si no existe', async () => {
    expect(await db.getMallaUsilById('no-existe')).toBeNull();
  });

  it('createMallaUsil agrega la malla al inicio', async () => {
    const saved = await db.createMallaUsil({
      unidad: 'Pregrado',
      facultad: 'Ingeniería y Ciencias',
      carrera: 'Nueva Carrera Test',
      modalidad: 'presencial',
      periodo: '2025-01',
      version: 'v1.0.0',
      estado: 'activo'
    });
    const mallas = await db.getMallasUsil();
    expect(mallas[0].id).toBe(saved.id);
    expect(mallas).toHaveLength(9);
    expect((await db.getMallaUsilById(saved.id))?.carrera).toBe('Nueva Carrera Test');
  });

  it('updateMallaUsil modifica una malla existente', async () => {
    const updated = await db.updateMallaUsil('malla-001', { version: 'v9.9.9' });
    expect(updated?.version).toBe('v9.9.9');
    expect((await db.getMallaUsilById('malla-001'))?.version).toBe('v9.9.9');
  });

  it('updateMallaUsil devuelve null si el id no existe', async () => {
    expect(await db.updateMallaUsil('no-existe', { version: 'v1' })).toBeNull();
  });
});
