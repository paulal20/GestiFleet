SET FOREIGN_KEY_CHECKS = 0;

USE gestifleetbd;

DROP TABLE IF EXISTS reservas;
DROP TABLE IF EXISTS vehiculos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS concesionarios;

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

SET FOREIGN_KEY_CHECKS = 1;