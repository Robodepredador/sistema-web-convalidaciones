import { test } from '@playwright/test';
import path from 'path';

const OUT = String.raw`C:\Users\LEGION\AppData\Local\Temp\claude\C--Users-LEGION-Desktop-CONVALIDACIONES-USIL-SISTEMA-WEB\14f8b14a-61ba-4457-94a9-1ec12145b017\scratchpad`;

test('screenshot simulaciones bandeja', async ({ page }) => {
  await page.goto('/public/modulos/simulaciones/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'sim-bandeja.png') });
});

test('screenshot simulaciones detalle', async ({ page }) => {
  await page.goto('/public/modulos/simulaciones/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Ver detalle")').first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'sim-detalle.png') });
});

test('screenshot convalidaciones bandeja', async ({ page }) => {
  await page.goto('/public/modulos/convalidaciones/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'conv-bandeja.png') });
});

test('screenshot convalidaciones detalle', async ({ page }) => {
  await page.goto('/public/modulos/convalidaciones/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Ver detalle")').first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, 'conv-detalle.png') });
});

test('screenshot reportes equivalencias', async ({ page }) => {
  await page.goto('/public/modulos/reportes/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'rep-eq.png') });
});

test('screenshot reportes convalidaciones tab', async ({ page }) => {
  await page.goto('/public/modulos/reportes/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.click('button[data-tab="convalidaciones"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, 'rep-conv.png') });
});

test('screenshot reportes actividad tab', async ({ page }) => {
  await page.goto('/public/modulos/reportes/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.click('button[data-tab="actividad"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, 'rep-act.png') });
});
