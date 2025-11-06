const express = require('express');
const router = express.Router();

const { isAuth, isAdmin } = require('../middleware/auth');

const store = require('../data/store');

router.get('/', isAuth, (req, res) => {
    const { vehiculos } = store;
    const idVehiculoSeleccionado = parseInt(req.query.idVehiculo, 10) || null;
    res.render('reservas', { title: 'Reserva', vehiculos, idVehiculoSeleccionado });
});

router.post('/', isAuth, (req, res) => {
    const { reservas } = store;
    const datosRecibidos = req.body;

    datosRecibidos.id_usuario = req.session.usuario.id_usuario; 
    datosRecibidos.usuarioCorreo = req.session.usuario.correo;
    datosRecibidos.usuarioNombre = req.session.usuario.nombre;
    const vehiculoSeleccionado = store.vehiculos.find(v => v.id === parseInt(datosRecibidos.vehiculo, 10));
    datosRecibidos.vehiculo = vehiculoSeleccionado ? `${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo}` : 'Desconocido';

    reservas.push(datosRecibidos);

    console.log("¡Nueva reserva recibida!");
    console.table(datosRecibidos);
    console.log("--- Total de reservas en memoria ---");
    console.table(reservas);

    if (req.session.usuario.rol === 'admin') {
        return res.redirect('/reserva/listareservas');
    }else{
        return res.redirect('/reserva/mis-reservas');
    }
});

router.get('/listareservas', isAdmin, (req, res) => {
    const { reservas, usuarios } = store;
    const idFiltrado = req.query.id;

    let reservasAMostrar = reservas;

    if (idFiltrado) {
        const idNumero = parseInt(idFiltrado, 10);
        reservasAMostrar = reservas.filter(r => r.id_usuario === idNumero);
    }

    res.render('listareservas', {
        title: 'Lista de Reservas',
        listaDeReservas: reservasAMostrar,
        todosLosUsuarios: usuarios,
        idSeleccionado: parseInt(idFiltrado, 10) || 0
    });
});

router.get('/mis-reservas', isAuth, (req, res) => {
    const { reservas } = store;
    const usuarioActual = req.session.usuario;
    const reservasDelUsuario = reservas.filter(reserva => reserva.id_usuario === usuarioActual.id_usuario);
    res.render('listareservas', {
        title: 'Mis Reservas',
        listaDeReservas: reservasDelUsuario,
        todosLosUsuarios: [],
        idSeleccionado: 0
    });
});

// Aqui iran rutas futuras como:
// POST /api/reservas (para AJAX en LAB 9)

module.exports = router;
