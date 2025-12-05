const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { isAuth, isAdmin } = require('../../middleware/auth');

// CONFIGURACION MULTER (Sin cambios)
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === '.png') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PNG.'));
  }
};
const upload = multer({ storage, fileFilter });

// HELPER TYPES (Sin cambios)
const fetchValidTypes = (db, callback) => {
  const sql = `SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehiculos' AND COLUMN_NAME = 'tipo'`;
  db.query(sql, (err, results) => {
    if (err || results.length === 0) return callback(err || new Error('No se pudo obtener schema'), []);
    const rawParams = results[0].COLUMN_TYPE;
    const types = rawParams.replace(/^enum\('/, '').replace(/'\)$/, '').split("','");           
    callback(null, types);
  });
};

// ==========================================
// GET /api/vehiculos (Listado JSON filtrado)
// ==========================================
router.get('/', isAuth, (req, res) => {
  if (!req.xhr) return res.redirect('/vehiculos');

  // Recibimos 'fecha' del date-time picker. Si no viene, usamos NOW().
  const { tipo, estado, color, plazas, concesionario, precio_max, autonomia_min, fecha } = req.query;
  const usuario = req.session.usuario;
  
  const fechaReferencia = fecha ? new Date(fecha) : new Date();
  
  let sql = `
    SELECT 
        v.id_vehiculo, v.matricula, v.marca, v.modelo, v.anyo_matriculacion, 
        v.descripcion, v.tipo, v.precio, v.numero_plazas, v.autonomia_km, 
        v.color, v.id_concesionario, 
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
  `;

  const params = [fechaReferencia, fechaReferencia];
  const condiciones = [];

  condiciones.push("v.activo = true"); // Siempre mostrar solo vehículos activos
  
  if (tipo) { condiciones.push('v.tipo = ?'); params.push(tipo); }
  if (color) { condiciones.push('v.color = ?'); params.push(color); }
  if (plazas) { condiciones.push('v.numero_plazas = ?'); params.push(plazas); }
  if (precio_max) { condiciones.push('v.precio <= ?'); params.push(precio_max); }
  if (autonomia_min) { condiciones.push('v.autonomia_km >= ?'); params.push(autonomia_min); }

  // Lógica de Roles
  if (!usuario || usuario.rol !== 'Admin') {
    condiciones.push('v.id_concesionario = ?');
    params.push(usuario.id_concesionario);

    condiciones.push(`
        NOT EXISTS (
            SELECT 1 FROM reservas r 
            WHERE r.id_vehiculo = v.id_vehiculo 
            AND r.estado = 'activa'
            AND r.fecha_inicio <= ? 
            AND r.fecha_fin >= ?
        )
    `);
    params.push(fechaReferencia, fechaReferencia);

  } else {
    if (concesionario) { condiciones.push('v.id_concesionario = ?'); params.push(concesionario); }

    if (estado === 'disponible') {
        condiciones.push(`
            NOT EXISTS (
                SELECT 1 FROM reservas r 
                WHERE r.id_vehiculo = v.id_vehiculo 
                AND r.estado = 'activa'
                AND r.fecha_inicio <= ? 
                AND r.fecha_fin >= ?
            )
        `);
        params.push(fechaReferencia, fechaReferencia);
    } else if (estado === 'reservado') {
        condiciones.push(`
            EXISTS (
                SELECT 1 FROM reservas r 
                WHERE r.id_vehiculo = v.id_vehiculo 
                AND r.estado = 'activa'
                AND r.fecha_inicio <= ? 
                AND r.fecha_fin >= ?
            )
        `);
        params.push(fechaReferencia, fechaReferencia);
    }
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

// ==========================================
// POST /api/vehiculos (Crear Vehículo)
// ==========================================
router.post('/', isAdmin, upload.single('imagen'), (req, res) => {
  const formData = req.body;
  
  fetchValidTypes(req.db, (errType, tiposValidos) => {
    if (errType) return res.status(500).json({ ok: false, error: 'Error verificando tipos' });

    const {
      matricula, marca, modelo, anyo_matriculacion, descripcion,
      tipo, precio, numero_plazas, autonomia_km, color,
      id_concesionario
    } = formData;

    // VALIDACIONES BÁSICAS
    let errorMsg = null;
    const actual = new Date().getFullYear();
    
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
    } else if (tipo && !tiposValidos.includes(tipo)) {
       errorMsg = 'El tipo de vehículo no es válido.';
    }

    if (errorMsg) return res.status(400).json({ ok: false, error: errorMsg });

    // 1. Verificar concesionario EXISTE y es ACTIVO
    req.db.query('SELECT id_concesionario FROM concesionarios WHERE id_concesionario = ? AND activo = true', [id_concesionario], (errConc, rowsConc) => {
        if (errConc) return res.status(500).json({ ok: false, error: 'Error al verificar concesionario.' });
        
        if (rowsConc.length === 0) {
            return res.status(400).json({ ok: false, error: 'El concesionario seleccionado no existe o no está activo.' });
        }

        // 2. Verificar duplicados
        req.db.query('SELECT id_vehiculo FROM vehiculos WHERE matricula = ?', [matricula.toUpperCase()], (errDup, duplicados) => {
            if (errDup) return res.status(500).json({ ok: false, error: errDup.message });
            
            if (duplicados.length > 0) {
                return res.status(400).json({ ok: false, error: 'La matrícula ya existe.' });
            }

            const imagenBuffer = req.file ? req.file.buffer : null;

            // 3. INSERTAR
            req.db.query(
                `INSERT INTO vehiculos 
                (matricula, marca, modelo, anyo_matriculacion, descripcion, 
                 tipo, precio, numero_plazas, autonomia_km, color, imagen, 
                 id_concesionario, activo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
                [
                    matricula.toUpperCase(), 
                    marca, 
                    modelo, 
                    anyo_matriculacion, 
                    descripcion || null, 
                    tipo, 
                    precio, 
                    numero_plazas || 5, 
                    autonomia_km || null, 
                    color || null, 
                    imagenBuffer, 
                    id_concesionario
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
  });
});

// ==========================================
// PUT /api/vehiculos/:id (Editar Vehículo)
// ==========================================
router.put('/:id(\\d+)', isAdmin, upload.single('imagen'), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const formData = req.body;

  fetchValidTypes(req.db, (errType, tiposValidos) => {
    if (errType) return res.status(500).json({ ok: false, error: 'Error verificando tipos' });

    const { 
      matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, 
      numero_plazas, autonomia_km, color, id_concesionario 
    } = formData;

    let errorMsg = null;
    const actual = new Date().getFullYear();
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
    } else if (tipo && !tiposValidos.includes(tipo)) {
       errorMsg = 'El tipo de vehículo no es válido.';
    }

    if (errorMsg) return res.status(400).json({ ok: false, error: errorMsg });

    // 1. Verificar concesionario EXISTE y es ACTIVO
    req.db.query('SELECT id_concesionario FROM concesionarios WHERE id_concesionario = ? AND activo = true', [id_concesionario], (errConc, rowsConc) => {
        if (errConc) return res.status(500).json({ ok: false, error: 'Error al verificar concesionario.' });
        
        if (rowsConc.length === 0) {
            return res.status(400).json({ ok: false, error: 'El concesionario seleccionado no existe o no está activo.' });
        }

        // 2. Verificar duplicados (excluyendo el propio vehículo)
        req.db.query('SELECT id_vehiculo FROM vehiculos WHERE matricula = ? AND id_vehiculo != ?', [matricula.toUpperCase(), id], (err, duplicados) => {
          if (err) return res.status(500).json({ ok: false, error: err.message });
          
          if (duplicados.length > 0) return res.status(400).json({ ok: false, error: 'La matrícula pertenece a otro vehículo.' });

          let sql = `UPDATE vehiculos SET matricula = ?, marca = ?, modelo = ?, anyo_matriculacion = ?, descripcion = ?, tipo = ?, precio = ?, numero_plazas = ?, autonomia_km = ?, color = ?, id_concesionario = ?`;
          let params = [matricula.toUpperCase(), marca, modelo, anyo_matriculacion, descripcion || null, tipo, precio, numero_plazas || 5, autonomia_km || null, color || null, id_concesionario];

          if (req.file) {
            sql += ', imagen = ?';
            params.push(req.file.buffer);
          }

          sql += ' WHERE id_vehiculo = ?';
          params.push(id);

          req.db.query(sql, params, (errUpdate) => {
            if (errUpdate) {
              console.error('Error actualizando:', errUpdate);
              return res.status(500).json({ ok: false, error: 'Error actualización' });
            }
            res.json({ ok: true, redirectUrl: `/vehiculos/${id}` });
          });
        });
    });
  });
});

// ==========================================
// DELETE /api/vehiculos/:id
// ==========================================
router.delete('/:id(\\d+)', isAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ahora = new Date();

  // 1. Validar que NO tenga reservas ACTIVAS en el presente o futuro
  const sqlCheck = "SELECT 1 FROM reservas WHERE id_vehiculo = ? AND estado = 'activa' AND fecha_fin >= ?";
  
  req.db.query(sqlCheck, [id, ahora], (errCheck, rows) => {
     if (errCheck) {
         console.error(errCheck);
         return res.status(500).json({ ok: false, error: 'Error al verificar reservas.' });
     }

     if (rows.length > 0) {
         return res.status(400).json({ 
             ok: false, 
             error: 'No se puede eliminar el vehículo porque tiene reservas activas o pendientes.' 
         });
     }

     // 2. Si no hay reservas, procedemos al soft delete
     req.db.query('UPDATE vehiculos SET activo=false WHERE id_vehiculo = ?', [id], (err) => {
        if (err) return res.status(500).json({ ok: false, error: err.message });
        res.json({ ok: true });
     });
  });
});

module.exports = router;