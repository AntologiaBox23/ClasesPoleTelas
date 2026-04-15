// ============================================================
//  api.js — Módulo de conexión con Google Apps Script
//  Antologia Pole Sport & Acrotelas
//
//  CÓMO USAR EN TU APP:
//  1. Copia este archivo a tu proyecto como api.js
//  2. Cambia API_URL por tu URL real de Apps Script
//  3. Importa las funciones que necesites:
//     import { getAlumnas, createPago, createClase } from './api.js'
// ============================================================

// ← PON AQUÍ TU URL DE APPS SCRIPT
const API_URL = 'https://script.google.com/macros/s/AKfycbxIRR8j6r4p9wgCJ7uZoaNXJ1G2wvPnDCMG2oXkvgtvBO4Bc2sr7txLnQISL2C4vY5nNw/exec';

// ============================================================
//  FUNCIÓN BASE — resuelve el problema de CORS con Apps Script
//
//  Google Apps Script redirige las peticiones (302 redirect).
//  fetch() en modo normal falla por CORS en esas redirecciones.
//  La solución: usar mode: 'no-cors' para POST y para GET
//  aprovechar que las redirecciones de GAS sí se siguen en
//  mode: 'cors' con credentials: 'omit'.
// ============================================================

async function _get(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString();
  const url = `${API_URL}?${qs}`;

  const res = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();
  return _parsear(text);
}

async function _post(action, data = {}) {
  const body = JSON.stringify({ action, ...data });

  // Apps Script con POST necesita redirect: 'follow' y headers mínimos
  const res = await fetch(API_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain' }, // text/plain evita preflight CORS
    body,
  });

  const text = await res.text();
  return _parsear(text);
}

function _parsear(text) {
  try {
    const data = JSON.parse(text);
    if (data.error) throw new Error(data.error);
    return data;
  } catch (e) {
    if (e.message.includes('JSON')) {
      throw new Error('La API no devolvió JSON válido. Verifica que la Web App esté publicada correctamente.');
    }
    throw e;
  }
}


// ============================================================
//  VERIFICACIÓN DE CONEXIÓN
// ============================================================

export async function ping() {
  return _get('ping');
}


// ============================================================
//  ALUMNAS
// ============================================================

export async function getAlumnas() {
  const res = await _get('getAlumnas');
  return res.alumnas || [];
}

export async function createAlumna(data) {
  // data: { Nombre, Telefono, Email, Disciplina, FechaIngreso, TipoPaquete? }
  return _post('createAlumna', { data });
}

export async function updateAlumna(id, data) {
  return _post('updateAlumna', { id, data });
}

export async function deleteAlumna(id) {
  return _post('deleteAlumna', { id });
}


// ============================================================
//  PAQUETES
// ============================================================

export async function getPaquetes(idAlumna) {
  const params = idAlumna ? { idAlumna } : {};
  const res = await _get('getPaquetes', params);
  return res.paquetes || [];
}

export async function createPaquete(data) {
  // data: { IDAlumna, NombreAlumna, TipoPaquete, FechaInicio? }
  return _post('createPaquete', { data });
}

export async function updatePaquete(id, data) {
  return _post('updatePaquete', { id, data });
}


// ============================================================
//  PAGOS
// ============================================================

export async function getPagos(idAlumna) {
  const params = idAlumna ? { idAlumna } : {};
  const res = await _get('getPagos', params);
  return res.pagos || [];
}

export async function createPago(data) {
  // data: { IDAlumna, NombreAlumna, TipoPaquete, Monto, MetodoPago, FechaPago? }
  // Al crear un pago se activa automáticamente un nuevo paquete
  return _post('createPago', { data });
}


// ============================================================
//  CLASES
// ============================================================

export async function getClases(idAlumna, fecha) {
  const params = {};
  if (idAlumna) params.idAlumna = idAlumna;
  if (fecha)    params.fecha    = fecha;
  const res = await _get('getClases', params);
  return res.clases || [];
}

export async function createClase(data) {
  // data: { IDAlumna, NombreAlumna, Disciplina, Fecha, Hora, Instructor? }
  // Descuenta automáticamente una clase del paquete activo
  return _post('createClase', { data });
}

export async function updateClase(id, data) {
  return _post('updateClase', { id, data });
}

export async function marcarAsistencia(id, estado) {
  // estado: 'Asistió' | 'Faltó' | 'Cancelada' | 'Programada'
  return _post('marcarAsistencia', { id, estado });
}


// ============================================================
//  DASHBOARD
// ============================================================

export async function getDashboard() {
  return _get('getDashboard');
}


// ============================================================
//  SETUP INICIAL (llámala UNA vez desde el navegador para
//  verificar que la conexión funciona)
// ============================================================

export async function setupSheets() {
  return _post('setupSheets', {});
}


// ============================================================
//  EJEMPLO DE USO EN UN COMPONENTE REACT
// ============================================================
//
//  import { getAlumnas, createPago, createClase, getDashboard } from './api.js';
//
//  // Cargar alumnas al montar el componente
//  useEffect(() => {
//    getAlumnas().then(setAlumnas).catch(console.error);
//  }, []);
//
//  // Registrar un pago
//  async function handlePago(form) {
//    try {
//      const res = await createPago({
//        IDAlumna:     alumnaSeleccionada.ID,
//        NombreAlumna: alumnaSeleccionada.Nombre,
//        TipoPaquete:  'Pack 12 clases',
//        Monto:        110000,
//        MetodoPago:   'Nequi',
//      });
//      alert(res.mensaje);
//      // Recargar datos
//      setAlumnas(await getAlumnas());
//    } catch (e) {
//      alert('Error: ' + e.message);
//    }
//  }
//
//  // Programar una clase
//  async function handleClase(form) {
//    await createClase({
//      IDAlumna:     alumna.ID,
//      NombreAlumna: alumna.Nombre,
//      Disciplina:   'Pole',
//      Fecha:        '2026-04-18',
//      Hora:         '07:00 PM',
//    });
//  }
//
// ============================================================
