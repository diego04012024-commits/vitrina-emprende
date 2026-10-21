// =============================================================
//  Pruebas de rendimiento: miden el tiempo de carga de cada página
//  y el tiempo que tarda el catálogo en mostrar 200 productos.
// =============================================================
const { test, expect } = require("@playwright/test");

const LIMITE_CARGA_MS = 2000;   // página lista para usar
const LIMITE_CATALOGO_MS = 1500; // pintar 200 productos

for (const pagina of ["index.html", "producto.html", "registro.html"]) {
  test(`PR-01 ${pagina} carga en menos de ${LIMITE_CARGA_MS} ms`, async ({ page }) => {
    await page.goto("/" + pagina, { waitUntil: "domcontentloaded" });
    const ms = await page.evaluate(() => {
      const n = performance.getEntriesByType("navigation")[0];
      return Math.round(n.domContentLoadedEventEnd - n.startTime);
    });
    test.info().annotations.push({ type: "tiempo", description: `${pagina}: ${ms} ms` });
    expect(ms).toBeLessThan(LIMITE_CARGA_MS);
  });
}

test(`PR-02 el catálogo muestra 200 productos en menos de ${LIMITE_CATALOGO_MS} ms`, async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.locator(".tarjeta")).toHaveCount(12);
  // Genera 200 productos de prueba en el almacenamiento local
  await page.evaluate(() => {
    const base = JSON.parse(localStorage.getItem("ve_productos"));
    const muchos = Array.from({ length: 200 }, (_, i) => ({ ...base[i % base.length], id: "carga-" + i, nombre: "Producto de carga " + i, fecha: Date.now() - i }));
    localStorage.setItem("ve_productos", JSON.stringify(muchos));
  });
  const inicio = Date.now();
  await page.reload();
  await expect(page.locator(".tarjeta")).toHaveCount(200);
  const ms = Date.now() - inicio;
  test.info().annotations.push({ type: "tiempo", description: `200 productos: ${ms} ms` });
  expect(ms).toBeLessThan(LIMITE_CATALOGO_MS);
});
