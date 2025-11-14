const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { isAdmin } = require('../middleware/auth');

// GET LISTA USUARIOS
router.get('/', isAdmin, async (req, res) => {
  try {
    const { concesionario } = req.query;
    const concesionarioSeleccionado = concesionario ? parseInt(concesionario, 10) : 0; 

    let sql = `
      SELECT u.*, c.nombre AS nombre_concesionario
      FROM usuarios u
      LEFT JOIN concesionarios c ON u.id_concesionario = c.id_concesionario
    `;
    const params = [];

    if (concesionarioSeleccionado > 0) {
      sql += ' WHERE u.id_concesionario = ?';
      params.push(concesionarioSeleccionado);
    }

    sql += ' ORDER BY u.nombre';

    const [usuarios] = await req.db.query(sql, params);

    const [concesionarios] = await req.db.query(
      'SELECT id_concesionario, nombre, ciudad FROM concesionarios ORDER BY nombre'
    );

    res.render('listaUsuarios', {
      title: 'Gestión de Usuarios',
      usuarios,
      concesionariosDisponibles: concesionarios,
      concesionarioSeleccionado: concesionarioSeleccionado, 
      usuario: req.session.usuario
    });

  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).render('listaUsuarios', {
      title: 'Gestión de Usuarios',
      usuarios: [],
      concesionariosDisponibles: [],
      concesionarioSeleccionado: 0,
      usuario: req.session.usuario,
      error: "Error al cargar usuarios"
    });
  }
});

// GET DETALLE USUARIO
router.get('/:id', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.redirect('/usuarios');

    const [usuarios] = await req.db.query(`
      SELECT u.*, c.nombre AS nombre_concesionario
      FROM usuarios u
      LEFT JOIN concesionarios c ON u.id_concesionario = c.id_concesionario
      WHERE u.id_usuario = ?
    `, [id]);

    if (usuarios.length === 0) {
      return res.status(404).render('error', { mensaje: 'Usuario no encontrado.' });
    }

    const usuario = usuarios[0];

    res.render('perfil', {
      title: 'Detalle del Usuario',
      usuario,
      usuarioSesion: req.session.usuario
    });

  } catch (err) {
    console.error('Error al obtener detalle del usuario:', err);
    res.status(500).render('error', { mensaje: 'Error al cargar el usuario.' });
  }
});

// GET NUEVO USUARIO
router.get('/nuevo', isAdmin, async (req, res) => {
  try {
    const [concesionarios] = await req.db.query('SELECT * FROM concesionarios');

    res.render('usuarioForm', {
      title: 'Nuevo Usuario',
      action: '/usuarios/nuevo',
      method: 'POST',
      usuario: {},
      concesionarios
    });
  } catch (err) {
    console.error('Error al obtener concesionarios:', err);
    res.status(500).render('error', { mensaje: 'No se pudieron cargar los concesionarios' });
  }
});

