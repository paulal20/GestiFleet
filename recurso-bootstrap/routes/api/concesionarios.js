const express = require('express');
const router = express.Router();
const { isAdminOrWorker, isAdmin } = require('../../middleware/auth');

// GET /api/concesionarios/lista
router.get('/lista', isAdmin, (req, res) => {
  const { ciudad } = req.query;
  let sql = "SELECT * FROM concesionarios";
  const params = [];

  if (ciudad) {
    sql += " WHERE ciudad = ?";
    params.push(ciudad);
  }

  sql += " ORDER BY nombre";

  req.db.query(sql, params, (err, concesionarios) => {
    if (err) {
      console.error("Error API concesionarios:", err);
      return res.status(500).json({ ok: false, error: "Error interno al obtener el listado de concesionarios." });
    }

    const concesionariosConEstado = concesionarios.map(c => ({
      ...c,
      activo: c.activo ? "Activo" : "Eliminado",
      activoBool: c.activo === 1
    }));

    res.json({ ok: true, concesionarios: concesionariosConEstado });
  });
});

// GET /api/concesionarios/:id
router.get("/:id(\\d+)", isAdminOrWorker, (req, res) => {
  const id = parseInt(req.params.id);

  req.db.query("SELECT * FROM concesionarios WHERE id_concesionario = ?", [id], (err, rows) => {
    if (err) return res.json({ ok: false, error: err.message });

    const concesionario = rows[0];

    if (!concesionario) {
      return res.json({ ok: false, error: "El concesionario solicitado no existe." });
    }

    const concesionarioConEstado = {
      ...concesionario,
      activo: concesionario.activo ? "Activo" : "Eliminado",
      activoBool: concesionario.activo === 1
    };

    const sqlVehiculos = `
      SELECT v.*, 
      (SELECT COUNT(*) FROM reservas r 
       WHERE r.id_vehiculo = v.id_vehiculo 
       AND r.activo = 1 
       AND r.estado = 'activa'
       AND NOW() BETWEEN r.fecha_inicio AND r.fecha_fin
      ) as ocupado_actualmente
      FROM vehiculos v 
      WHERE v.id_concesionario = ?
    `;

    req.db.query(sqlVehiculos, [id], (errVehiculos, vehiculos) => {
      if (errVehiculos) return res.json({ ok: false, error: errVehiculos.message });

      const vehiculosConEstado = vehiculos.map(v => ({
        ...v,
        activo: v.activo ? "Activo" : "Eliminado",
        activoBool: v.activo === 1,
        estaReservado: v.ocupado_actualmente > 0
      }));

      res.json({ ok: true, concesionario: concesionarioConEstado, vehiculos: vehiculosConEstado });
    });
  });
});

// POST /api/concesionarios/nuevo 
router.post('/nuevo', isAdmin, (req, res) => {
  const { nombre, ciudad, direccion, telefono_contacto } = req.body;
  const fieldErrors = {};

  if (!nombre || nombre.trim().length < 3) fieldErrors.nombre = 'El nombre debe tener al menos 3 caracteres.';
  if (!ciudad || ciudad.trim().length < 3) fieldErrors.ciudad = 'La ciudad debe tener al menos 3 caracteres.';
  if (!direccion || direccion.trim().length < 5) fieldErrors.direccion = 'La dirección debe ser más descriptiva (mín. 5 letras).';
  if (!telefono_contacto || !/^\d{9}$/.test(telefono_contacto.trim())) fieldErrors.telefono_contacto = 'El teléfono debe constar de 9 dígitos numéricos.';

  if (Object.keys(fieldErrors).length) return res.status(400).json({ ok: false, fieldErrors });

  // si está duplicado o no
  const sqlCheck = `
    SELECT * FROM concesionarios 
    WHERE nombre = ? OR direccion = ? OR telefono_contacto = ?
  `;

  req.db.query(sqlCheck, [nombre.trim(), direccion.trim(), telefono_contacto.trim()], (err, rows) => {
    if (err) {
      console.error("Error comprobando duplicados:", err);
      return res.status(500).json({ ok: false, error: "Error al verificar datos duplicados." });
    }

    if (rows.length > 0) {
      rows.forEach(row => {
        if (row.nombre.toLowerCase() === nombre.trim().toLowerCase()) {
          fieldErrors.nombre = 'Ya existe un concesionario con este nombre.';
        }
        if (row.direccion.toLowerCase() === direccion.trim().toLowerCase()) {
          fieldErrors.direccion = 'Esta dirección ya está registrada en el sistema.';
        }
        if (row.telefono_contacto === telefono_contacto.trim()) {
          fieldErrors.telefono_contacto = 'Este teléfono de contacto ya está en uso.';
        }
      });

      if (Object.keys(fieldErrors).length > 0) {
        return res.status(400).json({ ok: false, fieldErrors });
      }
    }

    req.db.query(
      'INSERT INTO concesionarios(nombre, ciudad, direccion, telefono_contacto, activo) VALUES (?, ?, ?, ?, 1)',
      [nombre.trim(), ciudad.trim(), direccion.trim(), telefono_contacto.trim()],
      (errInsert, result) => {
        if (errInsert) return res.status(500).json({ ok: false, error: "Error al guardar el nuevo concesionario." });

        res.json({ ok: true, id: result.insertId });
      }
    );
  });
});

