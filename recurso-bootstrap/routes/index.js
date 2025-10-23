
const express = require('express');
const router = express.Router();

// Ruta Home
router.get('/', (req, res) => {
    // res.send("holaaaa");
    res.render('../views/index', { title: 'Inicio' });
});
  
// Ruta Vehículos
router.get('/vehiculos', (req, res) => {
    res.render('../views/vehiculos', { title: 'Vehículos' });
});

// Ruta Reservas
router.get('/reservas', (req, res) => {
    res.render('../views/reservas', { title: 'Reservas' });
});

// Ruta Contacto
router.get('/contacto', (req, res) => {
    res.render('../views/contacto', { title: 'Contacto' });
});

module.exports = router;
