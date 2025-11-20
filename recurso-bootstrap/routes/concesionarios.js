const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/auth');

// LISTADO: /concesionarios
router.get('/', isAuth, async (req, res) => {
  res.render('listaConcesionarios', {
    title: 'Concesionarios',
    usuarioSesion: req.session.usuario
  });
});

// DETALLE: /concesionarios/:id
router.get('/:id(\\d+)', isAuth, async (req, res, next) => {
  res.render("concesionarioDetalle", {
    title: "Detalle Concesionario",
    usuarioSesion: req.session.usuario,
    idConcesionario: req.params.id
  });
});

// FORMULARIO NUEVO: GET /concesionarios/nuevo  (admin)
router.get('/nuevo', isAdmin, (req, res) => {
  res.render('concesionarioForm', {
    title: 'Nuevo Concesionario',
    concesionario: {},
    usuarioSesion: req.session.usuario,
    action: '/concesionarios/nuevo',
    method: 'POST'
  });
});

// FORMULARIO EDITAR: GET /concesionarios/:id/editar  (admin)
router.get('/:id(\\d+)/editar', isAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await req.db.query('SELECT * FROM concesionarios WHERE id_concesionario = ?', [id]);
    if (!rows || rows.length === 0) {
      const err = new Error(`Concesionario no encontrado (id_concesionario=${id})`);
      err.status = 404;
      return next(err);
    }
    const concesionario = rows[0];
    res.render('concesionarioForm', {
      title: 'Editar Concesionario',
      concesionario,
      usuarioSesion: req.session.usuario,
      action: `/concesionarios/${id}/editar`,
      method: 'POST'
    });
  } catch (err) {
    console.error('Error preparando edición:', err);
    res.status(500).render('error', { mensaje: 'Error al preparar edición del concesionario' });
  }
});

module.exports = router;
