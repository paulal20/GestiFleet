
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'gestifleet',
    resave: false,
    saveUninitialized: false
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(expressLayouts);
app.set('layout', 'layout'); 

// Simulated database (in-memory)
const usuarios = [
    { username: 'admin', password: 'admin' }
];
app.locals.usuarios = usuarios;

const productos = require('./data/productos.json');
const productosDetalle = require('./data/productos_detalle.json');
app.locals.productos = productos;
app.locals.productosDetalle = productosDetalle;

const todasLasReservas = [];
app.locals.todasLasReservas = todasLasReservas;

// Routes
const mainRoutes = require('./routes/index');
app.use('/', mainRoutes);

// Ruta que genera un error para probar error 500
app.get('/error', (req, res, next) => {
    next(new Error('Error forzado para probar error 500'));
  });
  
// 404: captura rutas no encontradas y las transforma en Error para pasar al handler central
app.use((req, res, next) => {
  const err404 = new Error(`Ruta ${req.originalUrl} no encontrada`);
  err404.status = 404;
  // err404.expose = true -> ruta inexistente es info segura para usuario
  err404.expose = true;
  // opcional: mensaje público distinto al message técnico
  err404.publicMessage = `La página que buscas no existe.`;
  next(err404);
});

// Error handler central (middleware con 4 args) — sigue el patrón del PDF
app.use((err, req, res, next) => {
  // 1) logging completo siempre en servidor (stack para depuración)
  console.error(err && err.stack ? err.stack : err);

  // 2) status (por defecto 500)
  const status = err.status || 500;
  res.status(status);

  // 3) decidir mensaje público:
  //    - si err.expose === true y existe err.publicMessage -> mostrar ese texto
  //    - si err.expose === true y no hay publicMessage -> mostrar err.message
  //    - en caso contrario, mostrar mensaje genérico según status (no leak de internals)
  let mensajePublico;
  if (err.expose && err.publicMessage) mensajePublico = err.publicMessage;
  else if (err.expose) mensajePublico = err.message;
  else if (status === 404) mensajePublico = 'No se ha encontrado la página solicitada.';
  else mensajePublico = 'Ha ocurrido un error en el servidor. Por favor, inténtalo más tarde.';

  // 4) decidir si mostramos detalles técnicos (solo en desarrollo y si explícitamente lo pides)
  const canShowDetails = (process.env.NODE_ENV !== 'production') && !!err.showStack;
  const detalles = canShowDetails ? (err.stack || String(err)) : null;

  // 5) content negotiation: HTML / JSON / TXT
  if (req.accepts('html')) {
    const vista = status === 404 ? 'error404' : 'error500';
    return res.render(vista, {
      title: status === 404 ? 'Página no encontrada' : 'Error interno del servidor',
      status,
      mensaje: mensajePublico,
      details: detalles
    });
  }

  if (req.accepts('json')) {
    const payload = { error: mensajePublico };
    if (detalles) payload.stack = detalles;
    return res.json(payload);
  }

  // fallback texto
  res.type('txt').send(mensajePublico);
});


// Server
app.listen(PORT, () => {
    console.log(`GestiFleet app running at http://localhost:${PORT}`);
});

