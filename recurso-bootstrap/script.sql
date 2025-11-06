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