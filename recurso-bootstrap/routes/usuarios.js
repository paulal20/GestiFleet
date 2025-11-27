const express = require('express');
const router = express.Router();
const { isAdmin, isAdminOrSelf } = require('../middleware/auth');

router.get('/', isAdmin, (req, res) => {
  // SELECT * para tener acceso a todos los campos (incluyendo ciudad para el select)
  req.db.query('SELECT * FROM concesionarios WHERE activo = true ORDER BY nombre', (err, concesionarios) => {
    if (err) concesionarios = []; 

    res.render('listaUsuarios', {
      title: 'Gestión de Usuarios',
      concesionariosDisponibles: concesionarios,
      usuarioSesion: req.session.usuario,
      usuarios: [], 
      concesionarioSeleccionado: 0
    });
  });
});

// VISTA FORMULARIO NUEVO: /usuarios/nuevo
router.get('/nuevo', isAdmin, (req, res) => {
  req.db.query('SELECT * FROM concesionarios WHERE activo = true ORDER BY nombre', (err, concesionarios) => {
    if (err) {
      console.error('Error cargando concesionarios vista nuevo:', err);
      return res.status(500).render('error', { mensaje: 'Error cargando formulario' });
    }

    res.render('usuarioForm', {
      title: 'Nuevo Usuario',
      action: '/usuarios/nuevo',
      method: 'POST',
      usuario: {},
      usuarioSesion: req.session.usuario,
      concesionarios
    });
  });
});

// VISTA FORMULARIO EDITAR: /usuarios/:id/editar
router.get('/:id(\\d+)/editar', isAdminOrSelf, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const redirectUrl = req.session.usuario.rol === 'Admin' ? '/usuarios' : '/perfil';

  req.db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id], (err, usuarios) => {
    if (err || !usuarios.length) {
       return res.redirect(redirectUrl);
    }
    
    let usuario = usuarios[0];
    
    const nombreParts = usuario.nombre ? usuario.nombre.split(' ') : [];
    usuario.nombre = nombreParts[0] || '';
    usuario.apellido1 = nombreParts[1] || '';
    usuario.apellido2 = nombreParts.slice(2).join(' ') || '';

    req.db.query('SELECT * FROM concesionarios WHERE activo = true ORDER BY nombre', (errCon, concesionarios) => {
      if (errCon) concesionarios = [];

      res.render('usuarioForm', {
        title: 'Editar Usuario',
        action: `/api/usuarios/${id}`, 
        method: 'PUT',
        usuario,
        usuarioSesion: req.session.usuario,
        concesionarios
      });
    });
  });
});

// VISTA DETALLE / PERFIL: /usuarios/:id
router.get('/:id(\\d+)', isAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);

  req.db.query(`
      SELECT u.*, c.nombre AS nombre_concesionario
      FROM usuarios u
      LEFT JOIN concesionarios c ON u.id_concesionario = c.id_concesionario
      WHERE u.id_usuario = ?
    `, [id], (err, usuarios) => {
    
    if (err || !usuarios.length) {
      return res.status(404).render('error', { mensaje: 'Usuario no encontrado.' });
    }

    res.render('perfil', {
      title: 'Detalle del Usuario',
      usuario: usuarios[0],
      lista: true, 
      usuarioSesion: req.session.usuario
    });
  });
});

module.exports = router;