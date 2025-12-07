const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../../middleware/auth');

// GET /api/reservas/disponibles?fecha=YYYY-MM-DDTHH:mm
router.get('/disponibles', isAuth, (req, res) => {
  const { fecha } = req.query;
  const momento = fecha ? new Date(fecha) : new Date();

  if (isNaN(momento.getTime())) {
    return res.status(400).json({ ok: false, error: 'Fecha inválida' });
  }

  let sql = `
      SELECT v.id_vehiculo, v.marca, v.modelo, v.matricula 
      FROM vehiculos v
      WHERE v.activo = 1
      AND NOT EXISTS (
          SELECT 1 FROM reservas r 
          WHERE r.id_vehiculo = v.id_vehiculo 
          AND r.estado = 'activa'
          -- El vehículo NO está disponible si hay una reserva activa en ese momento exacto
          AND r.fecha_inicio <= ? 
          AND r.fecha_fin >= ?
      )
    `;
  
  const params = [momento, momento];
  
  // Filtro por concesionario si no es Admin
  if (req.session.usuario.rol !== 'Admin') {
    sql += ' AND v.id_concesionario = ? ';
    params.push(req.session.usuario.id_concesionario);
  }

  sql += ' ORDER BY v.marca, v.modelo';

  req.db.query(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ ok: false, error: 'Error al buscar vehículos' });
    }
    res.json({ ok: true, vehiculos: rows });
  });
});

