const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/auth');

function getVehiculosDisponibles(db, usuario, fechaInicio, callback) {
  const momento = fechaInicio ? new Date(fechaInicio) : new Date();

  if (isNaN(momento.getTime())) {
      momento = new Date(); 
  }

  let sql = `
      SELECT v.id_vehiculo, v.marca, v.modelo, v.matricula 
      FROM vehiculos v
      WHERE v.activo = 1
      AND NOT EXISTS (
          SELECT 1 FROM reservas r 
          WHERE r.id_vehiculo = v.id_vehiculo 
          AND r.estado = 'activa'
          -- El vehículo NO está disponible si existe una reserva activa
          -- que envuelva el momento de inicio deseado
          AND r.fecha_inicio <= ? 
          AND r.fecha_fin >= ?
      )
    `;
  
  const params = [momento, momento];
  
  if (!usuario || usuario.rol !== 'Admin') {
    sql += ' AND v.id_concesionario = ? ';
    params.push(usuario.id_concesionario);
  }

  sql += ' ORDER BY v.marca, v.modelo';

  db.query(sql, params, callback);
}

// GET /reserva/ (Formulario Nueva Reserva)
router.get('/', isAuth, (req, res) => {
  // Recogemos la fecha de la URL (si viene del filtro)
  const fechaUrl = req.query.fecha;

  // Cargamos vehículos disponibles PARA ESA FECHA
  getVehiculosDisponibles(req.db, req.session.usuario, fechaUrl, (err, vehiculos) => {
    if (err) {
      console.error('Error al obtener vehículos vista:', err);
      vehiculos = [];
    }

    const idVehiculoSeleccionado = req.query.idVehiculo
      ? parseInt(req.query.idVehiculo, 10)
      : null;

    res.render('reservaForm', {
      title: 'Reserva tu coche!',
      vehiculos,
      idVehiculoSeleccionado,
      usuarioSesion: req.session.usuario,
      formData: {}, 
      action: '/api/reservas', 
      method: 'POST'
    });
  });
});

// GET /reserva/:id 
router.get('/:id(\\d+)', isAuth, (req, res, next) => {
  const idReserva = parseInt(req.params.id, 10);

  req.db.query(
    `SELECT r.*,
            u.nombre AS nombre_usuario, u.correo AS email_usuario,
            v.marca, v.modelo, v.matricula,
            (v.imagen IS NOT NULL AND LENGTH(v.imagen) > 0) AS tiene_imagen
     FROM reservas r
     JOIN usuarios u ON r.id_usuario = u.id_usuario
     JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
     WHERE r.id_reserva = ?`,
    [idReserva],
    (err, rows) => {
      if (err) {
        console.error('Error al obtener detalle de reserva:', err);
        return res.status(500).render('error', { mensaje: 'Error al cargar el detalle' });
      }

      if (!rows || rows.length === 0) {
        const error = new Error('Reserva no encontrada');
        error.status = 404;
        return next(error);
      }

      const reservaEncontrada = rows[0];

      if (req.session.usuario.rol !== 'Admin' && reservaEncontrada.id_usuario !== req.session.usuario.id_usuario) {
          const error = new Error('Acceso denegado. No puedes ver reservas de otros usuarios.');
          error.status = 403;
          return next(error);
      }

      res.render('reservaDetalle', {
        title: `Detalle Reserva ${reservaEncontrada.id_reserva}`,
        usuarioSesion: req.session.usuario,
        reserva: reservaEncontrada
      });
    }
  );
});

// GET /reserva/listareservas (Vista Admin)
router.get('/listareservas', isAdmin, (req, res) => {
  
  const queries = {
    usuarios: 'SELECT id_usuario, nombre, correo FROM usuarios ORDER BY nombre',
    vehiculos: 'SELECT id_vehiculo, marca, modelo, matricula FROM vehiculos ORDER BY marca, modelo'
  };

  req.db.query(queries.usuarios, (err1, usuarios) => {
    if (err1) usuarios = [];
    
    req.db.query(queries.vehiculos, (err2, vehiculos) => {
      if (err2) vehiculos = [];

      const estadosDisponibles = ['activa', 'finalizada', 'cancelada'];

      res.render('listareservas', {
        title: 'Reservas',
        listaDeReservas: [], 
        usuario: req.session.usuario,
        usuarioSesion: req.session.usuario,
        todosLosUsuarios: usuarios,
        todosVehiculos: vehiculos,
        estadosDisponibles: estadosDisponibles, 
        idSeleccionado: 0,
        vehiculoSeleccionado: 0,
        estadoSeleccionado: '',
        fechaDesdeSeleccionada: '',
        fechaHastaSeleccionada: ''
      });
    });
  });
});

// GET /reserva/mis-reservas (Vista Usuario)
router.get('/mis-reservas', isAuth, (req, res) => {
  const usuarioActual = req.session.usuario;
  
  // Aquí usamos 'null' o 'new Date()' como fecha para mostrar los disponibles AHORA por defecto para filtrar visualmente si hiciera falta
  // Aunque en esta vista 'listareservas' realmente 'todosVehiculos' se usa para los filtros, así que mostramos todos.
  // Para filtros de listado, no necesitamos filtrar por disponibilidad, así que usamos una query simple.
  
  const sqlTodosVehiculos = "SELECT id_vehiculo, marca, modelo, matricula FROM vehiculos WHERE activo = 1"; // Simplificado para filtros
  
  req.db.query(sqlTodosVehiculos, (err, vehiculos) => {
    if (err) vehiculos = [];

    const estadosDisponibles = ['activa', 'finalizada', 'cancelada'];

    res.render('listareservas', {
      title: 'Mis Reservas',
      listaDeReservas: [], 
      usuario: usuarioActual,
      usuarioSesion: req.session.usuario,
      todosLosUsuarios: [], 
      todosVehiculos: vehiculos, 
      estadosDisponibles: estadosDisponibles,
      idSeleccionado: usuarioActual.id_usuario,
      vehiculoSeleccionado: 0,
      estadoSeleccionado: '',
      fechaDesdeSeleccionada: '',
      fechaHastaSeleccionada: ''
    });
  });
});

module.exports = router;