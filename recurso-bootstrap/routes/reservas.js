const express = require('express');
const router = express.Router();

const { isAuth } = require('../middleware/auth');

router.get('/', isAuth, (req, res) => {
    res.render('reservas', { title: 'Reserva' });
});

router.post('/', isAuth, (req, res) => {
    const { reservas } = req.app.locals.store;
    const datosRecibidos = req.body;

    // Aqui deberias anyadir validacion (LAB 8/9)
    // y el id_usuario de la sesion (LAB 7)

    reservas.push(datosRecibidos);

    console.log("¡Nueva reserva recibida!");
    console.table(datosRecibidos);
    console.log("--- Total de reservas en memoria ---");
    console.table(reservas);

    res.redirect('/reserva/listareservas');
});

router.get('/listareservas', isAuth, (req, res) => {
    const { reservas } = req.app.locals.store;
    res.render('listareservas', {
        title: 'Lista de Reservas',
        listaDeReservas: reservas
    });
});

// Aqui iran rutas futuras como:
// GET /mis-reservas (para usuarios logueados)
// POST /api/reservas (para AJAX en LAB 9)


module.exports = router;
