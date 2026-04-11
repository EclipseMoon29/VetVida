// ============================================================
//  VETVIDA — SERVIDOR EXPRESS (server.js)
//  
//  CÓMO CORRER:
//  1. npm install
//  2. Copiá .env.example a .env y completá tus datos
//  3. Ejecutá database.sql en DBeaver
//  4. npm run dev   (o npm start)
//  5. Abrí http://localhost:3000/admin
// ============================================================

require('dotenv').config();
const express      = require('express');
const mysql        = require('mysql2/promise');
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.options('*', cors()); // Handle preflight requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ── Conexión a MySQL ─────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'Yae',
  password: process.env.DB_PASSWORD || 'Tonytony2729ynmc!',
  database: process.env.DB_NAME     || 'vetvida_db',
  waitForConnections: true,
  connectionLimit:    10,
});

// Verificar conexión al iniciar
pool.getConnection()
  .then(conn => { console.log('✅ MySQL conectado correctamente'); conn.release(); })
  .catch(err  => console.error('❌ Error MySQL:', err.message));


// ── Middleware de autenticación JWT ──────────────────────────
function authMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Verificar permiso específico
function requirePermiso(permiso) {
  return (req, res, next) => {
    const permisos = req.user?.permisos || {};
    if (permisos[permiso]) return next();
    res.status(403).json({ error: 'Sin permiso para esta acción' });
  };
}


// ============================================================
//  AUTH ROUTES
// ============================================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña requeridos' });

  try {
    const [rows] = await pool.query(
      `SELECT u.*, r.nombre AS rol_nombre, r.permisos
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id
       WHERE u.email = ? AND u.activo = TRUE`,
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

    // Actualizar último login
    await pool.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [user.id]);

    // Log de actividad
    await pool.query(
      'INSERT INTO activity_log (usuario_id, accion, ip) VALUES (?, ?, ?)',
      [user.id, 'login', req.ip]
    );

    const permisos = typeof user.permisos === 'string'
      ? JSON.parse(user.permisos) : user.permisos;

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, apellido: user.apellido,
        email: user.email, rol: user.rol_nombre, permisos },
      process.env.JWT_SECRET || 'secreto',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.cookie('token', token, {
      httpOnly: true, maxAge: 8 * 60 * 60 * 1000, sameSite: 'lax'
    });

    res.json({
      ok: true,
      token,
      usuario: { id: user.id, nombre: user.nombre, apellido: user.apellido,
                 email: user.email, rol: user.rol_nombre, permisos }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ usuario: req.user });
});


// ============================================================
//  DASHBOARD
// ============================================================

