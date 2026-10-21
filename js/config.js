(function () {
// =============================================================
//  Vitrina Emprende · Configuración
// =============================================================
// MODO = "local"    → los datos se guardan en este navegador (localStorage).
//                     No necesita internet ni cuentas. Ideal para probar y exponer.
// MODO = "firebase" → los datos se guardan en la nube (Firebase Authentication
//                     + Cloud Firestore). Completa firebaseConfig con los datos
//                     de tu proyecto (ver README.md, sección "Conectar con Firebase").
const MODO = "local";

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Asistente virtual con IBM Watson Assistant.
// Si completas estos tres datos (IBM Cloud › Watson Assistant › Integraciones ›
// Web chat › Incrustar), la página carga el chat de Watson. Si los dejas vacíos,
// se usa el asistente local de preguntas frecuentes (js/asistente.js).
const WATSON = {
  integrationID: "",
  region: "",            // por ejemplo "us-south"
  serviceInstanceID: ""
};

// Categorías del catálogo (clave interna → nombre visible)
const CATEGORIAS = [
  ["comida", "Comida"],
  ["accesorios", "Accesorios"],
  ["ropa", "Ropa"],
  ["arte", "Arte"],
  ["manualidades", "Manualidades"],
  ["otros", "Otros"]
];

const CARRERAS = [
  "Computación e Informática",
  "Administración de Empresas",
  "Diseño Gráfico",
  "Marketing",
  "Contabilidad",
  "Otra"
];

  window.VE = window.VE || {};
  VE.config = { MODO, firebaseConfig, WATSON, CATEGORIAS, CARRERAS };
})();
