const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/vehiculos
 * @desc    Devuelve la lista completa de vehIculos en JSON
 * @access  Public
 */

router.get('/vehiculos', (req, res) => {
    const { vehiculos } = req.app.locals.store;
    res.json(vehiculos);
});

// En el futuro (LAB 9):
// router.post('/reservas', ...)
// router.get('/reservas', ...)

module.exports = router;