const express = require('express');
const router = express.Router();
const { isGuest, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcrypt');
// npm install bcrypt
// npm install mysql2

/*
VALIDACIONES A METER:
- Q UN USUARIO NO PUEDA RESERVAR MÁS DE UN COCHE EN UN MISMO PERIODO DE TIEMPO
*/

const SALT_ROUNDS = 10;

router.get('/', (req, res) => {
 let nombre = "usted"; // valor por defecto
 if(req.session.usuario && req.session.usuario.nombre) {
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

router.get('/login', isGuest, (req, res) => {
 const errorMessage = req.session.errorMessage;
 delete req.session.errorMessage;

 res.render('login', { 
  title: 'Inicio de Sesión', 
  error: errorMessage || null,
  usuarioSesion: req.session.usuario,
  mensaje: null
 });
})

// async function generarHash() {
//  const hash = await bcrypt.hash("Admin^12", SALT_ROUNDS);
//  console.log(hash);
// }
// generarHash();

router.post('/login', isGuest, async (req, res) => {
 const { email: correo, contrasenya: password, remember } = req.body;
 try{
  const [usuarios] = await req.db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
  const usuario = usuarios[0];
  if(!usuario){
   return res.render('login', {
    title: 'Inicio de Sesión',
    usuarioSesion: req.session.usuario,
    error: 'Usuario no encontrado',
    mensaje: null
   });
  }

  const esValida = await bcrypt.compare(password, usuario.contrasenya);
  if(!esValida){
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

  console.log(usuario);

  if(usuario.rol === 'Admin'){
    req.session.usuario.rol = 'Admin';
  } else {
    req.session.usuario.rol = 'Empleado';
  }
  res.redirect('/');
 } catch(err){
  console.error('Error en el login:', err);
  return res.status(500).render('login',{ 
    title: 'Inicio de Sesión', 
    error: 'Error interno en el servidor', 
    mensaje: null,
    email: correo
  });
 }
});

// router.get('/register', isGuest, async (req, res) => {
//  try{
//   const [concesionarios] = await req.db.query('SELECT * FROM concesionarios');
//   res.render('register', { title: 'Registro' , error: null, concesionarios});

//  } catch(err){
//   console.error('Error al cargar los concesionarios:', err);
//   return res.status(500).render('register', { title: 'Registro de usuario', error: 'Error interno en el servidor', concesionarios: [] });
//  }
// })

// router.post('/register', isGuest, async (req, res) => {
//  const formData = { ...req.body };
//  const { email: correo, confemail, contrasenya, concesionario, nombre, apellido1, apellido2, telefono } = formData;
//  let concesionarios = []; 

//  try {
//   [concesionarios] = await req.db.query('SELECT * FROM concesionarios');
  
//   const fieldErrors = {};

//   if (!nombre || nombre.trim().length < 3) {
//    fieldErrors.nombre = 'El nombre debe tener al menos 3 caracteres.';
//   }
//   if (!apellido1 || apellido1.trim().length < 3) {
//    fieldErrors.apellido1 = 'El primer apellido debe tener al menos 3 caracteres.';
//   }
//   const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//   if (!correo || !emailRegex.test(correo)) {
//    fieldErrors.email = 'El formato del correo no es válido.';
//   }
//   if (correo !== confemail) {
//    fieldErrors.confemail = 'Los correos no coinciden.';
//   }
//   const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
//   if (!contrasenya || !passRegex.test(contrasenya)) {
//    fieldErrors.contrasenya = 'La contraseña debe tener mín. 8 caracteres, una mayúscula, un número y un símbolo.';
//   }
//   const telRegex = /^[0-9]{9,15}$/;
//   if (!telefono || !telRegex.test(telefono)) {
//    fieldErrors.telefono = 'El teléfono debe tener entre 9 y 15 números.';
//   }
//   if (!concesionario || concesionario === "") {
//    fieldErrors.concesionario = 'Debe seleccionar un concesionario.';
//   }

//   if (!fieldErrors.email) {
//    const [usuarios] = await req.db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
//    if(usuarios.length > 0){
//     fieldErrors.email = 'El correo ya está registrado';
//    }
//   }
//   if (!fieldErrors.telefono) {
//    const [telefonos] = await req.db.query('SELECT * FROM usuarios WHERE telefono = ?', [telefono]);
//    if(telefonos.length > 0){
//     fieldErrors.telefono = 'El teléfono ya está registrado';
//    }
//   }

//   if (Object.keys(fieldErrors).length > 0) {
   
//    formData.contrasenya = '';
   
//    if (fieldErrors.email || fieldErrors.confemail) {
//     formData.email = '';
//     formData.confemail = '';
//    }
//    if (fieldErrors.telefono) {
//     formData.telefono = '';
//    }
//    if (fieldErrors.nombre) formData.nombre = '';
//    if (fieldErrors.apellido1) formData.apellido1 = '';

//    return res.status(400).render('register', { 
//     title: 'Registro de usuario', 
//     error: 'El correo o el teléfono ya están registrados', 
//     concesionarios,
//     formData
//    });
//   }
//   const hash = await bcrypt.hash(password, SALT_ROUNDS);

//   const [result] = await req.db.query(
//    'INSERT INTO usuarios (nombre, correo, contrasenya, rol, telefono, id_concesionario) VALUES (?, ?, ?, ?, ?, ?)', 
//    [nombre, correo, hash, 'Empleado', telefono, parseInt(concesionario)]
//   );

//   // const [nuevoUsuario] = await req.db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [result.insertId]);
//   // req.session.usuario = nuevoUsuario[0];
//   // req.session.usuario.rol = 'Empleado';
//   res.redirect('/listaUsuarios'); 

//  } catch(err) {
//    console.error('Error en el registro:', err);
//    if (concesionarios.length === 0) {
//     try {
//      [concesionarios] = await req.db.query('SELECT * FROM concesionarios');
//     } catch (dbErr) {}
//    }
   
//    return res.status(500).render('register', { 
//     title: 'Registro de usuario', 
//     error: 'Error interno en el servidor', 
//     concesionarios: concesionarios,
//     formData: req.body
//    });
//  }
// });

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) console.error(err);
        res.redirect('/'); 
  });
});

