import { test, expect } from '@playwright/test';
import { resetMallasStorage } from './helpers.js';

async function fillCabecera(page) {
  await page.selectOption('#cab-unidad', 'Pregrado');
  await page.selectOption('#cab-facultad', 'Ingeniería y Ciencias');
  await page.selectOption('#cab-carrera', 'Ingeniería Civil');
  await page.fill('#cab-periodo', '2025-02');
  await page.fill('#cab-version', '1');
}

test.describe('Wizard — flujo manual (4 pasos)', () => {
  test.beforeEach(async ({ page }) => {
    await resetMallasStorage(page);
    await page.goto('/public/modulos/malla-nueva/');
  });

  test('Paso 1: validación de campos obligatorios', async ({ page }) => {
    await page.click('#s1-next');
    await expect(page.locator('#cab-unidad').locator('..')).toHaveClass(/has-error/);
    await expect(page.locator('#panel-1')).toHaveClass(/is-active/);
  });

  test('Paso 1: detecta periodo duplicado RF-03', async ({ page }) => {
    await page.selectOption('#cab-unidad', 'Pregrado');
    await page.selectOption('#cab-facultad', 'Ingeniería y Ciencias');
    await page.selectOption('#cab-carrera', 'Ingeniería de Software');
    await page.fill('#cab-periodo', '2024-01');
    await page.fill('#cab-version', '1');
    await page.click('#s1-next');
    await expect(page.locator('[data-error-for="cab-periodo"]').locator('..')).toHaveClass(/has-error/);
  });

  test('Paso 1→2→3→4: registro manual completo', async ({ page }) => {
    await fillCabecera(page);
    await page.click('#s1-next');
    await expect(page.locator('#panel-2')).toHaveClass(/is-active/);
    await expect(page.locator('#choice-manual')).toHaveClass(/is-selected/);

    await page.click('#s2-next');
    await expect(page.locator('#panel-3')).toHaveClass(/is-active/);
    await expect(page.locator('#step3-manual')).toBeVisible();
    await expect(page.locator('#ctx-title')).toContainText('Ingeniería Civil - Plan 2025');

    await expect(page.locator('#course-tbody tr')).not.toHaveCount(0);
    await expect(page.locator('#course-total')).not.toHaveText('0');

    await page.click('#s3m-next');
    await expect(page.locator('#panel-4')).toHaveClass(/is-active/);
    await expect(page.locator('#summary-institucional')).toContainText('Ingeniería Civil');
    await expect(page.locator('.ciclo-label').first()).toBeVisible();
  });

  test('Paso 3: soft delete y mensaje sin cursos', async ({ page }) => {
    await fillCabecera(page);
    await page.click('#s1-next');
    await page.click('#s2-next');

    const deleteButtons = page.locator('.row-del');
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      await page.locator('.row-del').first().click();
    }
    await expect(page.locator('.table-empty')).toContainText('No hay cursos');

    await page.click('#s3m-next');
    await expect(page.locator('#courses-error')).toContainText('al menos un curso');
  });

  test('Stepper muestra check en pasos completados', async ({ page }) => {
    await fillCabecera(page);
    await page.click('#s1-next');
    await expect(page.locator('#step-1')).toHaveClass(/is-done/);
    await expect(page.locator('#step-1 .step__num [data-icon="check"]')).toBeVisible();
  });

  test('publicar persiste malla y redirige a lista', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    await fillCabecera(page);
    await page.click('#s1-next');
    await page.click('#s2-next');
    await page.click('#s3m-next');
    await page.click('#s4-publish');

    await expect(page).toHaveURL(/modulos\/mallas/);
    await expect(page.locator('#table-body')).toContainText('Ingeniería Civil');
    await expect(page.locator('#pagination-info')).toContainText('de 9 mallas');
  });
});
