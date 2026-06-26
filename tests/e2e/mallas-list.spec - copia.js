import { test, expect } from '@playwright/test';
import { resetMallasStorage } from './helpers.js';

test.describe('Lista de Mallas', () => {
  test.beforeEach(async ({ page }) => {
    await resetMallasStorage(page);
  });

  test('carga tabla con paginación y stat de activas', async ({ page }) => {
    await expect(page.locator('.page-header__title')).toHaveText('Gestión de Mallas Curriculares');
    await expect(page.locator('#stat-activas')).toHaveText('6');
    await expect(page.locator('#table-body tr')).toHaveCount(4);
    await expect(page.locator('#pagination-info')).toContainText('Mostrando 4 de 8');
  });

  test('filtros actualizan la tabla', async ({ page }) => {
    await page.selectOption('#filter-unidad', 'Postgrado');
    await expect(page.locator('#table-body tr')).not.toHaveCount(0);
    const rows = page.locator('#table-body tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).locator('td').first()).toHaveText('Postgrado');
    }
  });

  test('limpiar filtros restaura todas las mallas', async ({ page }) => {
    await page.selectOption('#filter-carrera', 'Ingeniería de Software');
    await page.click('#filter-clear');
    await expect(page.locator('#pagination-info')).toContainText('de 8 mallas');
  });

  test('paginación avanza a página 2', async ({ page }) => {
    await page.click('[data-go="2"]');
    await expect(page.locator('.page-btn.is-active')).toHaveText('2');
    await expect(page.locator('#pagination-info')).toContainText('Mostrando 4 de 8');
  });

  test('navega al wizard desde botón principal', async ({ page }) => {
    await page.click('#nueva-malla');
    await expect(page).toHaveURL(/malla-nueva/);
    await expect(page.locator('#panel-1')).toHaveClass(/is-active/);
  });
});
