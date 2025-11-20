const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../../middleware/auth');

router.get('/lista', isAuth, async (req, res) => {
  try {
    const { ciudad } = req.query;
    let sql = "SELECT * FROM concesionarios";
    const params = [];

    if (ciudad) {
      sql += " WHERE ciudad = ?";
      params.push(ciudad);
    }

    sql += " ORDER BY nombre";
    const [concesionarios] = await req.db.query(sql, params);
    const concesionariosConEstado = concesionarios.map(c => ({
      ...c,
      activo: c.activo ? "Activo" : "Eliminado",
      activoBool: c.activo === 1 
    }));

    res.json({ ok: true, concesionarios: concesionariosConEstado });
  } catch (error) {
    console.error("Error API concesionarios:", error);
    res.status(500).json({ ok: false, error: "Error interno al obtener concesionarios" });
  }
});

router.get("/:id(\\d+)", isAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [[concesionario]] = await req.db.query(
      "SELECT * FROM concesionarios WHERE id_concesionario = ?",
      [id]
    );

    if (!concesionario)
      return res.json({ ok: false, error: "Concesionario no encontrado" });

    const concesionarioConEstado = {
      ...concesionario,
      activo: concesionario.activo ? "Activo" : "Eliminado",
      activoBool: concesionario.activo === 1
    };

    const [vehiculos] = await req.db.query(
      "SELECT * FROM vehiculos WHERE id_concesionario = ?",
      [id]
    );

    res.json({ ok: true, concesionario: concesionarioConEstado, vehiculos });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

router.post('/nuevo', isAdmin, async (req, res) => {
  const { nombre, ciudad, direccion, telefono_contacto } = req.body;
  const fieldErrors = {};

  try {
    if (!nombre || nombre.trim().length < 3) fieldErrors.nombre = 'Mínimo 3 caracteres';
    if (!ciudad || ciudad.trim().length < 3) fieldErrors.ciudad = 'Mínimo 3 caracteres';
    if (!direccion || direccion.trim().length < 5) fieldErrors.direccion = 'Mínimo 5 caracteres';
    if (!telefono_contacto || !/^\d{9}$/.test(telefono_contacto.trim())) fieldErrors.telefono_contacto = '9 dígitos';

    if (Object.keys(fieldErrors).length) return res.status(400).json({ ok: false, fieldErrors });

    const [result] = await req.db.query(
      'INSERT INTO concesionarios(nombre, ciudad, direccion, telefono_contacto, activo) VALUES (?, ?, ?, ?, 1)',
      [nombre.trim(), ciudad.trim(), direccion.trim(), telefono_contacto.trim()]
    );

    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/:id(\\d+)/editar', isAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nombre, ciudad, direccion, telefono_contacto } = req.body;
  const fieldErrors = {};

  try {
    if (!nombre || nombre.trim().length < 3) fieldErrors.nombre = 'Mínimo 3 caracteres';
    if (!ciudad || ciudad.trim().length < 3) fieldErrors.ciudad = 'Mínimo 3 caracteres';
    if (!direccion || direccion.trim().length < 5) fieldErrors.direccion = 'Mínimo 5 caracteres';
    if (!telefono_contacto || !/^\d{9}$/.test(telefono_contacto.trim())) fieldErrors.telefono_contacto = '9 dígitos';

    if (Object.keys(fieldErrors).length) return res.status(400).json({ ok: false, fieldErrors });

    await req.db.query(
      'UPDATE concesionarios SET nombre=?, ciudad=?, direccion=?, telefono_contacto=? WHERE id_concesionario=?',
      [nombre.trim(), ciudad.trim(), direccion.trim(), telefono_contacto.trim(), id]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.delete('/:id(\\d+)/eliminar', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const [vehiculos] = await req.db.query('SELECT COUNT(*) AS cnt FROM vehiculos WHERE id_concesionario=?', [id]);
    if (vehiculos[0].cnt > 0) return res.status(400).json({ ok: false, error: 'Tiene vehículos asociados' });

    await req.db.query('UPDATE concesionarios SET activo=0 WHERE id_concesionario=?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
module.exports = router;