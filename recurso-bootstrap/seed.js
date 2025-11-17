const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'GestifleetBD'
};

async function leerImagen(nombreArchivo) {
  if (!nombreArchivo) {
    return null;
  }
  
  const ruta = path.join(__dirname, 'public', 'img', 'vehiculos', nombreArchivo);
  
  try {
    const buffer = await fs.readFile(ruta);
    return buffer;
  } catch (err) {
    console.warn(`ADVERTENCIA: No se encontró la imagen ${nombreArchivo}. Se insertará NULL.`);
    return null;
  }
}

async function cargarDatos() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Conectado a la BBDD.');

    const jsonPath = path.join(__dirname, 'datos.json');
    const datosJson = await fs.readFile(jsonPath, 'utf8');
    const datos = JSON.parse(datosJson);
    console.log('Archivo JSON leído.');

    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('TRUNCATE TABLE reservas;');
    await connection.query('TRUNCATE TABLE vehiculos;');
    await connection.query('TRUNCATE TABLE usuarios;');
    await connection.query('TRUNCATE TABLE concesionarios;');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Tablas limpiadas.');

    const concesionariosQuery = `INSERT INTO concesionarios (id_concesionario, nombre, ciudad, direccion, telefono_contacto) VALUES ?`;
    const concesionariosData = datos.concesionarios.map(c => [
      c.id_concesionario, c.nombre, c.ciudad, c.direccion, c.telefono_contacto
    ]);
    await connection.query(concesionariosQuery, [concesionariosData]);
    console.log(`Insertados ${datos.concesionarios.length} concesionarios.`);

    console.log('Hasheando contraseñas e insertando usuarios...');
    for (const u of datos.usuarios) {
      let contrasenyaFinal;
      if (u.contrasenya && !u.contrasenya.startsWith('$2b$')) {
        contrasenyaFinal = await bcrypt.hash(u.contrasenya, 10);
      } else {
        contrasenyaFinal = u.contrasenya;
      }
      
      const usuarioQuery = `INSERT INTO usuarios (id_usuario, nombre, correo, contrasenya, rol, telefono, id_concesionario) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      await connection.execute(usuarioQuery, [
        u.id_usuario, u.nombre, u.correo, contrasenyaFinal, u.rol, u.telefono, u.id_concesionario
      ]);
    }
    console.log(`Insertados ${datos.usuarios.length} usuarios.`);

    console.log('Leyendo imágenes y cargando vehículos...');
    const vehiculoQuery = `INSERT INTO vehiculos (id_vehiculo, matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    for (const v of datos.vehiculos) {
      const imagenBuffer = await leerImagen(v.imagen_nombre);
      
      await connection.execute(vehiculoQuery, [
        v.id_vehiculo, v.matricula, v.marca, v.modelo, v.anyo_matriculacion, 
        v.descripcion, v.tipo, v.precio, v.numero_plazas, v.autonomia_km, 
        v.color, imagenBuffer, v.estado, v.id_concesionario
      ]);
    }
    console.log(`Insertados ${datos.vehiculos.length} vehículos.`);
    

    console.log('¡Carga de datos completada con éxito!');

  } catch (err) {
    console.error('Error durante la carga de datos:', err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada.');
    }
  }
}

cargarDatos();