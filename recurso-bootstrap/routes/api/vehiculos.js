const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { isAuth, isAdmin } = require('../../middleware/auth');

// --------------------
// CONFIGURACION MULTER
// --------------------
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === '.png') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PNG.'));
  }
};

const upload = multer({ storage, fileFilter });

// GET /api/vehiculos (Listado JSON filtrado)
router.get('/', isAuth, (req, res) => {
  if (!req.xhr) { // si no es AJAX/fetch
    return res.redirect('/vehiculos'); // redirige a la página normal
  }
  const { 
    tipo, estado, color, plazas, concesionario, precio_max, autonomia_min
  } = req.query;
  const usuario = req.session.usuario;

  let sql = `SELECT id_vehiculo, matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, numero_plazas, autonomia_km, color, estado, id_concesionario, (imagen IS NOT NULL AND LENGTH(imagen) > 0) AS tiene_imagen FROM vehiculos`;
  const params = [];
  const condiciones = [];

  // Lógica de permisos de visión
  if (!usuario || usuario.rol !== 'Admin') {
    condiciones.push(' id_concesionario = ? ');
    params.push(usuario.id_concesionario);
    condiciones.push(" estado = 'disponible' ");
    condiciones.push("activo = true");
  }
  
  // Filtros dinámicos
  if (tipo) { condiciones.push(' tipo = ? '); params.push(tipo); }
  if (color) { condiciones.push(' color = ? '); params.push(color); }
  if (plazas) { condiciones.push(' numero_plazas = ? '); params.push(plazas); }
  if (precio_max) { condiciones.push(' precio <= ? '); params.push(precio_max); }
  if (autonomia_min) { condiciones.push(' autonomia_km >= ? '); params.push(autonomia_min); }
  
  if (usuario && usuario.rol === 'Admin') {
    if (estado) { condiciones.push(' estado = ? '); params.push(estado); }
    if (concesionario) { condiciones.push(' id_concesionario = ? '); params.push(concesionario); }
    condiciones.push("activo=true");
  }

  if (condiciones.length > 0) {
    sql += ' WHERE ' + condiciones.join(' AND ');
  }

  req.db.query(sql, params, (err, vehiculos) => {
    if (err) {
      console.error('Error API vehiculos:', err);
      return res.status(500).json({ ok: false, error: 'Error al obtener vehículos' });
    }
    res.json({ ok: true, vehiculos });
  });
});

