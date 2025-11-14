const express = require('express');
const router = express.Router();

const { isAuth, isAdmin } = require('../middleware/auth');

async function getVehiculosDisponibles(db, usuario) {
  try {
    let sql = `
      SELECT id_vehiculo, marca, modelo, matricula 
      FROM vehiculos
      WHERE estado = 'disponible'
    `;
    
    const params = [];
    if (!usuario || usuario.rol !== 'Admin') {
      sql += ' AND id_concesionario = ? ';
      params.push(usuario.id_concesionario);
    }

    sql += ' ORDER BY marca, modelo';

    const [vehiculos] = await db.query(sql, params);
    return vehiculos;

  } catch (err) {
    console.error('Error al obtener vehículos disponibles:', err);
    return [];
  }
}


// Get Reserva
router.get('/', isAuth, async (req, res) => {
  try {
    const vehiculos = await getVehiculosDisponibles(req.db, req.session.usuario);
    const idVehiculoSeleccionado = req.query.idVehiculo
      ? parseInt(req.query.idVehiculo, 10)
      : null;

    res.render('reservaForm', {
      title: 'Reserva tu coche!',
      vehiculos,
      idVehiculoSeleccionado,
      formData: req.body || {}
    });
  } catch (err) {
    console.error('Error al cargar la página de reservas:', err);
    res.status(500).render('error', { mensaje: 'Error cargando la página de reservas' });
  }
});

// Post Reserva
router.post('/', isAuth, async (req, res) => {
  const usuarioActual = req.session.usuario;
  const { vehiculo, fechaInicio, fechaFin } = req.body;
  const idVehiculo = parseInt(vehiculo, 10);

  try {
    const ahora = new Date();
    const fechaI = new Date(fechaInicio);
    const fechaF = new Date(fechaFin);
    let errorFecha = null;

    if (!fechaInicio || !fechaFin) {
      errorFecha = 'Las fechas de inicio y fin son obligatorias.';
    } else if (isNaN(fechaI.getTime()) || isNaN(fechaF.getTime())) {
      errorFecha = 'El formato de las fechas no es válido.';
    } else if (fechaI <= ahora) {
      errorFecha = 'La fecha de inicio debe ser posterior al momento actual.';
    } else if (fechaF <= fechaI) {
      errorFecha = 'La fecha de fin debe ser posterior a la fecha de inicio.';
    }

    if (errorFecha) {
      const vehiculos = await getVehiculosDisponibles(req.db);
      return res.status(400).render('reservas', {
        title: 'Reserva tu coche!',
        vehiculos,
        idVehiculoSeleccionado: idVehiculo,
        error: errorFecha
      });
    }

    const [conflictos] = await req.db.query(
      `SELECT COUNT(*) AS conflicts
       FROM reservas
       WHERE id_vehiculo = ?
         AND estado = 'activa'
         AND (fecha_inicio < ?) -- existing_start < new_end
         AND (fecha_fin > ?)    -- existing_end > new_start
      `,
      [idVehiculo, fechaFin, fechaInicio]
    );

    if (conflictos[0].conflicts > 0) {
      const vehiculos = await getVehiculosDisponibles(req.db);
      return res.status(409).render('reservas', {
        title: 'Reserva tu coche!',
        vehiculos,
        idVehiculoSeleccionado: idVehiculo,
        error: 'El vehículo no está disponible en las fechas seleccionadas. Ya existe otra reserva.'
      });
    }

    await req.db.query(
      `INSERT INTO reservas 
         (id_usuario, id_vehiculo, fecha_inicio, fecha_fin, estado) 
         VALUES (?, ?, ?, ?, ?)`,
      [usuarioActual.id_usuario, idVehiculo, fechaInicio, fechaFin, 'activa']
    );

    if (usuarioActual.rol === 'Admin') {
      return res.redirect('/reserva/listareservas');
    } else {
      return res.redirect('/reserva/mis-reservas');
    }
  } catch (err) {
    console.error('Error al procesar la reserva:', err);
    const vehiculos = await getVehiculosDisponibles(req.db);
    res.status(500).render('reservas', {
      title: 'Reserva tu coche!',
      vehiculos,
      idVehiculoSeleccionado: idVehiculo,
      formData: req.body,
      error: 'No se pudo crear la reserva debido a un error del servidor.'
    });
  }
});

