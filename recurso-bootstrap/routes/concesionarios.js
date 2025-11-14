const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/auth');

// LISTADO: /concesionarios
router.get('/', isAuth, async (req, res) => {
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
router.get('/:id(\\d+)', isAuth, async (req, res, next) => {
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
  const formData = { ...req.body };
  const { nombre, ciudad, direccion, telefono_contacto } = formData;

  try {
    const fieldErrors = {};   
    const validFields = [];   

    if (!nombre || String(nombre).trim() === '') {
      fieldErrors.nombre = 'Este campo es obligatorio.';
    } else if (String(nombre).trim().length < 3) {
      fieldErrors.nombre = 'Debe tener al menos 3 caracteres.';
    } else {
      validFields.push('nombre');
    }

    if (!ciudad || String(ciudad).trim() === '') {
      fieldErrors.ciudad = 'Este campo es obligatorio.';
    } else if (String(ciudad).trim().length < 3) {
      fieldErrors.ciudad = 'Debe tener al menos 3 caracteres.';
    } else {
      validFields.push('ciudad');
    }

    if (!direccion || String(direccion).trim() === '') {
      fieldErrors.direccion = 'Este campo es obligatorio.';
    } else if (String(direccion).trim().length < 5) {
      fieldErrors.direccion = 'Debe tener al menos 5 caracteres.';
    } else {
      validFields.push('direccion');
    }

    const telefonoTrim = String(telefono_contacto || '').trim();
    if (!telefonoTrim) {
      fieldErrors.telefono_contacto = 'El teléfono es obligatorio.';
    } else if (!/^\d{9}$/.test(telefonoTrim)) {
      fieldErrors.telefono_contacto = 'El teléfono debe tener 9 dígitos.';
    } else {
      validFields.push('telefono_contacto');
    }

    if (validFields.includes('nombre')) {
      const [r] = await req.db.query('SELECT id_concesionario FROM concesionarios WHERE TRIM(nombre) = ?', [String(nombre).trim()]);
      if (r.length > 0) fieldErrors.nombre = 'Ya existe un concesionario con ese nombre.';
    }
    if (validFields.includes('telefono_contacto')) {
      const [r] = await req.db.query('SELECT id_concesionario FROM concesionarios WHERE TRIM(telefono_contacto) = ?', [telefonoTrim]);
      if (r.length > 0) fieldErrors.telefono_contacto = 'Ya existe ese teléfono de contacto.';
    }
    if (validFields.includes('direccion')) {
      const [r] = await req.db.query('SELECT id_concesionario FROM concesionarios WHERE TRIM(direccion) = ?', [String(direccion).trim()]);
      if (r.length > 0) fieldErrors.direccion = 'Ya existe esa dirección registrada.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      Object.keys(fieldErrors).forEach(field => {
        formData[field] = '';
      });

      return res.status(400).render('concesionarioForm', {
        title: 'Nuevo Concesionario',
        concesionario: formData,
        action: '/concesionarios/nuevo',
        method: 'POST',
        error: 'El nombre, dirección o teléfono ya existen o hay errores en el formulario.',
        fieldErrors,
        validFields
      });
    }

    await req.db.query(
      `INSERT INTO concesionarios (nombre, ciudad, direccion, telefono_contacto)
       VALUES (?, ?, ?, ?)`,
      [ String(nombre).trim(), String(ciudad).trim(), String(direccion).trim(), telefonoTrim ]
    );

    res.redirect('/concesionarios');
  } catch (err) {
    console.error('Error creando concesionario:', err);

    if (err && err.code === 'ER_DUP_ENTRY') {
      if (formData && formData.nombre) formData.nombre = '';
    }

    res.status(500).render('concesionarioForm', {
      title: 'Nuevo Concesionario',
      concesionario: formData,
      action: '/concesionarios/nuevo',
      method: 'POST',
      error: err.message || 'No se pudo crear el concesionario',
      fieldErrors: (err && err.fieldErrors) ? err.fieldErrors : {},
      validFields: []
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
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.redirect('/concesionarios');

  const formData = { ...req.body };
  const { nombre, ciudad, direccion, telefono_contacto } = formData;

  try {
    const fieldErrors = {};
    const validFields = [];

    if (!nombre || String(nombre).trim() === '') {
      fieldErrors.nombre = 'Este campo es obligatorio.';
    } else if (String(nombre).trim().length < 3) {
      fieldErrors.nombre = 'Debe tener al menos 3 caracteres.';
    } else {
      validFields.push('nombre');
    }

    if (!ciudad || String(ciudad).trim() === '') {
      fieldErrors.ciudad = 'Este campo es obligatorio.';
    } else if (String(ciudad).trim().length < 3) {
      fieldErrors.ciudad = 'Debe tener al menos 3 caracteres.';
    } else {
      validFields.push('ciudad');
    }

    if (!direccion || String(direccion).trim() === '') {
      fieldErrors.direccion = 'Este campo es obligatorio.';
    } else if (String(direccion).trim().length < 5) {
      fieldErrors.direccion = 'Debe tener al menos 5 caracteres.';
    } else {
      validFields.push('direccion');
    }

    const telefonoTrim = String(telefono_contacto || '').trim();
    if (!telefonoTrim) {
      fieldErrors.telefono_contacto = 'El teléfono es obligatorio.';
    } else if (!/^\d{9}$/.test(telefonoTrim)) {
      fieldErrors.telefono_contacto = 'El teléfono debe tener 9 dígitos.';
    } else {
      validFields.push('telefono_contacto');
    }

    if (validFields.includes('nombre')) {
      const [r] = await req.db.query('SELECT id_concesionario FROM concesionarios WHERE TRIM(nombre) = ? AND id_concesionario != ?', [String(nombre).trim(), id]);
      if (r.length > 0) fieldErrors.nombre = 'Ya existe un concesionario con ese nombre.';
    }
    if (validFields.includes('telefono_contacto')) {
      const [r] = await req.db.query('SELECT id_concesionario FROM concesionarios WHERE TRIM(telefono_contacto) = ? AND id_concesionario != ?', [telefonoTrim, id]);
      if (r.length > 0) fieldErrors.telefono_contacto = 'Ya existe ese teléfono de contacto.';
    }
    if (validFields.includes('direccion')) {
      const [r] = await req.db.query('SELECT id_concesionario FROM concesionarios WHERE TRIM(direccion) = ? AND id_concesionario != ?', [String(direccion).trim(), id]);
      if (r.length > 0) fieldErrors.direccion = 'Ya existe esa dirección registrada.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      Object.keys(fieldErrors).forEach(field => {
        formData[field] = '';
      });

      return res.status(400).render('concesionarioForm', {
        title: 'Editar Concesionario',
        concesionario: { id_concesionario: id, ...formData },
        action: `/concesionarios/${id}/editar`,
        method: 'POST',
        error: 'El nombre, dirección o teléfono ya existen o hay errores en el formulario.',
        fieldErrors,
        validFields
      });
    }

    await req.db.query(
      `UPDATE concesionarios
       SET nombre = ?, ciudad = ?, direccion = ?, telefono_contacto = ?
       WHERE id_concesionario = ?`,
      [ String(nombre).trim(), String(ciudad).trim(), String(direccion).trim(), telefonoTrim, id ]
    );

    res.redirect(`/concesionarios/${id}`);
  } catch (err) {
    console.error('Error actualizando concesionario:', err);
    if (err && err.code === 'ER_DUP_ENTRY' && formData && formData.nombre) formData.nombre = '';

    res.status(500).render('concesionarioForm', {
      title: 'Editar Concesionario',
      concesionario: { id_concesionario: id, ...formData },
      action: `/concesionarios/${id}/editar`,
      method: 'POST',
      error: err.message || 'No se pudo actualizar el concesionario',
      fieldErrors: {},
      validFields: []
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
      return res.status(400).render('concesionarios-lista', {
        title: 'Concesionarios',
        concesionarios,
        error: 'No se puede eliminar el concesionario porque tiene vehículos asociados.'
      });
    }

    await req.db.query('DELETE FROM concesionarios WHERE id_concesionario = ?', [id]);
    res.redirect('/concesionarios-lista');
  } catch (err) {
    console.error('Error al eliminar concesionario:', err);
    res.status(500).render('error', { mensaje: 'No se pudo eliminar el concesionario' });
  }
});

module.exports = router;