// PUT /api/concesionarios/:id/editar
router.put('/:id(\\d+)/editar', isAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nombre, ciudad, direccion, telefono_contacto } = req.body;
  const fieldErrors = {};

  if (!nombre || nombre.trim().length < 3) fieldErrors.nombre = 'El nombre debe tener al menos 3 caracteres.';
  if (!ciudad || ciudad.trim().length < 3) fieldErrors.ciudad = 'La ciudad debe tener al menos 3 caracteres.';
  if (!direccion || direccion.trim().length < 5) fieldErrors.direccion = 'La dirección debe ser más descriptiva (mín. 5 letras).';
  if (!telefono_contacto || !/^\d{9}$/.test(telefono_contacto.trim())) fieldErrors.telefono_contacto = 'El teléfono debe constar de 9 dígitos numéricos.';

  if (Object.keys(fieldErrors).length) {
    return res.status(400).json({ ok: false, fieldErrors });
  }

  const sqlCheck = `
    SELECT * FROM concesionarios 
    WHERE (nombre = ? OR direccion = ? OR telefono_contacto = ?) 
    AND id_concesionario <> ?
  `;

  req.db.query(
    sqlCheck, 
    [nombre.trim(), direccion.trim(), telefono_contacto.trim(), id], 
    (err, rows) => {
      if (err) {
        console.error("Error comprobando duplicados:", err);
        return res.status(500).json({ ok: false, error: "Error al verificar datos duplicados." });
      }

      if (rows.length > 0) {
        rows.forEach(row => {
          if (row.nombre.toLowerCase() === nombre.trim().toLowerCase()) {
            fieldErrors.nombre = 'Este nombre ya existe en otro concesionario.';
          }
          if (row.direccion.toLowerCase() === direccion.trim().toLowerCase()) {
            fieldErrors.direccion = 'Esta dirección ya está registrada en otro concesionario.';
          }
          if (row.telefono_contacto === telefono_contacto.trim()) {
            fieldErrors.telefono_contacto = 'Este teléfono ya está en uso por otro concesionario.';
          }
        });

        if (Object.keys(fieldErrors).length > 0) {
          return res.status(400).json({ ok: false, fieldErrors });
        }
      }

      req.db.query(
        'UPDATE concesionarios SET nombre=?, ciudad=?, direccion=?, telefono_contacto=?, activo=1 WHERE id_concesionario=?',
        [nombre.trim(), ciudad.trim(), direccion.trim(), telefono_contacto.trim(), id],
        (errUpdate) => {
          if (errUpdate) {
            console.error("Error actualizando:", errUpdate);
            return res.status(500).json({ ok: false, error: "Error al actualizar el concesionario." });
          }

          res.json({ ok: true });
        }
      );
    }
  );
});

// DELETE /api/concesionarios/:id/eliminar --> técnicamente es un delete lógico 
router.delete('/:id(\\d+)/eliminar', isAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);

  // vemos si tiene vehículos activos o empleados activos
  req.db.query('SELECT COUNT(*) AS cnt FROM vehiculos WHERE id_concesionario=? AND activo = true', [id], (errVeh, rowsVeh) => {
    if (errVeh) return res.status(500).json({ ok: false, error: errVeh.message });

    if (rowsVeh[0].cnt > 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'No se puede eliminar el concesionario porque todavía tiene vehículos activos en stock.' 
      });
    }

    req.db.query('SELECT COUNT(*) AS cnt FROM usuarios WHERE id_concesionario=? AND activo = true', [id], (errEmp, rowsEmp) => {
        if (errEmp) return res.status(500).json({ ok: false, error: errEmp.message });

        if (rowsEmp[0].cnt > 0) {
            return res.status(400).json({ 
                ok: false, 
                error: 'No se puede eliminar el concesionario porque tiene empleados activos trabajando en él.' 
            });
        }

        req.db.query('UPDATE concesionarios SET activo=0 WHERE id_concesionario=?', [id], (errUpdate) => {
            if (errUpdate) return res.status(500).json({ ok: false, error: errUpdate.message });

            res.json({ ok: true });
        });
    });
  });
});

module.exports = router;