// POST NUEVO USUARIO
router.post('/nuevo', isAdmin, async (req, res) => {
    const formData = req.body;
  const { nombre, apellido1, apellido2, email, confemail, contrasenya, rol, telefono, id_concesionario, preferencias_accesibilidad } = formData;

  let concesionarios = [];
  try {
    [concesionarios] = await req.db.query('SELECT * FROM concesionarios');

    let errorMsg = null;

    if (!nombre || !apellido1 || !email || !contrasenya || !rol) {
      errorMsg = 'Nombre, primer apellido, correo, contraseña y rol son obligatorios.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorMsg = 'El correo no tiene un formato válido.';
    } else if (email !== confemail) {
      errorMsg = 'Los correos no coinciden.';
    } else if (!['Admin', 'Empleado'].includes(rol)) {
      errorMsg = 'Rol inválido.';
    }

    if (!errorMsg && rol === 'Empleado' && (!id_concesionario || id_concesionario === '0')) {
      errorMsg = 'Los empleados deben pertenecer a un concesionario.';
    }

    if (!errorMsg) {
      const [duplicados] = await req.db.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [email]);
      if (duplicados.length > 0) {
        errorMsg = 'El correo introducido ya está en uso.';
      }
    }

    if (errorMsg) {
      return res.status(400).render('usuarioForm', {
        title: 'Nuevo Usuario',
        action: '/usuarios/nuevo',
        error: errorMsg,
        usuario: formData,
        concesionarios
      });
    }

    const hashedPassword = await bcrypt.hash(contrasenya, 10);

    await req.db.query(
      `INSERT INTO usuarios 
        (nombre, correo, contrasenya, rol, telefono, id_concesionario, preferencias_accesibilidad)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre + ' ' + apellido1 + ' ' + apellido2 || null,
        email,
        hashedPassword,
        rol,
        telefono || null,
        rol === 'Empleado' ? id_concesionario : null,
        preferencias_accesibilidad || null
      ]
    );

    res.redirect('/usuarios');

  } catch (err) {
    console.error('Error al crear usuario:', err);
    let error = 'Error al crear usuario';
    if (err.code === 'ER_DUP_ENTRY') error = 'El correo ya existe.';
    res.status(500).render('usuarioForm', {
      title: 'Nuevo Usuario',
      action: '/usuarios/nuevo',
      error,
      usuario: formData,
      concesionarios
    });
  }
});

// GET EDITAR USUARIO
router.get('/:id/editar', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.redirect('/usuarios');

    const [usuarios] = await req.db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
    if (usuarios.length === 0) return res.redirect('/usuarios');

    let usuario = usuarios[0];

    // Separar nombre y apellidos si los guardaste concatenados
    const nombreParts = usuario.nombre ? usuario.nombre.split(' ') : [];
    usuario.nombre = nombreParts[0] || '';
    usuario.apellido1 = nombreParts[1] || '';
    usuario.apellido2 = nombreParts.slice(2).join(' ') || '';

    const [concesionarios] = await req.db.query('SELECT * FROM concesionarios');

    res.render('usuarioForm', {
      title: 'Editar Usuario',
      action: `/usuarios/${id}/editar`,
      method: 'POST',
      usuario,
      concesionarios
    });
  } catch (err) {
    console.error('Error al cargar formulario de edición:', err);
    res.status(500).render('error', { mensaje: 'Error al cargar el usuario para editar.' });
  }
});


// POST EDITAR USUARIO
router.post('/:id/editar', isAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.redirect('/usuarios');

  const { nombre, correo, rol, telefono, id_concesionario } = req.body;
  let concesionarios = [];

  try {
    [concesionarios] = await req.db.query('SELECT * FROM concesionarios');

    let errorMsg = null;

    if (!nombre || !correo || !rol) {
      errorMsg = 'Nombre, correo y rol son obligatorios.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      errorMsg = 'El correo no tiene un formato válido.';
    } else if (!['Admin', 'Empleado'].includes(rol)) {
      errorMsg = 'Rol inválido.';
    }

    if (!errorMsg && rol === 'Empleado' && (!id_concesionario || id_concesionario === '0')) {
      errorMsg = 'Los empleados deben pertenecer a un concesionario.';
    }

    if (!errorMsg) {
      const [duplicados] = await req.db.query(
        'SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario != ?',
        [correo, id]
      );
      if (duplicados.length > 0) {
        errorMsg = 'El correo introducido ya está en uso por otro usuario.';
      }
    }

    if (errorMsg) {
      return res.status(400).render('usuarioForm', {
        title: 'Editar Usuario',
        action: `/usuarios/${id}/editar`,
        error: errorMsg,
        usuario: { ...req.body, id_usuario: id },
        concesionarios
      });
    }

    await req.db.query(
      `UPDATE usuarios SET 
        nombre = ?, 
        correo = ?, 
        rol = ?, 
        telefono = ?, 
        id_concesionario = ?
       WHERE id_usuario = ?`,
      [
        nombre,
        correo,
        rol,
        telefono || null,
        rol === 'Empleado' ? id_concesionario : null,
        id
      ]
    );

    res.redirect(`/usuarios/${id}`);

  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    let error = 'Error al actualizar usuario';
    if (err.code === 'ER_DUP_ENTRY') error = 'El correo introducido ya existe.';
    res.status(500).render('usuarioForm', {
      title: 'Editar Usuario',
      action: `/usuarios/${id}/editar`,
      error,
      usuario: { ...req.body, id_usuario: id },
      concesionarios
    });
  }
});

// POST ELIMINAR USUARIO
router.post('/:id/eliminar', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.redirect('/usuarios');

    await req.db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
    res.redirect('/usuarios');
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).render('error', { mensaje: 'Error al eliminar el usuario' });
  }
});

module.exports = router;