// Detalle de una reserva
router.get('/:id(\\d+)', isAuth, async (req, res, next) => {
  try {
    const idReserva = parseInt(req.params.id, 10);
    const usuarioActual = req.session.usuario;

    const [rows] = await req.db.query(
      `SELECT r.*,
              u.nombre AS nombre_usuario, u.correo AS email_usuario,
              v.marca, v.modelo, v.matricula, v.imagen
       FROM reservas r
       JOIN usuarios u ON r.id_usuario = u.id_usuario
       JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
       WHERE r.id_reserva = ?`,
      [idReserva]
    );

    if (rows.length === 0) {
      const err = new Error('Reserva no encontrada');
      err.status = 404;
      return next(err);
    }

    const reserva = rows[0];

    if (reserva.id_usuario !== usuarioActual.id_usuario && usuarioActual.rol !== 'Admin') {
      const err = new Error('Acceso no autorizado');
      err.status = 403;
      return next(err);
    }

    res.render('reservaDetalle', {
      title: `Detalle Reserva ${reserva.id_reserva}`,
      reserva
    });

  } catch (err) {
    console.error('Error al obtener detalle de reserva:', err);
    res.status(500).render('error', { mensaje: 'Error al cargar el detalle de la reserva' });
  }
});

// Cancelar reserva
router.post('/:id(\\d+)/cancelar', isAuth, async (req, res, next) => {
  try {
    const idReserva = parseInt(req.params.id, 10);
    const usuarioActual = req.session.usuario;

    const [rows] = await req.db.query(
      'SELECT id_usuario, estado FROM reservas WHERE id_reserva = ?',
      [idReserva]
    );

    if (rows.length === 0) {
      const err = new Error('Reserva no encontrada');
      err.status = 404;
      return next(err);
    }

    const reserva = rows[0];

    if (reserva.id_usuario !== usuarioActual.id_usuario && usuarioActual.rol !== 'Admin') {
      const err = new Error('Acceso no autorizado para cancelar esta reserva');
      err.status = 403;
      return next(err);
    }

    if (reserva.estado !== 'activa') {
      // Redirigimos con un mensaje (usar flash messages sería ideal) 
      console.warn(`Intento de cancelar reserva no activa (id: ${idReserva})`);
      return res.redirect('back');
    }

    await req.db.query(
      "UPDATE reservas SET estado = 'cancelada' WHERE id_reserva = ?",
      [idReserva]
    );

    if (usuarioActual.rol === 'Admin') {
      res.redirect('/reserva/listareservas');
    } else {
      res.redirect('/reserva/mis-reservas');
    }

  } catch (err) {
    console.error('Error al cancelar la reserva:', err);
    res.status(500).render('error', { mensaje: 'Error al procesar la cancelación' });
  }
});


router.get('/listareservas', isAdmin, async (req, res) => {
  try {
    const {
      id,
      vehiculo,
      estado,
      fecha_desde,
      fecha_hasta
    } = req.query;

    const idFiltrado = id ? parseInt(id, 10) : 0;
    const vehiculoFiltrado = vehiculo ? parseInt(vehiculo, 10) : 0;

    let query = `
      SELECT r.id_reserva, r.fecha_inicio, r.fecha_fin, r.estado,
        u.nombre AS nombre_usuario, u.correo AS email_usuario,
        v.marca, v.modelo, v.matricula
      FROM reservas r
      JOIN usuarios u ON r.id_usuario = u.id_usuario
      JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
    `;
    const params = [];
    const condiciones = [];

    if (idFiltrado > 0) {
      condiciones.push('r.id_usuario = ?');
      params.push(idFiltrado);
    }
    if (vehiculoFiltrado > 0) {
      condiciones.push('r.id_vehiculo = ?');
      params.push(vehiculoFiltrado);
    }
    if (estado) {
      condiciones.push('r.estado = ?');
      params.push(estado);
    }
    if (fecha_desde) {
      condiciones.push('r.fecha_inicio >= ?');
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      condiciones.push('r.fecha_fin <= ?');
      params.push(fecha_hasta);
    }

    if (condiciones.length > 0) {
      query += ' WHERE ' + condiciones.join(' AND ');
    }

    query += ' ORDER BY r.fecha_inicio DESC';

    const [reservas] = await req.db.query(query, params);

    const [usuarios] = await req.db.query(
      'SELECT id_usuario, nombre, correo FROM usuarios ORDER BY nombre'
    );
    const [vehiculos] = await req.db.query(
      'SELECT id_vehiculo, marca, modelo, matricula FROM vehiculos ORDER BY marca, modelo'
    );
    const [estados] = await req.db.query(
      'SELECT DISTINCT estado FROM reservas ORDER BY estado'
    );
    const estadosDisponibles = estados.map(e => e.estado);

    res.render('listareservas', {
      title: 'Reservas',
      listaDeReservas: reservas,
      usuario: req.session.usuario,
      todosLosUsuarios: usuarios,
      todosVehiculos: vehiculos,
      estadosDisponibles: estadosDisponibles,
      idSeleccionado: idFiltrado,
      vehiculoSeleccionado: vehiculoFiltrado,
      estadoSeleccionado: estado || '',
      fechaDesdeSeleccionada: fecha_desde || '',
      fechaHastaSeleccionada: fecha_hasta || ''
    });

  } catch (err) {
    console.error('Error al cargar la lista de reservas:', err);
    res.status(500).render('listareservas', {
      title: 'Reservas',
      listaDeReservas: [],
      usuario: req.session.usuario,
      todosLosUsuarios: [],
      todosVehiculos: [],
      estadosDisponibles: [],
      idSeleccionado: 0,
      vehiculoSeleccionado: 0,
      estadoSeleccionado: '',
      fechaDesdeSeleccionada: '',
      fechaHastaSeleccionada: '',
      error: 'No se pudieron cargar las reservas'
    });
  }
});

