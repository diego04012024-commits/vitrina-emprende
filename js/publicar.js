// Página: Publicar o editar un producto (publicar.html, publicar.html?id=...)
(async function () {
await VE.listo;
const { datos } = VE;
const { CATEGORIAS } = VE.config;
const {$, prepararEncabezado, exigirSesion, comprimirFoto, validar, avisoAlLlegar, esc} = VE.ui;

await prepararEncabezado();
const usuario = await exigirSesion();
const idEditar = new URLSearchParams(location.search).get("id");
let foto = null;          // data URL de la foto o ruta de la ilustración
let esIlustracion = false;

$("#categoria").insertAdjacentHTML("beforeend", CATEGORIAS.map(([k, l]) => `<option value="${k}">${l}</option>`).join(""));

function verMiniatura() {
  $("#miniatura").innerHTML = `<img src="${esc(foto)}" alt="Vista previa de la foto"${esIlustracion ? ' style="object-fit:contain;padding:14px"' : ""}>`;
}

// Modo edición
if (usuario && idEditar) {
  const p = await datos.producto(idEditar);
  if (!p || p.vendedorId !== usuario.uid) {
    avisoAlLlegar("No puedes editar ese producto.");
    location.replace("mis-productos.html");
  } else {
    document.title = "Editar producto · Vitrina Emprende";
    $("#titulo").textContent = "Editar producto";
    $("#enviar").textContent = "Guardar cambios";
    $("#nombre").value = p.nombre;
    $("#descripcion").value = p.descripcion;
    $("#precio").value = p.precio;
    $("#categoria").value = p.categoria;
    foto = p.foto; esIlustracion = !!p.ilustracion;
    verMiniatura();
  }
}

const contar = () => ($("#contador").textContent = `${$("#descripcion").value.length} / 300`);
$("#descripcion").addEventListener("input", contar); contar();

$("#foto").addEventListener("change", async e => {
  const archivo = e.target.files[0];
  if (!archivo) return;
  try {
    foto = await comprimirFoto(archivo); esIlustracion = false;
    verMiniatura();
    $("#caja-foto").classList.remove("invalido");
    $("#err-foto").textContent = "";
  } catch (err) {
    $("#caja-foto").classList.add("invalido");
    $("#err-foto").textContent = err.message;
  }
  e.target.value = "";
});

$("#form-producto").addEventListener("submit", async e => {
  e.preventDefault();
  const f = {
    nombre: $("#nombre").value.trim(),
    descripcion: $("#descripcion").value.trim(),
    precio: Math.round(parseFloat($("#precio").value) * 100) / 100,
    categoria: $("#categoria").value
  };
  // Campos obligatorios: aseguran fichas completas (Objetivo 2)
  const caja = $("#caja-foto");
  const okFoto = !!foto;
  caja.classList.toggle("invalido", !okFoto);
  $("#err-foto").textContent = okFoto ? "" : "Agrega una foto del producto.";
  const ok = [
    okFoto,
    validar("#nombre", f.nombre.length >= 3, "Escribe el nombre del producto."),
    validar("#descripcion", f.descripcion.length >= 20, `La descripción necesita al menos 20 caracteres (llevas ${f.descripcion.length}).`),
    validar("#precio", f.precio > 0 && f.precio <= 9999, "El precio debe ser un número mayor que cero."),
    validar("#categoria", !!f.categoria, "Elige una categoría.")
  ].every(Boolean);
  $("#err-general").textContent = ok ? "" : "Completa los campos marcados para publicar.";
  if (!ok) { (okFoto ? $("#form-producto .invalido") : $("#foto"))?.focus(); return; }

  const boton = $("#enviar"); boton.disabled = true; boton.textContent = "Guardando…";
  try {
    const datosProducto = { ...f, foto, ilustracion: esIlustracion };
    if (idEditar) {
      await datos.actualizar(idEditar, datosProducto);
      avisoAlLlegar("Cambios guardados");
    } else {
      await datos.crear(datosProducto);
      avisoAlLlegar("Producto publicado");
    }
    location.href = "mis-productos.html";
  } catch (err) {
    $("#err-general").textContent = err.message;
    boton.disabled = false; boton.textContent = idEditar ? "Guardar cambios" : "Publicar en la vitrina";
  }
});

})().catch(VE.mostrarError);
