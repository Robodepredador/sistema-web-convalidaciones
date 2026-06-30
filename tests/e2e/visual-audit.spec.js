/**
 * VISUAL AUDIT — Screenshots completos con scroll
 * Cubre: Landing page, Wizard de simulación (pasos 1-7),
 *        y todos los módulos del ERP interno (flujo superusuario).
 */
import { test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../../test-results/visual-audit');

async function snap(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
}

async function snapVP(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
}

async function scrollAndSnap(page, name) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let total = 0;
      const timer = setInterval(() => {
        window.scrollBy(0, 400);
        total += 400;
        if (total >= document.body.scrollHeight + 400) { clearInterval(timer); resolve(); }
      }, 120);
    });
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await snap(page, name);
}

// Helper: sube un archivo fake al paso 3 del wizard
async function subirArchivoPaso3(page) {
  const fcP = page.waitForEvent('filechooser');
  await page.click('#btn-select-files');
  const fc = await fcP.catch(() => null);
  if (fc) {
    await fc.setFiles({ name: 'certificado.pdf', mimeType: 'application/pdf', buffer: Buffer.from('PDF-TEST') });
    await page.waitForTimeout(400);
  }
}

// Helper: completa pasos 1 y 2 del wizard
async function completarPasos12(page) {
  await page.fill('#p1-nombres', 'María Elena');
  await page.fill('#p1-apellidos', 'Torres Huamán');
  await page.selectOption('#p1-tipo-doc', 'DNI');
  await page.fill('#p1-num-doc', '72345678');
  await page.fill('#p1-email', 'maria@gmail.com');
  await page.fill('#p1-telefono', '987123456');
  await page.click('#btn-paso1-sig');
  await page.waitForTimeout(400);
  await page.selectOption('#p2-tipo-inst', 'INSTITUTO');
  await page.fill('#p2-nombre-inst', 'SENATI');
  await page.fill('#p2-carrera', 'Ingeniería de Software');
  await page.selectOption('#p2-anio-ingreso', '2021');
  await page.selectOption('#p2-anio-egreso', '2023');
  await page.click('#btn-paso2-sig');
  await page.waitForTimeout(400);
}

