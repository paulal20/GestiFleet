const express = require('express');
const router = express.Router();

const { isAuth, isAdmin } = require('../middleware/auth');

// Página principal de reservas (formulario para crear)
router.get('/', isAuth, async (req, res) => {
  try {
    const [vehiculos] = await req.db.query('SELECT * FROM vehiculos');
    const idVehiculoSeleccionado = req.query.idVehiculo
      ? parseInt(req.query.idVehiculo, 10)
      : null;

    res.render('reservas', {
      title: 'Reserva',
      vehiculos,
      idVehiculoSeleccionado
    });
  } catch (err) {
    console.error('Error al cargar la página de reservas:', err);
    res.render('reservas', {
      title: 'Reserva',
      vehiculos: [],
      idVehiculoSeleccionado: null,
      error: 'Error cargando vehículos'
    });
  }
});

// Crear una reserva
router.post('/', isAuth, async (req, res) => {
  const usuarioActual = req.session.usuario;
  const { vehiculo, fechaInicio, fechaFin } = req.body;

  try {
    // Inserta la reserva
    await req.db.query(
      `INSERT INTO reservas 
        (id_usuario, id_vehiculo, fecha_inicio, fecha_fin, estado) 
        VALUES (?, ?, ?, ?, ?)`,
      [usuarioActual.id_usuario, parseInt(vehiculo, 10), fechaInicio, fechaFin, 'activa']
    );

    // Redirige según rol
    if (usuarioActual.rol === 'Admin') {
      return res.redirect('/reserva/listareservas');
    } else {
      return res.redirect('/reserva/mis-reservas');
    }
  } catch (err) {
    console.error('Error al procesar la reserva:', err);
    res.render('reservas', {
      title: 'Reserva',
      vehiculos: [],
      idVehiculoSeleccionado: vehiculo,
      error: 'No se pudo crear la reserva'
    });
  }
});

// Lista completa de reservas (solo admin)
router.get('/listareservas', isAdmin, async (req, res) => {
  try {
    const idFiltrado = req.query.id ? parseInt(req.query.id, 10) : 0;

    let query = `
      SELECT r.id_reserva, r.fecha_inicio, r.fecha_fin, r.estado,
        u.nombre AS nombre_usuario, u.correo AS email_usuario,
        v.marca, v.modelo, v.matricula
      FROM reservas r
      JOIN usuarios u ON r.id_usuario = u.id_usuario
      JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
    `;
    const params = [];

    if (idFiltrado > 0) {
      query += ' WHERE r.id_usuario = ?';
      params.push(idFiltrado);
    }

    const [reservas] = await req.db.query(query, params);
    const [usuarios] = await req.db.query(
      'SELECT id_usuario, nombre, correo FROM usuarios'
    );

    res.render('listareservas', {
      title: 'Lista de Reservas',
      listaDeReservas: reservas,
      todosLosUsuarios: usuarios,
      idSeleccionado: idFiltrado
    });
  } catch (err) {
    console.error('Error al cargar la lista de reservas:', err);
    res.render('listareservas', {
      title: 'Lista de Reservas',
      listaDeReservas: [],
      todosLosUsuarios: [],
      idSeleccionado: 0,
      error: 'No se pudieron cargar las reservas'
    });
  }
});

// Reservas del usuario logueado
router.get('/mis-reservas', isAuth, async (req, res) => {
  try {
    const usuarioActual = req.session.usuario;

    const [reservasDelUsuario] = await req.db.query(
      `SELECT r.id_reserva, r.fecha_inicio, r.fecha_fin, r.estado,
          u.nombre AS nombre_usuario, u.correo AS email_usuario,
          v.marca, v.modelo, v.matricula
       FROM reservas r
       JOIN usuarios u ON r.id_usuario = u.id_usuario
       JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
       WHERE r.id_usuario = ?`,
      [usuarioActual.id_usuario]
    );

    res.render('listareservas', {
      title: 'Mis Reservas',
      listaDeReservas: reservasDelUsuario,
      todosLosUsuarios: [],
      idSeleccionado: 0
    });
  } catch (err) {
    console.error('Error al cargar mis reservas:', err);
    res.render('listareservas', {
      title: 'Mis Reservas',
      listaDeReservas: [],
      todosLosUsuarios: [],
      idSeleccionado: 0,
      error: 'No se pudieron cargar tus reservas'
    });
  }
});

module.exports = router;