// POST /api/reservas
router.post('/', isAuth, (req, res) => {
  const usuarioActual = req.session.usuario;
  const { vehiculo, fechaInicio, fechaFin } = req.body;
  const idVehiculo = parseInt(vehiculo, 10);

  const fechaI = new Date(fechaInicio);
  const fechaF = new Date(fechaFin);
  
  const ahoraConMargen = new Date(Date.now() - 5 * 60000); 

  let errorFecha = null;
  if (!fechaInicio || !fechaFin) errorFecha = 'Las fechas son obligatorias.';
  else if (isNaN(fechaI.getTime()) || isNaN(fechaF.getTime())) errorFecha = 'Formato de fecha inválido.';
  else if (fechaI < ahoraConMargen) errorFecha = 'La fecha de inicio debe ser futura o actual.';
  else if (fechaF <= fechaI) errorFecha = 'La fecha fin debe ser posterior a la de inicio.';

  if (errorFecha) return res.status(400).json({ ok: false, error: errorFecha });

  const sqlConflictosVehiculo = `
      SELECT COUNT(*) AS conflicts
      FROM reservas
      WHERE id_vehiculo = ?
        AND estado = 'activa'
        AND fecha_inicio < ?
        AND fecha_fin > ?
  `;

  req.db.query(sqlConflictosVehiculo, [idVehiculo, fechaFin, fechaInicio], (err, rows) => {
    if (err) {
      console.error("Error comprobando conflictos vehículo:", err);
      return res.status(500).json({ ok: false, error: 'Error interno al verificar disponibilidad' });
    }

    if (rows[0].conflicts > 0) {
      return res.status(409).json({ 
        ok: false, 
        error: 'El vehículo no está disponible en esas fechas (coincide con otra reserva).' 
      });
    }

    const sqlConflictosUsuario = `
        SELECT COUNT(*) AS conflicts
        FROM reservas
        WHERE id_usuario = ?
          AND estado = 'activa'
          AND fecha_inicio < ?
          AND fecha_fin > ?
    `;

    req.db.query(sqlConflictosUsuario, [usuarioActual.id_usuario, fechaFin, fechaInicio], (err2, rows2) => {
      if (err2) {
        console.error("Error comprobando conflictos usuario:", err2);
        return res.status(500).json({ ok: false, error: 'Error interno al verificar tus reservas' });
      }

      if (rows2[0].conflicts > 0) {
        return res.status(409).json({
          ok: false,
          error: 'Ya tienes otra reserva activa que coincide con esas fechas.'
        });
      }

      const sqlInsert = `
        INSERT INTO reservas (id_usuario, id_vehiculo, fecha_inicio, fecha_fin, estado, activo) 
        VALUES (?, ?, ?, ?, ?, true)
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
});


// PUT /api/reservas/:id/cancelar
router.put('/:id(\\d+)/cancelar', isAuth, (req, res) => {
  const idReserva = parseInt(req.params.id, 10);
  const usuarioActual = req.session.usuario;

  req.db.query('SELECT id_usuario, estado FROM reservas WHERE id_reserva = ?', [idReserva], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    
    if (rows.length === 0) return res.status(404).json({ ok: false, error: 'Reserva no encontrada' });
    
    const reserva = rows[0];

    if (reserva.id_usuario !== usuarioActual.id_usuario && usuarioActual.rol !== 'Admin') {
      return res.status(403).json({ ok: false, error: 'No autorizado' });
    }

    if (reserva.estado !== 'activa') {
      return res.status(400).json({ ok: false, error: 'La reserva no está activa' });
    }

    req.db.query("UPDATE reservas SET estado = 'cancelada' WHERE id_reserva = ?", [idReserva], (errUpdate) => {
      if (errUpdate) return res.status(500).json({ ok: false, error: errUpdate.message });
      
      res.json({ ok: true });
    });
  });
});

function pad(n) { return n < 10 ? '0' + n : n; }
function ahoraLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}
// Función para actualizar estados de reservas (activa -> finalizada)
function actualizarEstados(db, callback) {
  const ahora = ahoraLocal(); // YYYY-MM-DD HH:MM en hora local

  const sql = `
    UPDATE reservas
    SET estado = 'finalizada'
    WHERE estado = 'activa'
      AND fecha_fin < ?
  `;

  db.query(sql, [ahora], (err, result) => {
    if (err) {
      console.error("Error actualizando estados:", err);
      return callback(err);
    }
    callback(null);
  });
}


// GET /api/reservas/listareservas
router.get('/listareservas', isAdmin, (req, res) => {

  actualizarEstados(req.db, (err) => {
    if (err) return res.json({ ok: false, error: 'Error actualizando estados' });

    const { id, vehiculo, estado, fecha_desde, fecha_hasta } = req.query;

    let query = `
      SELECT r.id_reserva, r.fecha_inicio, r.fecha_fin, r.estado,
        u.nombre AS nombre_usuario, u.correo AS email_usuario,
        v.marca, v.modelo, v.matricula
      FROM reservas r
      JOIN usuarios u ON r.id_usuario = u.id_usuario
      JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
    `;

    const filtros = [];
    const params = [];

    if (id) { filtros.push("r.id_usuario = ?"); params.push(parseInt(id)); }
    if (vehiculo) { filtros.push("r.id_vehiculo = ?"); params.push(parseInt(vehiculo)); }
    if (estado) { filtros.push("r.estado = ?"); params.push(estado); }
    if (fecha_desde) { filtros.push("r.fecha_inicio >= ?"); params.push(fecha_desde); }
    if (fecha_hasta) { filtros.push("r.fecha_fin <= ?"); params.push(fecha_hasta); }

    if (filtros.length) query += " WHERE " + filtros.join(" AND ");
    query += " ORDER BY r.fecha_inicio DESC";

    req.db.query(query, params, (err2, reservas) => {
      if (err2) return res.json({ ok: false, error: 'Error cargando datos' });

      res.json({ ok: true, reservas });
    });
  });

});


// GET /api/reservas/mis-reservas 
router.get('/mis-reservas', isAuth, (req, res) => {

  actualizarEstados(req.db, (err) => {
    if (err) return res.json({ ok: false, error: 'Error actualizando estados' });

    const usuario = req.session.usuario;
    const { vehiculo, estado, fecha_desde, fecha_hasta } = req.query;

    let query = `
      SELECT r.id_reserva, r.fecha_inicio, r.fecha_fin, r.estado,
        u.nombre AS nombre_usuario, u.correo AS email_usuario,
        v.marca, v.modelo, v.matricula
      FROM reservas r
      JOIN usuarios u ON r.id_usuario = u.id_usuario
      JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
      WHERE r.id_usuario = ?
    `;

    const params = [usuario.id_usuario];

    if (vehiculo) { query += " AND r.id_vehiculo = ?"; params.push(parseInt(vehiculo)); }
    if (estado) { query += " AND r.estado = ?"; params.push(estado); }
    if (fecha_desde) { query += " AND r.fecha_inicio >= ?"; params.push(fecha_desde); }
    if (fecha_hasta) { query += " AND r.fecha_fin <= ?"; params.push(fecha_hasta); }

    query += " ORDER BY r.fecha_inicio DESC";

    req.db.query(query, params, (err2, reservas) => {
      if (err2) return res.json({ ok: false, error: 'Error cargando datos' });
      res.json({ ok: true, reservas });
    });
  });

});


module.exports = router;