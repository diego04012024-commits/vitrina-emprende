(function () {
// =============================================================
//  Utilidades compartidas por todas las páginas
// =============================================================
const { CATEGORIAS } = VE.config;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const soles = n => "S/ " + Number(n).toFixed(2);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const nombreCategoria = c => (CATEGORIAS.find(x => x[0] === c) || [, "Otros"])[1];

const TINTES = ["#FFE3A3", "#CDEBE3", "#F9CFC4", "#D9E4FB", "#E9DDF7", "#E2F0C7", "#FCD9E7"];
function tinte(id) {
  let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTES[h % TINTES.length];
}

// Foto del producto (ilustración de categoría o foto real)
function fotoHTML(p, clase = "", prioritaria = false) {
  const alt = `Foto de ${esc(p.nombre)}`;
  const extra = `alt="${alt}"` + (prioritaria ? "" : ` loading="lazy" decoding="async"`);
  return p.ilustracion
    ? `<img class="foto ilustracion ${clase}" src="${esc(p.foto)}" ${extra}>`
    : `<img class="foto ${clase}" src="${esc(p.foto)}" ${extra}>`;
}

function tarjetaHTML(p) {
  return `
  <a class="tarjeta" href="producto.html?id=${encodeURIComponent(p.id)}">
    <div class="tarjeta-foto" style="background:${tinte(p.id)}">
      ${fotoHTML(p)}
      <span class="etiqueta-precio">${soles(p.precio)}</span>
      ${p.disponible ? "" : '<span class="insignia-agotado">Agotado</span>'}
    </div>
    <div class="tarjeta-info">
      <span class="categoria">${nombreCategoria(p.categoria)}</span>
      <h2>${esc(p.nombre)}</h2>
      <span class="vendedor">Hecho por ${esc(p.vendedorNombre)}</span>
    </div>
  </a>`;
}

// ---------- Mensajes emergentes (también entre páginas) ----------
function aviso(texto) {
  let t = $("#aviso");
  if (!t) { t = document.createElement("div"); t.id = "aviso"; t.className = "aviso"; t.setAttribute("role", "status"); document.body.append(t); }
  t.textContent = texto; t.hidden = false;
  clearTimeout(aviso.t); aviso.t = setTimeout(() => (t.hidden = true), 2800);
}
function avisoAlLlegar(texto) { try { sessionStorage.setItem("ve_aviso", texto); } catch {} }
function mostrarAvisoPendiente() {
  try { const t = sessionStorage.getItem("ve_aviso"); if (t) { sessionStorage.removeItem("ve_aviso"); aviso(t); } } catch {}
}

// ---------- Encabezado según la sesión ----------
async function prepararEncabezado() {
  const u = await VE.datos.sesion();
  const acciones = $("#acciones");
  if (acciones) {
    acciones.innerHTML = u
      ? `<a class="boton solo-escritorio" href="mis-productos.html">Mis productos</a>
         <a class="avatar avatar-boton solo-movil" href="mis-productos.html" aria-label="Mis productos" title="Mis productos">${esc(u.nombre[0])}</a>
         <a class="boton principal" href="publicar.html">Vender</a>`
      : `<a class="boton secundario-texto solo-escritorio" href="registro.html?modo=ingresar">Ingresar</a><a class="boton principal" href="registro.html">Vender</a>`;
  }
  const buscador = $("#buscador");
  if (buscador && !location.pathname.endsWith("index.html") && !location.pathname.endsWith("/")) {
    buscador.addEventListener("submit", e => {
      e.preventDefault();
      const q = $("#q").value.trim();
      location.href = "index.html" + (q ? "?q=" + encodeURIComponent(q) : "");
    });
  }
  if (VE.modo === "local") $("#modo-demo")?.removeAttribute("hidden");
  if (!document.querySelector(".asistente") && !window.watsonAssistantChatOptions) VE.iniciarAsistente();
  mostrarAvisoPendiente();
  return u;
}

// Redirige a registro si no hay sesión
async function exigirSesion() {
  const u = await VE.datos.sesion();
  if (!u) {
    avisoAlLlegar("Ingresa o crea tu cuenta para continuar.");
    location.replace("registro.html?volver=" + encodeURIComponent(location.pathname.split("/").pop() + location.search));
    return null;
  }
  return u;
}

// ---------- WhatsApp ----------
function mensajeWhatsApp(p) {
  return `Hola ${p.vendedorNombre.split(" ")[0]}, vi tu producto "${p.nombre}" (${soles(p.precio)}) en Vitrina Emprende. ¿Está disponible?`;
}
function enlaceWhatsApp(p) {
  return `https://wa.me/51${p.vendedorWhatsapp}?text=${encodeURIComponent(mensajeWhatsApp(p))}`;
}

// ---------- Foto: valida y comprime antes de guardar ----------
function comprimirFoto(archivo, maxLado = 900, calidad = 0.78) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpeg)$/.test(archivo.type)) return reject(new Error("La foto debe ser JPG o PNG."));
    if (archivo.size > 5 * 1024 * 1024) return reject(new Error("La foto pesa más de 5 MB. Elige una más liviana."));
    const lector = new FileReader();
    lector.onerror = () => reject(new Error("No se pudo leer la foto."));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("El archivo no es una imagen válida."));
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * escala); c.height = Math.round(img.height * escala);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", calidad));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}

// Marca un campo como válido o inválido y devuelve si es válido
function validar(campo, ok, mensaje) {
  const el = typeof campo === "string" ? $(campo) : campo;
  const err = $(`#err-${el.id}`);
  el.classList.toggle("invalido", !ok);
  el.setAttribute("aria-invalid", String(!ok));
  if (err) { err.textContent = ok ? "" : mensaje; el.setAttribute("aria-describedby", err.id); }
  return ok;
}

// Confirmación dentro de la página (sin ventanas del navegador)
function confirmar(texto, etiquetaOk = "Sí, continuar") {
  return new Promise(res => {
    const capa = document.createElement("div");
    capa.className = "capa";
    capa.innerHTML = `<div class="dialogo" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t">
      <p id="dlg-t">${esc(texto)}</p>
      <div class="fila-botones"><button class="boton" data-r="0">Cancelar</button><button class="boton peligro" data-r="1">${esc(etiquetaOk)}</button></div></div>`;
    document.body.append(capa);
    const previo = document.activeElement;
    const cerrar = valor => { capa.remove(); previo?.focus?.(); res(valor); };
    capa.querySelector('[data-r="0"]').focus();
    capa.addEventListener("click", e => {
      const b = e.target.closest("[data-r]");
      if (b || e.target === capa) cerrar(b?.dataset.r === "1");
    });
    // Escape cancela; Tab se queda dentro del diálogo
    capa.addEventListener("keydown", e => {
      if (e.key === "Escape") cerrar(false);
      if (e.key === "Tab") { const [a, b] = capa.querySelectorAll("button"); if (document.activeElement === (e.shiftKey ? a : b)) { e.preventDefault(); (e.shiftKey ? b : a).focus(); } }
    });
  });
}

VE.ui = { $, $$, soles, esc, normalizar, nombreCategoria, tinte, fotoHTML, tarjetaHTML, aviso, avisoAlLlegar, prepararEncabezado, exigirSesion, mensajeWhatsApp, enlaceWhatsApp, comprimirFoto, validar, confirmar };
})();
