const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt'); // Asegúrate de tenerlo importado
const getConnection = require('./middleware/connection');
const cargaInicial = require('./middleware/carga'); // Tu middleware de protección

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básicos
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' })); // Aumentamos límite por si el JSON es grande
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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

app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// DB Connection middleware
app.use(getConnection);

// --- SEEDER AUTOMÁTICO DE ADMINISTRADOR ---
// Esto se ejecuta en cada petición para asegurar que existe, 
// o podrías ponerlo solo al arrancar el servidor si prefieres.
app.use((req, res, next) => {
    const ADMIN_DEFAULT = {
        nombre: "Administrador Jefe",
        correo: "admin@gestifleet.com",
        pass_plana: "Admin^12",
        rol: "Admin",
        telefono: "111111111"
    };

    req.db.query('SELECT count(*) as count FROM usuarios', (err, rows) => {
        if (err) return next(err); // Si falla la BD, pasamos error

        if (rows[0].count === 0) {
            console.log("Detectada BD de usuarios vacía. Creando Administrador base...");
            bcrypt.hash(ADMIN_DEFAULT.pass_plana, 10, (errHash, hash) => {
                if (errHash) return next(errHash);
                
                // Insertamos el admin (sin concesionario)
                req.db.query(
                    `INSERT INTO usuarios (nombre, correo, contrasenya, rol, telefono, activo) VALUES (?, ?, ?, ?, ?, 1)`,
                    [ADMIN_DEFAULT.nombre, ADMIN_DEFAULT.correo, hash, ADMIN_DEFAULT.rol, ADMIN_DEFAULT.telefono],
                    (errInsert) => {
                        if (errInsert) console.error("Error creando admin base:", errInsert);
                        else console.log("Administrador base creado correctamente.");
                        next();
                    }
                );
            });
        } else {
            next();
        }
    });
});

// Middleware de Carga Inicial (Redirección si faltan datos)
app.use(cargaInicial);

// Rutas
const indexRoutes = require('./routes/index');
const vehiculosRoutes = require('./routes/vehiculos');
const reservasRoutes = require('./routes/reservas');
const concesionariosRoutes = require('./routes/concesionarios');
const usuariosRoutes = require('./routes/usuarios');
// APIs
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

// Manejo de errores
app.get('/error', (req, res, next) => next(new Error('Error forzado')));

app.use((req, res, next) => {
  const err = new Error(`Ruta ${req.originalUrl} no encontrada`);
  err.status = 404;
  err.publicMessage = 'La página que buscas no existe.';
  next(err);
});

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  const status = err.status || 500;
  const mensaje = err.publicMessage || 'Ha ocurrido un error en el servidor.';
  
  if (req.accepts('html')) {
    res.status(status).render('error', { status, mensaje, details: null, url: req.originalUrl });
  } else {
    res.status(status).json({ ok: false, error: mensaje });
  }
});

app.listen(PORT, () => {
  console.log(`GestiFleet app running at http://localhost:${PORT}`);
});