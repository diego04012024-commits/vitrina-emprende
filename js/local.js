(function () {
// =============================================================
//  Almacenamiento LOCAL (localStorage del navegador)
//  Misma interfaz que firebase.js, para poder cambiar de modo
//  sin tocar las páginas.
// =============================================================

const K = { usuarios: "ve_usuarios", productos: "ve_productos", sesion: "ve_sesion", version: "ve_version" };
const VERSION_DATOS = "1";

function leer(clave, porDefecto) {
  try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : porDefecto; }
  catch { return porDefecto; }
}
function guardar(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); }
  catch (e) {
    throw new Error("No hay espacio suficiente en el navegador. Retira productos antiguos o usa una foto más liviana.");
  }
}
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

async function hash(texto) {
  // SHA-256 para no guardar la contraseña en texto plano (solo modo demostración).
  if (window.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  return "plain:" + texto;
}

// ---------- Datos de ejemplo (se cargan una sola vez) ----------
async function sembrar() {
  if (leer(K.version, null) === VERSION_DATOS) return;
  const clave = await hash("demo1234");
  const ahora = Date.now();
  const usuarios = [
    { uid: "u-valeria", nombre: "Valeria Ríos", carrera: "Administración de Empresas", correo: "valeria@vitrina.pe", whatsapp: "", demo: true },
    { uid: "u-joaquin", nombre: "Joaquín Paredes", carrera: "Computación e Informática", correo: "joaquin@vitrina.pe", whatsapp: "", demo: true },
    { uid: "u-camila", nombre: "Camila Huamán", carrera: "Diseño Gráfico", correo: "camila@vitrina.pe", whatsapp: "", demo: true },
    { uid: "u-renzo", nombre: "Renzo Quispe", carrera: "Marketing", correo: "renzo@vitrina.pe", whatsapp: "", demo: true },
    { uid: "u-andrea", nombre: "Andrea Salas", carrera: "Contabilidad", correo: "andrea@vitrina.pe", whatsapp: "", demo: true },
    { uid: "u-demo", nombre: "Diana Torres", carrera: "Computación e Informática", correo: "demo@vitrina.pe", whatsapp: "", demo: true }
  ].map(u => ({ ...u, clave }));

  const p = (nombre, categoria, precio, uid, descripcion, disponible = true, minutos = 0) => {
    const u = usuarios.find(x => x.uid === uid);
    return {
      id: nuevoId() + minutos, nombre, categoria, precio, descripcion, disponible,
      foto: `img/categorias/${categoria}.svg`, ilustracion: true,
      vendedorId: uid, vendedorNombre: u.nombre, vendedorCarrera: u.carrera, vendedorWhatsapp: u.whatsapp, demo: true,
      fecha: ahora - minutos * 60000
    };
  };
  const productos = [
    p("Brownies de chocolate (caja x6)", "comida", 12, "u-valeria", "Brownies húmedos con chispas de chocolate, hechos el mismo día. Ideales para compartir en el break.", true, 5),
    p("Alfajores de maicena (x4)", "comida", 6, "u-andrea", "Rellenos de manjar blanco y cubiertos de coco rallado. Pedidos con un día de anticipación.", true, 30),
    p("Aretes de resina con flores", "accesorios", 15, "u-camila", "Aretes hechos a mano con flores secas encapsuladas en resina. Ganchos antialérgicos.", true, 60),
    p("Pulseras de hilo personalizadas", "accesorios", 8, "u-renzo", "Elige colores y una inicial. Se entregan en 2 días.", true, 90),
    p("Polo estampado “Code & Coffee”", "ropa", 35, "u-joaquin", "Polo de algodón con diseño serigrafiado. Tallas S, M y L.", true, 120),
    p("Tote bag pintada a mano", "ropa", 25, "u-camila", "Bolsa de lona con ilustración original. Resiste hasta 8 kg.", false, 150),
    p("Retrato digital por encargo", "arte", 30, "u-camila", "Ilustración digital de tu foto en estilo caricatura. Entrega en archivo PNG de alta resolución.", true, 180),
    p("Láminas A5 de paisajes peruanos", "arte", 10, "u-renzo", "Set de 3 láminas impresas en papel de 200 g, listas para enmarcar.", true, 210),
    p("Velas aromáticas de soya", "manualidades", 18, "u-valeria", "Velas en frasco de vidrio, aromas vainilla y lavanda. Duración aproximada de 20 horas.", true, 240),
    p("Llaveros tejidos a crochet", "manualidades", 7, "u-andrea", "Llaveros con forma de frutas y animalitos. Consulta los modelos disponibles.", true, 270),
    p("Stickers de programación (pack x10)", "otros", 5, "u-joaquin", "Stickers de vinilo resistentes al agua para tu laptop o termo.", true, 300),
    p("Cupcakes decorados (x6)", "comida", 15, "u-valeria", "Cupcakes de vainilla con frosting de colores. Ideales para cumpleaños.", true, 330)
  ];
  guardar(K.usuarios, usuarios);
  guardar(K.productos, productos);
  guardar(K.version, VERSION_DATOS);
}

const publico = u => u && ({ uid: u.uid, nombre: u.nombre, carrera: u.carrera, correo: u.correo, whatsapp: u.whatsapp, demo: !!u.demo });

const local = {
  async iniciar() { await sembrar(); },

  async sesion() {
    const uid = leer(K.sesion, null);
    return publico(leer(K.usuarios, []).find(u => u.uid === uid)) || null;
  },

  async registrar({ nombre, carrera, correo, whatsapp, clave }) {
    const usuarios = leer(K.usuarios, []);
    if (usuarios.some(u => u.correo === correo.toLowerCase())) throw new Error("Ya existe una cuenta con ese correo. Ingresa con tu contraseña.");
    const u = { uid: "u-" + nuevoId(), nombre, carrera, correo: correo.toLowerCase(), whatsapp, clave: await hash(clave) };
    usuarios.push(u); guardar(K.usuarios, usuarios); guardar(K.sesion, u.uid);
    return publico(u);
  },

  async ingresar(correo, clave) {
    const u = leer(K.usuarios, []).find(x => x.correo === correo.toLowerCase());
    if (!u || u.clave !== await hash(clave)) throw new Error("Correo o contraseña incorrectos.");
    guardar(K.sesion, u.uid);
    return publico(u);
  },

  async salir() { localStorage.removeItem(K.sesion); },

  async productos() { return leer(K.productos, []).sort((a, b) => b.fecha - a.fecha); },

  async producto(id) { return leer(K.productos, []).find(p => p.id === id) || null; },

  async crear(datos) {
    const u = await this.sesion();
    if (!u) throw new Error("Inicia sesión para publicar.");
    const prod = {
      ...datos, id: nuevoId(), disponible: true, fecha: Date.now(),
      vendedorId: u.uid, vendedorNombre: u.nombre, vendedorCarrera: u.carrera, vendedorWhatsapp: u.whatsapp, demo: !!u.demo
    };
    const lista = leer(K.productos, []); lista.push(prod); guardar(K.productos, lista);
    return prod;
  },

  async actualizar(id, cambios) {
    const u = await this.sesion();
    const lista = leer(K.productos, []);
    const i = lista.findIndex(p => p.id === id);
    if (i < 0) throw new Error("El producto ya no existe.");
    if (!u || lista[i].vendedorId !== u.uid) throw new Error("Solo el vendedor puede modificar este producto.");
    lista[i] = { ...lista[i], ...cambios }; guardar(K.productos, lista);
    return lista[i];
  },

  async eliminar(id) {
    const u = await this.sesion();
    const lista = leer(K.productos, []);
    const p = lista.find(x => x.id === id);
    if (!p) return;
    if (!u || p.vendedorId !== u.uid) throw new Error("Solo el vendedor puede retirar este producto.");
    guardar(K.productos, lista.filter(x => x.id !== id));
  },

  async restablecer() { Object.values(K).forEach(k => localStorage.removeItem(k)); await sembrar(); }
};

VE.local = local;
})();
