const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/vehiculos
 * @desc    Devuelve la lista completa de vehiculos en JSON
 * @access  Public
 */

router.get('/vehiculos', async (req, res, next) => {
  
  try {
    const [vehiculos] = await req.db.query('SELECT * FROM vehiculos ORDER BY marca, modelo');
    res.json(vehiculos);
  
  } catch (err) {
    console.error('Error al obtener vehículos para API:', err);
    err.publicMessage = 'Error al obtener la lista de vehículos';
    next(err);
  }

});

// En el futuro (LAB 9):
// router.post('/reservas', ...)
// router.get('/reservas', ...)

module.exports = router;