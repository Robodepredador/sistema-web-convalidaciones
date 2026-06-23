import { test, expect } from '@playwright/test';
import { resetMallasStorage } from './helpers.js';

test.describe('Wizard — rama Excel', () => {
  test.beforeEach(async ({ page }) => {
    await resetMallasStorage(page);
    await page.goto('/public/modulos/malla-nueva/');
  });

  test('requiere archivo antes de continuar', async ({ page }) => {
    await page.selectOption('#cab-unidad', 'Educación Continua');
    await page.selectOption('#cab-facultad', 'Negocios y Economía');
    await page.selectOption('#cab-carrera', 'Diplomado en Finanzas');
    await page.fill('#cab-periodo', '2025-01');
    await page.click('#s1-next');

    await page.click('#choice-excel');
    await page.click('#s2-next');
    await expect(page.locator('#step3-excel')).toBeVisible();

    await page.click('#s3e-next');
    await expect(page.locator('#excel-error')).toContainText('Debe cargar un archivo');
  });

  test('carga Excel simulada y avanza al resumen', async ({ page }) => {
    await page.selectOption('#cab-unidad', 'Educación Continua');
    await page.selectOption('#cab-facultad', 'Ingeniería y Ciencias');
    await page.selectOption('#cab-carrera', 'Diplomado en IA Aplicada');
    await page.fill('#cab-periodo', '2025-02');
    await page.click('#s1-next');

    await page.click('#choice-excel');
    await page.click('#s2-next');

    await page.setInputFiles('#file-input', {
      name: 'malla-test.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('mock excel content')
    });

    await expect(page.locator('#dropzone-file')).toContainText('malla-test.xlsx');
    await page.click('#s3e-next');
    await expect(page.locator('#panel-4')).toHaveClass(/is-active/);
    await expect(page.locator('#summary-curriculum')).toContainText('Curso importado Excel');
  });

  test('cambio manual a Excel desde paso 3-B', async ({ page }) => {
    await page.selectOption('#cab-unidad', 'Pregrado');
    await page.selectOption('#cab-facultad', 'Negocios y Economía');
    await page.selectOption('#cab-carrera', 'Administración');
    await page.fill('#cab-periodo', '2025-01');
    await page.click('#s1-next');
    await page.click('#s2-next');

    await expect(page.locator('#step3-manual')).toBeVisible();
    await page.click('#s3m-import');
    await expect(page.locator('#step3-excel')).toBeVisible();
  });
});
