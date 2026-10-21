// Página: Catálogo (index.html)
(async function () {
await VE.listo;
const { datos } = VE;
const { CATEGORIAS } = VE.config;
const {$, prepararEncabezado, tarjetaHTML, normalizar, nombreCategoria, aviso, confirmar} = VE.ui;

// La búsqueda hecha desde otras páginas llega como index.html?q=...
const estado = {
  cat: "todos",
  q: new URLSearchParams(location.search).get("q") || "",
  orden: "recientes"
};
let productos = [];

function filtrados() {
  const q = normalizar(estado.q.trim());
  let lista = productos.filter(p =>
    (estado.cat === "todos" || p.categoria === estado.cat) &&
    (!q || normalizar(`${p.nombre} ${p.descripcion} ${nombreCategoria(p.categoria)} ${p.vendedorNombre}`).includes(q))
  );
  if (estado.orden === "menor") lista = [...lista].sort((a, b) => a.precio - b.precio);
  if (estado.orden === "mayor") lista = [...lista].sort((a, b) => b.precio - a.precio);
  // Los agotados se muestran al final
  return [...lista].sort((a, b) => (b.disponible === true) - (a.disponible === true));
}

function pintarCategorias() {
  const cuenta = c => productos.filter(p => c === "todos" || p.categoria === c).length;
  $("#categorias").innerHTML = [["todos", "Todos"], ...CATEGORIAS]
    .map(([k, l]) => `<button type="button" class="chip" data-cat="${k}" aria-pressed="${estado.cat === k}">${l} <span>${cuenta(k)}</span></button>`)
    .join("");
}

function pintarProductos() {
  const lista = filtrados();
  const partes = [];
  if (estado.cat !== "todos") partes.push(nombreCategoria(estado.cat));
  if (estado.q.trim()) partes.push(`“${estado.q.trim()}”`);
  $("#resultado").innerHTML =
    `${lista.length} ${lista.length === 1 ? "producto" : "productos"}${partes.length ? " en " + partes.join(" · ") : ""}` +
    (partes.length ? ' <button type="button" id="limpiar">Quitar filtros</button>' : "");
  $("#rejilla").innerHTML = lista.length
    ? lista.map(tarjetaHTML).join("")
    : `<div class="vacio"><strong>No encontramos productos</strong>Prueba con otra palabra o revisa todas las categorías.</div>`;
  $("#limpiar")?.addEventListener("click", () => { estado.cat = "todos"; estado.q = ""; $("#q").value = ""; render(); });
}

function render() {
  $("#total-productos").textContent = productos.length;
  $("#total-vendedores").textContent = new Set(productos.map(p => p.vendedorId)).size;
  pintarCategorias(); pintarProductos();
}

async function cargar() {
  try { productos = await datos.productos(); }
  catch (e) { aviso(e.message); productos = []; }
  render();
}

await prepararEncabezado();
$("#q").value = estado.q;
$("#orden").value = estado.orden;

$("#categorias").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  estado.cat = b.dataset.cat; render();
});
let espera;
$("#q").addEventListener("input", e => { clearTimeout(espera); espera = setTimeout(() => { estado.q = e.target.value; pintarProductos(); }, 150); });
$("#buscador").addEventListener("submit", e => { e.preventDefault(); estado.q = $("#q").value; pintarProductos(); });
$("#orden").addEventListener("change", e => { estado.orden = e.target.value; pintarProductos(); });
$("#restablecer")?.addEventListener("click", async () => {
  if (!(await confirmar("Se borrarán las cuentas y productos creados en este navegador y se cargarán los datos de ejemplo.", "Restablecer"))) return;
  await datos.restablecer(); await prepararEncabezado(); await cargar(); aviso("Datos de ejemplo restablecidos");
});

await cargar();

})().catch(VE.mostrarError);
