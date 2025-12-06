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

// POST /api/usuarios/nuevo
router.post('/nuevo', isAdmin, (req, res) => {
  const { nombre, apellido1, apellido2, email, confemail, contrasenya, telefono, id_concesionario, rol } = req.body;

  // 1. Configuración inicial de variables
  let rolFinal = 'Empleado';
  let concesionarioFinal = id_concesionario;

  if (rol === 'Admin') {
      rolFinal = 'Admin';
      concesionarioFinal = null;
  } else {
      if (!concesionarioFinal || concesionarioFinal == '0') {
          return res.status(400).json({ ok: false, errors: { id_concesionario: 'Selecciona un concesionario' } });
      }
  }

  // 2. Validaciones básicas de campos
  const errors = {};
  if (!nombre || !email || !contrasenya || !telefono) errors.general = 'Faltan campos obligatorios';
  if (email !== confemail) errors.email = 'Los correos no coinciden';
  if (!telefono || !/^\d{9}$/.test(telefono.trim())) errors.general = 'El teléfono debe constar de 9 dígitos numéricos.';
  if (!email || !/^[a-zA-Z0-9._%+-]+@(gestifleet\.es|gestifleet\.com)$/.test(email.trim())) {
      errors.general = 'El correo no tiene un formato válido (@gestifleet.es/com).';
  }
  if (!rol || (rol !== 'Admin' && rol !== 'Empleado')) {
      errors.general = 'El rol seleccionado no es válido.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  // --- FUNCIÓN PRINCIPAL: Verificar duplicados de usuario e Insertar ---
  // (Esta lógica se ejecutará solo si pasamos el chequeo del concesionario)
  const verificarDuplicadosYCrear = () => {
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
            `INSERT INTO usuarios (nombre, correo, contrasenya, rol, telefono, id_concesionario, activo)
             VALUES (?, ?, ?, ?, ?, ?, true)`,
            [nombreCompleto, email, hash, rolFinal, telefono, concesionarioFinal],
            (errInsert, result) => {
              if (errInsert) return res.status(500).json({ ok: false, error: errInsert.message });
              res.json({ ok: true, id: result.insertId });
            }
          );
        });
      });
  };

  // 3. LÓGICA DE VERIFICACIÓN DE CONCESIONARIO ACTIVO
  if (rolFinal === 'Empleado') {
      // Consultamos si existe y si está activo (activo = 1)
      const sqlConc = 'SELECT id_concesionario FROM concesionarios WHERE id_concesionario = ? AND activo = 1';
      req.db.query(sqlConc, [concesionarioFinal], (errConc, rowsConc) => {
          if (errConc) return res.status(500).json({ ok: false, error: 'Error verificando concesionario: ' + errConc.message });

          if (rowsConc.length === 0) {
              // Si no devuelve filas, o no existe o está borrado (activo=0)
              return res.status(400).json({ 
                  ok: false, 
                  errors: { id_concesionario: 'El concesionario seleccionado no existe o no está activo.' } 
              });
          }

          // Si existe y está activo, procedemos a crear el usuario
          verificarDuplicadosYCrear();
      });
  } else {
      // Si es Admin, no verificamos concesionario, pasamos directo
      verificarDuplicadosYCrear();
  }
});

// PUT /api/usuarios/:id (Editar Usuario)
router.put('/:id(\\d+)', isAdminOrSelf, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nombre, apellido1, apellido2, email, contrasenya, telefono} = req.body;
  
  let { rol, id_concesionario } = req.body;

  if (!nombre || !email || !telefono) {
    return res.status(400).json({ ok: false, error: 'Faltan datos obligatorios' });
  }
  if (!telefono || !/^\d{9}$/.test(telefono.trim()))
    return res.status(400).json({ ok: false, error: 'El teléfono debe constar de 9 dígitos numéricos.' });
  if (!email || !/^[a-zA-Z0-9._%+-]+@(gestifleet\.es|gestifleet\.com)$/.test(email.trim())) {
    return res.status(400).json({ ok: false, error: 'El correo no tiene un formato válido (@gestifleet.es/com).' });
  }
  if (!rol || (rol !== 'Admin' && rol !== 'Empleado')) {
    return res.status(400).json({ ok: false, error: 'El rol seleccionado no es válido.' });
  }

  const isSelf = (req.session.usuario.id_usuario === id);
  const isAdminUser = (req.session.usuario.rol === 'Admin');

  if (isSelf) {
      rol = undefined;
      id_concesionario = undefined;
  } else if (isAdminUser) {
      if (rol === 'Admin') {
          id_concesionario = null; 
      } else {
          rol = 'Empleado'; 
          if (!id_concesionario || id_concesionario == '0') {
              return res.status(400).json({ ok: false, errors: { id_concesionario: 'Selecciona un concesionario para el empleado' } });
          }
      }
  } else {
      return res.status(403).json({ ok: false, error: "No tienes permisos." });
  }

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

    const executeUpdate = (passwordHash) => {
      const nombreCompleto = [nombre, apellido1, apellido2].filter(Boolean).join(' ').trim();
      
      // CAMBIO AQUÍ: Añadimos activo=true al actualizar para reactivar usuarios eliminados
      let sql = `UPDATE usuarios SET nombre=?, correo=?, telefono=?, activo=true`;
      const params = [nombreCompleto, email, telefono];
      
      if (passwordHash) {
        sql += `, contrasenya=?`;
        params.push(passwordHash);
      }
      
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