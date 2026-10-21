// Página: Crear cuenta / Ingresar (registro.html)
(async function () {
await VE.listo;
const { datos } = VE;
const { CARRERAS } = VE.config;
const {$, prepararEncabezado, validar, avisoAlLlegar} = VE.ui;

const params = new URLSearchParams(location.search);
// Solo se permite volver a páginas propias del sitio
const volver = /^[a-z-]+\.html(\?[\w=&%.-]*)?$/i.test(params.get("volver") || "") ? params.get("volver") : "publicar.html";

const usuario = await prepararEncabezado();
if (usuario) location.replace(volver);

$("#carrera").insertAdjacentHTML("beforeend", CARRERAS.map(c => `<option>${c}</option>`).join(""));

function mostrar(pestana) {
  const crear = pestana === "crear";
  $("#tab-crear").setAttribute("aria-selected", crear);
  $("#tab-ingresar").setAttribute("aria-selected", !crear);
  $("#form-crear").hidden = !crear;
  $("#form-ingresar").hidden = crear;
  (crear ? $("#nombre") : $("#correo-in")).focus();
}
$("#tab-crear").addEventListener("click", () => mostrar("crear"));
$("#tab-ingresar").addEventListener("click", () => mostrar("ingresar"));
if (params.get("modo") === "ingresar") mostrar("ingresar");

// Solo números en el WhatsApp
$("#whatsapp").addEventListener("input", e => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 9); });

const correoValido = c => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c);

$("#form-crear").addEventListener("submit", async e => {
  e.preventDefault();
  const f = {
    nombre: $("#nombre").value.trim().replace(/\s+/g, " "),
    carrera: $("#carrera").value,
    correo: $("#correo").value.trim(),
    whatsapp: $("#whatsapp").value.trim(),
    clave: $("#clave").value
  };
  const ok = [
    validar("#nombre", f.nombre.split(" ").length >= 2 && f.nombre.length >= 5, "Escribe tu nombre y apellido."),
    validar("#carrera", !!f.carrera, "Elige tu carrera."),
    validar("#correo", correoValido(f.correo), "Escribe un correo válido, por ejemplo nombre@correo.com."),
    validar("#whatsapp", /^9\d{8}$/.test(f.whatsapp), "El WhatsApp debe tener 9 dígitos y empezar con 9."),
    validar("#clave", f.clave.length >= 8, "La contraseña necesita al menos 8 caracteres.")
  ].every(Boolean);
  $("#err-crear").textContent = "";
  if (!ok) { $("#form-crear .invalido")?.focus(); return; }

  const boton = e.submitter; boton.disabled = true; boton.textContent = "Creando cuenta…";
  try {
    const u = await datos.registrar(f);
    avisoAlLlegar(`¡Bienvenida/o, ${u.nombre.split(" ")[0]}! Ya puedes publicar.`);
    location.href = volver;
  } catch (err) {
    $("#err-crear").textContent = err.message;
    boton.disabled = false; boton.textContent = "Crear cuenta";
  }
});

$("#form-ingresar").addEventListener("submit", async e => {
  e.preventDefault();
  const correo = $("#correo-in").value.trim(), clave = $("#clave-in").value;
  const ok = [
    validar("#correo-in", correoValido(correo), "Escribe tu correo."),
    validar("#clave-in", clave.length > 0, "Escribe tu contraseña.")
  ].every(Boolean);
  $("#err-ingresar").textContent = "";
  if (!ok) { $("#form-ingresar .invalido")?.focus(); return; }
  const boton = e.submitter; boton.disabled = true; boton.textContent = "Ingresando…";
  try {
    const u = await datos.ingresar(correo, clave);
    avisoAlLlegar(`Hola, ${u.nombre.split(" ")[0]}`);
    location.href = volver === "publicar.html" ? "mis-productos.html" : volver;
  } catch (err) {
    $("#err-ingresar").textContent = err.message;
    boton.disabled = false; boton.textContent = "Ingresar";
  }
});

})().catch(VE.mostrarError);
