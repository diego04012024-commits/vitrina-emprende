# Vitrina Emprende

Plataforma web donde los estudiantes de Cibertec publican los productos que elaboran (postres, accesorios, ropa, arte y manualidades) y los compradores los encuentran por categoría o búsqueda y contactan al vendedor por WhatsApp.

Proyecto EFSRT · Escuela de Educación Superior Cibertec.

---

## 1. Cómo ejecutarla en Visual Studio Code

1. Descomprime la carpeta `vitrina-emprende`.
2. En VS Code: **Archivo › Abrir carpeta…** y elige `vitrina-emprende`.
3. Instala la extensión **Live Server** (de Ritwick Dey). VS Code la sugiere al abrir la carpeta.
4. Abre `index.html`, haz clic derecho y elige **Open with Live Server** (o el botón **Go Live** de la barra inferior).
5. Se abre el navegador en `http://127.0.0.1:5500/index.html`.

> También funciona sin Live Server: basta con abrir `index.html` con doble clic en Chrome o Edge. Con Live Server la página se recarga sola cada vez que guardas un cambio en VS Code.

---

## 2. Cuentas de prueba

La página trae 12 productos y 6 cuentas de ejemplo. Todas usan la contraseña **demo1234**:

| Correo | Uso sugerido |
|---|---|
| demo@vitrina.pe | Cuenta vacía para mostrar cómo se publica |
| valeria@vitrina.pe | Vendedora con brownies, cupcakes y velas |
| camila@vitrina.pe | Vendedora con aretes, tote bag y retratos |

También puedes crear una cuenta nueva desde **Vender**.

Los vendedores de ejemplo no tienen un WhatsApp real. Al pulsar **Contactar por WhatsApp** se muestra el mensaje que se enviaría. Con una cuenta creada por ti, con tu número real, el botón abre WhatsApp con el mensaje listo.

Para volver al estado inicial usa **Restablecer datos de ejemplo** en la banda superior del catálogo.

---

## 3. Qué puede hacer la página

**Comprador (sin cuenta)**
- Ver el catálogo con foto, precio, categoría y vendedor.
- Filtrar por categoría, buscar por palabra y ordenar por precio o fecha.
- Abrir la ficha del producto y contactar al vendedor por WhatsApp con un mensaje ya redactado.
- Ver otros productos del mismo vendedor.

**Vendedor (con cuenta)**
- Crear cuenta (nombre, carrera, correo, WhatsApp y contraseña) o ingresar.
- Publicar productos con foto, nombre, descripción, precio y categoría. La página no publica si falta algún dato (Objetivo 2: fichas completas).
- Editar, marcar como agotado o disponible y retirar sus productos.
- Ver un resumen: publicados, disponibles y agotados.
- Descargar el reporte de sus productos en Excel (CSV) o imprimirlo y guardarlo como PDF.

**Asistente virtual**
- Botón **Ayuda** en todas las páginas: responde cómo publicar, comprar, pagar, editar o descargar reportes.
- Si se configura IBM Watson Assistant en `js/config.js`, la página carga el chat de Watson en lugar del asistente local (ver sección 6).

**Reglas de seguridad incluidas**
- Solo el dueño de un producto puede editarlo o retirarlo.
- Las fotos se validan (JPG o PNG) y se comprimen antes de guardarse.
- En modo local, la contraseña se guarda cifrada (SHA-256). En modo Firebase la gestiona Firebase Authentication.

---

## 4. Estructura del proyecto

