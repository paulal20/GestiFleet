const express = require('express');
const router = express.Router();

// Ruta Home
router.get('/', (req, res) => {
  res.render('index', { title: 'Inicio' });
});
  
// Ruta Vehículos (con filtro por tipo)
router.get('/vehiculos', (req, res) => {
  // const vehiculos = [
  //   { nombre: 'tesla1', marca: 'Tesla', descripcion: 'Sedán eléctrico de lujo con aceleración impresionante, autonomía de más de 600 km y tecnología avanzada de conducción autónoma.', tipo: 'coche', precio: '95.000' },
  //   { nombre: 'byd_seal1', marca: 'BYD SEAL', descripcion: 'Sedán eléctrico moderno con diseño aerodinámico, interiores tecnológicos y un rendimiento eficiente para ciudad y carretera.', tipo: 'coche', precio: '40.000' },
  //   { nombre: 'volvo1', marca: 'Volvo', descripcion: 'SUV seguro y confortable, con un interior espacioso, tecnología de asistencia al conductor y sistemas de seguridad de última generación.', tipo: 'suv', precio: '70.000' },
  //   { nombre: 'VW1', marca: 'Volkswagen', descripcion: 'Compacto eficiente y versátil, ideal para la ciudad, con un diseño moderno y prestaciones equilibradas para toda la familia.', tipo: 'suv', precio: '62.000' },
  //   { nombre: 'tesla2', marca: 'Tesla', descripcion: 'Sedán eléctrico de lujo con interiores premium, sistema de conducción autónoma y batería de alta duración para viajes largos.', tipo: 'coche', precio: '95.000' }
  // ];
    const vehiculos = [
      { nombre: 'byd_seal1', marca: 'BYD SEAL', descripcion: 'Sedán eléctrico moderno con diseño aerodinámico y rendimiento eficiente para ciudad y carretera.', tipo: 'coche', precio: '40.000' },
      { nombre: 'byd_seal2', marca: 'BYD SEAL', descripcion: 'Sedán eléctrico eficiente con interiores tecnológicos y autonomía optimizada.', tipo: 'coche', precio: '42.000' },
      { nombre: 'byd_seal3', marca: 'BYD SEAL', descripcion: 'Versión deportiva con prestaciones mejoradas y diseño elegante.', tipo: 'coche', precio: '45.000' },
      { nombre: 'tesla1', marca: 'Tesla', descripcion: 'Sedán eléctrico de lujo con aceleración impresionante y tecnología avanzada.', tipo: 'coche', precio: '95.000' },
      { nombre: 'tesla2', marca: 'Tesla', descripcion: 'Versión con interiores premium y sistema de conducción autónoma.', tipo: 'coche', precio: '98.000' },
      { nombre: 'tesla3', marca: 'Tesla', descripcion: 'Modelo con batería de larga duración y autonomía extendida.', tipo: 'coche', precio: '100.000' },
      { nombre: 'tesla4', marca: 'Tesla', descripcion: 'Edición deportiva con máxima aceleración y diseño moderno.', tipo: 'coche', precio: '105.000' },
      { nombre: 'tesla5', marca: 'Tesla', descripcion: 'Versión urbana con eficiencia energética optimizada.', tipo: 'coche', precio: '92.000' },
      { nombre: 'tesla6', marca: 'Tesla', descripcion: 'Modelo familiar con tecnología de asistencia y confort superior.', tipo: 'coche', precio: '97.000' },
      { nombre: 'volvo1', marca: 'Volvo', descripcion: 'SUV seguro y confortable con interior espacioso y tecnología de asistencia.', tipo: 'suv', precio: '70.000' },
      { nombre: 'volvo2', marca: 'Volvo', descripcion: 'Versión avanzada con sistemas de seguridad de última generación.', tipo: 'suv', precio: '72.000' },
      { nombre: 'volvo3', marca: 'Volvo', descripcion: 'SUV premium con interiores amplios y acabados de lujo.', tipo: 'suv', precio: '75.000' },
      { nombre: 'VW1', marca: 'Volkswagen', descripcion: 'Compacto eficiente y versátil, ideal para la ciudad y viajes familiares.', tipo: 'suv', precio: '62.000' },
      { nombre: 'VW2', marca: 'Volkswagen', descripcion: 'Versión con diseño moderno y prestaciones equilibradas.', tipo: 'suv', precio: '64.000' },
      { nombre: 'VW3', marca: 'Volkswagen', descripcion: 'Modelo urbano con eficiencia energética optimizada.', tipo: 'suv', precio: '66.000' },
      { nombre: 'VW4', marca: 'Volkswagen', descripcion: 'Edición deportiva con mayor potencia y estilo moderno.', tipo: 'suv', precio: '68.000' },
      { nombre: 'VW5', marca: 'Volkswagen', descripcion: 'Versión familiar con espacio extra y confort superior.', tipo: 'suv', precio: '70.000' }
    ];


  const { tipo } = req.query;
  const tipoSeleccionado = tipo || '';

  const filtro = tipo
    ? vehiculos.filter(v => v.tipo.toLowerCase() === tipo.toLowerCase())
    : vehiculos;

  const tiposDisponibles = [...new Set(vehiculos.map(v => v.tipo))];

  //vehiculos: la lista de los vehiculos con el filtro aplicado
  //tiposDisponibles: para que salga en el desplegable del filtro
  //tipoSeleccionado: para que se marque la opción del filtro
  res.render('vehiculos', { title: 'Vehículos', vehiculos: filtro, tiposDisponibles });
});

// Ruta Reservas
router.get('/reserva', (req, res) => {
  res.render('reservas', { title: 'Reserva' });
});

//Ruta Post Reserva
router.post('/reserva', (req, res) => {
    const todasLasReservas = req.app.locals.todasLasReservas;
    const datosRecibidos = req.body;
    todasLasReservas.push(datosRecibidos);

    console.log("¡Nueva reserva recibida!");
    console.table(datosRecibidos);
    console.log("--- Total de reservas en memoria ---");
    console.table(todasLasReservas);

   res.redirect('/listareservas');
});

//Ruta Lista Reservas
router.get('/listareservas', (req, res) => {
  const todasLasReservas = req.app.locals.todasLasReservas;
  res.render('listareservas', { title: 'Lista de Reservas', listaDeReservas: todasLasReservas });
});

// Ruta Contacto
router.get('/contacto', (req, res) => {
  res.render('contacto', { title: 'Contacto' });
});

module.exports = router;
