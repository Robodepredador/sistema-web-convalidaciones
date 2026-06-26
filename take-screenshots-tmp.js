import { chromium } from '@playwright/test';

const OUT = String.raw`C:\Users\LEGION\AppData\Local\Temp\claude\C--Users-LEGION-Desktop-CONVALIDACIONES-USIL-SISTEMA-WEB\14f8b14a-61ba-4457-94a9-1ec12145b017\scratchpad`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const pg = await ctx.newPage();

async function shot(name) {
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: OUT + '\\\\' + name + '.png', fullPage: false });
  console.log('shot:', name);
}

await pg.goto('http://127.0.0.1:5500/public/modulos/simulaciones/', { waitUntil: 'networkidle' });
await shot('sim-bandeja');

const btn1 = pg.locator('button:has-text("Ver detalle")').first();
await btn1.click();
await shot('sim-detalle');

await pg.goto('http://127.0.0.1:5500/public/modulos/convalidaciones/', { waitUntil: 'networkidle' });
await shot('conv-bandeja');

const btn2 = pg.locator('button:has-text("Ver detalle")').first();
await btn2.click();
await shot('conv-detalle');

await pg.goto('http://127.0.0.1:5500/public/modulos/reportes/', { waitUntil: 'networkidle' });
await shot('rep-equivalencias');

await pg.click('button[data-tab="convalidaciones"]');
await pg.waitForTimeout(600);
await shot('rep-convalidaciones');

await pg.click('button[data-tab="actividad"]');
await pg.waitForTimeout(600);
await shot('rep-actividad');

await browser.close();
console.log('Done.');
