const express = require('express');
const router = express.Router();
const { isAdmin, isAdminOrWorker } = require('../middleware/auth');

// LISTADO: /concesionarios
router.get('/', isAdmin, (req, res) => {
  res.render('listaConcesionarios', {
    title: 'Concesionarios',
    usuarioSesion: req.session.usuario
  });
});

// DETALLE: /concesionarios/:id
router.get('/:id(\\d+)', isAdminOrWorker, (req, res) => {
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

// FORMULARIO EDITAR: GET /concesionarios/:id/editar  (
router.get('/:id(\\d+)/editar', isAdmin, (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  req.db.query('SELECT * FROM concesionarios WHERE id_concesionario = ?', [id], (err, rows) => {
    if (err) {
      console.error('Error preparando edición:', err);
      return res.status(500).render('error', { mensaje: 'Error al preparar edición del concesionario' });
    }

    if (!rows || rows.length === 0) {
      const error = new Error(`Concesionario no encontrado (id_concesionario=${id})`);
      error.status = 404;
      return next(error);
    }

    const concesionario = rows[0];

    res.render('concesionarioForm', {
      title: 'Editar Concesionario',
      concesionario,
      usuarioSesion: req.session.usuario,
      action: `/concesionarios/${id}/editar`,
      method: 'POST'
    });
  });
});

module.exports = router;