const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/auth');

// LISTADO: /concesionarios
router.get('/', async (req, res) => {
  try {
    const [concesionarios] = await req.db.query('SELECT * FROM concesionarios ORDER BY nombre');
    res.render('listaConcesionarios', {
      title: 'Concesionarios',
      concesionarios
    });
  } catch (err) {
    console.error('Error cargando concesionarios:', err);
    res.status(500).render('error', { mensaje: 'Error al cargar los concesionarios' });
  }
});

// DETALLE: /concesionarios/:id
router.get('/:id(\\d+)', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await req.db.query('SELECT * FROM concesionarios WHERE id_concesionario = ?', [id]);
    if (!rows || rows.length === 0) {
      const err = new Error(`Concesionario no encontrado (id_concesionario=${id})`);
      err.status = 404;
      return next(err);
    }
    const concesionario = rows[0];

    // opcional: traer sus vehículos
    const [vehiculos] = await req.db.query(
      'SELECT id_vehiculo, matricula, marca, modelo, estado FROM vehiculos WHERE id_concesionario = ?',
      [id]
    );

    res.render('concesionarioDetalle', {
      title: `Concesionario - ${concesionario.nombre}`,
      concesionario,
      vehiculos
    });
  } catch (err) {
    console.error('Error al obtener detalle de concesionario:', err);
    res.status(500).render('error', { mensaje: 'Error al cargar el concesionario' });
  }
});

// FORMULARIO NUEVO: GET /concesionarios/nuevo  (admin)
router.get('/nuevo', isAuth, isAdmin, (req, res) => {
  res.render('concesionarioForm', {
    title: 'Nuevo Concesionario',
    concesionario: {},
    action: '/concesionarios/nuevo',
    method: 'POST'
  });
});

// CREAR: POST /concesionarios/nuevo  (admin)
router.post('/nuevo', isAuth, isAdmin, async (req, res) => {
  try {
    const { nombre, ciudad, direccion, telefono_contacto } = req.body;

    // validaciones simples
    if (!nombre || !ciudad || !direccion || !telefono_contacto) {
      const error = 'Todos los campos son obligatorios';
      return res.status(400).render('concesionarioForm', {
        title: 'Nuevo Concesionario',
        concesionario: req.body,
        action: '/concesionarios/nuevo',
        method: 'POST',
        error
      });
    }

    await req.db.query(
      `INSERT INTO concesionarios (nombre, ciudad, direccion, telefono_contacto)
       VALUES (?, ?, ?, ?)`,
      [nombre, ciudad, direccion, telefono_contacto]
    );

    res.redirect('/concesionarios');
  } catch (err) {
    console.error('Error creando concesionario:', err);
    res.status(500).render('concesionarioForm', {
      title: 'Nuevo Concesionario',
      concesionario: req.body,
      action: '/concesionarios/nuevo',
      method: 'POST',
      error: 'No se pudo crear el concesionario'
    });
  }
});

// FORMULARIO EDITAR: GET /concesionarios/:id/editar  (admin)
router.get('/:id(\\d+)/editar', isAuth, isAdmin, async (req, res, next) => {
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
      action: `/concesionarios/${id}/editar`,
      method: 'POST'
    });
  } catch (err) {
    console.error('Error preparando edición:', err);
    res.status(500).render('error', { mensaje: 'Error al preparar edición del concesionario' });
  }
});

// ACTUALIZAR: POST /concesionarios/:id/editar  (admin)
router.post('/:id(\\d+)/editar', isAuth, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nombre, ciudad, direccion, telefono_contacto } = req.body;

    if (!nombre || !ciudad || !direccion || !telefono_contacto) {
      const error = 'Todos los campos son obligatorios';
      return res.status(400).render('concesionarioForm', {
        title: 'Editar Concesionario',
        concesionario: { id_concesionario: id, ...req.body },
        action: `/concesionarios/${id}/editar`,
        method: 'POST',
        error
      });
    }

    await req.db.query(
      `UPDATE concesionarios
       SET nombre = ?, ciudad = ?, direccion = ?, telefono_contacto = ?
       WHERE id_concesionario = ?`,
      [nombre, ciudad, direccion, telefono_contacto, id]
    );

    res.redirect(`/concesionarios/${id}`);
  } catch (err) {
    console.error('Error actualizando concesionario:', err);
    res.status(500).render('concesionarioForm', {
      title: 'Editar Concesionario',
      concesionario: { id_concesionario: req.params.id, ...req.body },
      action: `/concesionarios/${req.params.id}/editar`,
      method: 'POST',
      error: 'No se pudo actualizar el concesionario'
    });
  }
});

// ELIMINAR: POST /concesionarios/:id/eliminar  (admin)
router.post('/:id(\\d+)/eliminar', isAuth, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    // comprobar si hay vehículos asociados
    const [countRows] = await req.db.query('SELECT COUNT(*) AS cnt FROM vehiculos WHERE id_concesionario = ?', [id]);
    const cnt = countRows[0].cnt;

    if (cnt > 0) {
      const [concesionarios] = await req.db.query('SELECT * FROM concesionarios ORDER BY nombre');
      return res.status(400).render('concesionarios', {
        title: 'Concesionarios',
        concesionarios,
        error: 'No se puede eliminar el concesionario porque tiene vehículos asociados.'
      });
    }

    await req.db.query('DELETE FROM concesionarios WHERE id_concesionario = ?', [id]);
    res.redirect('/concesionarios');
  } catch (err) {
    console.error('Error al eliminar concesionario:', err);
    res.status(500).render('error', { mensaje: 'No se pudo eliminar el concesionario' });
  }
});

module.exports = router;