app.get('/api/dashboard', authMiddleware, async (req, res) => {
  try {
    const [[{ total_pedidos }]]   = await pool.query("SELECT COUNT(*) AS total_pedidos FROM pedidos WHERE estado != 'cancelado'");
    const [[{ ingresos_mes }]]    = await pool.query("SELECT COALESCE(SUM(total),0) AS ingresos_mes FROM pedidos WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW()) AND estado!='cancelado'");
    const [[{ total_clientes }]]  = await pool.query('SELECT COUNT(*) AS total_clientes FROM clientes WHERE activo=TRUE');
    const [[{ turnos_hoy }]]      = await pool.query("SELECT COUNT(*) AS turnos_hoy FROM turnos WHERE fecha=CURDATE() AND estado!='cancelado'");
    const [[{ pedidos_pend }]]    = await pool.query("SELECT COUNT(*) AS pedidos_pend FROM pedidos WHERE estado IN ('pendiente','confirmado','preparando')");
    const [[{ total_prods }]]     = await pool.query('SELECT COUNT(*) AS total_prods FROM productos WHERE activo=TRUE');
    const [stock_bajo]            = await pool.query('SELECT * FROM v_stock_bajo');
    const [ultimos_pedidos]       = await pool.query('SELECT p.id, p.cliente_nombre, p.total, p.estado, p.metodo_pago, p.created_at FROM pedidos p ORDER BY p.created_at DESC LIMIT 6');
    const [turnos_hoy_lista]      = await pool.query('SELECT * FROM v_turnos_hoy LIMIT 6');
    const [ventas_chart]          = await pool.query('SELECT * FROM v_ventas_mes LIMIT 6');
    const [metodos]               = await pool.query("SELECT metodo_pago, COUNT(*) AS pedidos, COALESCE(SUM(total),0) AS total FROM pedidos WHERE estado!='cancelado' GROUP BY metodo_pago ORDER BY total DESC");

    // Turnos por servicio — datos reales para el gráfico polar
    const [turnos_por_servicio] = await pool.query(`
      SELECT servicio, COUNT(*) AS total
      FROM turnos WHERE estado != 'cancelado'
      GROUP BY servicio ORDER BY total DESC
    `);

    // Turnos pendientes próximos 7 días — para la timeline
    const [turnos_pendientes] = await pool.query(`
      SELECT t.id, t.fecha, t.hora, t.servicio, t.estado,
             t.cliente_nombre, t.mascota_nombre, t.especie,
             CONCAT(IFNULL(u.nombre,''), ' ', IFNULL(u.apellido,'')) AS veterinario
      FROM turnos t LEFT JOIN usuarios u ON t.veterinario_id = u.id
      WHERE t.estado IN ('pendiente','confirmado')
        AND t.fecha >= CURDATE()
        AND t.fecha <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY t.fecha ASC, t.hora ASC LIMIT 10
    `);

    res.json({
      stats: { total_pedidos, ingresos_mes, total_clientes, turnos_hoy, pedidos_pend, total_prods },
      stock_bajo, ultimos_pedidos,
      turnos_hoy: turnos_hoy_lista,
      ventas_chart, metodos,
      turnos_por_servicio, turnos_pendientes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cargar dashboard' });
  }
});


// ============================================================
//  PRODUCTOS
// ============================================================

app.get('/api/productos', authMiddleware, async (req, res) => {
  const { buscar, categoria, activo } = req.query;
  let sql = `SELECT p.*, c.nombre AS categoria_nombre, c.icono AS categoria_icono
             FROM productos p JOIN categorias c ON p.categoria_id = c.id WHERE 1=1`;
  const params = [];
  if (buscar)    { sql += ' AND p.nombre LIKE ?';       params.push(`%${buscar}%`); }
  if (categoria) { sql += ' AND p.categoria_id = ?';    params.push(categoria); }
  if (activo !== undefined) { sql += ' AND p.activo = ?'; params.push(activo === 'true' ? 1 : 0); }
  sql += ' ORDER BY p.id DESC';
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

app.get('/api/productos/:id', authMiddleware, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});

app.post('/api/productos', authMiddleware, requirePermiso('productos'), async (req, res) => {
  const { nombre, descripcion, categoria_id, precio, stock, stock_minimo, badge, animales, emoji } = req.body;
  const [result] = await pool.query(
    'INSERT INTO productos (nombre, descripcion, categoria_id, precio, stock, stock_minimo, badge, animales, emoji) VALUES (?,?,?,?,?,?,?,?,?)',
    [nombre, descripcion, categoria_id, precio, stock || 0, stock_minimo || 5, badge || null, JSON.stringify(animales || []), emoji || '📦']
  );
  await pool.query('INSERT INTO activity_log (usuario_id, accion, entidad, entidad_id) VALUES (?,?,?,?)',
    [req.user.id, 'producto_creado', 'producto', result.insertId]);
  res.json({ ok: true, id: result.insertId });
});

app.put('/api/productos/:id', authMiddleware, requirePermiso('productos'), async (req, res) => {
  const { nombre, descripcion, categoria_id, precio, stock, stock_minimo, badge, animales, emoji, activo } = req.body;
  await pool.query(
    'UPDATE productos SET nombre=?, descripcion=?, categoria_id=?, precio=?, stock=?, stock_minimo=?, badge=?, animales=?, emoji=?, activo=? WHERE id=?',
    [nombre, descripcion, categoria_id, precio, stock, stock_minimo, badge||null, JSON.stringify(animales||[]), emoji, activo, req.params.id]
  );
  await pool.query('INSERT INTO activity_log (usuario_id, accion, entidad, entidad_id) VALUES (?,?,?,?)',
    [req.user.id, 'producto_editado', 'producto', req.params.id]);
  res.json({ ok: true });
});

app.delete('/api/productos/:id', authMiddleware, requirePermiso('productos'), async (req, res) => {
  await pool.query('UPDATE productos SET activo = FALSE WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});


// ============================================================
//  PEDIDOS
// ============================================================

app.get('/api/pedidos', authMiddleware, async (req, res) => {
  try {
    const { estado, buscar } = req.query;
    let sql = 'SELECT p.*, COUNT(pi.id) AS cant_items FROM pedidos p LEFT JOIN pedido_items pi ON p.id=pi.pedido_id WHERE 1=1';
    const params = [];
    if (estado)  { sql += ' AND p.estado = ?'; params.push(estado); }
    if (buscar)  { sql += ' AND (p.cliente_nombre LIKE ? OR p.cliente_email LIKE ?)'; params.push(`%${buscar}%`, `%${buscar}%`); }
    sql += ' GROUP BY p.id ORDER BY p.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch(err) {
    console.error('[GET /api/pedidos]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pedidos/:id', authMiddleware, async (req, res) => {
  const [[pedido]] = await pool.query('SELECT * FROM pedidos WHERE id=?', [req.params.id]);
  if (!pedido) return res.status(404).json({ error: 'No encontrado' });
  const [items] = await pool.query('SELECT * FROM pedido_items WHERE pedido_id=?', [req.params.id]);
  res.json({ ...pedido, items });
});

app.put('/api/pedidos/:id/estado', authMiddleware, requirePermiso('pedidos'), async (req, res) => {
  const { estado } = req.body;
  await pool.query('UPDATE pedidos SET estado=? WHERE id=?', [estado, req.params.id]);
  await pool.query('INSERT INTO activity_log (usuario_id, accion, entidad, entidad_id, detalle) VALUES (?,?,?,?,?)',
    [req.user.id, 'pedido_actualizado', 'pedido', req.params.id, JSON.stringify({ estado })]);
  res.json({ ok: true });
});

// POST desde la tienda (público)
app.post('/api/pedidos', async (req, res) => {
  console.log('[POST /api/pedidos] Body recibido:', JSON.stringify(req.body).slice(0,200));
  const { cliente_nombre, cliente_email, cliente_tel, direccion_envio, metodo_pago, cuotas, items } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'Sin items' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Calcular total desde la BD (nunca confiar en el precio del cliente)
    let total = 0;
    const itemsDB = [];
    for (const item of items) {
      const [[prod]] = await conn.query('SELECT id, nombre, precio, stock FROM productos WHERE id=? AND activo=TRUE', [item.id]);
      if (!prod) throw new Error(`Producto ${item.id} no disponible`);
      if (prod.stock < item.qty) throw new Error(`Stock insuficiente para ${prod.nombre}`);
      total += prod.precio * item.qty;
      itemsDB.push({ ...prod, qty: item.qty });
    }

    const [res1] = await conn.query(
      'INSERT INTO pedidos (cliente_nombre, cliente_email, cliente_tel, direccion_envio, total, metodo_pago, cuotas, estado) VALUES (?,?,?,?,?,?,?,?)',
      [cliente_nombre, cliente_email, cliente_tel, direccion_envio, total, metodo_pago, cuotas || 1, 'pendiente']
    );
    const pedidoId = res1.insertId;

    for (const item of itemsDB) {
      await conn.query('INSERT INTO pedido_items (pedido_id, producto_id, nombre, precio, cantidad) VALUES (?,?,?,?,?)',
        [pedidoId, item.id, item.nombre, item.precio, item.qty]);
      await conn.query('UPDATE productos SET stock = stock - ? WHERE id=?', [item.qty, item.id]);
    }

    await conn.commit();
    res.json({ ok: true, pedido_id: pedidoId, total });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    conn.release();
  }
});


// ============================================================
//  CLIENTES
// ============================================================

// POST /api/clientes — registro público desde la tienda
app.post('/api/clientes', async (req, res) => {
  console.log('[POST /api/clientes] Body recibido:', req.body);
  const { nombre, apellido, email, notif_ofertas, notif_novedades, notif_pedidos, notif_newsletter } = req.body;
  if (!nombre || !email) return res.status(400).json({ error: 'Nombre y email requeridos' });
  try {
    const [exist] = await pool.query('SELECT id FROM clientes WHERE email = ?', [email]);
    if (exist.length) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    const [result] = await pool.query(
      'INSERT INTO clientes (nombre, apellido, email, notif_ofertas, notif_novedades, notif_pedidos, notif_newsletter) VALUES (?,?,?,?,?,?,?)',
      [nombre, apellido||'', email, notif_ofertas??true, notif_novedades??true, notif_pedidos??false, notif_newsletter??false]
    );
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar cliente' });
  }
});

app.get('/api/clientes', authMiddleware, async (req, res) => {
  try {
    const { buscar } = req.query;
    let sql = `SELECT c.*, COUNT(DISTINCT m.id) AS cant_mascotas, COUNT(DISTINCT p.id) AS cant_pedidos
               FROM clientes c
               LEFT JOIN mascotas m ON c.id = m.cliente_id
               LEFT JOIN pedidos  p ON c.id = p.cliente_id
               WHERE c.activo = TRUE`;
    const params = [];
    if (buscar) { sql += ' AND (c.nombre LIKE ? OR c.email LIKE ? OR c.apellido LIKE ?)'; params.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`); }
    sql += ' GROUP BY c.id ORDER BY c.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch(err) {
    console.error('[GET /api/clientes]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clientes/:id', authMiddleware, async (req, res) => {
  const [[cliente]] = await pool.query('SELECT * FROM clientes WHERE id=?', [req.params.id]);
  if (!cliente) return res.status(404).json({ error: 'No encontrado' });
  const [mascotas] = await pool.query('SELECT * FROM mascotas WHERE cliente_id=?', [req.params.id]);
  const [pedidos]  = await pool.query('SELECT id, total, estado, created_at FROM pedidos WHERE cliente_id=? ORDER BY created_at DESC LIMIT 5', [req.params.id]);
  res.json({ ...cliente, mascotas, pedidos });
});


// ============================================================
//  TURNOS
// ============================================================

app.get('/api/turnos', authMiddleware, async (req, res) => {
  try {
    const { fecha, estado } = req.query;
    let sql = `SELECT t.*, CONCAT(IFNULL(u.nombre,''), ' ', IFNULL(u.apellido,'')) AS veterinario
               FROM turnos t LEFT JOIN usuarios u ON t.veterinario_id=u.id WHERE 1=1`;
    const params = [];
    if (fecha)  { sql += ' AND t.fecha = ?';  params.push(fecha); }
    // Sin filtro de fecha: muestra todos (pasados y futuros)
    if (estado) { sql += ' AND t.estado = ?'; params.push(estado); }
    sql += ' ORDER BY t.fecha DESC, t.hora DESC LIMIT 200';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch(err) {
    console.error('[GET /api/turnos]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/turnos/:id/estado', authMiddleware, requirePermiso('turnos'), async (req, res) => {
  await pool.query('UPDATE turnos SET estado=? WHERE id=?', [req.body.estado, req.params.id]);
  res.json({ ok: true });
});

// POST desde la web (público)
app.post('/api/turnos', async (req, res) => {
  console.log('[POST /api/turnos] Body recibido:', req.body);
  try {
    const { cliente_nombre, cliente_tel, mascota_nombre, especie, servicio, fecha, hora, comentarios } = req.body;

    // Validación de campos obligatorios
    if (!cliente_nombre || !fecha || !hora || !servicio) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: nombre, fecha, hora, servicio' });
    }

    // Normalizar especie al enum válido
    const especiesValidas = ['perro','gato','ave','conejo','reptil','pez','otro'];
    const especieNorm = (especie || '').toLowerCase();
    const especieFinal = especiesValidas.includes(especieNorm) ? especieNorm : 'otro';

    // Normalizar servicio al enum válido
    const serviciosValidos = ['consulta-general','vacunacion','laboratorio','cirugia','imagen','estetica'];
    const servicioNorm = (servicio || '').toLowerCase();
    const servicioFinal = serviciosValidos.includes(servicioNorm) ? servicioNorm : 'consulta-general';

    // Normalizar hora — acepta "09:00", "09:00:00", "09:00 - 10:00"
    let horaFinal = hora.toString().split(' - ')[0].trim();
    if (horaFinal.split(':').length === 2) horaFinal += ':00'; // "09:00" → "09:00:00"

    const [result] = await pool.query(
      'INSERT INTO turnos (cliente_nombre, cliente_tel, mascota_nombre, especie, servicio, fecha, hora, notas) VALUES (?,?,?,?,?,?,?,?)',
      [cliente_nombre, cliente_tel || null, mascota_nombre || null, especieFinal, servicioFinal, fecha, horaFinal, comentarios || null]
    );

    console.log(`[POST /api/turnos] ✅ Turno creado ID=${result.insertId}`);
    res.json({ ok: true, turno_id: result.insertId });

  } catch (err) {
    console.error('[POST /api/turnos] ❌ Error:', err.message);
    res.status(500).json({ error: 'Error al guardar el turno: ' + err.message });
  }
});


// ============================================================
//  USUARIOS (solo dueño/admin puede ver)
// ============================================================

app.get('/api/usuarios', authMiddleware, requirePermiso('empleados'), async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.email, u.activo, u.ultimo_login, u.created_at,
            r.nombre AS rol
     FROM usuarios u JOIN roles r ON u.rol_id = r.id ORDER BY u.id`
  );
  res.json(rows);
});

app.post('/api/usuarios', authMiddleware, requirePermiso('empleados'), async (req, res) => {
  const { nombre, apellido, email, password, rol_id } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id) VALUES (?,?,?,?,?)',
    [nombre, apellido, email, hash, rol_id]
  );
  res.json({ ok: true, id: result.insertId });
});

app.put('/api/usuarios/:id', authMiddleware, requirePermiso('empleados'), async (req, res) => {
  const { nombre, apellido, email, rol_id, activo } = req.body;
  await pool.query('UPDATE usuarios SET nombre=?, apellido=?, email=?, rol_id=?, activo=? WHERE id=?',
    [nombre, apellido, email, rol_id, activo, req.params.id]);
  res.json({ ok: true });
});


// ============================================================
//  CATEGORÍAS
// ============================================================
app.get('/api/categorias', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM categorias');
  res.json(rows);
});

// ============================================================
//  REPORTES
// ============================================================
app.get('/api/reportes/ventas', authMiddleware, requirePermiso('reportes'), async (req, res) => {
  const [porMes]      = await pool.query('SELECT * FROM v_ventas_mes LIMIT 12');
  const [porMetodo]   = await pool.query("SELECT metodo_pago, COUNT(*) AS pedidos, SUM(total) AS total FROM pedidos WHERE estado!='cancelado' GROUP BY metodo_pago");
  const [topProductos]= await pool.query("SELECT p.nombre, SUM(pi.cantidad) AS vendidos, SUM(pi.subtotal) AS ingresos FROM pedido_items pi JOIN productos p ON pi.producto_id=p.id GROUP BY pi.producto_id ORDER BY vendidos DESC LIMIT 10");
  res.json({ por_mes: porMes, por_metodo: porMetodo, top_productos: topProductos });
});

app.get('/api/reportes/stock', authMiddleware, requirePermiso('reportes'), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM v_stock_bajo');
  res.json(rows);
});


// ── Servir el panel de admin ─────────────────────────────────
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 VetVida Backend corriendo en http://localhost:${PORT}`);
  console.log(`📊 Panel admin:          http://localhost:${PORT}/admin`);
  console.log(`🔌 API:                  http://localhost:${PORT}/api`);
  console.log(`\nUsuarios de prueba:`);
  console.log(`  dueno@vetvida.com    / VetVida2025!`);
  console.log(`  admin@vetvida.com    / VetVida2025!`);
  console.log(`  vet@vetvida.com      / VetVida2025!`);
  console.log(`  empleado@vetvida.com / VetVida2025!\n`);
});