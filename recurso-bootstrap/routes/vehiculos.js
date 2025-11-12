const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { tipo, estado } = req.query;

    let sql = 'SELECT * FROM vehiculos';
    const params = [];

    if (tipo || estado) {
      sql += ' WHERE';
      const condiciones = [];
      if (tipo) {
        condiciones.push(' tipo = ? ');
        params.push(tipo);
      }
      if (estado) {
        condiciones.push(' estado = ? ');
        params.push(estado);
      }
      sql += condiciones.join(' AND ');
    }

    // Consultas usando req.db
    const [vehiculos] = await req.db.query(sql, params);
    const [tipos] = await req.db.query('SELECT DISTINCT tipo FROM vehiculos');
    const [estados] = await req.db.query('SELECT DISTINCT estado FROM vehiculos');

    const tiposDisponibles = tipos.map(t => t.tipo);
    const estadosDisponibles = estados.map(e => e.estado);

    res.render('vehiculos', {
      title: 'Vehículos ofertados en GestiFleet',
      vehiculos,
      tiposDisponibles,
      estadosDisponibles,
      tipoSeleccionado: tipo || '',
      estadoSeleccionado: estado || ''
    });

  } catch (err) {
    console.error('Error al obtener vehículos:', err);
    res.status(500).render('error', { mensaje: 'Error al cargar los vehículos' });
  }
});

// DETALLE DE UN VEHÍCULO
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const [vehiculos] = await req.db.query('SELECT * FROM vehiculos WHERE id_vehiculo = ?', [id]);
    if (vehiculos.length === 0) {
      const err = new Error(`Vehículo no encontrado (id_vehiculo=${id})`);
      err.status = 404;
      err.publicMessage = 'Vehículo no encontrado.';
      err.expose = true;
      return next(err);
    }

    const vehiculo = vehiculos[0];

    const [concesionarios] = await req.db.query(
      'SELECT * FROM concesionarios WHERE id_concesionario = ?',
      [vehiculo.id_concesionario]
    );
    const concesionario = concesionarios[0];

    res.render('vehiculoDetalle', {
      vehiculo,
      concesionario: concesionario || { nombre: 'Sin asignar' }
    });
  } catch (err) {
    console.error('Error al obtener el vehículo:', err);
    res.status(500).render('error', { mensaje: 'Error al cargar el vehículo' });
  }
});

// GET /vehiculos/nuevo
router.get('/nuevo', isAuth, isAdmin, async (req, res) => {
  res.render('vehiculoForm', {
    title: 'Nuevo Vehículo',
    vehiculo: {},
    action: '/vehiculos/nuevo',
    method: 'POST'
  });
});
// POST /vehiculos/nuevo
router.post('/nuevo', isAuth, isAdmin, async (req, res) => {
  try {
    const {
      matricula, marca, modelo, anyo_matriculacion, descripcion,
      tipo, precio, numero_plazas, autonomia_km, color,
      imagen, estado, id_concesionario
    } = req.body;

    // Validación básica
    if (!matricula || !marca || !modelo || !anyo_matriculacion || !precio || !id_concesionario) {
      return res.status(400).render('vehiculoForm', {
        title: 'Nuevo Vehículo',
        vehiculo: req.body,
        action: '/vehiculos/nuevo',
        method: 'POST',
        error: 'Los campos obligatorios no pueden estar vacíos.'
      });
    }

    await req.db.query(
      `INSERT INTO vehiculos 
      (matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [matricula, marca, modelo, anyo_matriculacion, descripcion || null, tipo || 'coche', precio, numero_plazas || 5, autonomia_km || null, color || null, imagen || null, estado || 'disponible', id_concesionario]
    );

    res.redirect('/vehiculos');
  } catch (err) {
    console.error('Error creando vehículo:', err);
    res.status(500).render('vehiculoForm', {
      title: 'Nuevo Vehículo',
      vehiculo: req.body,
      action: '/vehiculos/nuevo',
      method: 'POST',
      error: 'No se pudo crear el vehículo.'
    });
  }
});
// GET /vehiculos/:id/editar -> Formulario para editar (Ruta: '/:id/editar')
// POST /vehiculos/:id/editar -> Lógica para actualizar (Ruta: '/:id/editar')
// POST /vehiculos/:id/eliminar -> Lógica para borrar (Ruta: '/:id/eliminar')

module.exports = router;
