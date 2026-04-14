-- ============================================================
--  VETVIDA — BASE DE DATOS MYSQL

--  CÓMO USAR EN DBEAVER:
--  1. Abrí DBeaver y conectate a MySQL (localhost / XAMPP)
--  2. File → Open File → seleccioná este archivo
--  3. Ctrl+A para seleccionar todo
--  4. Ctrl+Enter para ejecutar
--
--  CÓMO USAR EN LÍNEA DE COMANDOS:
--  mysql -u root -p < database.sql

--
--  USUARIOS DE PRUEBA (contraseña: VetVida2025!):
--  - dueno@vetvida.com     → Dueño    (acceso total)
--  - admin@vetvida.com     → Admin    (sin gestión de empleados)
--  - vet@vetvida.com       → Veterinario (solo turnos y clientes)
--  - empleado@vetvida.com  → Empleado (productos y pedidos)
-- ============================================================

DROP DATABASE IF EXISTS vetvida_db;

CREATE DATABASE vetvida_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vetvida_db;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================================
--  1. ROLES Y USUARIOS
-- ============================================================

CREATE TABLE roles (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(50)  NOT NULL UNIQUE,
  permisos   JSON         NOT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO roles (nombre, permisos) VALUES
  ('dueño',       '{"dashboard":true,"productos":true,"pedidos":true,"clientes":true,"empleados":true,"turnos":true,"reportes":true,"configuracion":true}'),
  ('admin',       '{"dashboard":true,"productos":true,"pedidos":true,"clientes":true,"empleados":false,"turnos":true,"reportes":true,"configuracion":false}'),
  ('veterinario', '{"dashboard":true,"productos":false,"pedidos":false,"clientes":true,"empleados":false,"turnos":true,"reportes":false,"configuracion":false}'),
  ('empleado',    '{"dashboard":true,"productos":true,"pedidos":true,"clientes":true,"empleados":false,"turnos":false,"reportes":false,"configuracion":false}');


CREATE TABLE usuarios (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  apellido      VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol_id        INT          NOT NULL,
  activo        BOOLEAN      DEFAULT TRUE,
  avatar_url    VARCHAR(255) DEFAULT NULL,
  ultimo_login  TIMESTAMP    NULL DEFAULT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hash bcrypt de "VetVida2025!" — para cambiar: node -e "console.log(require('bcryptjs').hashSync('TuPass',10))"
INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id) VALUES
  ('Carlos',    'Mendez',  'dueno@vetvida.com',    '$2b$10$xJ8qKlM3nP2vR7tY9wZ1EuHsOiA5bDfGcNeVkQpUjTrWmXyIoLzSe', 1),
  ('Valentina', 'Ramos',   'admin@vetvida.com',     '$2b$10$xJ8qKlM3nP2vR7tY9wZ1EuHsOiA5bDfGcNeVkQpUjTrWmXyIoLzSe', 2),
  ('Matias',    'Herrera', 'vet@vetvida.com',        '$2b$10$xJ8qKlM3nP2vR7tY9wZ1EuHsOiA5bDfGcNeVkQpUjTrWmXyIoLzSe', 3),
  ('Luciana',   'Paz',     'empleado@vetvida.com',  '$2b$10$xJ8qKlM3nP2vR7tY9wZ1EuHsOiA5bDfGcNeVkQpUjTrWmXyIoLzSe', 4);


-- ============================================================
--  2. CLIENTES
-- ============================================================

CREATE TABLE clientes (
  id               INT          AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(100) NOT NULL,
  apellido         VARCHAR(100) NOT NULL DEFAULT '',
  email            VARCHAR(150) UNIQUE   DEFAULT NULL,
  telefono         VARCHAR(30)           DEFAULT NULL,
  direccion        VARCHAR(255)          DEFAULT NULL,
  notif_ofertas    BOOLEAN      DEFAULT TRUE,
  notif_novedades  BOOLEAN      DEFAULT TRUE,
  notif_pedidos    BOOLEAN      DEFAULT FALSE,
  notif_newsletter BOOLEAN      DEFAULT FALSE,
  activo           BOOLEAN      DEFAULT TRUE,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO clientes (nombre, apellido, email, telefono, direccion) VALUES
  ('María',    'González', 'maria@email.com',    '+54 341 111-2222', 'Av. Pellegrini 500, Rosario'),
  ('Roberto',  'Díaz',     'roberto@email.com',  '+54 341 333-4444', 'Mendoza 1200, Rosario'),
  ('Carolina', 'Méndez',   'carolina@email.com', '+54 341 555-6666', 'Córdoba 800, Rosario'),
  ('Jorge',    'Pérez',    'jorge@email.com',     '+54 341 777-8888', 'Entre Ríos 400, Rosario'),
  ('Ana',      'López',    'ana@email.com',       '+54 341 999-0000', 'San Martín 150, Rosario');


-- ============================================================
--  3. MASCOTAS
-- ============================================================

CREATE TABLE mascotas (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  cliente_id    INT          NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  especie       ENUM('perro','gato','ave','conejo','reptil','pez','otro') NOT NULL,
  raza          VARCHAR(100) DEFAULT NULL,
  fecha_nac     DATE         DEFAULT NULL,
  sexo          ENUM('macho','hembra','desconocido') DEFAULT 'desconocido',
  peso_kg       DECIMAL(5,2) DEFAULT NULL,
  observaciones TEXT         DEFAULT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO mascotas (cliente_id, nombre, especie, raza, sexo, peso_kg) VALUES
  (1, 'Tobi', 'perro',  'Labrador',         'macho',  28.5),
  (1, 'Mia',  'gato',   'Siamés',           'hembra',  4.2),
  (2, 'Luna', 'gato',   'Persa',            'hembra',  3.8),
  (3, 'Max',  'perro',  'Golden Retriever', 'macho',  32.0),
  (4, 'Pico', 'ave',    'Loro Amazónico',   'macho',   0.4),
  (5, 'Boo',  'conejo', 'Holland Lop',      'hembra',  1.9);


-- ============================================================
--  4. CATEGORÍAS Y PRODUCTOS (tienda)
-- ============================================================

CREATE TABLE categorias (
  id     INT         AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  icono  VARCHAR(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO categorias (nombre, icono) VALUES
  ('medicina',  '💊'),
  ('comida',    '🍖'),
  ('baño',      '🛁'),
  ('juguetes',  '🎾'),
  ('ropa',      '👕'),
  ('camas',     '🛏️'),
  ('comederos', '🥣');


CREATE TABLE productos (
  id           INT            AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(200)   NOT NULL,
  descripcion  TEXT           DEFAULT NULL,
  categoria_id INT            NOT NULL,
  precio       DECIMAL(10,2)  NOT NULL,
  stock        INT            DEFAULT 0,
  stock_minimo INT            DEFAULT 5,
  badge        ENUM('new','sale','top') DEFAULT NULL,
  animales     JSON           DEFAULT NULL,
  emoji        VARCHAR(10)    DEFAULT NULL,
  activo       BOOLEAN        DEFAULT TRUE,
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO productos (nombre, descripcion, categoria_id, precio, stock, stock_minimo, badge, animales, emoji) VALUES
  ('Antiparasitario Interno',  'Comprimidos para eliminar parásitos internos. Sabor carne.',         1,  3200.00,  45, 10, 'top',  '["perro","gato"]',          '💊'),
  ('Antipulgas y Garrapatas',  'Pipeta mensual de amplio espectro. Protección duradera.',             1,  4800.00,  30, 10, 'top',  '["perro","gato"]',          '🧴'),
  ('Vitaminas para Aves',      'Suplemento vitamínico en gotas para pájaros y loros.',               1,  2100.00,  20,  5,  NULL,  '["ave"]',                   '💉'),
  ('Probiótico Digestivo',     'Restaura la flora intestinal. Ideal post-antibióticos.',             1,  3600.00,  25,  8, 'new',  '["perro","gato","conejo"]', '🌿'),
  ('Colirio Oftálmico',        'Limpieza y tratamiento de ojos. Fórmula suave.',                    1,  2800.00,  18,  5,  NULL,  '["perro","gato"]',          '👁️'),
  ('Calcio para Reptiles',     'Suplemento en polvo para espolvorear sobre el alimento.',            1,  1900.00,  15,  5,  NULL,  '["reptil"]',                '🦴'),
  ('Omega 3 Pelaje Brillante', 'Ácidos grasos esenciales para pelo y piel saludables.',              1,  4100.00,  22,  8, 'new',  '["perro","gato"]',          '✨'),
  ('Antibacterial Peces',      'Tratamiento de infecciones bacterianas en acuarios.',                1,  1600.00,  12,  5,  NULL,  '["pez"]',                   '🐠'),
  ('Croquetas Premium Perro',  'Alimento balanceado adulto. Sin colorantes artificiales. 3kg.',      2,  8500.00,  60, 15, 'top',  '["perro"]',                 '🍖'),
  ('Croquetas Gato Adulto',    'Con atún y pollo. Enriquecida con taurina. 2kg.',                   2,  7200.00,  55, 15, 'top',  '["gato"]',                  '🐟'),
  ('Alimento Húmedo Perro',    'Lata con carne real. Complementa la dieta seca.',                   2,  1200.00, 120, 20,  NULL,  '["perro"]',                 '🥫'),
  ('Alimento para Aves',       'Mix de semillas y frutas deshidratadas. 1kg.',                      2,  2400.00,  30,  8,  NULL,  '["ave"]',                   '🌾'),
  ('Pellets para Conejos',     'Alimento completo con heno, zanahoria y vegetales. 1,5kg.',         2,  3100.00,  20,  8, 'new',  '["conejo"]',                '🥕'),
  ('Alimento para Reptiles',   'Grillos y tenebrios deshidratados. Alto valor proteico.',           2,  2700.00,  15,  5,  NULL,  '["reptil"]',                '🦗'),
  ('Snack Dental Perro',       'Palitos masticables para higiene bucal. Pack x12.',                 2,  2200.00,  80, 15, 'sale', '["perro"]',                 '🦷'),
  ('Shampoo Anti-Pulgas Perro','Con citronela y lavanda. 500ml. Ph neutro.',                        3,  3400.00,  35, 10, 'top',  '["perro"]',                 '🧴'),
  ('Shampoo para Gatos',       'Fórmula suave sin alcohol. Para pelaje largo y corto.',             3,  2900.00,  28,  8,  NULL,  '["gato"]',                  '🛁'),
  ('Colonia para Mascotas',    'Perfume de larga duración. Aroma lavanda y vainilla.',              3,  2100.00,  25,  8,  NULL,  '["perro","gato"]',          '🌸'),
  ('Cortaúñas Profesional',    'Acero inoxidable con guía de seguridad. Ergonómico.',               3,  4200.00,  15,  5,  NULL,  '["perro","gato","conejo"]', '✂️'),
  ('Cepillo Cardador',         'Púas redondeadas. Elimina pelo muerto eficazmente.',                3,  3100.00,  20,  5, 'new',  '["perro","gato"]',          '🪮'),
  ('Pelota Kong Rellenable',   'Goma resistente. Rellená con premios para mantenerlo ocupado.',     4,  5200.00,  28,  8, 'top',  '["perro"]',                 '🎾'),
  ('Rascador para Gatos',      'Torre con cuerda sisal, plataformas y juguete colgante.',           4, 12000.00,  12,  5, 'top',  '["gato"]',                  '🏗️'),
  ('Juguete Interactivo Ave',  'Espejo con campana y argollas de colores.',                         4,  1900.00,  18,  5,  NULL,  '["ave"]',                   '🪀'),
  ('Puntero Láser',            '5 figuras distintas y luz LED. Pilas incluidas.',                   4,  2200.00,  22,  5,  NULL,  '["gato"]',                  '🔴'),
  ('Campera Polar Perro',      'Forro polar suave. Tallas XS a XL.',                               5,  7800.00,  18,  5, 'new',  '["perro"]',                 '🧥'),
  ('Capa Impermeable',         'Ajustable con capucha. Ideal para días de lluvia.',                 5,  9200.00,  12,  5, 'top',  '["perro"]',                 '🌧️'),
  ('Cama Cueva Polar',         'Interior polar súper suave. Razas pequeñas.',                       6, 11500.00,  14,  5, 'top',  '["perro","gato"]',          '🛏️'),
  ('Cama Ortopédica Grande',   'Espuma viscoelástica para razas grandes y seniors.',                6, 18000.00,   8,  3, 'new',  '["perro"]',                 '🛋️'),
  ('Hamaca para Gato',         'Se cuelga en la ventana. Soporta hasta 8kg.',                      6,  5400.00,  10,  3, 'new',  '["gato"]',                  '🌙'),
  ('Comedero Automático',      'Dispensador programable con temporizador y pantalla LCD.',           7, 22000.00,   8,  3, 'new',  '["perro","gato"]',          '🥣'),
  ('Bebedero Fuente',          'Fuente circulante con filtro de carbón. 2 litros.',                 7, 14500.00,  10,  3, 'top',  '["perro","gato"]',          '⛲'),
  ('Set Comedero + Bebedero',  'Acero inoxidable antibacterial. Base antideslizante.',              7,  6800.00,  20,  5,  NULL,  '["perro","gato"]',          '🫙');


-- ============================================================
--  5. PEDIDOS Y DETALLE
-- ============================================================

CREATE TABLE pedidos (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  cliente_id      INT           DEFAULT NULL,
  cliente_nombre  VARCHAR(200)  NOT NULL,
  cliente_email   VARCHAR(150)  DEFAULT NULL,
  cliente_tel     VARCHAR(30)   DEFAULT NULL,
  direccion_envio VARCHAR(255)  DEFAULT NULL,
  total           DECIMAL(10,2) NOT NULL,
  metodo_pago     ENUM('tarjeta-credito','tarjeta-debito','transferencia','mercadopago','efectivo','qr') NOT NULL,
  cuotas          INT           DEFAULT 1,
  estado          ENUM('pendiente','confirmado','preparando','enviado','entregado','cancelado') DEFAULT 'pendiente',
  notas           TEXT          DEFAULT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE pedido_items (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  pedido_id   INT           NOT NULL,
  producto_id INT           DEFAULT NULL,
  nombre      VARCHAR(200)  NOT NULL,
  precio      DECIMAL(10,2) NOT NULL,
  cantidad    INT           NOT NULL,
  subtotal    DECIMAL(10,2) GENERATED ALWAYS AS (precio * cantidad) STORED,
  FOREIGN KEY (pedido_id)   REFERENCES pedidos(id)   ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO pedidos (cliente_id, cliente_nombre, cliente_email, total, metodo_pago, cuotas, estado) VALUES
  (1, 'María González',  'maria@email.com',    15700.00, 'tarjeta-credito', 3,  'entregado'),
  (2, 'Roberto Díaz',    'roberto@email.com',   8500.00, 'mercadopago',     1,  'enviado'),
  (3, 'Carolina Méndez', 'carolina@email.com', 26800.00, 'tarjeta-credito', 6,  'preparando'),
  (4, 'Jorge Pérez',     'jorge@email.com',     4800.00, 'transferencia',   1,  'confirmado'),
  (5, 'Ana López',       'ana@email.com',      19300.00, 'tarjeta-credito', 12, 'pendiente');

INSERT INTO pedido_items (pedido_id, producto_id, nombre, precio, cantidad) VALUES
  (1, 9,  'Croquetas Premium Perro',  8500.00, 1),
  (1, 1,  'Antiparasitario Interno',  3200.00, 1),
  (1, 11, 'Alimento Húmedo Perro',    1200.00, 2),
  (2, 9,  'Croquetas Premium Perro',  8500.00, 1),
  (3, 30, 'Comedero Automático',     22000.00, 1),
  (3, 2,  'Antipulgas y Garrapatas',  4800.00, 1),
  (4, 2,  'Antipulgas y Garrapatas',  4800.00, 1),
  (5, 31, 'Bebedero Fuente',         14500.00, 1),
  (5, 25, 'Campera Polar Perro',      7800.00, 1);


-- ============================================================
--  6. TURNOS VETERINARIOS
-- ============================================================

CREATE TABLE turnos (
  id             INT          AUTO_INCREMENT PRIMARY KEY,
  cliente_id     INT          DEFAULT NULL,
  mascota_id     INT          DEFAULT NULL,
  veterinario_id INT          DEFAULT NULL,
  cliente_nombre VARCHAR(200) DEFAULT NULL,
  cliente_tel    VARCHAR(30)  DEFAULT NULL,
  mascota_nombre VARCHAR(100) DEFAULT NULL,
  especie        VARCHAR(50)  DEFAULT NULL,
  servicio       ENUM('consulta-general','vacunacion','laboratorio','cirugia','imagen','estetica') NOT NULL,
  fecha          DATE         NOT NULL,
  hora           TIME         NOT NULL,
  estado         ENUM('pendiente','confirmado','en-curso','completado','cancelado') DEFAULT 'pendiente',
  notas          TEXT         DEFAULT NULL,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id)     REFERENCES clientes(id) ON DELETE SET NULL,
  FOREIGN KEY (mascota_id)     REFERENCES mascotas(id) ON DELETE SET NULL,
  FOREIGN KEY (veterinario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO turnos (cliente_id, mascota_id, veterinario_id, cliente_nombre, mascota_nombre, especie, servicio, fecha, hora, estado) VALUES
  (1, 1, 3, 'María González',  'Tobi', 'perro',  'consulta-general', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', 'confirmado'),
  (2, 3, 3, 'Roberto Díaz',    'Luna', 'gato',   'vacunacion',        DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 'confirmado'),
  (3, 4, 3, 'Carolina Méndez', 'Max',  'perro',  'laboratorio',       DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 'pendiente'),
  (4, 5, 3, 'Jorge Pérez',     'Pico', 'ave',    'consulta-general',  DATE_ADD(CURDATE(), INTERVAL 3 DAY), '15:00:00', 'pendiente'),
  (5, 6, 3, 'Ana López',       'Boo',  'conejo', 'estetica',           DATE_ADD(CURDATE(), INTERVAL 5 DAY), '09:00:00', 'pendiente');


-- ============================================================
--  7. HISTORIAL CLÍNICO
-- ============================================================

CREATE TABLE historial_clinico (
  id             INT          AUTO_INCREMENT PRIMARY KEY,
  mascota_id     INT          NOT NULL,
  veterinario_id INT          DEFAULT NULL,
  turno_id       INT          DEFAULT NULL,
  tipo           ENUM('consulta','vacuna','cirugia','laboratorio','otro') NOT NULL,
  descripcion    TEXT         NOT NULL,
  diagnostico    TEXT         DEFAULT NULL,
  tratamiento    TEXT         DEFAULT NULL,
  peso_kg        DECIMAL(5,2) DEFAULT NULL,
  proxima_visita DATE         DEFAULT NULL,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mascota_id)     REFERENCES mascotas(id) ON DELETE CASCADE,
  FOREIGN KEY (veterinario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (turno_id)       REFERENCES turnos(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  8. SESIONES Y LOG DE ACTIVIDAD
-- ============================================================

CREATE TABLE sesiones (
  id          VARCHAR(128) PRIMARY KEY,
  usuario_id  INT          NOT NULL,
  ip          VARCHAR(45)  DEFAULT NULL,
  user_agent  TEXT         DEFAULT NULL,
  expires_at  TIMESTAMP    NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE activity_log (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT          DEFAULT NULL,
  accion      VARCHAR(100) NOT NULL,
  entidad     VARCHAR(50)  DEFAULT NULL,
  entidad_id  INT          DEFAULT NULL,
  detalle     JSON         DEFAULT NULL,
  ip          VARCHAR(45)  DEFAULT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
--  9. VISTAS PARA EL DASHBOARD
-- ============================================================

CREATE OR REPLACE VIEW v_ventas_mes AS
SELECT
  YEAR(created_at)  AS año,
  MONTH(created_at) AS mes,
  COUNT(*)          AS total_pedidos,
  SUM(total)        AS ingresos
FROM pedidos
WHERE estado != 'cancelado'
GROUP BY YEAR(created_at), MONTH(created_at)
ORDER BY año DESC, mes DESC;


CREATE OR REPLACE VIEW v_stock_bajo AS
SELECT p.id, p.nombre, p.stock, p.stock_minimo, c.nombre AS categoria
FROM productos p
JOIN categorias c ON p.categoria_id = c.id
WHERE p.stock <= p.stock_minimo AND p.activo = TRUE
ORDER BY p.stock ASC;


CREATE OR REPLACE VIEW v_turnos_hoy AS
SELECT
  t.id, t.hora, t.servicio, t.estado,
  t.cliente_nombre, t.mascota_nombre, t.especie,
  CONCAT(IFNULL(u.nombre,''), ' ', IFNULL(u.apellido,'')) AS veterinario
FROM turnos t
LEFT JOIN usuarios u ON t.veterinario_id = u.id
WHERE t.fecha = CURDATE()
ORDER BY t.hora;


CREATE OR REPLACE VIEW v_pedidos_pendientes AS
SELECT p.id, p.created_at, p.cliente_nombre, p.total, p.metodo_pago,
       COUNT(pi.id) AS cant_items
FROM pedidos p
JOIN pedido_items pi ON p.id = pi.pedido_id
WHERE p.estado IN ('confirmado', 'preparando')
GROUP BY p.id
ORDER BY p.created_at ASC;


-- ============================================================
--  RESTAURAR CONFIGURACIÓN
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
--  VERIFICACIÓN — todos los valores deben ser > 0
-- ============================================================
SELECT 'roles'              AS tabla, COUNT(*) AS registros FROM roles
UNION ALL SELECT 'usuarios',           COUNT(*) FROM usuarios
UNION ALL SELECT 'clientes',           COUNT(*) FROM clientes
UNION ALL SELECT 'mascotas',           COUNT(*) FROM mascotas
UNION ALL SELECT 'categorias',         COUNT(*) FROM categorias
UNION ALL SELECT 'productos',          COUNT(*) FROM productos
UNION ALL SELECT 'pedidos',            COUNT(*) FROM pedidos
UNION ALL SELECT 'pedido_items',       COUNT(*) FROM pedido_items
UNION ALL SELECT 'turnos',             COUNT(*) FROM turnos;

SELECT '✅ vetvida_db instalada. Ejecutá: npm run dev' AS estado;

-- ============================================================
--  PRÓXIMOS PASOS:
--  1. Copiá .env.example a .env y completá DB_PASSWORD
--  2. cd vetvida-backend && npm install && npm run dev
--  3. Panel admin: http://localhost:3000/admin
--  Para limpiar datos de prueba: ejecutá reset_datos.sql
-- ============================================================