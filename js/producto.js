// Página: Ficha del producto (producto.html?id=...)
(async function () {
await VE.listo;
const { datos } = VE;
const {$, prepararEncabezado, fotoHTML, tinte, soles, esc, nombreCategoria, mensajeWhatsApp, enlaceWhatsApp, aviso} = VE.ui;

const usuario = await prepararEncabezado();
const id = new URLSearchParams(location.search).get("id");
const p = id ? await datos.producto(id) : null;

if (!p) {
  document.title = "Producto no encontrado · Vitrina Emprende";
  $("#contenido").innerHTML = `<div class="vacio" style="margin-block:24px"><strong>Este producto ya no está disponible</strong>Puede que el vendedor lo haya retirado.<a class="boton principal" href="index.html">Ver el catálogo</a></div>`;
} else {
  document.title = `${p.nombre} · Vitrina Emprende`;
  const esMio = usuario && usuario.uid === p.vendedorId;
  const mensaje = mensajeWhatsApp(p);

  let contacto;
  if (esMio) {
    contacto = `<div class="fila-botones"><a class="boton oscuro" href="publicar.html?id=${encodeURIComponent(p.id)}">Editar producto</a><a class="boton" href="mis-productos.html">Ir a mis productos</a></div>
      <p class="nota">Este producto es tuyo. Así lo ven los compradores.</p>`;
  } else if (!p.disponible) {
    contacto = `<button class="boton boton-whatsapp grande ancho" disabled>Producto agotado</button>`;
  } else if (p.vendedorWhatsapp) {
    contacto = `<a class="boton boton-whatsapp grande ancho" href="${enlaceWhatsApp(p)}" target="_blank" rel="noopener">${iconoWA()}Contactar por WhatsApp</a>`;
  } else {
    // Vendedores de ejemplo: no tienen un número real
    contacto = `<button class="boton boton-whatsapp grande ancho" id="ver-mensaje" type="button">${iconoWA()}Contactar por WhatsApp</button>`;
  }

  $("#contenido").innerHTML = `
    <article class="ficha">
      <div class="ficha-foto" style="background:${tinte(p.id)}">${fotoHTML(p, "", true)}</div>
      <div class="ficha-cuerpo">
        <span class="categoria">${nombreCategoria(p.categoria)}</span>
        <h1>${esc(p.nombre)}</h1>
        <div class="fila">
          <span class="precio">${soles(p.precio)}</span>
          <span class="estado ${p.disponible ? "disponible" : "agotado"}">${p.disponible ? "Disponible" : "Agotado"}</span>
        </div>
        <p class="descripcion">${esc(p.descripcion)}</p>
        <div class="vendedor-bloque">
          <span class="avatar" aria-hidden="true">${esc(p.vendedorNombre[0])}</span>
          <div><strong>${esc(p.vendedorNombre)}</strong><div class="nota">${esc(p.vendedorCarrera)}</div></div>
        </div>
        <div class="mensaje" id="mensaje" ${p.vendedorWhatsapp || esMio ? "" : "hidden"}>
          <strong>Mensaje que se enviará</strong>
          <span id="texto-mensaje">${esc(mensaje)}</span>
          ${p.vendedorWhatsapp ? "" : '<span class="nota">Este es un vendedor de ejemplo, por eso no se abre WhatsApp. Con un vendedor registrado, el botón abre el chat con este mensaje.</span>'}
        </div>
        ${contacto}
        <p class="nota">El pago y la entrega se coordinan directamente con el vendedor.</p>
      </div>
    </article>`;

  $("#ver-mensaje")?.addEventListener("click", () => { $("#mensaje").hidden = false; aviso("Vendedor de ejemplo: revisa el mensaje"); });
}

function iconoWA() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z"/></svg>`;
}

})().catch(VE.mostrarError);
