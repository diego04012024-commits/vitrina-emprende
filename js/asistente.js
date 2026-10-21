(function () {
// =============================================================
//  Asistente virtual
//  - Con IBM Watson Assistant configurado en js/config.js → carga el web chat oficial.
//  - Sin configuración → asistente local de preguntas frecuentes.
//  Las mismas intenciones (preguntas) están documentadas en el informe
//  para crearlas en Watson Assistant.
// =============================================================
const { WATSON } = VE.config;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const INTENCIONES = [
  { id: "publicar", claves: ["public", "vender", "vendo", "subir", "anunci", "ofrec"],
    respuesta: "Pulsa “Vender”, crea tu cuenta o ingresa, y completa la ficha: foto, nombre, descripción (mínimo 20 caracteres), precio y categoría. Si falta un dato, la página te indica cuál.",
    enlace: ["Ir a vender", "registro.html"] },
  { id: "comprar", claves: ["compr", "pedi", "contact", "whatsapp", "escribir al vendedor"],
    respuesta: "Busca el producto o elige una categoría, ábrelo y pulsa “Contactar por WhatsApp”. Se abre el chat con el vendedor y un mensaje con el nombre y el precio del producto.",
    enlace: ["Ver el catálogo", "index.html"] },
  { id: "pago", claves: ["pago", "pagar", "paga", "yape", "plin", "entreg", "delivery", "envi"],
    respuesta: "La plataforma no cobra ni hace envíos. El pago y la entrega se coordinan directamente con el vendedor por WhatsApp." },
  { id: "agotado", claves: ["agotad", "stock", "disponib"],
    respuesta: "Si un producto dice “Agotado”, el vendedor lo marcó así y el botón de contacto se desactiva. Vuelve a revisarlo más tarde." },
  { id: "editar", claves: ["edit", "cambi", "precio", "retir", "borr", "elimin"],
    respuesta: "Entra a “Mis productos”. Ahí puedes editar, marcar como agotado o retirar cada producto.",
    enlace: ["Mis productos", "mis-productos.html"] },
  { id: "cuenta", claves: ["cuenta", "contrase", "clave", "registr", "ingres", "sesion", "login"],
    respuesta: "Para crear tu cuenta necesitas nombre, carrera, correo, WhatsApp (9 dígitos) y una contraseña de al menos 8 caracteres. Para comprar no necesitas cuenta." },
  { id: "reporte", claves: ["report", "excel", "pdf", "descarg", "export"],
    respuesta: "En “Mis productos” puedes descargar tu reporte en Excel (CSV) o imprimirlo y guardarlo como PDF." },
  { id: "seguridad", claves: ["segur", "datos", "privacid", "estaf"],
    respuesta: "Solo el dueño puede modificar sus productos y tu contraseña se guarda cifrada. Coordina la entrega en un lugar conocido y no compartas datos bancarios por adelantado." }
];
const SUGERENCIAS = ["¿Cómo publico un producto?", "¿Cómo compro?", "¿Cómo se paga?", "¿Puedo descargar un reporte?"];

const normalizar = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function responder(texto) {
  const t = normalizar(texto);
  let mejor = null, puntos = 0;
  for (const i of INTENCIONES) {
    const p = i.claves.filter(c => t.includes(normalizar(c))).length;
    if (p > puntos) { mejor = i; puntos = p; }
  }
  return mejor || { respuesta: "No encontré una respuesta para eso. Prueba con: publicar, comprar, pago, agotado, cuenta o reporte." };
}

function asistenteLocal() {
  const raiz = document.createElement("div");
  raiz.className = "asistente no-imprimir";
  raiz.innerHTML = `
    <button type="button" class="asistente-boton" aria-expanded="false" aria-controls="asistente-panel">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 16h.01"/></svg>
      <span>Ayuda</span>
    </button>
    <section class="asistente-panel" id="asistente-panel" hidden aria-label="Asistente virtual">
      <header><strong>Asistente Vitrina</strong><button type="button" class="asistente-cerrar" aria-label="Cerrar">×</button></header>
      <div class="asistente-mensajes" aria-live="polite">
        <p class="msg bot">Hola, ¿en qué te ayudo? Elige una pregunta o escribe la tuya.</p>
      </div>
      <div class="asistente-sugerencias">${SUGERENCIAS.map(s => `<button type="button">${s}</button>`).join("")}</div>
      <form class="asistente-form"><label for="asistente-q" class="solo-lector">Escribe tu pregunta</label>
        <input id="asistente-q" type="text" placeholder="Escribe tu pregunta…" autocomplete="off"><button type="submit" class="boton principal">Enviar</button></form>
    </section>`;
  document.body.append(raiz);

  const boton = raiz.querySelector(".asistente-boton");
  const panel = raiz.querySelector(".asistente-panel");
  const mensajes = raiz.querySelector(".asistente-mensajes");
  const abrir = v => { panel.hidden = !v; boton.setAttribute("aria-expanded", v); if (v) raiz.querySelector("#asistente-q").focus(); };
  const preguntar = texto => {
    if (!texto.trim()) return;
    const r = responder(texto);
    mensajes.insertAdjacentHTML("beforeend", `<p class="msg yo">${esc(texto)}</p><p class="msg bot">${esc(r.respuesta)}${r.enlace ? ` <a href="${r.enlace[1]}">${r.enlace[0]}</a>` : ""}</p>`);
    mensajes.scrollTop = mensajes.scrollHeight;
  };
  boton.addEventListener("click", () => abrir(panel.hidden));
  raiz.querySelector(".asistente-cerrar").addEventListener("click", () => abrir(false));
  raiz.querySelector(".asistente-sugerencias").addEventListener("click", e => { if (e.target.matches("button")) preguntar(e.target.textContent); });
  raiz.querySelector(".asistente-form").addEventListener("submit", e => { e.preventDefault(); const i = raiz.querySelector("#asistente-q"); preguntar(i.value); i.value = ""; });
}

function asistenteWatson() {
  // Código de inserción del web chat de IBM Watson Assistant
  window.watsonAssistantChatOptions = {
    integrationID: WATSON.integrationID,
    region: WATSON.region,
    serviceInstanceID: WATSON.serviceInstanceID,
    onLoad: async instance => { await instance.render(); }
  };
  const s = document.createElement("script");
  s.src = "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" +
    (window.watsonAssistantChatOptions.clientVersion || "latest") + "/WatsonAssistantChatEntry.js";
  document.head.append(s);
}

function iniciarAsistente() {
  if (WATSON.integrationID && WATSON.region && WATSON.serviceInstanceID) asistenteWatson();
  else asistenteLocal();
}

VE.iniciarAsistente = iniciarAsistente;
VE.asistente = { INTENCIONES, responder };

})();
