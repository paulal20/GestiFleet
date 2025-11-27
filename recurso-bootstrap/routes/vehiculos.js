const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/auth');

// GET /vehiculos (Vista Listado)
router.get('/', isAuth, (req, res) => {
  const usuario = req.session.usuario;
  
  // Necesitamos cargar TODOS los datos auxiliares para los filtros (Tipos, Estados, Colores, etc.)
  // Al ser callbacks, tendremos un anidamiento considerable (Callback Hell), pero es la forma sin async/await.

  // 1. Tipos
  req.db.query('SELECT DISTINCT tipo FROM vehiculos', (err1, tiposRows) => {
    const tiposDisponibles = err1 ? [] : tiposRows.map(t => t.tipo);

    // 2. Estados
    req.db.query('SELECT DISTINCT estado FROM vehiculos', (err2, estadosRows) => {
      const estadosDisponibles = err2 ? [] : estadosRows.map(e => e.estado);

      // 3. Colores
      req.db.query('SELECT DISTINCT color FROM vehiculos WHERE color IS NOT NULL ORDER BY color', (err3, coloresRows) => {
        const coloresDisponibles = err3 ? [] : coloresRows.map(c => c.color);

        // 4. Plazas
        req.db.query('SELECT DISTINCT numero_plazas FROM vehiculos ORDER BY numero_plazas ASC', (err4, plazasRows) => {
          const plazasDisponibles = err4 ? [] : plazasRows.map(p => p.numero_plazas);

          // 5. Concesionarios
          req.db.query('SELECT id_concesionario, nombre FROM concesionarios ORDER BY nombre', (err5, concesionariosRows) => {
            const concesionariosDisponibles = err5 ? [] : concesionariosRows;

            // 6. Rangos (Precio/Autonomía)
            req.db.query('SELECT MIN(precio) as minPrecio, MAX(precio) as maxPrecio, MIN(autonomia_km) as minAutonomia, MAX(autonomia_km) as maxAutonomia FROM vehiculos', (err6, rangosRows) => {
              const rangos = (rangosRows && rangosRows[0]) ? rangosRows[0] : { minPrecio: 0, maxPrecio: 100000, minAutonomia: 0, maxAutonomia: 1000 };

              // RENDER FINAL
              // Nota: 'vehiculos' se pasa vacío []. El frontend debe llamar a la API.
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
                // Mantenemos los valores de query por si el frontend los lee para inicializar filtros
                tipoSeleccionado: req.query.tipo || '',
                estadoSeleccionado: req.query.estado || '',
                colorSeleccionado: req.query.color || '',
                plazasSeleccionado: req.query.plazas || '',
                concesionarioSeleccionado: req.query.concesionario || '',
                precioMaxSeleccionado: req.query.precio_max || rangos.maxPrecio,
                autonomiaMinSeleccionado: req.query.autonomia_min || rangos.minAutonomia,
              });
            });
          });
        });
      });
    });
  });
});

// GET /vehiculos/nuevo (Formulario Creación)
router.get('/nuevo', isAuth, isAdmin, (req, res) => {
  req.db.query('SELECT * FROM concesionarios', (err, concesionarios) => {
    if (err) {
      console.error('Error al obtener concesionarios:', err);
      return res.status(500).render('error', { mensaje: 'No se pudieron cargar los concesionarios' });
    }

    res.render('vehiculoForm', {
      title: 'Nuevo Vehículo',
      vehiculo: {},
      usuarioSesion: req.session.usuario,
      action: '/api/vehiculos', // Apunta a la API
      method: 'POST',
      concesionarios
    });
  });
});

// GET /vehiculos/:id/editar (Formulario Edición)
router.get('/:id/editar', isAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.redirect('/vehiculos');

  // 1. Obtener Vehículo
  req.db.query('SELECT * FROM vehiculos WHERE id_vehiculo = ?', [id], (err, vehiculos) => {
    if (err) {
        console.error('Error cargando vehículo editar:', err);
        return res.status(500).render('error', { mensaje: 'Error al cargar vehículo' });
    }

    if (!vehiculos || vehiculos.length === 0) return res.redirect('/vehiculos');
    const vehiculo = vehiculos[0];

    // 2. Obtener Concesionarios
    req.db.query('SELECT * FROM concesionarios', (errCon, concesionarios) => {
      if (errCon) {
          console.error('Error cargando concesionarios editar:', errCon);
          return res.status(500).render('error', { mensaje: 'Error al cargar datos auxiliares' });
      }

      res.render('vehiculoForm', {
        title: 'Editar Vehículo',
        vehiculo,
        usuarioSesion: req.session.usuario,
        action: `/api/vehiculos/${id}`, // Apunta a la API
        method: 'PUT', // Método AJAX
        concesionarios
      });
    });
  });
});

// GET /vehiculos/:id/imagen (Servir Imagen)
// Mantenemos esta ruta aquí porque sirve un recurso binario, no JSON.
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

// GET /vehiculos/:id (Detalle SSR)
router.get('/:id', (req, res, next) => {
  const id = parseInt(req.params.id);

  // 1. Obtener Vehículo
  req.db.query(
    'SELECT id_vehiculo, matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, numero_plazas, autonomia_km, color, estado, id_concesionario, activo, (imagen IS NOT NULL AND LENGTH(imagen) > 0) AS tiene_imagen FROM vehiculos WHERE id_vehiculo = ?', 
    [id], 
    (err, vehiculos) => {
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

      // 2. Obtener Concesionario asociado
      req.db.query('SELECT * FROM concesionarios WHERE id_concesionario = ?', [vehiculo.id_concesionario], (errCon, concesionarios) => {
        const concesionario = (concesionarios && concesionarios[0]) ? concesionarios[0] : { nombre: 'Sin asignar' };

        res.render('vehiculoDetalle', {
          vehiculo,
          usuarioSesion: req.session.usuario,
          concesionario
        });
      });
    }
  );
});

module.exports = router;