// Helper: selecciona primera facultad + carrera disponible
async function seleccionarCarreraUsil(page) {
  const opts = await page.locator('#p4-facultad option').allTextContents();
  const fac = opts.find(o => o.trim() && !o.includes('Seleccionar'));
  if (!fac) return;
  await page.selectOption('#p4-facultad', { label: fac.trim() });
  await page.waitForTimeout(700);
  const carOpts = await page.locator('#p4-carrera option').allTextContents();
  const car = carOpts.find(o => o.trim() && !o.includes('Seleccionar') && !o.includes('Primero'));
  if (car) { await page.selectOption('#p4-carrera', { label: car.trim() }); await page.waitForTimeout(300); }
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

test('01 landing: hero + navbar', async ({ page }) => {
  await page.goto('/public/landing/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snapVP(page, '01-landing-hero');
});

test('02 landing: página completa full-scroll', async ({ page }) => {
  await page.goto('/public/landing/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await scrollAndSnap(page, '02-landing-full');
});

test('03 landing: sección features', async ({ page }) => {
  await page.goto('/public/landing/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.locator('.ln-features').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await snapVP(page, '03-landing-features');
});

test('04 landing: sección proceso', async ({ page }) => {
  await page.goto('/public/landing/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.locator('.ln-process').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await snapVP(page, '04-landing-proceso');
});

test('05 landing: stats + CTA + footer', async ({ page }) => {
  await page.goto('/public/landing/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.locator('.ln-footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await snapVP(page, '05-landing-footer');
});

// ─── WIZARD: PASOS 1-7 ───────────────────────────────────────────────────────

test('06 wizard: paso 1 vacío', async ({ page }) => {
  await page.goto('/public/landing/simulacion.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await snapVP(page, '06-wizard-paso1-vacio');
});

test('07 wizard: paso 1 errores de validación', async ({ page }) => {
  await page.goto('/public/landing/simulacion.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.click('#btn-paso1-sig');
  await page.waitForTimeout(400);
  await snapVP(page, '07-wizard-paso1-errores');
});

test('08 wizard: paso 2 institución', async ({ page }) => {
  await page.goto('/public/landing/simulacion.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#p1-nombres', 'María Elena');
  await page.fill('#p1-apellidos', 'Torres Huamán');
  await page.selectOption('#p1-tipo-doc', 'DNI');
  await page.fill('#p1-num-doc', '72345678');
  await page.fill('#p1-email', 'maria@gmail.com');
  await page.fill('#p1-telefono', '987123456');
  await page.click('#btn-paso1-sig');
  await page.waitForTimeout(600);
  await snapVP(page, '08-wizard-paso2');
});

test('09 wizard: paso 3 documentos (zona upload)', async ({ page }) => {
  await page.goto('/public/landing/simulacion.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await completarPasos12(page);
  await snapVP(page, '09-wizard-paso3-upload');
});

test('10 wizard: paso 3 con archivo cargado', async ({ page }) => {
  await page.goto('/public/landing/simulacion.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await completarPasos12(page);
  await subirArchivoPaso3(page);
  await snapVP(page, '10-wizard-paso3-con-archivo');
});

test('11 wizard: paso 4 carrera USIL', async ({ page }) => {
  await page.goto('/public/landing/simulacion.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await completarPasos12(page);
  await subirArchivoPaso3(page);
  await page.click('#btn-paso3-sig');
  await page.waitForTimeout(600);
  await snapVP(page, '11-wizard-paso4-vacio');
});

test('12 wizard: paso 4 con facultad y carrera seleccionada', async ({ page }) => {
  await page.goto('/public/landing/simulacion.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await completarPasos12(page);
  await subirArchivoPaso3(page);
  await page.click('#btn-paso3-sig');
  await page.waitForTimeout(600);
  await seleccionarCarreraUsil(page);
  await snapVP(page, '12-wizard-paso4-seleccionado');
});

test('13 wizard: paso 5 confirmación/resumen', async ({ page }) => {
  await page.goto('/public/landing/simulacion.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await completarPasos12(page);
  await subirArchivoPaso3(page);
  await page.click('#btn-paso3-sig');
  await page.waitForTimeout(500);
  await seleccionarCarreraUsil(page);
  await page.click('#btn-paso4-sig');
  await page.waitForTimeout(700);
  await snapVP(page, '13-wizard-paso5-confirmacion');
  await snap(page, '13b-wizard-paso5-full');
});

test('14 wizard: paso 6 procesando IA', async ({ page }) => {
  await page.goto('/public/landing/simulacion.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await completarPasos12(page);
  await subirArchivoPaso3(page);
  await page.click('#btn-paso3-sig');
  await page.waitForTimeout(500);
  await seleccionarCarreraUsil(page);
  await page.click('#btn-paso4-sig');
  await page.waitForTimeout(500);
  await page.click('#btn-enviar-sim');
  await page.waitForTimeout(1000);
  await snapVP(page, '14-wizard-paso6-procesando');
});

test('15 wizard: paso 7 resultados completo', async ({ page }) => {
  await page.goto('/public/landing/simulacion.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await completarPasos12(page);
  await subirArchivoPaso3(page);
  await page.click('#btn-paso3-sig');
  await page.waitForTimeout(500);
  await seleccionarCarreraUsil(page);
  await page.click('#btn-paso4-sig');
  await page.waitForTimeout(500);
  await page.click('#btn-enviar-sim');
  await page.waitForSelector('#paso-7.is-active', { timeout: 12000 });
  await page.waitForTimeout(600);
  await snapVP(page, '15-wizard-paso7-resultados');
  await snap(page, '15b-wizard-paso7-full');
});

// ─── ERP INTERNO — FLUJO SUPERUSUARIO (Dr. Alberto Ruiz) ─────────────────────

test('20 erp: admisión bandeja', async ({ page }) => {
  await page.goto('/public/modulos/admision/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await snapVP(page, '20-erp-admision-bandeja');
  await snap(page, '20b-erp-admision-full');
});

test('21 erp: admisión detalle solicitud', async ({ page }) => {
  await page.goto('/public/modulos/admision/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const btn = page.locator('td button, button:has-text("Ver")').first();
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(1000); }
  await snapVP(page, '21-erp-admision-detalle');
});

test('22 erp: mallas listado', async ({ page }) => {
  await page.goto('/public/modulos/mallas/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await snapVP(page, '22-erp-mallas');
  await snap(page, '22b-erp-mallas-full');
});

test('23 erp: equivalencias wizard paso 1', async ({ page }) => {
  await page.goto('/public/modulos/equivalencias/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await snapVP(page, '23-erp-equiv-paso1');
  await snap(page, '23b-erp-equiv-full');
});

test('24 erp: instituciones', async ({ page }) => {
  await page.goto('/public/modulos/instituciones/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await snapVP(page, '24-erp-instituciones');
  await snap(page, '24b-erp-instituciones-full');
});

test('25 erp: simulaciones bandeja', async ({ page }) => {
  await page.goto('/public/modulos/simulaciones/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await snapVP(page, '25-erp-simulaciones-bandeja');
  await snap(page, '25b-erp-simulaciones-full');
});

test('26 erp: simulaciones detalle', async ({ page }) => {
  await page.goto('/public/modulos/simulaciones/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const btn = page.locator('button:has-text("Ver detalle")').first();
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(1000); }
  await snapVP(page, '26-erp-simulaciones-detalle');
  await snap(page, '26b-erp-simulaciones-detalle-full');
});

test('27 erp: convalidaciones bandeja', async ({ page }) => {
  await page.goto('/public/modulos/convalidaciones/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await snapVP(page, '27-erp-conv-bandeja');
  await snap(page, '27b-erp-conv-full');
});

test('28 erp: convalidaciones detalle + timeline', async ({ page }) => {
  await page.goto('/public/modulos/convalidaciones/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const btn = page.locator('button:has-text("Ver detalle")').first();
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(1000); }
  await snapVP(page, '28-erp-conv-detalle');
  await snap(page, '28b-erp-conv-detalle-full');
});

test('29 erp: reportes tab equivalencias', async ({ page }) => {
  await page.goto('/public/modulos/reportes/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await snapVP(page, '29-erp-reportes-eq');
  await snap(page, '29b-erp-reportes-eq-full');
});

test('30 erp: reportes tab convalidaciones', async ({ page }) => {
  await page.goto('/public/modulos/reportes/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.click('button[data-tab="convalidaciones"]');
  await page.waitForTimeout(800);
  await snapVP(page, '30-erp-reportes-conv');
});

test('31 erp: reportes tab actividad + gráfico', async ({ page }) => {
  await page.goto('/public/modulos/reportes/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.click('button[data-tab="actividad"]');
  await page.waitForTimeout(800);
  await snapVP(page, '31-erp-reportes-actividad');
  await snap(page, '31b-erp-reportes-actividad-full');
});

test('32 erp: usuarios', async ({ page }) => {
  await page.goto('/public/modulos/usuarios/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await snapVP(page, '32-erp-usuarios');
});

test('33 erp: centro-ia', async ({ page }) => {
  await page.goto('/public/modulos/centro-ia/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await snapVP(page, '33-erp-centro-ia');
});

test('34 erp: sidebar superusuario + navegación entre módulos', async ({ page }) => {
  // Visita admision y verifica que el sidebar muestra todos los módulos y el usuario
  await page.goto('/public/modulos/admision/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await snapVP(page, '34-erp-sidebar-superusuario');
  // Navegar a cada módulo desde el sidebar para verificar que funcionan
  const modulos = [
    { selector: 'a[href*="simulaciones"]', nombre: '34b-nav-simulaciones' },
    { selector: 'a[href*="convalidaciones"]', nombre: '34c-nav-convalidaciones' },
    { selector: 'a[href*="reportes"]', nombre: '34d-nav-reportes' },
  ];
  for (const m of modulos) {
    const link = page.locator(m.selector).first();
    if (await link.count()) {
      await link.click();
      await page.waitForTimeout(1500);
      await snapVP(page, m.nombre);
    }
  }
});
