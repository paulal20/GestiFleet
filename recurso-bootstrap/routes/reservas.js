const express = require('express');
const router = express.Router();

router.get('/reserva', (req, res) => {
    res.render('reservas', { title: 'Reserva' });
});

router.post('/reserva', (req, res) => {
    const { reservas } = req.app.locals.store;
    const datosRecibidos = req.body;

    // Aquí deberías añadir validación (LAB 8/9)
    // y el id_usuario de la sesión (LAB 7)

    reservas.push(datosRecibidos);

    console.log("¡Nueva reserva recibida!");
    console.table(datosRecibidos);
    console.log("--- Total de reservas en memoria ---");
    console.table(reservas);

    res.redirect('/listareservas');
});

router.get('/listareservas', (req, res) => {
    const { reservas } = req.app.locals.store;
    res.render('listareservas', {
        title: 'Lista de Reservas',
        listaDeReservas: reservas
    });
});

// Aquí irán rutas futuras como:
// GET /mis-reservas (para usuarios logueados)
// POST /api/reservas (para AJAX en LAB 9)


module.exports = router;
