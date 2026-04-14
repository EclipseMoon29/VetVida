-- ============================================================
--  VETVIDA — LIMPIEZA DE DATOS DE PRUEBA
--  reset_datos.sql
--
--  INSTRUCCIONES EN DBEAVER:
--  1. Abrí DBeaver y conectate a vetvida_db
--  2. Abrí este archivo: File → Open File
--  3. Ejecutá TODO con Ctrl+A → Ctrl+Enter
--
--  ⚠️  ESTO BORRA: turnos, pedidos, clientes y mascotas de prueba.
--  ✅  CONSERVA:   tablas, productos, categorías y usuarios del sistema.
-- ============================================================

USE vetvida_db;

-- Desactivar chequeo de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Limpiar actividad y sesiones
TRUNCATE TABLE activity_log;
TRUNCATE TABLE sesiones;

-- 2. Limpiar historial clínico
TRUNCATE TABLE historial_clinico;

-- 3. Limpiar turnos
TRUNCATE TABLE turnos;

-- 4. Limpiar pedidos e items
TRUNCATE TABLE pedido_items;
TRUNCATE TABLE pedidos;

-- 5. Limpiar mascotas y clientes
TRUNCATE TABLE mascotas;
TRUNCATE TABLE clientes;

-- Reactivar chequeo de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- 6. Resetear el stock de productos al valor original
--    (los pedidos de prueba habían descontado stock)
UPDATE productos SET stock = 45  WHERE nombre = 'Antiparasitario Interno';
UPDATE productos SET stock = 30  WHERE nombre = 'Antipulgas y Garrapatas';
UPDATE productos SET stock = 20  WHERE nombre = 'Vitaminas para Aves';
UPDATE productos SET stock = 25  WHERE nombre = 'Probiótico Digestivo';
UPDATE productos SET stock = 60  WHERE nombre = 'Croquetas Premium Perro';
UPDATE productos SET stock = 55  WHERE nombre = 'Croquetas Gato Adulto';
UPDATE productos SET stock = 120 WHERE nombre = 'Alimento Húmedo Perro';
UPDATE productos SET stock = 35  WHERE nombre = 'Shampoo Anti-Pulgas Perro';
UPDATE productos SET stock = 28  WHERE nombre = 'Pelota Kong Rellenable';
UPDATE productos SET stock = 12  WHERE nombre = 'Rascador para Gatos';
UPDATE productos SET stock = 18  WHERE nombre = 'Campera Polar Perro';
UPDATE productos SET stock = 14  WHERE nombre = 'Cama Cueva Polar';
UPDATE productos SET stock = 8   WHERE nombre = 'Comedero Automático';
UPDATE productos SET stock = 10  WHERE nombre = 'Bebedero Fuente';
UPDATE productos SET stock = 80  WHERE nombre = 'Snack Dental Perro';

-- Verificación final
SELECT 'turnos'    AS tabla, COUNT(*) AS registros FROM turnos
UNION ALL
SELECT 'pedidos',   COUNT(*) FROM pedidos
UNION ALL
SELECT 'clientes',  COUNT(*) FROM clientes
UNION ALL
SELECT 'mascotas',  COUNT(*) FROM mascotas
UNION ALL
SELECT 'productos', COUNT(*) FROM productos
UNION ALL
SELECT 'usuarios',  COUNT(*) FROM usuarios;

-- ✅ Si ves 0 en turnos/pedidos/clientes/mascotas y > 0 en productos/usuarios,
--    la limpieza fue exitosa.
SELECT '✅ Base de datos lista para datos reales' AS estado;