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

//---------------------PARTE NUEVA PARA LAB 7---------------------//
// Middleware GLOBAL para exponer el usuario a TODAS las vistas
app.use((req, res, next) => {
  // Guardamos el usuario de la sesión (si existe) en res.locals
  // 'res.locals' hace que la variable 'usuario' esté disponible
  // automáticamente en todas tus plantillas EJS
  res.locals.usuario = req.session.usuario || null;
  next();
});
//-------------------FIN PARTE NUEVA PARA LAB 7-------------------//

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

//Sacar los datos del store
const store = require('./data/store');
app.locals.store = store;

// --- Rutas ---
const indexRoutes = require('./routes/index');
const vehiculosRoutes = require('./routes/vehiculos');
const reservasRoutes = require('./routes/reservas');
const apiRoutes = require('./routes/api');

app.use('/', indexRoutes);
app.use('/vehiculos', vehiculosRoutes);
app.use('/reserva', reservasRoutes);
app.use('/api', apiRoutes);

// Forzar error 500
app.get('/error', (req, res, next) => {
    next(new Error('Error forzado para probar error 500'));
});

// 404 y manejador de errores
app.use((req, res, next) => {
  const err404 = new Error(`Ruta ${req.originalUrl} no encontrada`);
  err404.status = 404;
  err404.publicMessage = 'La página que buscas no existe.';
  err404.expose = true;
  next(err404);
});

// Manejador de errores genérico
app.use((err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err);

  const status = err.status || 500;
  res.status(status);

  let mensajePublico;
  if (err.expose && err.publicMessage) mensajePublico = err.publicMessage;
  else if (err.expose) mensajePublico = err.message;
  else if (status === 404) mensajePublico = 'No se ha encontrado la página solicitada.';
  else mensajePublico = 'Ha ocurrido un error en el servidor. Por favor, inténtalo más tarde.';

  //----------------------------------------No sé si esto sobra----------------------------------------//
  const canShowDetails = (process.env.NODE_ENV !== 'production') && !!err.showStack;
  const detalles = canShowDetails ? (err.stack || String(err)) : null;
  //----------------------------------------No sé si esto sobra----------------------------------------//

  if (req.accepts('html')) {
      return res.render('error', {
          status,
          mensaje: mensajePublico,
          details: detalles,
          url: req.originalUrl
      });
  }
});

// Server
app.listen(PORT, () => {
  console.log(`GestiFleet app running at http://localhost:${PORT}`);
});
