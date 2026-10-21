// Configuración de las pruebas automáticas (Playwright)
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5500",
    browserName: "chromium",
    locale: "es-PE",
    ...(process.env.CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.CHROMIUM_PATH } } : {})
  },
  // Levanta el sitio antes de probar (igual que Live Server)
  webServer: {
    command: "npx http-server . -p 5500 -c-1 -s",
    url: "http://127.0.0.1:5500/index.html",
    reuseExistingServer: !process.env.CI
  }
});
