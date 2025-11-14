const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/auth');


const path = require('path');
const multer = require('multer');

// --------------------
// CONFIGURACION MULTER
// --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/vehiculos'); // carpeta donde se guardaran las imagenes
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

// GET /vehiculos
router.get('/', isAuth, async (req, res) => {
  try {
    const { tipo, estado } = req.query;
    const usuario = req.session.usuario; // o de donde lo guardes

    let sql = 'SELECT * FROM vehiculos';
    const params = [];
    const condiciones = [];

    if (!usuario || usuario.rol !== 'Admin') {
      condiciones.push(' id_concesionario = ? ');
      params.push(usuario.id_concesionario);

      condiciones.push(" estado = 'disponible' ");
    }

    if (tipo) {
      condiciones.push(' tipo = ? ');
      params.push(tipo);
    }
    if (usuario && usuario.rol === 'Admin') {
      if (estado) {
        condiciones.push(' estado = ? ');
        params.push(estado);
      }
    }

    if (condiciones.length > 0) {
      sql += ' WHERE ' + condiciones.join(' AND ');
    }

    // Ejecutar consulta
    const [vehiculos] = await req.db.query(sql, params);

    // Estos valores solo se necesitan para Admin (filtros)
    let tiposDisponibles = [];
    let estadosDisponibles = [];

    const [tipos] = await req.db.query('SELECT DISTINCT tipo FROM vehiculos');
    tiposDisponibles = tipos.map(t => t.tipo);

    if (usuario && usuario.rol === 'Admin') {
      const [estados] = await req.db.query('SELECT DISTINCT estado FROM vehiculos');
      estadosDisponibles = estados.map(e => e.estado);
    }

    res.render('listaVehiculos', {
      title: 'Vehículos ofertados en GestiFleet',
      vehiculos,
      tiposDisponibles,
      estadosDisponibles,
      tipoSeleccionado: tipo || '',
      estadoSeleccionado: estado || '',
      usuario
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
router.post('/nuevo', isAdmin, upload.single('imagen'), async (req, res) => {
  const formData = req.body;
  const {
    matricula, marca, modelo, anyo_matriculacion, descripcion,
    tipo, precio, numero_plazas, autonomia_km, color,
    estado, id_concesionario
  } = formData;
  
  let concesionarios = [];
  let campoErroneo = null;

  try {
    [concesionarios] = await req.db.query('SELECT * FROM concesionarios');

    let errorMsg = null;
    const actual = new Date().getFullYear();

    if (!matricula || !marca || !modelo || !anyo_matriculacion || !precio || !id_concesionario) {
      errorMsg = 'Faltan campos obligatorios (Matrícula, Marca, Modelo, Año, Precio, Concesionario).';
    } else if (!/^\d{4}[A-Z]{3}$/i.test(matricula)) {
      errorMsg = 'La matrícula debe tener 4 números seguidos de 3 letras (ej: 1234ABC).';
      campoErroneo = 'matricula';
    } else if (parseInt(anyo_matriculacion, 10) < 1 || parseInt(anyo_matriculacion, 10) > actual) {
      errorMsg = `El año de matriculación debe estar entre 1901 y ${actual}.`;
    } else if (parseFloat(precio) <= 0) {
      errorMsg = 'El precio debe ser un número positivo.';
    } else if (id_concesionario === '0') {
      errorMsg = 'Debe seleccionar un concesionario válido.';
    } else if (!req.file) {
      errorMsg = 'La imagen es obligatoria al crear un vehículo nuevo.';
    }

    if (errorMsg) {
      if (campoErroneo === 'matricula') {
        formData.matricula = '';
      }
      return res.status(400).render('vehiculoForm', {
        title: 'Nuevo Vehículo',
        action: '/vehiculos/nuevo',
        error: errorMsg,
        vehiculo: formData, 
        concesionarios
      });
    }

    const imagen = `/img/vehiculos/${req.file.filename}`;

    await req.db.query(
      `INSERT INTO vehiculos
      (matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        matricula.toUpperCase(), 
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
    
    if (concesionarios.length === 0) {
        try {
            [concesionarios] = await req.db.query('SELECT * FROM concesionarios');
        } catch (dbErr) {
            console.error("Error fatal, no se pueden cargar concesionarios", dbErr);
        }
    }

    let error = 'Error al crear vehículo';
    if (err.code === 'ER_DUP_ENTRY') {
      error = 'La matrícula introducida ya existe.';
      formData.matricula = '';
    } else {
      error = err.message || error;
    }

    res.status(500).render('vehiculoForm', {
      title: 'Nuevo Vehículo',
      action: '/vehiculos/nuevo',
      error: error,
      vehiculo: formData,
      concesionarios
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
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.redirect('/vehiculos');
  
  const formData = req.body;
  const { matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, numero_plazas,
    autonomia_km, color, estado, id_concesionario, imagen_actual } = formData;

  let concesionarios = [];
  let campoErroneo = null;

  try {
    [concesionarios] = await req.db.query('SELECT * FROM concesionarios');
    
    let errorMsg = null;
    const actual = new Date().getFullYear();

    if (!matricula || !marca || !modelo || !anyo_matriculacion || !precio || !id_concesionario) {
      errorMsg = 'Faltan campos obligatorios (Matrícula, Marca, Modelo, Año, Precio, Concesionario).';
    } else if (!/^\d{4}[A-Z]{3}$/i.test(matricula)) {
      errorMsg = 'La matrícula debe tener 4 números seguidos de 3 letras (ej: 1234ABC).';
      campoErroneo = 'matricula';
    } else if (parseInt(anyo_matriculacion, 10) < 1901 || parseInt(anyo_matriculacion, 10) > actual) {
      errorMsg = `El año de matriculación debe estar entre 1901 y ${actual}.`;
    } else if (parseFloat(precio) <= 0) {
      errorMsg = 'El precio debe ser un número positivo.';
    } else if (id_concesionario === '0') {
      errorMsg = 'Debe seleccionar un concesionario válido.';
    }
    
    if (!errorMsg) {
      const [duplicados] = await req.db.query(
        'SELECT id_vehiculo FROM vehiculos WHERE matricula = ? AND id_vehiculo != ?',
        [matricula.toUpperCase(), id]
      );
      if (duplicados.length > 0) {
        errorMsg = 'La matrícula introducida ya pertenece a otro vehículo.';
        campoErroneo = 'matricula';
      }
    }

    if (errorMsg) {
      if (campoErroneo === 'matricula') {
        formData.matricula = '';
      }
      return res.status(400).render('vehiculoForm', {
        title: 'Editar Vehículo',
        action: `/vehiculos/${id}/editar`,
        error: errorMsg,
        vehiculo: { ...formData, id_vehiculo: id, imagen: imagen_actual },
        concesionarios
      });
    }

    const imagen = req.file
      ? `/img/vehiculos/${req.file.filename}`
      : imagen_actual || null;

    await req.db.query(
      `UPDATE vehiculos SET 
        matricula = ?, marca = ?, modelo = ?, anyo_matriculacion = ?, descripcion = ?, 
        tipo = ?, precio = ?, numero_plazas = ?, autonomia_km = ?, color = ?, 
        imagen = ?, estado = ?, id_concesionario = ?
      WHERE id_vehiculo = ?`,
      [ matricula.toUpperCase(),
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
        id_concesionario,
        id 
      ]);

    res.redirect(`/vehiculos/${id}`);

  } catch (err) {
    console.error('Error al actualizar vehículo:', err);

    if (concesionarios.length === 0) {
        try { [concesionarios] = await req.db.query('SELECT * FROM concesionarios'); } catch (dbErr) { /* ... */ }
    }
    
    let error = 'Error al actualizar vehículo';
    if (err.code === 'ER_DUP_ENTRY') {
      error = 'La matrícula introducida ya existe.';
      formData.matricula = '';
    } else {
      error = err.message || error;
    }

    res.status(500).render('vehiculoForm', {
      title: 'Editar Vehículo',
      action: `/vehiculos/${req.params.id}/editar`,
      error: error,
      vehiculo: { ...formData, id_vehiculo: req.params.id, imagen: imagen_actual }, 
      concesionarios,
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

module.exports = router;
