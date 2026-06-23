/** Reinicia datos de mallas en localStorage antes de cada prueba E2E. */
export async function resetMallasStorage(page) {
  await page.goto('/public/modulos/mallas/');
  await page.evaluate(() => localStorage.removeItem('usil_mallas_v1'));
  await page.reload();
}
