-- 1. Creación y selección de la Base de Datos
CREATE DATABASE IF NOT EXISTS GestifleetBD;
USE GestifleetBD;

---

-- 2. Creación de las Tablas
CREATE TABLE IF NOT EXISTS concesionarios (
  id_concesionario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  ciudad VARCHAR(50) NOT NULL,
  direccion VARCHAR(150) NOT NULL,
  telefono_contacto VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  contraseña VARCHAR(255) NOT NULL,
  rol ENUM('empleado','admin') NOT NULL,
  telefono VARCHAR(20),
  id_concesionario INT,
  preferencias_accesibilidad JSON,
  FOREIGN KEY (id_concesionario) REFERENCES concesionarios(id_concesionario)
);

CREATE TABLE IF NOT EXISTS vehiculos (
  id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
  matricula VARCHAR(10) UNIQUE NOT NULL,
  marca VARCHAR(50) NOT NULL,
  modelo VARCHAR(50) NOT NULL,
  año_matriculacion YEAR NOT NULL,
  numero_plazas TINYINT NOT NULL,
  autonomia_km INT NOT NULL,
  color VARCHAR(30) NOT NULL,
  imagen VARCHAR(255),
  estado ENUM('disponible','reservado','mantenimiento') DEFAULT 'disponible',
  id_concesionario INT,
  FOREIGN KEY (id_concesionario) REFERENCES concesionarios(id_concesionario)
);

CREATE TABLE IF NOT EXISTS reservas (
  id_reserva INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT,
  id_vehiculo INT,
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME NOT NULL,
  estado ENUM('activa','finalizada','cancelada') DEFAULT 'activa',
  kilometros_recorridos INT,
  incidencias_reportadas TEXT,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo)
);

------------------------------------------------------------------------------------------------

INSERT INTO concesionarios (id_concesionario, nombre, ciudad, direccion, telefono_contacto) VALUES 
(1, 'GestiFleet Madrid', 'Madrid', 'Calle Falsa 123', '000000000'),
(2, 'GestiFleet Barcelona', 'Barcelona', 'Avenida Siempre Viva 742', '000000000');

INSERT INTO usuarios (id_usuario, nombre, correo, contraseña, rol, id_concesionario) VALUES 
(1, 'Administrador', 'admin@gestifleet.com', 'Admin^12', 'admin', 1),
(2, 'Empleado Ejemplo', 'empleado@gestifleet.com', 'Empleado^1', 'empleado', 2);

INSERT INTO vehiculos (id_vehiculo, matricula, marca, modelo, año_matriculacion, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario) VALUES
(1,  'MAD0001A', 'BYD',        'Seal 1',               2023, 5, 520, 'Gris', '/img/vehiculos/byd_seal1.png', 'disponible',   1),
(2,  'MAD0002A', 'BYD',        'Seal 2',               2023, 5, 500, 'Negro', '/img/vehiculos/byd_seal2.png', 'disponible',   1),
(3,  'MAD0003A', 'BYD',        'Seal 3',               2024, 5, 540, 'Blanco', '/img/vehiculos/byd_seal3.png', 'mantenimiento',2),
(4,  'MAD0004A', 'Tesla',      'Model S',              2023, 5, 652, 'Negro', '/img/vehiculos/tesla1.png', 'reservado',    1),
(5,  'MAD0005A', 'Tesla',      'Model 3',              2024, 5, 560, 'Rojo', '/img/vehiculos/tesla2.png', 'disponible',   1),
(6,  'MAD0006A', 'Tesla',      'Model X',              2023, 7, 600, 'Gris', '/img/vehiculos/tesla3.png', 'disponible',   2),
(7,  'MAD0007A', 'Tesla',      'Model Y',              2024, 5, 540, 'Negro', '/img/vehiculos/tesla4.png', 'disponible',   1),
(8,  'MAD0008A', 'Tesla',      'Model 3 Urban',        2023, 5, 430, 'Azul', '/img/vehiculos/tesla5.png', 'reservado',    2),
(9,  'MAD0009A', 'Tesla',      'Model X Family',       2024, 7, 580, 'Blanco', '/img/vehiculos/tesla6.png', 'disponible',   1),
(10, 'MAD0010A', 'Volvo',      'XC90',                 2023, 7, 550, 'Gris', '/img/vehiculos/volvo1.png', 'disponible',   2),
(11, 'MAD0011A', 'Volvo',      'XC90 Advanced',        2024, 7, 560, 'Blanco', '/img/vehiculos/volvo2.png', 'mantenimiento',1),
(12, 'MAD0012A', 'Volvo',      'XC90 Premium',         2023, 7, 570, 'Amarillo', '/img/vehiculos/volvo3.png', 'disponible',   2),
(13, 'MAD0013A', 'Volkswagen', 'T-Cross',              2023, 5, 650, 'Azul', '/img/vehiculos/VW1.png', 'disponible',   1),
(14, 'MAD0014A', 'Volkswagen', 'T-Roc',                2024, 5, 630, 'Rojo', '/img/vehiculos/VW2.png', 'reservado',    2),
(15, 'MAD0015A', 'Volkswagen', 'Tiguan',               2023, 5, 620, 'Azul', '/img/vehiculos/VW3.png', 'disponible',   1),
(16, 'MAD0016A', 'Volkswagen', 'Tiguan Sport',         2024, 5, 610, 'Rojo', '/img/vehiculos/VW4.png', 'disponible',   2),
(17, 'MAD0017A', 'Volkswagen', 'Tiguan Family',        2023, 7, 600, 'Azul', '/img/vehiculos/VW5.png', 'disponible',   1);
