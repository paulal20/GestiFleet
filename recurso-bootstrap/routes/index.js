const express = require('express');
const router = express.Router();
const { isGuest, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcrypt');
// npm install bcrypt
// npm install mysql2

const SALT_ROUNDS = 10;

// INICIO
router.get('/', (req, res) => {
  let nombre = "usted";
  if (req.session.usuario && req.session.usuario.nombre) {
    nombre = req.session.usuario.nombre;
  }

  const errorMessage = req.session.errorMessage;
  delete req.session.errorMessage;

  res.render('index', {
    title: 'Inicio',
    nombre,
    usuarioSesion: req.session.usuario,
    error: errorMessage || null
  });
});

// GET LOGIN
router.get('/login', isGuest, (req, res) => {
  const errorMessage = req.session.errorMessage;
  delete req.session.errorMessage;

  res.render('login', {
    title: 'Inicio de Sesión',
    error: errorMessage || null,
    usuarioSesion: req.session.usuario,
    mensaje: null
  });
});

// POST LOGIN
router.post('/login', isGuest, (req, res) => {
  const { email: correo, contrasenya: password, remember } = req.body;

  req.db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], (err, usuarios) => {
    if (err) {
      console.error('Error en el login (DB):', err);
      return res.status(500).render('login', {
        title: 'Inicio de Sesión',
        error: 'Error interno en el servidor',
        mensaje: null,
        email: correo
      });
    }

    const usuario = usuarios[0];
    if (!usuario) {
      return res.render('login', {
        title: 'Inicio de Sesión',
        usuarioSesion: req.session.usuario,
        error: 'Usuario no encontrado',
        mensaje: null
      });
    }

    if (!usuario.activo) {
      return res.render('login', {
        title: 'Inicio de Sesión',
        usuarioSesion: req.session.usuario,
        error: 'Tu cuenta está desactivada. Contacta con el administrador.',
        mensaje: null
      });
    }

    bcrypt.compare(password, usuario.contrasenya, (errBcrypt, esValida) => {
      if (errBcrypt) {
        console.error('Error bcrypt:', errBcrypt);
        return res.status(500).render('login', {
          title: 'Inicio de Sesión',
          error: 'Error al verificar credenciales',
          mensaje: null,
          email: correo
        });
      }

      if (!esValida) {
        return res.render('login', {
          title: 'Inicio de Sesión',
          error: 'Contraseña incorrecta',
          mensaje: null,
          email: correo
        });
      }

      if (remember) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      } else {
        req.session.cookie.maxAge = null;
      }

      req.session.usuario = {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        rol: usuario.rol,
        id_concesionario: usuario.id_concesionario
      };

      console.log("Usuario logueado:", usuario);

      if (usuario.rol === 'Admin') {
        req.session.usuario.rol = 'Admin';
      } else {
        req.session.usuario.rol = 'Empleado';
      }

      res.redirect('/');
    });
  });
});

// GET REGISTER
router.get('/register', isGuest, (req, res) => {
  res.render('register', { 
    title: 'Registro', 
    error: null, 
    formData: {},
    fieldErrors: {}
  });
});

// POST REGISTER
router.post('/register', isGuest, (req, res) => {
    // Recibimos los datos del cuerpo (JSON desde AJAX)
    const { nombre, apellido1, apellido2, email, confemail, contrasenya, telefono } = req.body;
    
    // Objeto para acumular errores de campos específicos
    const fieldErrors = {};
    
    // Nombre y Apellido1 obligatorios
    if (!nombre || nombre.trim().length < 3) fieldErrors.nombre = 'El nombre debe tener al menos 3 caracteres.';
    if (!apellido1 || apellido1.trim().length < 3) fieldErrors.apellido1 = 'El primer apellido debe tener al menos 3 caracteres.';
    // Apellido2 es opcional, pero si viene, validamos longitud mínima
    if (apellido2 && apellido2.trim().length > 0 && apellido2.trim().length < 3) {
        fieldErrors.apellido2 = 'El segundo apellido debe tener al menos 3 caracteres.';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gestifleet\.es|gestifleet\.com)$/;
    if (!email || !emailRegex.test(email)) fieldErrors.email = 'El formato del correo no es válido (@gestifleet.es/com).';
    
    if (email !== confemail) fieldErrors.confemail = 'Los correos no coinciden.';
    
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!contrasenya || !passRegex.test(contrasenya)) fieldErrors.contrasenya = 'La contraseña debe tener mín. 8 caracteres, mayúscula, minúscula, número y símbolo.';

    const telRegex = /^\d{9}$/; // Validamos 9 dígitos exactos para consistencia
    if (!telefono || !telRegex.test(telefono)) fieldErrors.telefono = 'El teléfono debe tener 9 dígitos numéricos.';

    // Si ya hay errores de formato, devolvemos respuesta y no consultamos la BD
    if (Object.keys(fieldErrors).length > 0) {
        return res.status(400).json({ 
            ok: false, 
            error: 'Por favor, revisa los campos marcados.', 
            fieldErrors 
        });
    }

    // --- 2. Validación de duplicados en BD ---
    req.db.query('SELECT correo, telefono FROM usuarios WHERE correo = ? OR telefono = ?', [email, telefono], (errCheck, rows) => {
        if (errCheck) {
            console.error("Error BD Check Register:", errCheck);
            return res.status(500).json({ ok: false, error: 'Error interno del servidor verificando datos.' });
        }

        if (rows.length > 0) {
            // Analizamos qué coincidió
            rows.forEach(row => {
                if (row.correo === email) fieldErrors.email = 'Este correo ya está registrado.';
                if (row.telefono === telefono) fieldErrors.telefono = 'Este teléfono ya está registrado.';
            });

            return res.status(400).json({ 
                ok: false, 
                error: 'Algunos datos ya existen en el sistema.', 
                fieldErrors 
            });
        }

        // --- 3. Hash e Inserción ---
        bcrypt.hash(contrasenya, SALT_ROUNDS, (errHash, hash) => {
            if (errHash) {
                return res.status(500).json({ ok: false, error: 'Error de seguridad procesando la contraseña.' });
            }

            // Construir nombre completo
            const nombreCompleto = [nombre, apellido1, apellido2].filter(Boolean).join(' ').trim();

            const sqlInsert = 'INSERT INTO usuarios (nombre, correo, contrasenya, rol, telefono, activo) VALUES (?, ?, ?, ?, ?, 1)';
            // Nota: id_concesionario queda NULL por defecto hasta que un admin lo asigne
            req.db.query(sqlInsert, [nombreCompleto, email, hash, 'Empleado', telefono], (errInsert, result) => {
                if (errInsert) {
                    console.error("Error BD Insert Register:", errInsert);
                    return res.status(500).json({ ok: false, error: 'Error interno al registrar el usuario.' });
                }

                // ÉXITO
                res.json({ ok: true, mensaje: 'Registro completado. Redirigiendo...' });
            });
        });
    });
});