router.post('/check-email', async (req, res) => {
 const { email } = req.body;
 
  try {
    const [usuarios] = await req.db.query('SELECT * FROM usuarios WHERE correo = ?', [email]);
    const usuario = usuarios[0];

    if (usuario) {
    return res.json({ exists: true });
    } else {
    return res.status(404).json({ 
      exists: false, 
      message: "El correo electrónico no se encuentra registrado." 
    });
    }
  } catch (err) {
    console.error('Error en check-email:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/perfil', async (req, res) => {
  const usuario = req.session.usuario;
  if (!usuario) {
    req.session.errorMessage = 'Debes iniciar sesión para ver tu perfil';
    return res.redirect('/login');
  }

  const [usuarios] = await req.db.query(`
      SELECT u.*, c.nombre AS nombre_concesionario
      FROM usuarios u
      LEFT JOIN concesionarios c ON u.id_concesionario = c.id_concesionario
      WHERE u.id_usuario = ?
    `, [usuario.id_usuario]);
    
  if (usuarios.length === 0) {
      return res.status(404).render('error', { mensaje: 'Usuario no encontrado.' });
    }
  const usuarioDetalle = usuarios[0];
  res.render('perfil', { title: 'Mi Información', usuario: usuarioDetalle, lista: false, usuarioSesion: usuario });
});

router.get('/administrar', isAdmin, (req, res) => {
  const usuario = req.session.usuario;
  if (!usuario || usuario.rol !== 'Admin') {
    req.session.errorMessage = 'No tienes permisos para acceder a esta página';
    return res.redirect('/login');
  }
  res.render('administrar', { title: 'Administración', usuario, usuarioSesion: req.session.usuario });
});

router.get('/estadisticas', isAdmin, async (req, res) => {
  try {
    const usuario = req.session.usuario;

    // Total de reservas
    const [[{ total_reservas }]] = await req.db.query(`
      SELECT COUNT(*) AS total_reservas FROM reservas
    `);

    // Reservas por concesionario
    const [reservasPorConcesionario] = await req.db.query(`
      SELECT 
          c.nombre AS concesionario,
          COUNT(r.id_reserva) AS total_reservas,
          c.id_concesionario
      FROM concesionarios c
      LEFT JOIN vehiculos v ON v.id_concesionario = c.id_concesionario
      LEFT JOIN reservas r ON r.id_vehiculo = v.id_vehiculo
      GROUP BY c.id_concesionario
      ORDER BY total_reservas DESC
    `);

    // Vehículo más usado
    const [vehiculoMasUsado] = await req.db.query(`
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
    `);

    // Reservas por mes (YYYY-MM)
    const [reservasPorMes] = await req.db.query(`
      SELECT 
          DATE_FORMAT(fecha_inicio, '%Y-%m') AS mes,
          COUNT(*) AS total
      FROM reservas
      GROUP BY mes
      ORDER BY mes
    `);

    res.render('estadisticasAdmin', {
      title: 'Estadísticas',
      usuarioSesion: usuario,
      total_reservas,
      reservasPorConcesionario,
      vehiculoMasUsado: vehiculoMasUsado[0] || null,
      reservasPorMes,
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('error', { mensaje: 'Error al cargar estadísticas' });
  }
});



// --- Rutas Estáticas ---

router.get('/contacto', (req, res) => {
  res.render('contacto', { title: 'Contacto', usuarioSesion: req.session.usuario });
});

module.exports = router;
