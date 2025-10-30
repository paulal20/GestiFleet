const express = require('express');
const router = express.Router();

// Ruta Home
router.get('/', (req, res) => {
  res.render('index', { title: 'Inicio' });
});
  
// const vehiculos = [
//       { id:1, nombre: 'byd_seal1', marca: 'BYD SEAL', descripcion: 'Sedán eléctrico moderno con diseño aerodinámico y rendimiento eficiente para ciudad y carretera.', tipo: 'coche', precio: '40.000' },
//       { id:2, nombre: 'byd_seal2', marca: 'BYD SEAL', descripcion: 'Sedán eléctrico eficiente con interiores tecnológicos y autonomía optimizada.', tipo: 'coche', precio: '42.000' },
//       { id:3, nombre: 'byd_seal3', marca: 'BYD SEAL', descripcion: 'Versión deportiva con prestaciones mejoradas y diseño elegante.', tipo: 'coche', precio: '45.000' },
//       { id:4, nombre: 'tesla1', marca: 'Tesla', descripcion: 'Sedán eléctrico de lujo con aceleración impresionante y tecnología avanzada.', tipo: 'coche', precio: '95.000' },
//       { id:5, nombre: 'tesla2', marca: 'Tesla', descripcion: 'Versión con interiores premium y sistema de conducción autónoma.', tipo: 'coche', precio: '98.000' },
//       { id:6, nombre: 'tesla3', marca: 'Tesla', descripcion: 'Modelo con batería de larga duración y autonomía extendida.', tipo: 'coche', precio: '100.000' },
//       { id:7, nombre: 'tesla4', marca: 'Tesla', descripcion: 'Edición deportiva con máxima aceleración y diseño moderno.', tipo: 'coche', precio: '105.000' },
//       { id:8, nombre: 'tesla5', marca: 'Tesla', descripcion: 'Versión urbana con eficiencia energética optimizada.', tipo: 'coche', precio: '92.000' },
//       { id:9, nombre: 'tesla6', marca: 'Tesla', descripcion: 'Modelo familiar con tecnología de asistencia y confort superior.', tipo: 'coche', precio: '97.000' },
//       { id:10, nombre: 'volvo1', marca: 'Volvo', descripcion: 'SUV seguro y confortable con interior espacioso y tecnología de asistencia.', tipo: 'suv', precio: '70.000' },
//       { id:11, nombre: 'volvo2', marca: 'Volvo', descripcion: 'Versión avanzada con sistemas de seguridad de última generación.', tipo: 'suv', precio: '72.000' },
//       { id:12, nombre: 'volvo3', marca: 'Volvo', descripcion: 'SUV premium con interiores amplios y acabados de lujo.', tipo: 'suv', precio: '75.000' },
//       { id:13, nombre: 'VW1', marca: 'Volkswagen', descripcion: 'Compacto eficiente y versátil, ideal para la ciudad y viajes familiares.', tipo: 'suv', precio: '62.000' },
//       { id:14, nombre: 'VW2', marca: 'Volkswagen', descripcion: 'Versión con diseño moderno y prestaciones equilibradas.', tipo: 'suv', precio: '64.000' },
//       { id:15, nombre: 'VW3', marca: 'Volkswagen', descripcion: 'Modelo urbano con eficiencia energética optimizada.', tipo: 'suv', precio: '66.000' },
//       { id:16, nombre: 'VW4', marca: 'Volkswagen', descripcion: 'Edición deportiva con mayor potencia y estilo moderno.', tipo: 'suv', precio: '68.000' },
//       { id:17, nombre: 'VW5', marca: 'Volkswagen', descripcion: 'Versión familiar con espacio extra y confort superior.', tipo: 'suv', precio: '70.000' }
//     ];

