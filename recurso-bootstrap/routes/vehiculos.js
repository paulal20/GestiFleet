const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const { vehiculos } = req.app.locals.store;
    const { tipo, estado } = req.query;

    var filtro = vehiculos;

    if(tipo) {
        filtro = filtro.filter(v => v.tipo.toLowerCase() === tipo.toLowerCase());
    }
    if (estado) {
        filtro = filtro.filter(v => v.estado.toLowerCase() === estado.toLowerCase());
    }
    const tiposDisponibles = [...new Set(vehiculos.map(v => v.tipo))];
    const estadosDisponibles = [...new Set(vehiculos.map(v => v.estado))];

    res.render('vehiculos', {
        title: 'Vehículos',
        vehiculos: filtro,
        tiposDisponibles,
        estadosDisponibles,
        tipoSeleccionado: tipo || '',
        estadoSeleccionado: estado || ''
    });
});

router.get('/:id', (req, res, next) => {
    const { vehiculos, concesionarios } = req.app.locals.store;
    const id = parseInt(req.params.id);
    const vehiculo = vehiculos.find(v => v.id === id);

    if (!vehiculo) {
        const err = new Error('Vehículo no encontrado (id=' + req.params.id + ')');
        err.status = 404;
        err.publicMessage = 'Vehículo no encontrado.';
        err.expose = true;
        return next(err);
    }

    const concesionario = concesionarios.find(c => c.id_concesionario === vehiculo.id_concesionario);

    res.render('vehiculoDetalle', { 
        vehiculo, 
        concesionario: concesionario || { nombre: 'Sin asignar' } 
    });
});

// Aquí añadirás las rutas del LAB 8 (CRUD)
// GET /vehiculos/nuevo -> Formulario para crear (Ruta: '/nuevo')
// POST /vehiculos/nuevo -> Lógica para crear (Ruta: '/nuevo')
// GET /vehiculos/:id/editar -> Formulario para editar (Ruta: '/:id/editar')
// POST /vehiculos/:id/editar -> Lógica para actualizar (Ruta: '/:id/editar')
// POST /vehiculos/:id/eliminar -> Lógica para borrar (Ruta: '/:id/eliminar')


module.exports = router;