// POST /api/vehiculos (Crear Vehículo)
router.post('/', isAdmin, upload.single('imagen'), (req, res) => {
  const formData = req.body;
  const {
    matricula, marca, modelo, anyo_matriculacion, descripcion,
    tipo, precio, numero_plazas, autonomia_km, color,
    estado, id_concesionario
  } = formData;

  // Validaciones
  let errorMsg = null;
  const actual = new Date().getFullYear();
  const tiposValidos = ['coche', 'suv', 'furgoneta', 'moto', 'deportivo', 'todoterreno', 'cabrio', 'pickup', 'otro'];

  if (!matricula || !marca || !modelo || !anyo_matriculacion || !precio || !id_concesionario || !tipo) {
    errorMsg = 'Faltan campos obligatorios.';
  } else if (!/^\d{4}[A-Z]{3}$/i.test(matricula)) {
    errorMsg = 'Formato matrícula inválido (1234ABC).';
  } else if (parseInt(anyo_matriculacion, 10) < 1901 || parseInt(anyo_matriculacion, 10) > actual) {
    errorMsg = `Año inválido (1901-${actual}).`;
  } else if (parseFloat(precio) <= 0) {
    errorMsg = 'El precio debe ser positivo.';
  } else if (id_concesionario === '0') {
    errorMsg = 'Seleccione un concesionario válido.';
  } else if (!req.file) {
    errorMsg = 'La imagen es obligatoria.';
  }else if (tipo && !tiposValidos.includes(tipo)) {
      errorMsg = 'El tipo de vehículo no es válido.';
  }

  if (errorMsg) return res.status(400).json({ ok: false, error: errorMsg });

  // 1. Verificar duplicidad matrícula
  req.db.query('SELECT id_vehiculo FROM vehiculos WHERE matricula = ?', [matricula.toUpperCase()], (err, duplicados) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    
    if (duplicados.length > 0) {
      return res.status(400).json({ ok: false, error: 'La matrícula ya existe.' });
    }

    const imagenBuffer = req.file ? req.file.buffer : null;

    // 2. Insertar
    req.db.query(
      `INSERT INTO vehiculos
      (matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [
        matricula.toUpperCase(), marca, modelo, anyo_matriculacion, descripcion || null, 
        tipo || 'coche', precio, numero_plazas || 5, autonomia_km || null, color || null, 
        imagenBuffer, estado || 'disponible', id_concesionario
      ],
      (errInsert, result) => {
        if (errInsert) {
           console.error('Error insertando vehículo:', errInsert);
           return res.status(500).json({ ok: false, error: 'Error al guardar el vehículo' });
        }
        res.json({ ok: true, id: result.insertId, redirectUrl: '/vehiculos' });
      }
    );
  });
});

// PUT /api/vehiculos/:id (Editar Vehículo)
router.put('/:id(\\d+)', isAdmin, upload.single('imagen'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const formData = req.body;
  const { 
    matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, 
    numero_plazas, autonomia_km, color, estado, id_concesionario 
  } = formData;

  // Validaciones
  let errorMsg = null;
  const actual = new Date().getFullYear();
  const tiposValidos = ['coche', 'suv', 'furgoneta', 'moto', 'deportivo', 'todoterreno', 'cabrio', 'pickup', 'otro'];

  if (!matricula || !marca || !modelo || !anyo_matriculacion || !precio || !id_concesionario) {
    errorMsg = 'Faltan campos obligatorios.';
  } else if (!/^\d{4}[A-Z]{3}$/i.test(matricula)) {
    errorMsg = 'Formato matrícula inválido.';
  } else if (parseInt(anyo_matriculacion, 10) < 1901 || parseInt(anyo_matriculacion, 10) > actual) {
    errorMsg = 'Año inválido.';
  } else if (parseFloat(precio) <= 0) {
    errorMsg = 'El precio debe ser positivo.';
  } else if (id_concesionario === '0') {
    errorMsg = 'Seleccione un concesionario válido.';
  }else if (tipo && !tiposValidos.includes(tipo)) {
      errorMsg = 'El tipo de vehículo no es válido.';
  }

  if (errorMsg) return res.status(400).json({ ok: false, error: errorMsg });

  // 1. Verificar duplicidad matrícula (excluyendo propio ID)
  req.db.query('SELECT id_vehiculo FROM vehiculos WHERE matricula = ? AND id_vehiculo != ?', [matricula.toUpperCase(), id], (err, duplicados) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });

    if (duplicados.length > 0) return res.status(400).json({ ok: false, error: 'La matrícula ya pertenece a otro vehículo.' });

    // Preparar UPDATE
    let sql = `UPDATE vehiculos SET 
        matricula = ?, marca = ?, modelo = ?, anyo_matriculacion = ?, descripcion = ?, 
        tipo = ?, precio = ?, numero_plazas = ?, autonomia_km = ?, color = ?, 
        estado = ?, id_concesionario = ?`;
        
    let params = [
      matricula.toUpperCase(), marca, modelo, anyo_matriculacion,
      descripcion || null, tipo || 'coche', precio, numero_plazas || 5,
      autonomia_km || null, color || null, estado || 'disponible',
      id_concesionario
    ];

    if (req.file) {
      sql += ', imagen = ?';
      params.push(req.file.buffer);
    }

    sql += ' WHERE id_vehiculo = ?';
    params.push(id);

    // 2. Ejecutar Update
    req.db.query(sql, params, (errUpdate) => {
      if (errUpdate) {
        console.error('Error actualizando vehículo:', errUpdate);
        let errorFinal = 'Error al actualizar vehículo';
        if (errUpdate.code === 'ER_DUP_ENTRY') errorFinal = 'La matrícula ya existe.';
        return res.status(500).json({ ok: false, error: errorFinal });
      }

      res.json({ ok: true, redirectUrl: `/vehiculos/${id}` });
    });
  });
});

// DELETE /api/vehiculos/:id (Eliminar Vehículo)
router.delete('/:id(\\d+)', isAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);

  req.db.query('UPDATE vehiculos SET activo=false WHERE id_vehiculo = ?', [id], (err) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true });
  });
});

module.exports = router;