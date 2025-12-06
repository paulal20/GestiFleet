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

    // Enviamos el idUsuarioSesion para controlar botones en el front
    res.json({ ok: true, usuarios: usuariosConEstado, idUsuarioSesion: req.session.usuario.id_usuario });
  });
});

// POST /api/usuarios/nuevo (Crear Usuario - Solo Admin)
router.post('/nuevo', isAdmin, (req, res) => {
  const { nombre, apellido1, apellido2, email, confemail, contrasenya, telefono, id_concesionario, preferencias_accesibilidad, rol } = req.body;

  // Validación de Rol
  let rolFinal = 'Empleado';
  let concesionarioFinal = id_concesionario;

  if (rol === 'Admin') {
      rolFinal = 'Admin';
      concesionarioFinal = null; // Admins no tienen concesionario asignado en esta lógica
  } else {
      // Es empleado, validar concesionario
      if (!concesionarioFinal || concesionarioFinal == '0') {
          return res.status(400).json({ ok: false, errors: { id_concesionario: 'Selecciona un concesionario' } });
      }
  }

  const errors = {};
  if (!nombre || !apellido1 || !email || !contrasenya || !telefono) errors.general = 'Faltan campos obligatorios';
  if (email !== confemail) errors.email = 'Los correos no coinciden';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  const checkSql = 'SELECT id_usuario, correo, telefono FROM usuarios WHERE correo = ? OR telefono = ?';
  req.db.query(checkSql, [email, telefono], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    
    if (rows.length > 0) {
      const dbErrors = {};
      rows.forEach(row => {
        if (row.correo === email) dbErrors.email = 'El correo ya existe';
        if (row.telefono === telefono) dbErrors.telefono = 'El teléfono ya existe';
      });
      if (Object.keys(dbErrors).length > 0) {
        return res.status(400).json({ ok: false, error: 'Datos duplicados', errors: dbErrors });
      }
    }

    bcrypt.hash(contrasenya, 10, (errHash, hash) => {
      if (errHash) return res.status(500).json({ ok: false, error: 'Error encriptando contraseña' });

      const nombreCompleto = [nombre, apellido1, apellido2].filter(Boolean).join(' ').trim();

      req.db.query(
        `INSERT INTO usuarios (nombre, correo, contrasenya, rol, telefono, id_concesionario, preferencias_accesibilidad, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, true)`,
        [nombreCompleto, email, hash, rolFinal, telefono, concesionarioFinal, preferencias_accesibilidad || null],
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
  const { nombre, apellido1, apellido2, email, contrasenya, telefono, preferencias_accesibilidad } = req.body;
  
  // Estos los leemos pero validaremos si se usan o no
  let { rol, id_concesionario } = req.body;

  // Validación básica
  if (!nombre || !apellido1 || !email || !telefono) {
    return res.status(400).json({ ok: false, error: 'Faltan datos obligatorios' });
  }

  const isSelf = (req.session.usuario.id_usuario === id);
  const isAdminUser = (req.session.usuario.rol === 'Admin');

  // Lógica de Permisos de Rol y Concesionario
  if (isSelf) {
      // Si se edita a sí mismo, NO puede cambiar su rol ni su concesionario.
      // Se ignoran los valores del body.
      rol = undefined;
      id_concesionario = undefined;
  } else if (isAdminUser) {
      // Admin editando a otro: Puede cambiar rol.
      if (rol === 'Admin') {
          // Si lo asciende a Admin, quitamos concesionario
          id_concesionario = null; 
      } else {
          // Si es Empleado, debe tener concesionario
          rol = 'Empleado'; // Asegurar valor
          if (!id_concesionario || id_concesionario == '0') {
              return res.status(400).json({ ok: false, errors: { id_concesionario: 'Selecciona un concesionario para el empleado' } });
          }
      }
  } else {
      // Empleado editando a otro (No debería pasar por el middleware, pero por seguridad)
      return res.status(403).json({ ok: false, error: "No tienes permisos." });
  }

  // Verificar duplicados (excluyendo el propio usuario)
  let checkSql = 'SELECT id_usuario, correo, telefono FROM usuarios WHERE (correo = ? OR telefono = ?) AND id_usuario != ?';
  req.db.query(checkSql, [email, telefono, id], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    
    if (rows.length > 0) {
       const dbErrors = {};
       rows.forEach(row => {
           if (row.correo === email) dbErrors.email = 'El correo ya está en uso';
           if (row.telefono === telefono) dbErrors.telefono = 'El teléfono ya está en uso';
       });
       if (Object.keys(dbErrors).length > 0) return res.status(400).json({ ok: false, error: 'Datos duplicados', errors: dbErrors });
    }

    // Ejecutar Update
    const executeUpdate = (passwordHash) => {
      const nombreCompleto = [nombre, apellido1, apellido2].filter(Boolean).join(' ').trim();
      
      let sql = `UPDATE usuarios SET nombre=?, correo=?, telefono=?, preferencias_accesibilidad=?`;
      const params = [nombreCompleto, email, telefono, preferencias_accesibilidad || null];
      
      if (passwordHash) {
        sql += `, contrasenya=?`;
        params.push(passwordHash);
      }
      
      // Solo actualizamos rol/concesionario si NO es self y ES admin
      if (!isSelf && isAdminUser) {
        sql += `, rol=?, id_concesionario=?`;
        params.push(rol);
        params.push(id_concesionario);
      }

      sql += ` WHERE id_usuario=?`;
      params.push(id);

      req.db.query(sql, params, (errUpdate) => {
        if (errUpdate) return res.status(500).json({ ok: false, error: errUpdate.message });
        res.json({ ok: true });
      });
    };
    
    if (contrasenya && contrasenya.trim() !== '') {
       bcrypt.hash(contrasenya, 10, (errHash, hash) => { executeUpdate(hash); });
    } else {
       executeUpdate(null);
    }
  });
});

// PATCH y DELETE se mantienen igual (omito por brevedad si no cambian, pero recuerda incluirlos en tu archivo final)
// ... (Copiar PATCH y DELETE del mensaje anterior si no cambian)

router.patch('/:id(\\d+)/asignar-concesionario', isAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { id_concesionario } = req.body;
  
    if (!id_concesionario || id_concesionario === '0') {
      return res.status(400).json({ ok: false, error: 'Debes seleccionar un concesionario' });
    }
  
    req.db.query(
      'UPDATE usuarios SET id_concesionario=? WHERE id_usuario=?',
      [id_concesionario, id],
      (err, result) => {
        if (err) return res.status(500).json({ ok: false, error: err.message });
  
        res.json({ ok: true, mensaje: 'Concesionario asignado correctamente' });
      }
    );
  });
  
  
  // DELETE /api/usuarios/:id (Eliminar Usuario)
  router.delete('/:id(\\d+)', isAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
  
    // Evitar auto-eliminación
    if (req.session.usuario.id_usuario === id) {
      return res.status(400).json({ ok: false, error: 'No puedes eliminar tu propio usuario' });
    }
  
    const sqlReserva = `
      SELECT id_reserva
      FROM reservas
      WHERE id_usuario = ?
        AND estado = 'activa'
        AND fecha_fin >= NOW()
    `;
  
  req.db.query(sqlReserva, [id], (errReserva, reservas) => {
    if (errReserva) {
      console.error("Error comprobando reservas:", errReserva);
      return res.status(500).json({ ok: false, error: "Error interno al comprobar reservas" });
    }
    //tiene reservas activas/futuras
    if (reservas.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "No puedes eliminar este usuario: tiene reservas activas o futuras"
      });
    }
    req.db.query('UPDATE usuarios SET activo = 0 WHERE id_usuario = ?', [id], (errDelete) => {
        if (errDelete) {
          console.error("Error eliminando usuario:", errDelete);
          return res.status(500).json({ ok: false, error: "Error al eliminar usuario" });
        }
  
        return res.json({ ok: true, mensaje: "Usuario eliminado correctamente" });
      }
    );
  });
});

module.exports = router;