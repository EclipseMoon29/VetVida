/* ============================================================
   VETVIDA — API CLIENT (api.js)
   Archivo compartido por index.html, tienda.html y cualquier
   página que necesite hablar con el backend.

   Cambiá BASE_URL si el backend corre en otro puerto o dominio.
   ============================================================ */

const BASE_URL = 'http://localhost:3000';

/* Wrapper de fetch con manejo de errores centralizado */
async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(BASE_URL + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // Servidor no disponible — devolvemos objeto de error controlado
    console.warn(`[VetVida API] Sin conexión a ${path}:`, err.message);
    return { ok: false, status: 0, data: { error: 'Sin conexión al servidor' }, offline: true };
  }
}

/* Helpers públicos */
const VetAPI = {
  /* ── Turnos ── */
  async crearTurno(payload) {
    return apiFetch('/api/turnos', { method: 'POST', body: payload });
  },

  /* ── Pedidos ── */
  async crearPedido(payload) {
    return apiFetch('/api/pedidos', { method: 'POST', body: payload });
  },

  /* ── Clientes ── */
  async registrarCliente(payload) {
    return apiFetch('/api/clientes', { method: 'POST', body: payload });
  },

  /* ── Productos (para la tienda) ── */
  async getProductos(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    return apiFetch('/api/productos' + (params ? '?' + params : ''));
  },
};