const vehiculos = [
  { id: 1, nombre: 'byd_seal1', marca: 'BYD', modelo: 'Seal 1', anyo: 2023, descripcion: 'Sedán eléctrico moderno con diseño aerodinámico y rendimiento eficiente para ciudad y carretera.', tipo: 'coche', precio: '40.000' },
  { id: 2, nombre: 'byd_seal2', marca: 'BYD', modelo: 'Seal 2', anyo: 2023, descripcion: 'Sedán eléctrico eficiente con interiores tecnológicos y autonomía optimizada.', tipo: 'coche', precio: '42.000' },
  { id: 3, nombre: 'byd_seal3', marca: 'BYD', modelo: 'Seal 3', anyo: 2024, descripcion: 'Versión deportiva con prestaciones mejoradas y diseño elegante.', tipo: 'coche', precio: '45.000' },
  { id: 4, nombre: 'tesla1', marca: 'Tesla', modelo: 'Model S', anyo: 2023, descripcion: 'Sedán eléctrico de lujo con aceleración impresionante y tecnología avanzada.', tipo: 'coche', precio: '95.000' },
  { id: 5, nombre: 'tesla2', marca: 'Tesla', modelo: 'Model 3', anyo: 2024, descripcion: 'Versión con interiores premium y sistema de conducción autónoma.', tipo: 'coche', precio: '98.000' },
  { id: 6, nombre: 'tesla3', marca: 'Tesla', modelo: 'Model X', anyo: 2023, descripcion: 'Modelo con batería de larga duración y autonomía extendida.', tipo: 'coche', precio: '100.000' },
  { id: 7, nombre: 'tesla4', marca: 'Tesla', modelo: 'Model Y', anyo: 2024, descripcion: 'Edición deportiva con máxima aceleración y diseño moderno.', tipo: 'coche', precio: '105.000' },
  { id: 8, nombre: 'tesla5', marca: 'Tesla', modelo: 'Model 3 Urban', anyo: 2023, descripcion: 'Versión urbana con eficiencia energética optimizada.', tipo: 'coche', precio: '92.000' },
  { id: 9, nombre: 'tesla6', marca: 'Tesla', modelo: 'Model X Family', anyo: 2024, descripcion: 'Modelo familiar con tecnología de asistencia y confort superior.', tipo: 'coche', precio: '97.000' },
  { id: 10, nombre: 'volvo1', marca: 'Volvo', modelo: 'XC90', anyo: 2023, descripcion: 'SUV seguro y confortable con interior espacioso y tecnología de asistencia.', tipo: 'suv', precio: '70.000' },
  { id: 11, nombre: 'volvo2', marca: 'Volvo', modelo: 'XC90 Advanced', anyo: 2024, descripcion: 'Versión avanzada con sistemas de seguridad de última generación.', tipo: 'suv', precio: '72.000' },
  { id: 12, nombre: 'volvo3', marca: 'Volvo', modelo: 'XC90 Premium', anyo: 2023, descripcion: 'SUV premium con interiores amplios y acabados de lujo.', tipo: 'suv', precio: '75.000' },
  { id: 13, nombre: 'VW1', marca: 'Volkswagen', modelo: 'T-Cross', anyo: 2023, descripcion: 'Compacto eficiente y versátil, ideal para la ciudad y viajes familiares.', tipo: 'suv', precio: '62.000' },
  { id: 14, nombre: 'VW2', marca: 'Volkswagen', modelo: 'T-Roc', anyo: 2024, descripcion: 'Versión con diseño moderno y prestaciones equilibradas.', tipo: 'suv', precio: '64.000' },
  { id: 15, nombre: 'VW3', marca: 'Volkswagen', modelo: 'Tiguan', anyo: 2023, descripcion: 'Modelo urbano con eficiencia energética optimizada.', tipo: 'suv', precio: '66.000' },
  { id: 16, nombre: 'VW4', marca: 'Volkswagen', modelo: 'Tiguan Sport', anyo: 2024, descripcion: 'Edición deportiva con mayor potencia y estilo moderno.', tipo: 'suv', precio: '68.000' },
  { id: 17, nombre: 'VW5', marca: 'Volkswagen', modelo: 'Tiguan Family', anyo: 2023, descripcion: 'Versión familiar con espacio extra y confort superior.', tipo: 'suv', precio: '70.000' }
];



// Ruta Vehículos (con filtro por tipo)
router.get('/vehiculos', (req, res) => {
  const { tipo } = req.query;

  const filtro = tipo
    ? vehiculos.filter(v => v.tipo.toLowerCase() === tipo.toLowerCase())
    : vehiculos;

  const tiposDisponibles = [...new Set(vehiculos.map(v => v.tipo))];

  //vehiculos: la lista de los vehiculos con el filtro aplicado
  //tiposDisponibles: para que salga en el desplegable del filtro
  res.render('vehiculos', { title: 'Vehículos', vehiculos: filtro, tiposDisponibles });
});

router.get('/vehiculos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const vehiculo = vehiculos.find(v => v.id === id);

  if (!vehiculo) {
    return res.status(404).render('error404', { mensaje: 'Vehículo no encontrado' });
  }

  res.render('vehiculoDetalle', { vehiculo });
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
