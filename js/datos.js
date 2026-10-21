// =============================================================
//  Capa de datos: elige el almacenamiento según js/config.js
//  - MODO "local"    → js/local.js (navegador)
//  - MODO "firebase" → js/firebase.js (nube)
//  Las páginas esperan a VE.listo y luego usan VE.datos.
// =============================================================
(function () {
  const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";

  function cargarScript(src) {
    return new Promise((ok, falla) => {
      const s = document.createElement("script");
      s.src = src; s.onload = ok;
      s.onerror = () => falla(new Error("No se pudo cargar " + src + ". Revisa tu conexión a internet."));
      document.head.append(s);
    });
  }

  // Muestra un aviso visible si algo falla al cargar la página
  VE.mostrarError = function (e) {
    console.error(e);
    const caja = document.createElement("div");
    caja.setAttribute("role", "alert");
    caja.style.cssText = "background:#F8DEDB;color:#B3261E;padding:12px 16px;font:600 14px/1.4 Arial,sans-serif;text-align:center";
    caja.textContent = "No se pudo cargar la página: " + (e && e.message ? e.message : e);
    document.body.prepend(caja);
  };

  VE.modo = VE.config.MODO;
  VE.listo = (async function () {
    if (VE.config.MODO === "firebase") {
      await cargarScript(SDK + "firebase-app-compat.js");
      await cargarScript(SDK + "firebase-auth-compat.js");
      await cargarScript(SDK + "firebase-firestore-compat.js");
      VE.datos = VE.crearNube();
    } else {
      VE.datos = VE.local;
    }
    await VE.datos.iniciar();
  })();
  VE.listo.catch(VE.mostrarError);
})();