// LOGOUT
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect('/');
  });
});

// CHECK-EMAIL
router.post('/check-email', (req, res) => {
  const { email } = req.body;

  req.db.query('SELECT * FROM usuarios WHERE correo = ?', [email], (err, usuarios) => {
    if (err) {
      console.error('Error en check-email:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    const usuario = usuarios[0];
    if (usuario) {
      return res.json({ exists: true });
    } else {
      return res.status(404).json({
        exists: false,
        message: "El correo electrónico no se encuentra registrado."
      });
    }
  });
});

// ADMINISTRAR
router.get('/administrar', isAdmin, (req, res) => {
  const usuario = req.session.usuario;
  if (!usuario || usuario.rol !== 'Admin') {
    req.session.errorMessage = 'No tienes permisos para acceder a esta página';
    return res.redirect('/login');
  }
  res.render('administrar', { title: 'Administración', usuario, usuarioSesion: req.session.usuario });
});

// ESTADÍSTICAS
router.get('/estadisticas', isAdmin, (req, res) => {
  const usuario = req.session.usuario;

  req.db.query(`SELECT COUNT(*) AS total_reservas FROM reservas`, (err1, rows1) => {
    if (err1) return res.status(500).render('error', { mensaje: 'Error al cargar estadísticas (1)' });
    const total_reservas = rows1[0].total_reservas;

    req.db.query(`
      SELECT 
          c.nombre AS concesionario,
          COUNT(r.id_reserva) AS total_reservas,
          c.id_concesionario
      FROM concesionarios c
      LEFT JOIN vehiculos v ON v.id_concesionario = c.id_concesionario
      LEFT JOIN reservas r ON r.id_vehiculo = v.id_vehiculo
      GROUP BY c.id_concesionario
      ORDER BY total_reservas DESC
    `, (err2, reservasPorConcesionario) => {
      if (err2) return res.status(500).render('error', { mensaje: 'Error al cargar estadísticas (2)' });

      req.db.query(`
        SELECT 
            v.marca,
            v.modelo,
            COUNT(r.id_reserva) AS total_reservas,
            v.id_vehiculo
        FROM vehiculos v
        LEFT JOIN reservas r ON r.id_vehiculo = v.id_vehiculo
        GROUP BY v.id_vehiculo
        ORDER BY total_reservas DESC
        LIMIT 1
      `, (err3, vehiculoMasUsadoRows) => {
        if (err3) return res.status(500).render('error', { mensaje: 'Error al cargar estadísticas (3)' });
        const vehiculoMasUsado = vehiculoMasUsadoRows[0] || null;

        req.db.query(`
          SELECT 
              DATE_FORMAT(fecha_inicio, '%Y-%m') AS mes,
              COUNT(*) AS total
          FROM reservas
          GROUP BY mes
          ORDER BY mes
        `, (err4, reservasPorMes) => {
          if (err4) return res.status(500).render('error', { mensaje: 'Error al cargar estadísticas (4)' });

          res.render('estadisticasAdmin', {
            title: 'Estadísticas',
            usuarioSesion: usuario,
            total_reservas,
            reservasPorConcesionario,
            vehiculoMasUsado,
            reservasPorMes,
          });
        });
      });
    });
  });
});

router.get('/contacto', (req, res) => {
  res.render('contacto', { title: 'Contacto', usuarioSesion: req.session.usuario });
});

module.exports = router;