router.get('/mis-reservas', isAuth, async (req, res) => {
  try {
    const usuarioActual = req.session.usuario;

    const {
      vehiculo,
      estado,
      fecha_desde,
      fecha_hasta
    } = req.query;

    const vehiculoFiltrado = vehiculo ? parseInt(vehiculo, 10) : 0;

    let query = `
      SELECT r.id_reserva, r.fecha_inicio, r.fecha_fin, r.estado,
         u.nombre AS nombre_usuario, u.correo AS email_usuario,
         v.marca, v.modelo, v.matricula
       FROM reservas r
       JOIN usuarios u ON r.id_usuario = u.id_usuario
       JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
    `;
    
    const condiciones = [];
    const params = [];

    condiciones.push('r.id_usuario = ?');
    params.push(usuarioActual.id_usuario);

    if (vehiculoFiltrado > 0) {
      condiciones.push('r.id_vehiculo = ?');
      params.push(vehiculoFiltrado);
    }
    if (estado) {
      condiciones.push('r.estado = ?');
      params.push(estado);
    }
    if (fecha_desde) {
      condiciones.push('r.fecha_inicio >= ?');
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      condiciones.push('r.fecha_fin <= ?');
      params.push(fecha_hasta);
    }

    query += ' WHERE ' + condiciones.join(' AND ');
    query += ' ORDER BY r.fecha_inicio DESC';

    const [reservasDelUsuario] = await req.db.query(query, params);

    const [vehiculos, estados] = await Promise.all([
        getVehiculosDisponibles(req.db, usuarioActual),
        req.db.query('SELECT DISTINCT estado FROM reservas WHERE id_usuario = ?', [usuarioActual.id_usuario])
    ]);
    
    const estadosDisponibles = estados[0].map(e => e.estado);
    
    res.render('listareservas', {
      title: 'Mis Reservas',
      listaDeReservas: reservasDelUsuario,
      usuario: usuarioActual,

      todosLosUsuarios: [], 
      todosVehiculos: vehiculos, 
      estadosDisponibles: estadosDisponibles, 
      
      idSeleccionado: usuarioActual.id_usuario,
      vehiculoSeleccionado: vehiculoFiltrado,
      estadoSeleccionado: estado || '',
      fechaDesdeSeleccionada: fecha_desde || '',
      fechaHastaSeleccionada: fecha_hasta || ''
    });

  } catch (err) {
    console.error('Error al cargar mis reservas:', err);
    res.status(500).render('listareservas', {
      title: 'Mis Reservas',
      listaDeReservas: [],
      usuario: req.session.usuario,
      error: 'No se pudieron cargar tus reservas',
      todosLosUsuarios: [],
      todosVehiculos: [],
      estadosDisponibles: [],
      idSeleccionado: 0,
      vehiculoSeleccionado: 0,
      estadoSeleccionado: '',
      fechaDesdeSeleccionada: '',
      fechaHastaSeleccionada: ''
    });
  }
});

module.exports = router;