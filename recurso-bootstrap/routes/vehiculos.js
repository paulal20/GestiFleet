const express = require('express');
const router = express.Router();
const db = require('../data/db');

router.get('/', async (req, res) => {
  try {
    const { tipo, estado } = req.query;

    let sql = 'SELECT * FROM vehiculos';
    const params = [];

    if (tipo || estado) {
      sql += ' WHERE';
      const condiciones = [];
      if (tipo) {
        condiciones.push(' tipo = ? ');
        params.push(tipo);
      }
      if (estado) {
        condiciones.push(' estado = ? ');
        params.push(estado);
      }
      sql += condiciones.join(' AND ');
    }

    const [vehiculos] = await db.query(sql, params);
    
    const [tipos] = await db.query('SELECT DISTINCT tipo FROM vehiculos');
    const [estados] = await db.query('SELECT DISTINCT estado FROM vehiculos');

    const tiposDisponibles = tipos.map(t => t.tipo);
    const estadosDisponibles = estados.map(e => e.estado);

    res.render('vehiculos', {
      title: 'Vehículos',
      vehiculos,
      tiposDisponibles,
      estadosDisponibles,
      tipoSeleccionado: tipo || '',
      estadoSeleccionado: estado || ''
    });

  } catch (err) {
    console.error('Error al obtener vehículos:', err);
    res.status(500).render('error', { mensaje: 'Error al cargar los vehículos' });
  }
});

router.get('/:id', async (req, res, next) => {
    // const { vehiculos, concesionarios } = req.app.locals.store;
    try{
        const id = parseInt(req.params.id);
        const [vehiculos] = await db.query('SELECT * FROM vehiculos WHERE id_vehiculo = ?', [id]);
        
        if (vehiculos.length === 0) {
            const err = new Error('Vehículo no encontrado (id_vehiculo=' + id + ')');
            err.status = 404;
            err.publicMessage = 'Vehículo no encontrado.';
            err.expose = true;
            return next(err);
        }

        const vehiculo = vehiculos[0];
        const [concesionarios] = await db.query('SELECT * FROM concesionarios WHERE id_concesionario = ?', [vehiculo.id_concesionario]);
        const concesionario = concesionarios[0];

        res.render('vehiculoDetalle', { 
            vehiculo, 
            concesionario: concesionario || { nombre: 'Sin asignar' } 
        });
    } catch(err) {
        console.error('Error al obtener el vehículo:', err);
        res.status(500).render('error', { mensaje: 'Error al cargar el vehículo' });
    }
});

// Aquí añadirás las rutas del LAB 8 (CRUD)
// GET /vehiculos/nuevo -> Formulario para crear (Ruta: '/nuevo')
// POST /vehiculos/nuevo -> Lógica para crear (Ruta: '/nuevo')
// GET /vehiculos/:id/editar -> Formulario para editar (Ruta: '/:id/editar')
// POST /vehiculos/:id/editar -> Lógica para actualizar (Ruta: '/:id/editar')
// POST /vehiculos/:id/eliminar -> Lógica para borrar (Ruta: '/:id/eliminar')


module.exports = router;
