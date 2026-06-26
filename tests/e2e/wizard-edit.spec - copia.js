import { test, expect } from '@playwright/test';
import { resetMallasStorage } from './helpers.js';

test.describe('Wizard — edición de malla existente', () => {
  test.beforeEach(async ({ page }) => {
    await resetMallasStorage(page);
  });
  test('botón editar abre wizard precargado', async ({ page }) => {
    await page.goto('/public/modulos/mallas/');
    await page.locator('[data-edit-id="malla-001"]').click();

    await expect(page).toHaveURL(/edit=malla-001/);
    await expect(page.locator('#cab-carrera')).toHaveValue('Ingeniería de Software');
    await expect(page.locator('#cab-periodo')).toHaveValue('2024-01');
    await expect(page.locator('.page-header__title')).toContainText('Edición');
  });

  test('actualizar versión y publicar', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await page.goto('/public/modulos/malla-nueva/?edit=malla-006');
    await expect(page.locator('#cab-carrera')).toHaveValue('Ingeniería Civil');

    await page.fill('#cab-version', '3');
    await page.click('#s1-next');
    await page.click('#s2-next');
    await page.click('#s3m-next');
    await page.click('#s4-publish');

    await expect(page).toHaveURL(/modulos\/mallas/);
    await page.selectOption('#filter-carrera', 'Ingeniería Civil');
    await expect(page.locator('#table-body')).toContainText('v3');
    await expect(page.locator('#table-body')).toContainText('Ingeniería Civil');
  });
});
