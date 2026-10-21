// =============================================================
//  Pruebas de integración: recorren la página como lo haría un
//  usuario y comprueban que las capas (páginas, lógica y datos)
//  funcionen juntas. Ejecutar con:  npm test
// =============================================================
const { test, expect } = require("@playwright/test");
const path = require("path");

const FOTO = path.join(__dirname, "recursos", "foto-prueba.jpg");

async function crearCuenta(page, { nombre = "Lucía Mendoza", correo = "lucia@correo.pe", whatsapp = "987654321" } = {}) {
  await page.goto("/registro.html");
  await page.fill("#nombre", nombre);
  await page.selectOption("#carrera", "Diseño Gráfico");
  await page.fill("#correo", correo);
  await page.fill("#whatsapp", whatsapp);
  await page.fill("#clave", "segura123");
  await page.click("#form-crear button[type=submit]");
  await page.waitForURL("**/publicar.html");
}

async function publicar(page, { nombre = "Galletas de avena (x10)", precio = "8" } = {}) {
  await page.setInputFiles("#foto", FOTO);
  await expect(page.locator("#miniatura img")).toBeVisible();
  await page.fill("#nombre", nombre);
  await page.fill("#descripcion", "Galletas caseras de avena con pasas y canela.");
  await page.fill("#precio", precio);
  await page.selectOption("#categoria", "comida");
  await page.click("#enviar");
  await page.waitForURL("**/mis-productos.html");
}

test.describe("Catálogo", () => {
  test("PI-01 muestra los 12 productos de ejemplo", async ({ page }) => {
    await page.goto("/index.html");
    await expect(page.locator(".tarjeta")).toHaveCount(12);
  });

  test("PI-02 filtra por categoría y busca por palabra", async ({ page }) => {
    await page.goto("/index.html");
    await page.click("[data-cat=comida]");
    await expect(page.locator(".tarjeta")).toHaveCount(3);
    await page.click("#limpiar");
    await page.fill("#q", "vela");
    await expect(page.locator(".tarjeta")).toHaveCount(1);
  });

  test("PI-03 ordena por precio de menor a mayor", async ({ page }) => {
    await page.goto("/index.html");
    await page.selectOption("#orden", "menor");
    await expect(page.locator(".tarjeta .etiqueta-precio").first()).toHaveText("S/ 5.00");
  });
});

test.describe("Vendedor", () => {
  test("PI-04 el registro valida los campos obligatorios", async ({ page }) => {
    await page.goto("/registro.html");
    await page.click("#form-crear button[type=submit]");
    await expect(page.locator("#form-crear .error:not(:empty)")).toHaveCount(5);
  });

  test("PI-05 no deja publicar sin sesión", async ({ page }) => {
    await page.goto("/publicar.html");
    await page.waitForURL(/registro\.html/);
  });

  test("PI-06 no publica una ficha incompleta", async ({ page }) => {
    await crearCuenta(page);
    await page.click("#enviar");
    await expect(page.locator("#form-producto .error:not(:empty)")).toHaveCount(5);
    await expect(page).toHaveURL(/publicar\.html/);
  });

  test("PI-07 publica con foto y el producto llega al catálogo y a WhatsApp", async ({ page }) => {
    await crearCuenta(page);
    await publicar(page);
    await expect(page.locator(".item")).toHaveCount(1);
    await page.click("#salir");
    await page.waitForURL("**/index.html");
    await expect(page.locator(".tarjeta")).toHaveCount(13);
    await page.locator(".tarjeta", { hasText: "Galletas de avena" }).click();
    const enlace = await page.locator("a.boton-whatsapp").getAttribute("href");
    expect(enlace).toContain("https://wa.me/51987654321?text=");
  });

  test("PI-08 edita, marca agotado y retira un producto", async ({ page }) => {
    await crearCuenta(page);
    await publicar(page);
    await page.click("[data-alternar]");
    await expect(page.locator("#n-agotados")).toHaveText("1");
    await page.click(".item a:has-text('Editar')");
    await expect(page.locator("#nombre")).toHaveValue("Galletas de avena (x10)");
    await page.fill("#precio", "9.5");
    await page.click("#enviar");
    await page.waitForURL("**/mis-productos.html");
    await expect(page.locator(".item .detalle")).toContainText("S/ 9.50");
    await page.click("[data-retirar]");
    await page.click(".dialogo [data-r='1']");
    await expect(page.locator(".item")).toHaveCount(0);
  });

  test("PI-09 descarga el reporte Excel (CSV)", async ({ page }) => {
    await crearCuenta(page);
    await publicar(page);
    const [descarga] = await Promise.all([page.waitForEvent("download"), page.click("#exportar-csv")]);
    expect(descarga.suggestedFilename()).toMatch(/^reporte-productos-.*\.csv$/);
    const fs = require("fs");
    const contenido = fs.readFileSync(await descarga.path(), "utf8");
    expect(contenido).toContain("Producto");
    expect(contenido).toContain("Galletas de avena (x10)");
  });

  test("PI-10 rechaza una contraseña incorrecta", async ({ page }) => {
    await page.goto("/registro.html?modo=ingresar");
    await page.fill("#correo-in", "demo@vitrina.pe");
    await page.fill("#clave-in", "incorrecta");
    await page.click("#form-ingresar button[type=submit]");
    await expect(page.locator("#err-ingresar")).toHaveText("Correo o contraseña incorrectos.");
  });
});

test.describe("Asistente virtual", () => {
  test("PI-11 responde cómo publicar un producto", async ({ page }) => {
    await page.goto("/index.html");
    await page.click(".asistente-boton");
    await page.fill("#asistente-q", "¿Cómo publico un producto?");
    await page.click(".asistente-form button[type=submit]");
    await expect(page.locator(".msg.bot").last()).toContainText("Vender");
  });
});
