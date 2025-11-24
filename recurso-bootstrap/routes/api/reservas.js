const express = require('express');
const router = express.Router();
const { isAuth, isAdmin, isAdminOrSelf } = require('../../middleware/auth');

// POST /api/reservas (Crear Reserva)
router.post('/', isAuth, (req, res) => {
  const usuarioActual = req.session.usuario;
  const { vehiculo, fechaInicio, fechaFin } = req.body;
  const idVehiculo = parseInt(vehiculo, 10);

  // 1. Validaciones de Fecha
  const ahora = new Date();
  const fechaI = new Date(fechaInicio);
  const fechaF = new Date(fechaFin);
  let errorFecha = null;

  if (!fechaInicio || !fechaFin) errorFecha = 'Las fechas son obligatorias.';
  else if (isNaN(fechaI.getTime()) || isNaN(fechaF.getTime())) errorFecha = 'Formato de fecha inválido.';
  else if (fechaI <= ahora) errorFecha = 'La fecha de inicio debe ser futura.';
  else if (fechaF <= fechaI) errorFecha = 'La fecha fin debe ser posterior a la de inicio.';

  if (errorFecha) {
    return res.status(400).json({ ok: false, error: errorFecha });
  }

  // 2. Comprobación de Conflictos (Query)
  const sqlConflictos = `
      SELECT COUNT(*) AS conflicts
      FROM reservas
      WHERE id_vehiculo = ?
        AND estado = 'activa'
        AND (fecha_inicio < ?) 
        AND (fecha_fin > ?)
    `;

  req.db.query(sqlConflictos, [idVehiculo, fechaFin, fechaInicio], (err, rows) => {
    if (err) {
      console.error("Error comprobando conflictos:", err);
      return res.status(500).json({ ok: false, error: 'Error interno al verificar disponibilidad' });
    }

    if (rows[0].conflicts > 0) {
      return res.status(409).json({ 
        ok: false, 
        error: 'El vehículo no está disponible en esas fechas.' 
      });
    }

    // 3. Insertar Reserva
    const sqlInsert = `
      INSERT INTO reservas (id_usuario, id_vehiculo, fecha_inicio, fecha_fin, estado) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    req.db.query(sqlInsert, [usuarioActual.id_usuario, idVehiculo, fechaInicio, fechaFin, 'activa'], (errInsert, result) => {
      if (errInsert) {
        console.error("Error insertando reserva:", errInsert);
        return res.status(500).json({ ok: false, error: 'Error al guardar la reserva' });
      }

      const redirectUrl = usuarioActual.rol === 'Admin' ? '/reserva/listareservas' : '/reserva/mis-reservas';
      res.json({ ok: true, id: result.insertId, redirectUrl });
    });
  });
});

// PUT /api/reservas/:id/cancelar (Cancelar)
// Nota: Cambiado a PUT para ser RESTful. Si tu frontend usa form action normal, avísame.
router.put('/:id(\\d+)/cancelar', isAuth, (req, res) => {
  const idReserva = parseInt(req.params.id, 10);
  const usuarioActual = req.session.usuario;

  // 1. Obtener la reserva para verificar permisos
  req.db.query('SELECT id_usuario, estado FROM reservas WHERE id_reserva = ?', [idReserva], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    
    if (rows.length === 0) return res.status(404).json({ ok: false, error: 'Reserva no encontrada' });
    
    const reserva = rows[0];

    // Verificar propiedad
    if (reserva.id_usuario !== usuarioActual.id_usuario && usuarioActual.rol !== 'Admin') {
      return res.status(403).json({ ok: false, error: 'No autorizado' });
    }

    if (reserva.estado !== 'activa') {
      return res.status(400).json({ ok: false, error: 'La reserva no está activa' });
    }

    // 2. Actualizar estado
    req.db.query("UPDATE reservas SET estado = 'cancelada' WHERE id_reserva = ?", [idReserva], (errUpdate) => {
      if (errUpdate) return res.status(500).json({ ok: false, error: errUpdate.message });
      
      res.json({ ok: true });
    });
  });
});

// GET /api/reservas/listareservas (Admin - JSON List)
router.get('/listareservas', isAdmin, (req, res) => {
   const { id, vehiculo, estado, fecha_desde, fecha_hasta } = req.query;

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

    if (idFiltrado > 0) { condiciones.push('r.id_usuario = ?'); params.push(idFiltrado); }
    if (vehiculoFiltrado > 0) { condiciones.push('r.id_vehiculo = ?'); params.push(vehiculoFiltrado); }
    if (estado) { condiciones.push('r.estado = ?'); params.push(estado); }
    if (fecha_desde) { condiciones.push('r.fecha_inicio >= ?'); params.push(fecha_desde); }
    if (fecha_hasta) { condiciones.push('r.fecha_fin <= ?'); params.push(fecha_hasta); }

    if (condiciones.length > 0) query += ' WHERE ' + condiciones.join(' AND ');
    
    query += ' ORDER BY r.fecha_inicio DESC';

    req.db.query(query, params, (err, reservas) => {
      if (err) {
        console.error("Error API listareservas:", err);
        return res.status(500).json({ ok: false, error: 'Error cargando datos' });
      }
      res.json({ ok: true, reservas });
    });
});

// GET /api/reservas/mis-reservas (Usuario - JSON List)
router.get('/mis-reservas', isAuth, (req, res) => {
   const usuarioActual = req.session.usuario;
   const { vehiculo, estado, fecha_desde, fecha_hasta } = req.query;
   const vehiculoFiltrado = vehiculo ? parseInt(vehiculo, 10) : 0;

   let query = `
      SELECT r.id_reserva, r.fecha_inicio, r.fecha_fin, r.estado,
          u.nombre AS nombre_usuario, u.correo AS email_usuario,
          v.marca, v.modelo, v.matricula
        FROM reservas r
        JOIN usuarios u ON r.id_usuario = u.id_usuario
        JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
    `;
    
    const condiciones = ['r.id_usuario = ?'];
    const params = [usuarioActual.id_usuario];

    if (vehiculoFiltrado > 0) { condiciones.push('r.id_vehiculo = ?'); params.push(vehiculoFiltrado); }
    if (estado) { condiciones.push('r.estado = ?'); params.push(estado); }
    if (fecha_desde) { condiciones.push('r.fecha_inicio >= ?'); params.push(fecha_desde); }
    if (fecha_hasta) { condiciones.push('r.fecha_fin <= ?'); params.push(fecha_hasta); }

    query += ' WHERE ' + condiciones.join(' AND ');
    query += ' ORDER BY r.fecha_inicio DESC';

    req.db.query(query, params, (err, reservas) => {
      if (err) {
        console.error("Error API mis-reservas:", err);
        return res.status(500).json({ ok: false, error: 'Error cargando datos' });
      }
      res.json({ ok: true, reservas });
    });
});

module.exports = router;