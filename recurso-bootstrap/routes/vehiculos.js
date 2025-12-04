const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/auth');

// HELPER: Formatear fecha local a string 'YYYY-MM-DDTHH:mm' (Compatible con input type="datetime-local")
const obtenerFechaActualLocal = () => {
  const ahora = new Date();
  // Ajuste manual para zona horaria local (sin librerías y síncrono)
  // getTimezoneOffset devuelve minutos de diferencia (invertido).
  // Restamos el offset para ajustar a la hora local real del servidor.
  const fechaLocal = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60000));
  
  // Convertimos a ISO y cortamos segundos y milisegundos: "2023-11-20T10:30"
  return fechaLocal.toISOString().slice(0, 16);
};

// ... (Tu función fetchValidTypes sigue igual aquí) ...
const fetchValidTypes = (db, callback) => {
  // ... código existente ...
  const sql = `SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehiculos' AND COLUMN_NAME = 'tipo'`;
  db.query(sql, (err, results) => {
    if (err || results.length === 0) return callback(err, []);
    const rawParams = results[0].COLUMN_TYPE;
    const types = rawParams.replace(/^enum\('/, '').replace(/'\)$/, '').split("','");          
    callback(null, types);
  });
};

// GET /vehiculos (Vista Listado)
router.get('/', isAuth, (req, res) => {
  const usuario = req.session.usuario;
  const esAdmin = (usuario && usuario.rol === 'Admin');

  // ... (Consultas SQL existentes: sqlTipos, sqlColores, etc.) ...
  const sqlTipos = "SELECT tipo, COUNT(*) as total FROM vehiculos WHERE activo = true GROUP BY tipo ORDER BY tipo ASC";

  req.db.query(sqlTipos, (err1, tiposRows) => {
    const tiposDisponibles = err1 ? [] : tiposRows;
    
    let estadosDisponibles = [];
    if (esAdmin) {
        estadosDisponibles = [
            { valor: '', nombre: 'Todos' },
            { valor: 'disponible', nombre: 'Disponibles' },
            { valor: 'reservado', nombre: 'Reservados' }
        ];
    } else {
        estadosDisponibles = [
            { valor: 'disponible', nombre: 'Disponibles' }
        ];
    }

    const sqlColores = `SELECT color, COUNT(*) as total FROM vehiculos WHERE activo = true AND color IS NOT NULL GROUP BY color ORDER BY color ASC`;
    req.db.query(sqlColores, (err3, coloresRows) => {
      const coloresDisponibles = err3 ? [] : coloresRows;

      const sqlPlazas = `SELECT numero_plazas, COUNT(*) as total FROM vehiculos WHERE activo = true GROUP BY numero_plazas ORDER BY numero_plazas ASC`;
      req.db.query(sqlPlazas, (err4, plazasRows) => {
        const plazasDisponibles = err4 ? [] : plazasRows;

        const sqlConcesionarios = `SELECT c.id_concesionario, c.nombre, COUNT(v.id_vehiculo) as total FROM concesionarios c INNER JOIN vehiculos v ON c.id_concesionario = v.id_concesionario WHERE c.activo = true AND v.activo = true GROUP BY c.id_concesionario, c.nombre ORDER BY c.nombre`;
        req.db.query(sqlConcesionarios, (err5, concesionariosRows) => {
            const concesionariosDisponibles = err5 ? [] : concesionariosRows;

            req.db.query('SELECT MIN(precio) as minPrecio, MAX(precio) as maxPrecio, MIN(autonomia_km) as minAutonomia, MAX(autonomia_km) as maxAutonomia FROM vehiculos', (err6, rangosRows) => {
              const rangos = (rangosRows && rangosRows[0]) ? rangosRows[0] : { minPrecio: 0, maxPrecio: 100000, minAutonomia: 0, maxAutonomia: 1000 };

              const fechaParaInput = req.query.fecha || obtenerFechaActualLocal();

              res.render('listaVehiculos', {
                title: 'Vehículos',
                vehiculos: [], 
                usuario,
                usuarioSesion: req.session.usuario,
                tiposDisponibles, 
                estadosDisponibles,
                coloresDisponibles,
                plazasDisponibles,
                concesionariosDisponibles,
                rangos,
                tipoSeleccionado: req.query.tipo || '',
                estadoSeleccionado: req.query.estado || (esAdmin ? '' : 'disponible'),
                colorSeleccionado: req.query.color || '',
                plazasSeleccionado: req.query.plazas || '',
                concesionarioSeleccionado: req.query.concesionario || '',
                precioMaxSeleccionado: req.query.precio_max || rangos.maxPrecio,
                autonomiaMinSeleccionado: req.query.autonomia_min || rangos.minAutonomia,
                
                fechaSeleccionada: fechaParaInput 
              });
            });
        });
      });
    });
  });
});

