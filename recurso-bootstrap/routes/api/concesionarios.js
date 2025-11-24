const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../../middleware/auth');

// LISTA
router.get('/lista', isAuth, (req, res) => {
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
      return res.status(500).json({ ok: false, error: "Error interno al obtener concesionarios" });
    }

    const concesionariosConEstado = concesionarios.map(c => ({
      ...c,
      activo: c.activo ? "Activo" : "Eliminado",
      activoBool: c.activo === 1
    }));

    res.json({ ok: true, concesionarios: concesionariosConEstado });
  });
});

// DETALLE POR ID (Requiere dos consultas anidadas)
router.get("/:id(\\d+)", isAuth, (req, res) => {
  console.log("entro");
  const id = parseInt(req.params.id);

  // PRIMERA CONSULTA: Obtener el concesionario
  req.db.query("SELECT * FROM concesionarios WHERE id_concesionario = ?", [id], (err, rows) => {
    if (err) return res.json({ ok: false, error: err.message });

    // Verificación de si existe (rows[0])
    const concesionario = rows[0];

    if (!concesionario) {
      return res.json({ ok: false, error: "Concesionario no encontrado" });
    }

    const concesionarioConEstado = {
      ...concesionario,
      activo: concesionario.activo ? "Activo" : "Eliminado",
      activoBool: concesionario.activo === 1
    };

    // SEGUNDA CONSULTA (ANIDADA): Obtener vehículos
    // Se ejecuta solo si la primera tuvo éxito
    req.db.query("SELECT * FROM vehiculos WHERE id_concesionario = ?", [id], (errVehiculos, vehiculos) => {
      if (errVehiculos) return res.json({ ok: false, error: errVehiculos.message });

      const vehiculosConEstado = vehiculos.map(v => ({
        ...v,
        activo: v.activo ? "Activo" : "Eliminado",
        activoBool: v.activo === 1
      }));

      // Respuesta final con datos de ambas consultas
      res.json({ ok: true, concesionario: concesionarioConEstado, vehiculos: vehiculosConEstado });
    });
  });
});

// CREAR NUEVO
router.post('/nuevo', isAdmin, (req, res) => {
  const { nombre, ciudad, direccion, telefono_contacto } = req.body;
  const fieldErrors = {};

  // Validaciones síncronas (no requieren callback)
  if (!nombre || nombre.trim().length < 3) fieldErrors.nombre = 'Mínimo 3 caracteres';
  if (!ciudad || ciudad.trim().length < 3) fieldErrors.ciudad = 'Mínimo 3 caracteres';
  if (!direccion || direccion.trim().length < 5) fieldErrors.direccion = 'Mínimo 5 caracteres';
  if (!telefono_contacto || !/^\d{9}$/.test(telefono_contacto.trim())) fieldErrors.telefono_contacto = '9 dígitos';

  if (Object.keys(fieldErrors).length) return res.status(400).json({ ok: false, fieldErrors });

  // Consulta INSERT con callback
  req.db.query(
    'INSERT INTO concesionarios(nombre, ciudad, direccion, telefono_contacto, activo) VALUES (?, ?, ?, ?, 1)',
    [nombre.trim(), ciudad.trim(), direccion.trim(), telefono_contacto.trim()],
    (err, result) => {
      if (err) return res.status(500).json({ ok: false, error: err.message });

      res.json({ ok: true, id: result.insertId });
    }
  );
});

// EDITAR (PUT)
router.put('/:id(\\d+)/editar', isAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nombre, ciudad, direccion, telefono_contacto } = req.body;
  const fieldErrors = {};

  if (!nombre || nombre.trim().length < 3) fieldErrors.nombre = 'Mínimo 3 caracteres';
  if (!ciudad || ciudad.trim().length < 3) fieldErrors.ciudad = 'Mínimo 3 caracteres';
  if (!direccion || direccion.trim().length < 5) fieldErrors.direccion = 'Mínimo 5 caracteres';
  if (!telefono_contacto || !/^\d{9}$/.test(telefono_contacto.trim())) fieldErrors.telefono_contacto = '9 dígitos';

  if (Object.keys(fieldErrors).length) return res.status(400).json({ ok: false, fieldErrors });

  // Consulta UPDATE con callback
  req.db.query(
    'UPDATE concesionarios SET nombre=?, ciudad=?, direccion=?, telefono_contacto=? WHERE id_concesionario=?',
    [nombre.trim(), ciudad.trim(), direccion.trim(), telefono_contacto.trim(), id],
    (err) => {
      if (err) return res.status(500).json({ ok: false, error: err.message });

      res.json({ ok: true });
    }
  );
});

// ELIMINAR (Soft Delete)
// Nota: Aunque lógicamente es un PUT, mantenemos router.delete si tu frontend lo llama así.
router.delete('/:id(\\d+)/eliminar', isAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);

  // PRIMERA CONSULTA: Verificar si tiene vehículos
  req.db.query('SELECT COUNT(*) AS cnt FROM vehiculos WHERE id_concesionario=?', [id], (err, rows) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });

    if (rows[0].cnt > 0) {
      return res.status(400).json({ ok: false, error: 'Tiene vehículos asociados' });
    }

    // SEGUNDA CONSULTA (ANIDADA): Realizar el Soft Delete
    req.db.query('UPDATE concesionarios SET activo=0 WHERE id_concesionario=?', [id], (errUpdate) => {
      if (errUpdate) return res.status(500).json({ ok: false, error: errUpdate.message });

      res.json({ ok: true });
    });
  });
});

module.exports = router;