const express = require('express');
const router = express.Router();

// Ruta Home
router.get('/', (req, res) => {
  res.render('index', { title: 'Inicio' });
});
  
// Ruta Vehículos (con filtro por tipo)
router.get('/vehiculos', (req, res) => {
  const vehiculos = [
    { nombre: 'tesla1', marca: 'Tesla', descripcion: 'Sedán eléctrico de lujo con aceleración impresionante, autonomía de más de 600 km y tecnología avanzada de conducción autónoma.', tipo: 'coche', precio: '95.000' },
    { nombre: 'byd_seal1', marca: 'BYD SEAL', descripcion: 'Sedán eléctrico moderno con diseño aerodinámico, interiores tecnológicos y un rendimiento eficiente para ciudad y carretera.', tipo: 'coche', precio: '40.000' },
    { nombre: 'volvo1', marca: 'Volvo', descripcion: 'SUV seguro y confortable, con un interior espacioso, tecnología de asistencia al conductor y sistemas de seguridad de última generación.', tipo: 'suv', precio: '70.000' },
    { nombre: 'VW1', marca: 'Volkswagen', descripcion: 'Compacto eficiente y versátil, ideal para la ciudad, con un diseño moderno y prestaciones equilibradas para toda la familia.', tipo: 'suv', precio: '62.000' },
    { nombre: 'tesla2', marca: 'Tesla', descripcion: 'Sedán eléctrico de lujo con interiores premium, sistema de conducción autónoma y batería de alta duración para viajes largos.', tipo: 'coche', precio: '95.000' }
  ];

  const { tipo } = req.query;

  const filtro = tipo
    ? vehiculos.filter(v => v.tipo.toLowerCase() === tipo.toLowerCase())
    : vehiculos;
  res.render('vehiculos', { title: 'Vehículos', vehiculos: filtro });
});

// Ruta Reservas
router.get('/reservas', (req, res) => {
  res.render('reservas', { title: 'Reservas' });
});

//Ruta Reserva (procesa el formulario)
router.post('/reserva', (req, res) => {
    // 1. Accede al array global desde req.app.locals
    const todasLasReservas = req.app.locals.todasLasReservas;

    // 2. Los datos están en req.body
    const datosRecibidos = req.body;

    // 3. Guardamos la reserva
    todasLasReservas.push(datosRecibidos);

    // 4. Mostramos en la terminal
    console.log("¡Nueva reserva recibida!");
    console.table(datosRecibidos);
    console.log("--- Total de reservas en memoria ---");
    console.table(todasLasReservas);

    // 5. Enviamos respuesta
    res.send('<h1>¡Reserva recibida!</h1><p>Gracias, hemos guardado tus datos.</p><a href="/reservas">Volver</a>');
});

// Ruta Contacto
router.get('/contacto', (req, res) => {
  res.render('contacto', { title: 'Contacto' });
});

module.exports = router;