// GET /vehiculos/nuevo (Formulario Creación)
router.get('/nuevo', isAuth, isAdmin, (req, res) => {
  req.db.query('SELECT * FROM concesionarios WHERE activo = true ORDER BY nombre', (err, concesionarios) => {
    if (err) return res.status(500).render('error', { mensaje: 'Error concesionarios' });
    fetchValidTypes(req.db, (errTypes, tiposPermitidos) => {
      if (errTypes) return res.status(500).render('error', { mensaje: 'Error tipos' });
      res.render('vehiculoForm', {
        title: 'Nuevo Vehículo',
        vehiculo: { tipo: 'coche' },
        usuarioSesion: req.session.usuario,
        action: '/api/vehiculos',
        method: 'POST',
        concesionarios,
        tiposPermitidos
      });
    });
  });
});

// GET /vehiculos/:id/editar (Formulario Edición)
router.get('/:id/editar', isAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.redirect('/vehiculos');

  req.db.query('SELECT * FROM vehiculos WHERE id_vehiculo = ?', [id], (err, vehiculos) => {
    if (err) {
        console.error('Error cargando vehículo editar:', err);
        return res.status(500).render('error', { mensaje: 'Error al cargar vehículo' });
    }

    if (!vehiculos || vehiculos.length === 0) return res.redirect('/vehiculos');
    const vehiculo = vehiculos[0];

    req.db.query('SELECT * FROM concesionarios WHERE activo = true ORDER BY nombre', (errCon, concesionarios) => {
      if (errCon) {
          console.error('Error cargando concesionarios editar:', errCon);
          return res.status(500).render('error', { mensaje: 'Error al cargar datos auxiliares' });
      }

      fetchValidTypes(req.db, (errTypes, tiposPermitidos) => {
        if (errTypes) {
           console.error('Error cargando tipos editar:', errTypes);
           return res.status(500).render('error', { mensaje: 'Error al cargar tipos' });
        }

        res.render('vehiculoForm', {
          title: 'Editar Vehículo',
          vehiculo,
          usuarioSesion: req.session.usuario,
          action: `/api/vehiculos/${id}`,
          method: 'PUT',
          concesionarios,
          tiposPermitidos
        });
      });
    });
  });
});

// GET /vehiculos/:id/imagen
router.get('/:id/imagen', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).send('ID no válido');

  req.db.query('SELECT imagen FROM vehiculos WHERE id_vehiculo = ?', [id], (err, rows) => {
    if (err) {
      console.error('Error al servir imagen:', err);
      return res.status(500).send('Error al cargar la imagen');
    }

    if (rows.length === 0 || !rows[0].imagen) {
      return res.status(404).send('Imagen no encontrada');
    }

    const imagenBuffer = rows[0].imagen;
    res.setHeader('Content-Type', 'image/png');
    res.end(imagenBuffer);
  });
});

// GET /vehiculos/:id
router.get('/:id', (req, res, next) => {
  const id = parseInt(req.params.id);
  const fechaQuery = req.query.fecha; 
  const fechaReferencia = fechaQuery ? new Date(fechaQuery) : new Date();

  const sql = `
    SELECT 
      v.id_vehiculo, v.matricula, v.marca, v.modelo, v.anyo_matriculacion, 
      v.descripcion, v.tipo, v.precio, v.numero_plazas, v.autonomia_km, 
      v.color, v.id_concesionario, v.activo, 
      (v.imagen IS NOT NULL AND LENGTH(v.imagen) > 0) AS tiene_imagen,
      CASE 
          WHEN EXISTS (
              SELECT 1 FROM reservas r 
              WHERE r.id_vehiculo = v.id_vehiculo 
              AND r.estado = 'activa'
              AND r.fecha_inicio <= ? 
              AND r.fecha_fin >= ?
          ) THEN 'reservado'
          ELSE 'disponible'
      END AS estado_dinamico
    FROM vehiculos v 
    WHERE v.id_vehiculo = ?
  `;

  req.db.query(sql, [fechaReferencia, fechaReferencia, id], (err, vehiculos) => {
      if (err) {
        console.error('Error al obtener el vehículo:', err);
        return res.status(500).render('error', { mensaje: 'Error al cargar el vehículo' });
      }

      if (vehiculos.length === 0) {
        const error = new Error(`Vehículo no encontrado (id_vehiculo=${id})`);
        error.status = 404;
        error.publicMessage = 'Vehículo no encontrado.';
        error.expose = true;
        return next(error);
      }

      const vehiculo = vehiculos[0];

      req.db.query('SELECT * FROM concesionarios WHERE id_concesionario = ?', [vehiculo.id_concesionario], (errCon, concesionarios) => {
        const concesionario = (concesionarios && concesionarios[0]) ? concesionarios[0] : { nombre: 'Sin asignar' };

        res.render('vehiculoDetalle', {
          vehiculo,
          usuarioSesion: req.session.usuario,
          concesionario,
          fechaSeleccionada: fechaQuery || '' 
        });
      });
    }
  );
});

module.exports = router;