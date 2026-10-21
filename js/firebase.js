// =============================================================
//  Almacenamiento en la NUBE (Firebase Authentication + Firestore)
//  Se usa solo cuando MODO = "firebase" en js/config.js.
//  datos.js carga primero el SDK de Firebase (versión compat).
//  Las fotos se guardan comprimidas dentro del documento del
//  producto, así el proyecto funciona en el plan gratuito (Spark)
//  sin necesitar Cloud Storage.
// =============================================================
(function () {
  const MENSAJES = {
    "auth/email-already-in-use": "Ya existe una cuenta con ese correo. Ingresa con tu contraseña.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/invalid-login-credentials": "Correo o contraseña incorrectos.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "Correo o contraseña incorrectos.",
    "auth/weak-password": "La contraseña necesita al menos 8 caracteres.",
    "auth/network-request-failed": "No hay conexión a internet. Inténtalo de nuevo.",
    "permission-denied": "No tienes permiso para realizar esta acción."
  };
  const traducir = e => new Error(MENSAJES[e && e.code] || (e && e.message) || "Ocurrió un error. Inténtalo de nuevo.");

  VE.crearNube = function () {
    firebase.initializeApp(VE.config.firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Espera a que Firebase confirme si hay una sesión abierta
    const sesionLista = new Promise(res => { const off = auth.onAuthStateChanged(() => { off(); res(); }); });

    async function perfil(uid) {
      const s = await db.collection("usuarios").doc(uid).get();
      return s.exists ? Object.assign({ uid }, s.data()) : null;
    }

    return {
      async iniciar() { await sesionLista; },

      async sesion() {
        await sesionLista;
        return auth.currentUser ? await perfil(auth.currentUser.uid) : null;
      },

      async registrar({ nombre, carrera, correo, whatsapp, clave }) {
        try {
          const cred = await auth.createUserWithEmailAndPassword(correo, clave);
          const datos = { nombre, carrera, correo: correo.toLowerCase(), whatsapp };
          await db.collection("usuarios").doc(cred.user.uid).set(datos);
          return Object.assign({ uid: cred.user.uid }, datos);
        } catch (e) { throw traducir(e); }
      },

      async ingresar(correo, clave) {
        try {
          const cred = await auth.signInWithEmailAndPassword(correo, clave);
          return await perfil(cred.user.uid);
        } catch (e) { throw traducir(e); }
      },

      async salir() { await auth.signOut(); },

      async productos() {
        try {
          const s = await db.collection("productos").orderBy("fecha", "desc").get();
          return s.docs.map(d => Object.assign({ id: d.id }, d.data()));
        } catch (e) { throw traducir(e); }
      },

      async producto(id) {
        const s = await db.collection("productos").doc(id).get();
        return s.exists ? Object.assign({ id: s.id }, s.data()) : null;
      },

      async crear(datos) {
        const u = await this.sesion();
        if (!u) throw new Error("Inicia sesión para publicar.");
        const prod = Object.assign({}, datos, {
          disponible: true, fecha: Date.now(),
          vendedorId: u.uid, vendedorNombre: u.nombre, vendedorCarrera: u.carrera, vendedorWhatsapp: u.whatsapp
        });
        try { const ref = await db.collection("productos").add(prod); return Object.assign({ id: ref.id }, prod); }
        catch (e) { throw traducir(e); }
      },

      async actualizar(id, cambios) {
        try { await db.collection("productos").doc(id).update(cambios); return await this.producto(id); }
        catch (e) { throw traducir(e); }
      },

      async eliminar(id) {
        try { await db.collection("productos").doc(id).delete(); } catch (e) { throw traducir(e); }
      },

      async restablecer() { /* En la nube no se borran datos desde la página. */ }
    };
  };
})();