```
vitrina-emprende/
├── index.html            Catálogo (inicio)
├── producto.html         Ficha del producto y contacto
├── registro.html         Crear cuenta / Ingresar
├── publicar.html         Publicar o editar un producto
├── mis-productos.html    Panel del vendedor
├── css/estilos.css       Estilos (primero celular, luego escritorio)
├── js/
│   ├── config.js         Modo de datos (local o firebase) y categorías
│   ├── datos.js          Elige dónde se guardan los datos
│   ├── local.js          Guardado en el navegador + datos de ejemplo
│   ├── firebase.js       Guardado en la nube (Firebase)
│   ├── ui.js             Funciones compartidas (encabezado, tarjetas, validación)
│   └── catalogo.js, producto.js, registro.js, publicar.js, mis-productos.js
├── img/                  Logo e ilustraciones por categoría
├── js/asistente.js       Asistente virtual (Watson Assistant o preguntas frecuentes)
├── tests/                Pruebas automáticas de integración y rendimiento
├── .github/workflows/    Integración continua (GitHub Actions)
├── firestore.rules       Reglas de seguridad para Firebase
├── firebase.json         Configuración de Firebase Hosting
└── package.json          Comandos para pruebas y servidor local
```

La aplicación está organizada en tres capas: **presentación** (archivos .html y estilos.css), **lógica** (archivos .js de cada página y ui.js) y **datos** (datos.js, local.js y firebase.js).

---

## 5. Modos de datos

En `js/config.js`:

- `MODO = "local"` (por defecto): todo se guarda en el navegador donde se abre la página. No necesita internet ni configuración. Es ideal para probar y para la sustentación, pero cada navegador tiene sus propios datos.
- `MODO = "firebase"`: los datos se guardan en la nube y todos los usuarios ven el mismo catálogo.

### Conectar con Firebase (semana 4 del cronograma)

1. Entra a <https://console.firebase.google.com> y crea un proyecto (por ejemplo, `vitrina-emprende`).
2. **Authentication › Comenzar › Correo electrónico/contraseña › Habilitar**.
3. **Firestore Database › Crear base de datos** (modo producción, región `southamerica-east1`).
4. En **Firestore › Reglas**, pega el contenido de `firestore.rules` y pulsa **Publicar**.
5. **Configuración del proyecto › Tus apps › Web (`</>`)**, registra la app y copia el objeto `firebaseConfig`.
6. Pega esos valores en `js/config.js` y cambia `MODO = "firebase"`.
7. Abre de nuevo con Live Server y crea una cuenta: el catálogo empieza vacío porque los datos de ejemplo solo existen en modo local.

> Las fotos se guardan comprimidas dentro de cada producto en Firestore. Por eso no se necesita Cloud Storage, que hoy exige el plan de pago (Blaze), y el proyecto funciona en el plan gratuito (Spark).

### Publicarla en internet (opcional)

Con Firebase Hosting: instala Node.js, ejecuta `npm install -g firebase-tools`, luego `firebase login`, `firebase init hosting` (carpeta pública: `.`) y `firebase deploy`. Firebase te dará un enlace `https://<proyecto>.web.app` para compartir.

---

## 6. Asistente virtual con IBM Watson Assistant (opcional)

1. Crea una cuenta en IBM Cloud y una instancia de **Watson Assistant** (plan Lite).
2. Crea un asistente con las intenciones de `js/asistente.js` (publicar, comprar, pago, agotado, editar, cuenta, reporte, seguridad) y sus respuestas.
3. En **Integraciones › Web chat › Incrustar**, copia `integrationID`, `region` y `serviceInstanceID`.
4. Pégalos en `WATSON` dentro de `js/config.js`. Si quedan vacíos, la página usa el asistente local.

---

## 7. Pruebas automáticas

Requieren Node.js 18 o superior.

```bash
npm install
npx playwright install chromium
npm test                 # todas las pruebas (15)
npm run test:integracion # solo integración (11 pruebas)
npm run test:rendimiento # solo rendimiento (4 pruebas)
npm run reporte          # abre el reporte HTML de la última ejecución
```

Las pruebas levantan el sitio automáticamente en `http://127.0.0.1:5500`.

## 8. Integración continua

El archivo `.github/workflows/integracion-continua.yml` hace que GitHub ejecute las pruebas cada vez que alguien sube cambios a la rama `main` o abre un pull request. Si las pruebas pasan y el repositorio tiene el secreto `FIREBASE_SERVICE_ACCOUNT`, publica la página en Firebase Hosting. Antes, reemplaza el ID del proyecto en `.firebaserc`.
