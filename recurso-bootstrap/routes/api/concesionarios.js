const express = require('express');
const router = express.Router();
const { isAuth } = require('../../middleware/auth');

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

    res.json({ ok: true, concesionarios });
  } catch (error) {
    console.error("Error API concesionarios:", error);
    res.status(500).json({ ok: false, error: "Error interno al obtener concesionarios" });
  }
});
module.exports = router;