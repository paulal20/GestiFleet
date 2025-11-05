const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { isGuest } = require('../middleware/auth');
// const bcrypt = require('bcrypt');
// npm install bcrypt

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

router.post('/login', isGuest, (req, res) => {
  const { email: correo, contrasenya: password } = req.body;
  // const { usuarios } = store; //req.app.locals.store


  const usuario = store.usuarios.find(u => u.correo === correo);
  if(!usuario){
    return res.render('login', {
      title: 'Inicio de Sesión',
      error: 'Usuario no encontrado',
      mensaje: null
    });
  }
  const esValida = password === usuario.password;
  // await bcrypt.compare(password, user.password);
  // try {
  //   const esValida = await bcrypt.compare(password, user.password);
  //   if(!esValida){
  //     return res.render('login', {error:'Contraseña incorrecta'});
  //   }
  // } catch(err) {
  //   console.error(err);
  //   return res.render('login', {error: 'Error interno en la validación'});
  // }
  if(!esValida){
   return res.render('login', {
      title: 'Inicio de Sesión',
      error: 'Contraseña incorrecta',
      mensaje: null
    });
  }
  req.session.usuario = usuario;

  res.redirect('/');
});

router.get('/register', isGuest, (req, res) => {
  res.render('register', { title: 'Registro' , error: null, concesionarios: store.concesionarios});
})

router.post('/register', isGuest, (req, res) => {
  const { email: correo, contrasenya: password } = req.body;
  const { usuarios } = store;

  console.log("¡Nuevo registro recibido!");
  console.table(req.body);

  const existe = usuarios.find(u => u.correo === correo);
  if(existe){
    return res.render('register', { title: 'Registro', error: 'El correo ya está registrado', concesionarios: store.concesionarios });
  }

  try {
    const hash = password;
    // const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const nuevoUser = {
      id_usuario: usuarios.length + 1,
      nombre: req.body.nombre,
      correo,
      password: hash,
      rol: 'empleado',
      id_concesionario: parseInt(req.body.concesionario)
    };

    usuarios.push(nuevoUser);
    //lo logeamos directamente?? o q tenga q hacer el login?
    req.session.usuario = nuevoUser

    console.table(store.usuarios);
    res.redirect('/');
  } catch(err) {
    console.error(err);
    res.render('register', { title: 'Registro', error: 'Error al registrar usuario', concesionarios: store.concesionarios });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect('/'); 
  });
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
