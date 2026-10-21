// Página: Panel del vendedor (mis-productos.html)
(async function () {
await VE.listo;
const { datos } = VE;
const {$, prepararEncabezado, exigirSesion, fotoHTML, tinte, soles, esc, nombreCategoria, aviso, avisoAlLlegar, confirmar} = VE.ui;

await prepararEncabezado();
const usuario = await exigirSesion();

let mios = [];

// ---------- Reportes exportables ----------
function descargarCSV() {
  if (!mios.length) { aviso("Aún no tienes productos para exportar."); return; }
  const fecha = d => new Date(d).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
  const celda = v => `"${String(v).replace(/"/g, '""')}"`;
  const filas = [
    ["Producto", "Categoría", "Precio (S/)", "Estado", "Fecha de publicación"],
    ...mios.map(p => [p.nombre, nombreCategoria(p.categoria), p.precio.toFixed(2), p.disponible ? "Disponible" : "Agotado", fecha(p.fecha)])
  ];
  // Separador ";" y BOM UTF-8 para que Excel en español lo abra con tildes y columnas correctas
  const csv = "﻿" + filas.map(f => f.map(celda).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `reporte-productos-${new Date().toISOString().slice(0, 10)}.csv` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  aviso("Reporte descargado");
}

function imprimir() {
  const hoy = new Date().toLocaleDateString("es-PE", { dateStyle: "long" });
  $("#encabezado-reporte").textContent = `Reporte de productos de ${usuario.nombre} · Vitrina Emprende · ${hoy}`;
  window.print();
}

async function pintar() {
  mios = (await datos.productos()).filter(p => p.vendedorId === usuario.uid);
  $("#n-publicados").textContent = mios.length;
  $("#n-disponibles").textContent = mios.filter(p => p.disponible).length;
  $("#n-agotados").textContent = mios.filter(p => !p.disponible).length;

  $("#lista").innerHTML = mios.length ? mios.map(p => `
    <article class="item">
      <a class="tarjeta-foto" href="producto.html?id=${encodeURIComponent(p.id)}" style="background:${tinte(p.id)}" aria-label="Ver ${esc(p.nombre)}">${fotoHTML(p)}</a>
      <div style="min-width:0">
        <h2>${esc(p.nombre)}</h2>
        <div class="detalle">${soles(p.precio)} · ${nombreCategoria(p.categoria)}
          <span class="estado ${p.disponible ? "disponible" : "agotado"}">${p.disponible ? "Disponible" : "Agotado"}</span></div>
      </div>
      <div class="fila-botones">
        <button class="boton" type="button" data-alternar="${esc(p.id)}">${p.disponible ? "Marcar agotado" : "Marcar disponible"}</button>
        <a class="boton" href="publicar.html?id=${encodeURIComponent(p.id)}">Editar</a>
        <button class="boton" type="button" data-retirar="${esc(p.id)}">Retirar</button>
      </div>
    </article>`).join("")
    : `<div class="vacio"><strong>Aún no publicas productos</strong>Tu primer producto aparecerá aquí.</div>`;
}

if (usuario) {
  $("#avatar").textContent = usuario.nombre[0];
  $("#nombre-usuario").textContent = usuario.nombre;
  $("#carrera-usuario").textContent = usuario.carrera;
  await pintar();

  $("#lista").addEventListener("click", async e => {
    const alt = e.target.closest("[data-alternar]");
    const ret = e.target.closest("[data-retirar]");
    try {
      if (alt) {
        const p = await datos.producto(alt.dataset.alternar);
        await datos.actualizar(p.id, { disponible: !p.disponible });
        aviso(p.disponible ? "Marcado como agotado" : "Marcado como disponible");
        await pintar();
      }
      if (ret) {
        if (!(await confirmar("¿Retirar este producto de la vitrina? Ya no aparecerá en el catálogo.", "Retirar"))) return;
        await datos.eliminar(ret.dataset.retirar);
        aviso("Producto retirado");
        await pintar();
      }
    } catch (err) { aviso(err.message); }
  });

  $("#exportar-csv").addEventListener("click", descargarCSV);
  $("#imprimir").addEventListener("click", imprimir);

  $("#salir").addEventListener("click", async () => {
    await datos.salir();
    avisoAlLlegar("Sesión cerrada");
    location.href = "index.html";
  });
}

})().catch(VE.mostrarError);
