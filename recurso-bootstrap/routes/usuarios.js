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

    // Validación (el JS de frontend ya hace esto, pero es bueno tenerlo en backend)
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
      // CORREGIDO: Mapear 'email' a 'correo' para repoblar el formulario
      const usuarioParaRender = { ...formData, correo: formData.email };
      return res.status(400).render('usuarioForm', {
        title: 'Nuevo Usuario',
        action: '/usuarios/nuevo',
        error: errorMsg,
        usuario: usuarioParaRender,
        concesionarios
      });
    }

    const hashedPassword = await bcrypt.hash(contrasenya, 10);
    
    // Concatenar nombre
    const nombreCompleto = [nombre, apellido1, apellido2].filter(Boolean).join(' ').trim();

    await req.db.query(
      `INSERT INTO usuarios 
        (nombre, correo, contrasenya, rol, telefono, id_concesionario, preferencias_accesibilidad)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nombreCompleto,
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
    const usuarioParaRender = { ...formData, correo: formData.email };
    res.status(500).render('usuarioForm', {
      title: 'Nuevo Usuario',
      action: '/usuarios/nuevo',
      error,
      usuario: usuarioParaRender,
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

    // Separar nombre y apellidos para el formulario
    const nombreParts = usuario.nombre ? usuario.nombre.split(' ') : [];
    usuario.nombre = nombreParts[0] || '';
    usuario.apellido1 = nombreParts[1] || '';
    usuario.apellido2 = nombreParts.slice(2).join(' ') || '';
    // 'usuario.correo' ya viene bien desde la BD

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


// =================================================================
// POST EDITAR USUARIO (SECCIÓN CORREGIDA)
// =================================================================
router.post('/:id/editar', isAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.redirect('/usuarios');

  // 1. Usar los nombres correctos del formulario: 'email', 'contrasenya', 'apellido1', etc.
  const { 
    nombre, apellido1, apellido2, 
    email, contrasenya, rol, 
    telefono, id_concesionario, preferencias_accesibilidad 
  } = req.body;
  
  let concesionarios = [];

  try {
    [concesionarios] = await req.db.query('SELECT * FROM concesionarios');

    let errorMsg = null;

    // 2. Validar con 'email' y 'apellido1' (campo obligatorio)
    if (!nombre || !apellido1 || !email || !rol) {
      errorMsg = 'Nombre, primer apellido, correo y rol son obligatorios.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorMsg = 'El correo no tiene un formato válido.';
    } else if (!['Admin', 'Empleado'].includes(rol)) {
      errorMsg = 'Rol inválido.';
    }

    if (!errorMsg && rol === 'Empleado' && (!id_concesionario || id_concesionario === '0')) {
      errorMsg = 'Los empleados deben pertenecer a un concesionario.';
    }

    if (!errorMsg) {
      // 3. Validar duplicados con 'email'
      const [duplicados] = await req.db.query(
        'SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario != ?',
        [email, id]
      );
      if (duplicados.length > 0) {
        errorMsg = 'El correo introducido ya está en uso por otro usuario.';
      }
    }

    if (errorMsg) {
      // 4. Al re-renderizar, mapear 'email' a 'correo' para que el EJS lo lea
      const usuarioParaRender = {
        ...req.body,
        id_usuario: id,
        correo: req.body.email // El EJS espera 'usuario.correo'
      };
      return res.status(400).render('usuarioForm', {
        title: 'Editar Usuario',
        action: `/usuarios/${id}/editar`,
        error: errorMsg,
        usuario: usuarioParaRender,
        concesionarios
      });
    }

    // 5. Construir la consulta de actualización dinámicamente
    
    // Re-concatenar el nombre
    const nombreCompleto = [nombre, apellido1, apellido2].filter(Boolean).join(' ').trim();
    
    let sql = `
      UPDATE usuarios SET 
        nombre = ?, 
        correo = ?, 
        rol = ?, 
        telefono = ?, 
        id_concesionario = ?,
        preferencias_accesibilidad = ?
    `;
    
    const params = [
      nombreCompleto,
      email, // Usar 'email' del formulario
      rol,
      telefono || null,
      rol === 'Empleado' ? id_concesionario : null,
      preferencias_accesibilidad || null
    ];

    // 6. Actualizar contraseña SOLO si se proporcionó una nueva
    if (contrasenya) {
      const hashedPassword = await bcrypt.hash(contrasenya, 10);
      sql += ', contrasenya = ?';
      params.push(hashedPassword);
    }

    // Terminar la consulta
    sql += ' WHERE id_usuario = ?';
    params.push(id);

    // Ejecutar la consulta
    await req.db.query(sql, params);

    res.redirect(`/usuarios`); // Redirigir a la lista (o a /usuarios/${id} si prefieres)

a } catch (err) {
    console.error('Error al actualizar usuario:', err);
    let error = 'Error al actualizar usuario';
    if (err.code === 'ER_DUP_ENTRY') error = 'El correo introducido ya existe.';
    
    const usuarioParaRender = {
      ...req.body,
      id_usuario: id,
      correo: req.body.email
    };
    
    res.status(500).render('usuarioForm', {
      title: 'Editar Usuario',
      action: `/usuarios/${id}/editar`,
      error,
      usuario: usuarioParaRender,
      concesionarios
    });
  }
});
// =================================================================
// FIN SECCIÓN CORREGIDA
// =================================================================


// POST ELIMINAR USUARIO
router.post('/:id/eliminar', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.redirect('/usuarios');

    // (Opcional) No dejar que un admin se elimine a sí mismo
    if (req.session.usuario && req.session.usuario.id_usuario === id) {
      // O renderizar un error
      return res.redirect('/usuarios?error=no_self_delete'); 
    }

    await req.db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
    res.redirect('/usuarios');
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).render('error', { mensaje: 'Error al eliminar el usuario' });
  }
});

module.exports = router;