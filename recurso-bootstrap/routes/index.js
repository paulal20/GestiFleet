const express = require('express');
const router = express.Router();
const { isGuest } = require('../middleware/auth');
const bcrypt = require('bcrypt');
// npm install bcrypt
// npm install mysql2

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
    error: errorMessage || null
  });
});

router.get('/login', isGuest, (req, res) => {
 const errorMessage = req.session.errorMessage;
 delete req.session.errorMessage;

 res.render('login', { 
  title: 'Inicio de Sesión', 
  error: errorMessage || null,
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
    error: 'Usuario no encontrado',
    mensaje: null
   });
  }

  const esValida = await bcrypt.compare(password, usuario.contrasenya);
  if(!esValida){
   return res.render('login', {
    title: 'Inicio de Sesión',
    error: 'Contraseña incorrecta',
    mensaje: null
   });
  }
  if (remember) {
   req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  } else {
   req.session.cookie.maxAge = null;
  }
  req.session.usuario = usuario;
  console.log(usuario.rol);

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
      mensaje: null
    });
 }
});

router.get('/register', isGuest, async (req, res) => {
 try{
  const [concesionarios] = await req.db.query('SELECT * FROM concesionarios');
  res.render('register', { title: 'Registro' , error: null, concesionarios});

 } catch(err){
  console.error('Error al cargar los concesionarios:', err);
  return res.status(500).render('register', { title: 'Registro', error: 'Error interno en el servidor', concesionarios: [] });
 }
})

router.post('/register', isGuest, async (req, res) => {
 const { email: correo, contrasenya: password, concesionario, nombre, telefono } = req.body;
  let concesionarios = []; 
 try{
  const [usuarios] = await req.db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
  [concesionarios] = await req.db.query('SELECT * FROM concesionarios');
  
    if(usuarios.length > 0){
   return res.render('register', { title: 'Registro', error: 'El correo ya está registrado', concesionarios});
  }
  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  const [result] = await req.db.query(
   'INSERT INTO usuarios (nombre, correo, contrasenya, rol, telefono, id_concesionario) VALUES (?, ?, ?, ?, ?, ?)', 
   [nombre, correo, hash, 'Empleado', telefono, parseInt(concesionario)]
  );

  const [nuevoUsuario] = await req.db.query('SELECT * FROM usuarios WHERE id_usuario = ?', [result.insertId]);
  req.session.usuario = nuevoUsuario[0];
  req.session.usuario.rol = 'Empleado';
  res.redirect('/');
 } catch(err) {
    console.error('Error en el registro:', err);
    return res.status(500).render('register', { title: 'Registro', error: 'Error interno en el servidor', concesionarios: concesionarios });
 }
});

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

router.get('/perfil', (req, res) => {
  const usuario = req.session.usuario;
  if (!usuario) {
    req.session.errorMessage = 'Debes iniciar sesión para ver tu perfil';
    return res.redirect('/login');
  }
  res.render('perfil', { title: 'Mi Información', usuario });
});


// --- Rutas Estáticas ---

router.get('/contacto', (req, res) => {
  res.render('contacto', { title: 'Contacto' });
});

module.exports = router;
