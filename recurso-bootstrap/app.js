const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const getConnection = require('./middleware/connection');

const cargaInicial = require('./middleware/carga');

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

app.use((req, res, next) => {
  res.locals.usuarioSesion = req.session.usuario || null;
  next();
});

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Get Connection
app.use(getConnection);

//Mirar carga inicial
app.use(cargaInicial);

// Rutas
const indexRoutes = require('./routes/index');
const vehiculosRoutes = require('./routes/vehiculos');
const reservasRoutes = require('./routes/reservas');
const concesionariosRoutes = require('./routes/concesionarios');
const usuariosRoutes = require('./routes/usuarios');
const concesionariosAjax = require('./routes/api/concesionarios');
const usuariosAjax = require('./routes/api/usuarios');
const vehiculosAjax = require('./routes/api/vehiculos');
const reservasAjax = require('./routes/api/reservas');
const cargaInicialRoutes = require('./routes/cargaInicial');

app.use('/', indexRoutes);
app.use('/vehiculos', vehiculosRoutes);
app.use('/reserva', reservasRoutes);
app.use('/concesionarios', concesionariosRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/api/concesionarios', concesionariosAjax);
app.use('/api/usuarios', usuariosAjax);
app.use('/api/vehiculos', vehiculosAjax);
app.use('/api/reservas', reservasAjax);
app.use('/carga-inicial', cargaInicialRoutes);

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
  }else if (req.accepts('json')) {
    return res.json({
        status,
        mensaje: mensajePublico,
        details: detalles
    });
  } else {
    return res.type('txt').send(`${status}: ${mensajePublico}`);
  }
});

// Server
app.listen(PORT, () => {
  console.log(`GestiFleet app running at http://localhost:${PORT}`);
});
