const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/auth');


const path = require('path');
const multer = require('multer');

// --------------------
// CONFIGURACIÓN MULTER
// --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/vehiculos'); // carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    const nombre = Date.now() + '-' + file.originalname;
    cb(null, nombre);
  }
});

const fileFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === '.png') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PNG.'));
  }
};

const upload = multer({ storage, fileFilter });

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


// GET /vehiculos/nuevo
router.get('/nuevo', isAuth, isAdmin, async (req, res) => {
  try {
    // Obtener todos los concesionarios
    const [concesionarios] = await req.db.query('SELECT * FROM concesionarios');

    res.render('vehiculoForm', {
      title: 'Nuevo Vehículo',
      vehiculo: {},
      action: '/vehiculos/nuevo',
      method: 'POST',
      concesionarios // <-- pasamos la lista al EJS
    });
  } catch (err) {
    console.error('Error al obtener concesionarios:', err);
    res.status(500).render('error', { mensaje: 'No se pudieron cargar los concesionarios' });
  }
});

// POST /vehiculos/nuevo
router.post('/nuevo', upload.single('imagen'), async (req, res) => {
  try {
    const {
      matricula, marca, modelo, anyo_matriculacion, descripcion,
      tipo, precio, numero_plazas, autonomia_km, color,
      estado, id_concesionario
    } = req.body;

    // Validación básica de campos obligatorios
    if (!matricula || !marca || !modelo || !anyo_matriculacion || !precio || !id_concesionario) {
      return res.render('vehiculoForm', {
        title: 'Nuevo Vehículo',
        action: '/vehiculos/nuevo',
        error: 'Faltan campos obligatorios',
        vehiculo: req.body
      });
    }

    // Ruta de la imagen si se sube
    const imagen = req.file ? `/img/vehiculos/${req.file.filename}` : null;

    // Insertar en la base de datos
    await req.db.query(
      `INSERT INTO vehiculos
      (matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        matricula,
        marca,
        modelo,
        anyo_matriculacion,
        descripcion || null,
        tipo || 'coche',
        precio,
        numero_plazas || 5,
        autonomia_km || null,
        color || null,
        imagen,
        estado || 'disponible',
        id_concesionario
      ]
    );

    res.redirect('/vehiculos');
  } catch (err) {
    console.error('Error al crear vehículo:', err);
    res.render('vehiculoForm', {
      title: 'Nuevo Vehículo',
      action: '/vehiculos/nuevo',
      error: err.message || 'Error al crear vehículo',
      vehiculo: req.body
    });
  }
});

// GET /vehiculos/:id/editar
router.get('/:id/editar', isAuth, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.redirect('/vehiculos');
    }

    // Obtener el vehículo
    const [vehiculos] = await req.db.query('SELECT * FROM vehiculos WHERE id_vehiculo = ?', [id]);
    if (vehiculos.length === 0) {
      return res.redirect('/vehiculos');
    }
    const vehiculo = vehiculos[0];

    // Obtener lista de concesionarios para el select
    const [concesionarios] = await req.db.query('SELECT * FROM concesionarios');

    res.render('vehiculoForm', {
      title: 'Editar Vehículo',
      vehiculo,
      action: `/vehiculos/${id}/editar`,
      method: 'POST',
      concesionarios
    });
  } catch (err) {
    console.error('Error al cargar formulario de edición:', err);
    res.status(500).render('error', { mensaje: 'Error al cargar el vehículo para editar' });
  }
});

// POST /vehiculos/:id/editar
router.post('/:id/editar', isAuth, isAdmin, upload.single('imagen'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.redirect('/vehiculos');
    }

    const {
      matricula, marca, modelo, anyo_matriculacion, descripcion,
      tipo, precio, numero_plazas, autonomia_km, color,
      estado, id_concesionario
    } = req.body;

    // Validación básica
    if (!matricula || !marca || !modelo || !anyo_matriculacion || !precio || !id_concesionario) {
      const [concesionarios] = await req.db.query('SELECT * FROM concesionarios');
      return res.render('vehiculoForm', {
        title: 'Editar Vehículo',
        action: `/vehiculos/${id}/editar`,
        error: 'Faltan campos obligatorios',
        vehiculo: { ...req.body, id_vehiculo: id },
        concesionarios
      });
    }

    // Validar matrícula (4 números + 3 letras)
    if (!/^\d{4}[A-Z]{3}$/i.test(matricula)) {
      const [concesionarios] = await req.db.query('SELECT * FROM concesionarios');
      return res.render('vehiculoForm', {
        title: 'Editar Vehículo',
        action: `/vehiculos/${id}/editar`,
        error: 'La matrícula debe tener 4 números seguidos de 3 letras (ej: 1234ABC).',
        vehiculo: { ...req.body, id_vehiculo: id },
        concesionarios
      });
    }

    // Ruta de la imagen si se sube
    const imagen = req.file ? `/img/vehiculos/${req.file.filename}` : req.body.imagen || null;

    // Actualizar en la base de datos
    await req.db.query(
      `UPDATE vehiculos SET 
        matricula = ?, marca = ?, modelo = ?, anyo_matriculacion = ?, descripcion = ?, 
        tipo = ?, precio = ?, numero_plazas = ?, autonomia_km = ?, color = ?, imagen = ?, 
        estado = ?, id_concesionario = ?
      WHERE id_vehiculo = ?`,
      [
        matricula, marca, modelo, anyo_matriculacion, descripcion || null,
        tipo || 'coche', precio, numero_plazas || 5, autonomia_km || null, color || null,
        imagen, estado || 'disponible', id_concesionario, id
      ]
    );

    res.redirect(`/vehiculos/${id}`);
  } catch (err) {
    console.error('Error al actualizar vehículo:', err);
    const [concesionarios] = await req.db.query('SELECT * FROM concesionarios');
    res.render('vehiculoForm', {
      title: 'Editar Vehículo',
      action: `/vehiculos/${req.params.id}/editar`,
      error: err.message || 'Error al actualizar vehículo',
      vehiculo: { ...req.body, id_vehiculo: req.params.id },
      concesionarios
    });
  }
});

// POST /vehiculos/:id/eliminar
router.post('/:id/eliminar', isAuth, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.redirect('/vehiculos');
    }

    // Borrar vehículo
    await req.db.query('DELETE FROM vehiculos WHERE id_vehiculo = ?', [id]);
    res.redirect('/vehiculos');
  } catch (err) {
    console.error('Error al eliminar vehículo:', err);
    res.status(500).render('error', { mensaje: 'Error al eliminar el vehículo' });
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
// GET /vehiculos/:id/editar -> Formulario para editar (Ruta: '/:id/editar')
// POST /vehiculos/:id/editar -> Lógica para actualizar (Ruta: '/:id/editar')
// POST /vehiculos/:id/eliminar -> Lógica para borrar (Ruta: '/:id/eliminar')

module.exports = router;
