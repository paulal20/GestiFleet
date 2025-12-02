const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { isAdmin, isAdminOrSelf } = require('../../middleware/auth');

// GET /api/usuarios (Listado JSON)
router.get('/', isAdmin, (req, res) => {
  const { concesionario, estado } = req.query;
  const concesionarioSeleccionado = concesionario ? parseInt(concesionario, 10) : 0;

  let sql = `
      SELECT u.id_usuario, u.nombre, u.correo, u.rol, u.telefono, c.nombre AS nombre_concesionario, u.activo
      FROM usuarios u
      LEFT JOIN concesionarios c ON u.id_concesionario = c.id_concesionario
    `;
  
  const params = [];
  const conditions = [];

  if (concesionarioSeleccionado > 0) {
    conditions.push('u.id_concesionario = ?');
    params.push(concesionarioSeleccionado);
  }

  // Filtro de Estado: '1' = Activos, '0' = Eliminados
  if (estado === '1') {
    conditions.push('u.activo = 1');
  } else if (estado === '0') {
    conditions.push('u.activo = 0');
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY u.nombre';

  req.db.query(sql, params, (err, usuarios) => {
    if (err) {
      console.error("Error API usuarios lista:", err);
      return res.status(500).json({ ok: false, error: "Error al obtener usuarios" });
    }

    const usuariosConEstado = usuarios.map(u => ({
      ...u,
      activo: u.activo ? "Activo" : "Eliminado",
      activoBool: u.activo === 1
    }));

    res.json({ ok: true, usuarios: usuariosConEstado });
  });
});

// POST /api/usuarios (Crear Usuario)
router.post('/nuevo', isAdmin, (req, res) => {
  const { nombre, apellido1, apellido2, email, confemail, contrasenya, rol, telefono, id_concesionario, preferencias_accesibilidad } = req.body;

  // Validaciones básicas
  const errors = {};
  if (!nombre || !apellido1 || !email || !contrasenya || !rol) errors.general = 'Faltan campos obligatorios';
  if (email !== confemail) errors.email = 'Los correos no coinciden';
  if (rol === 'Empleado' && (!id_concesionario || id_concesionario == '0')) errors.concesionario = 'Selecciona un concesionario';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  // 1. Verificar duplicados (Email O Teléfono)
  let checkSql = 'SELECT id_usuario, correo, telefono FROM usuarios WHERE correo = ?';
  const checkParams = [email];
  
  if (telefono) {
      checkSql += ' OR telefono = ?';
      checkParams.push(telefono);
  }

  req.db.query(checkSql, checkParams, (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    
    // Comprobamos qué campo está duplicado
    if (rows.length > 0) {
        const dbErrors = {};
        rows.forEach(row => {
            if (row.correo === email) dbErrors.email = 'El correo ya existe';
            if (telefono && row.telefono === telefono) dbErrors.telefono = 'El teléfono ya existe';
        });
        
        // Si encontramos duplicados, devolvemos error estructurado
        if (Object.keys(dbErrors).length > 0) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Datos duplicados', // Mensaje genérico para la alerta superior
                errors: dbErrors           // Objeto para marcar los campos específicos
            });
        }
    }

    // 2. Hash Password
    bcrypt.hash(contrasenya, 10, (errHash, hash) => {
      if (errHash) return res.status(500).json({ ok: false, error: 'Error encriptando contraseña' });

      const nombreCompleto = [nombre, apellido1, apellido2].filter(Boolean).join(' ').trim();

      // 3. Insertar
      req.db.query(
        `INSERT INTO usuarios (nombre, correo, contrasenya, rol, telefono, id_concesionario, preferencias_accesibilidad, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, true)`,
        [
          nombreCompleto, 
          email, 
          hash, 
          rol, 
          telefono || null, 
          rol === 'Empleado' ? id_concesionario : null, 
          preferencias_accesibilidad || null
        ],
        (errInsert, result) => {
          if (errInsert) return res.status(500).json({ ok: false, error: errInsert.message });
          res.json({ ok: true, id: result.insertId });
        }
      );
    });
  });
});

// PUT /api/usuarios/:id (Editar Usuario)
router.put('/:id(\\d+)', isAdminOrSelf, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nombre, apellido1, apellido2, email, contrasenya, rol, telefono, id_concesionario, preferencias_accesibilidad } = req.body;

  // Validaciones básicas
  if (!nombre || !apellido1 || !email || !rol) {
    return res.status(400).json({ ok: false, error: 'Faltan datos obligatorios' });
  }

  // 1. Verificar duplicados (Email O Teléfono, excluyendo el usuario actual)
  let checkSql = 'SELECT id_usuario, correo, telefono FROM usuarios WHERE (correo = ?';
  const checkParams = [email];
  
  if (telefono) {
      checkSql += ' OR telefono = ?';
      checkParams.push(telefono);
  }
  checkSql += ') AND id_usuario != ?';
  checkParams.push(id);

  req.db.query(checkSql, checkParams, (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    
    if (rows.length > 0) {
        const dbErrors = {};
        rows.forEach(row => {
            if (row.correo === email) dbErrors.email = 'El correo ya está en uso';
            if (telefono && row.telefono === telefono) dbErrors.telefono = 'El teléfono ya está en uso';
        });

        if (Object.keys(dbErrors).length > 0) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Datos duplicados', 
                errors: dbErrors 
            });
        }
    }

    // Función auxiliar para actualizar
    const executeUpdate = (passwordHash) => {
      const nombreCompleto = [nombre, apellido1, apellido2].filter(Boolean).join(' ').trim();
      let sql = `UPDATE usuarios SET nombre=?, correo=?, telefono=?, preferencias_accesibilidad=?`;
      const params = [nombreCompleto, email, telefono || null, preferencias_accesibilidad || null];

      if (passwordHash) {
        sql += `, contrasenya=?`;
        params.push(passwordHash);
      }

      // Lógica de roles (Solo Admin puede cambiar roles/concesionarios de otros)
      if (req.session.usuario.rol === 'Admin' && req.session.usuario.id_usuario !== id) {
        sql += `, rol=?, id_concesionario=?`;
        params.push(rol);
        params.push(rol === 'Empleado' ? id_concesionario : null);
      }
      
      sql += ` WHERE id_usuario=?`;
      params.push(id);

      req.db.query(sql, params, (errUpdate) => {
        if (errUpdate) return res.status(500).json({ ok: false, error: errUpdate.message });
        res.json({ ok: true });
      });
    };

    // 2. Si hay contraseña nueva, hashear
    if (contrasenya && contrasenya.trim() !== '') {
      bcrypt.hash(contrasenya, 10, (errHash, hash) => {
        if (errHash) return res.status(500).json({ ok: false, error: 'Error password' });
        executeUpdate(hash);
      });
    } else {
      executeUpdate(null);
    }
  });
});

// DELETE /api/usuarios/:id (Eliminar Usuario)
router.delete('/:id(\\d+)', isAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);

  // Evitar auto-eliminación
  if (req.session.usuario.id_usuario === id) {
    return res.status(400).json({ ok: false, error: 'No puedes eliminar tu propio usuario' });
  }

  req.db.query('UPDATE usuarios SET activo=0 WHERE id_usuario=?', [id], (err) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true });
  });
});

module.exports = router;