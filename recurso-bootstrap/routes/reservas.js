const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/auth');

// Fubnción auxiliar para tener los vehículos disponibles en una fecha dada
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

// GET /reserva/ --> formulario nueva reserva
router.get('/', isAuth, (req, res) => {
  let fechaObj = req.query.fecha ? new Date(req.query.fecha) : new Date();
  if (isNaN(fechaObj.getTime())) fechaObj = new Date();

  const tzOffset = fechaObj.getTimezoneOffset() * 60000; 
  const localISOTime = (new Date(fechaObj - tzOffset)).toISOString().slice(0, 16);

  getVehiculosDisponibles(req.db, req.session.usuario, localISOTime, (err, vehiculos) => {
    if (err) vehiculos = [];

    const idVehiculoSeleccionado = req.query.idVehiculo
      ? parseInt(req.query.idVehiculo, 10)
      : null;

    res.render('reservaForm', {
      title: 'Reserva tu coche!',
      vehiculos,
      idVehiculoSeleccionado,
      usuarioSesion: req.session.usuario,
      fechaDefecto: localISOTime, 
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

// GET /reserva/listareservas (admin)
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

// GET /reserva/mis-reservas 
router.get('/mis-reservas', isAuth, (req, res) => {
  const usuarioActual = req.session.usuario;
  
  const sqlTodosVehiculos = "SELECT id_vehiculo, marca, modelo, matricula FROM vehiculos WHERE activo = 1";
  
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