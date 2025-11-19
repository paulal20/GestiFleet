-- 1. Creación y selección de la Base de Datos
CREATE DATABASE IF NOT EXISTS GestifleetBD;
USE GestifleetBD;

---
DROP TABLE reservas;
DROP TABLE vehiculos;
DROP TABLE usuarios;
DROP TABLE concesionarios;

-- 2. Creación de las Tablas
CREATE TABLE IF NOT EXISTS concesionarios (
  id_concesionario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  ciudad VARCHAR(50) NOT NULL,
  direccion VARCHAR(150) NOT NULL,
  telefono_contacto VARCHAR(20) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  contrasenya VARCHAR(255) NOT NULL,
  rol ENUM('Empleado','Admin') NOT NULL,
  telefono VARCHAR(20),
  id_concesionario INT,
  preferencias_accesibilidad JSON,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (id_concesionario) REFERENCES concesionarios(id_concesionario)
);

CREATE TABLE IF NOT EXISTS vehiculos (
  id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
  matricula VARCHAR(10) UNIQUE NOT NULL,
  marca VARCHAR(50) NOT NULL,
  modelo VARCHAR(50) NOT NULL,
  anyo_matriculacion YEAR NOT NULL,
  descripcion TEXT,
  tipo ENUM('coche','suv','furgoneta','otro') DEFAULT 'coche',
  precio DECIMAL(10,2) NOT NULL,
  numero_plazas TINYINT NOT NULL DEFAULT 5,
  autonomia_km INT,
  color VARCHAR(30),
  imagen LONGBLOB,
  estado ENUM('disponible','reservado','mantenimiento') DEFAULT 'disponible',
  id_concesionario INT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
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
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo)
);

------------------------------------------------------------------------------------------------

INSERT INTO concesionarios (id_concesionario, nombre, ciudad, direccion, telefono_contacto) VALUES
(1, 'GestiFleet Madrid', 'Madrid', 'Calle Falsa 123', '000000000'),
(2, 'GestiFleet Barcelona', 'Barcelona', 'Avenida Siempre Viva 742', '000000000');

INSERT INTO usuarios (id_usuario, nombre, correo, contrasenya, rol, telefono, id_concesionario) VALUES
(1, 'Administrador', 'admin@gestifleet.com', '$2b$10$yRO//lNEE/HAs9/cG7r18efG02NZ6j53jpmHh0xXd/zvKvH9KAzfi', 'Admin', '111111111', 1),
(2, 'Empleado Ejemplo', 'empleado@gestifleet.com', 'Empleado^1', 'Empleado', '222222222', 2);

INSERT INTO vehiculos
(id_vehiculo, matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario)
VALUES
(1,  '1234AAA', 'BYD', 'Seal 1', 2023, 'Sedán eléctrico moderno con diseño aerodinámico y rendimiento eficiente para ciudad y carretera.', 'coche', 40000.00, 5, 520, 'Gris', '/img/vehiculos/byd_seal1.png', 'disponible', 1),
(2,  '1234AAB', 'BYD', 'Seal 2', 2023, 'Sedán eléctrico eficiente con interiores tecnológicos y autonomía optimizada.', 'coche', 42000.00, 5, 500, 'Negro', '/img/vehiculos/byd_seal2.png', 'disponible', 1),
(3,  '1234AAC', 'BYD', 'Seal 3', 2024, 'Versión deportiva con prestaciones mejoradas y diseño elegante.', 'coche', 45000.00, 5, 540, 'Blanco', '/img/vehiculos/byd_seal3.png', 'mantenimiento', 2),
(4,  '1234AAD', 'Tesla', 'Model S', 2023, 'Sedán eléctrico de lujo con aceleración impresionante y tecnología avanzada.', 'coche', 95000.00, 5, 652, 'Negro', '/img/vehiculos/tesla1.png', 'reservado', 1),
(5,  '1234AAE', 'Tesla', 'Model 3', 2024, 'Versión con interiores premium y sistema de conducción autónoma.', 'coche', 98000.00, 5, 560, 'Rojo', '/img/vehiculos/tesla2.png', 'disponible', 1),
(6,  '1234AAF', 'Tesla', 'Model X', 2023, 'Modelo con batería de larga duración y autonomía extendida.', 'coche', 100000.00, 7, 600, 'Gris', '/img/vehiculos/tesla3.png', 'disponible', 2),
(7,  '1234AAG', 'Tesla', 'Model Y', 2024, 'Edición deportiva con máxima aceleración y diseño moderno.', 'coche', 105000.00, 5, 540, 'Negro', '/img/vehiculos/tesla4.png', 'disponible', 1),
(8,  '1234AAH', 'Tesla', 'Model 3 Urban', 2023, 'Versión urbana con eficiencia energética optimizada y máxima aceleración.', 'coche', 92000.00, 5, 430, 'Azul', '/img/vehiculos/tesla5.png', 'reservado', 2),
(9,  '1234AAI', 'Tesla', 'Model X Family', 2024, 'Modelo familiar con tecnología de asistencia y confort superior.', 'coche', 97000.00, 7, 580, 'Blanco', '/img/vehiculos/tesla6.png', 'disponible', 1),
(10, '1234AAJ', 'Volvo', 'XC90', 2023, 'SUV seguro y confortable con interior espacioso y tecnología de asistencia.', 'suv', 70000.00, 7, 550, 'Gris', '/img/vehiculos/volvo1.png', 'disponible', 2),
(11, '1234AAK', 'Volvo', 'XC90 Advanced', 2024, 'Versión avanzada con sistemas de seguridad de última generación.', 'suv', 72000.00, 7, 560, 'Blanco', '/img/vehiculos/volvo2.png', 'mantenimiento', 1),
(12, '1234AAL', 'Volvo', 'XC90 Premium', 2023, 'SUV premium con interiores amplios y acabados de lujo.', 'suv', 75000.00, 7, 570, 'Amarillo', '/img/vehiculos/volvo3.png', 'disponible', 2),
(13, '1234AAM', 'Volkswagen', 'T-Cross', 2023, 'Compacto eficiente y versátil, ideal para la ciudad y viajes familiares.', 'suv', 62000.00, 5, 650, 'Azul', '/img/vehiculos/VW1.png', 'disponible', 1),
(14, '1234AAN', 'Volkswagen', 'T-Roc', 2024, 'Versión con diseño moderno y prestaciones equilibradas.', 'suv', 64000.00, 5, 630, 'Rojo', '/img/vehiculos/VW2.png', 'reservado', 2),
(15, '1234AAO', 'Volkswagen', 'Tiguan', 2023, 'Modelo urbano con eficiencia energética optimizada y diseño moderno.', 'suv', 66000.00, 5, 620, 'Azul', '/img/vehiculos/VW3.png', 'disponible', 1),
(16, '1234AAP', 'Volkswagen', 'Tiguan Sport', 2024, 'Edición deportiva con mayor potencia y estilo moderno.', 'suv', 68000.00, 5, 610, 'Rojo', '/img/vehiculos/VW4.png', 'disponible', 2),
(17, '1234AAQ', 'Volkswagen', 'Tiguan Family', 2023, 'Versión familiar con espacio extra y confort superior.', 'suv', 70000.00, 7, 600, 'Azul', '/img/vehiculos/VW5.png', 'disponible', 1);

SELECT * FROM usuarios;
SELECT * FROM concesionarios;
SELECT * FROM vehiculos;
SELECT * FROM reservas;