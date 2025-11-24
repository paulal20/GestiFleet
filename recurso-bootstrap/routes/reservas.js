const express = require('express');
const router = express.Router();
const { isAuth, isAdmin, isAdminOrSelf } = require('../middleware/auth');

// Helper function (Callback style)
function getVehiculosDisponibles(db, usuario, callback) {
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

  db.query(sql, params, callback);
}

// GET /reserva/ (Formulario Nueva Reserva)
router.get('/', isAuth, (req, res) => {
  // Cargamos vehículos para el <select>
  getVehiculosDisponibles(req.db, req.session.usuario, (err, vehiculos) => {
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
      formData: {}, // El frontend se encarga de los datos si falla
      action: '/api/reservas', // Apunta a la API
      method: 'POST'
    });
  });
});

// GET /reserva/:id (Detalle de una reserva - SSR)
// Mantenemos SSR (Server Side Rendering) para el detalle por si se accede por enlace directo
router.get('/:id(\\d+)', isAdminOrSelf, (req, res, next) => {
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

      res.render('reservaDetalle', {
        title: `Detalle Reserva ${rows[0].id_reserva}`,
        usuarioSesion: req.session.usuario,
        reserva: rows[0]
      });
    }
  );
});

// GET /reserva/listareservas (Vista Admin)
router.get('/listareservas', isAdmin, (req, res) => {
  // Cargamos SOLO los datos para los filtros (Usuarios, Vehículos, Estados)
  // La lista principal se carga vacía [] para que AJAX la pida después.
  
  const queries = {
    usuarios: 'SELECT id_usuario, nombre, correo FROM usuarios ORDER BY nombre',
    vehiculos: 'SELECT id_vehiculo, marca, modelo, matricula FROM vehiculos ORDER BY marca, modelo',
    estados: 'SELECT DISTINCT estado FROM reservas ORDER BY estado'
  };

  req.db.query(queries.usuarios, (err1, usuarios) => {
    if (err1) usuarios = [];
    
    req.db.query(queries.vehiculos, (err2, vehiculos) => {
      if (err2) vehiculos = [];

      req.db.query(queries.estados, (err3, estadosRows) => {
        const estadosDisponibles = err3 ? [] : estadosRows.map(e => e.estado);

        res.render('listareservas', {
          title: 'Reservas',
          listaDeReservas: [], // VACÍA -> AJAX debe llenarla
          usuario: req.session.usuario,
          usuarioSesion: req.session.usuario,
          todosLosUsuarios: usuarios,
          todosVehiculos: vehiculos,
          estadosDisponibles: estadosDisponibles,
          // Mantenemos params por si el frontend lee esto para filtros iniciales
          idSeleccionado: 0,
          vehiculoSeleccionado: 0,
          estadoSeleccionado: '',
          fechaDesdeSeleccionada: '',
          fechaHastaSeleccionada: ''
        });
      });
    });
  });
});

// GET /reserva/mis-reservas (Vista Usuario)
router.get('/mis-reservas', isAuth, (req, res) => {
  const usuarioActual = req.session.usuario;
  
  // Cargar datos para filtros
  getVehiculosDisponibles(req.db, usuarioActual, (err, vehiculos) => {
    if (err) vehiculos = [];

    req.db.query('SELECT DISTINCT estado FROM reservas WHERE id_usuario = ?', [usuarioActual.id_usuario], (err2, estadosRows) => {
      const estadosDisponibles = err2 ? [] : estadosRows.map(e => e.estado);

      res.render('listareservas', {
        title: 'Mis Reservas',
        listaDeReservas: [], // VACÍA -> AJAX debe llenarla
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
});

module.exports = router;