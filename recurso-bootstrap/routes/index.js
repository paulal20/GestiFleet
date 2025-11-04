const express = require('express');
const router = express.Router();
const store = require('../data/store');
// const bcrypt = require('bcrypt');
// npm install bcrypt

router.get('/', (req, res) => {
  let nombre = "usted"; // valor por defecto
  if(req.session.usuario && req.session.usuario.nombre) {
    nombre = req.session.usuario.nombre;
  }
  res.render('index', { title: 'Inicio', nombre });
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Inicio de Sesión' , error: null, mensaje: null});
})

router.post('/login', (req, res) => {
  const { email: correo, contrasenya: password } = req.body;
  // const { usuarios } = store; //req.app.locals.store


  const usuario = store.usuarios.find(u => u.correo === correo);
  if(!usuario){
    return res.render('login', {error: 'Usuario no encontrado'});
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
    return res.render('login', {error:'Contraseña incorrecta'});
  }
  req.session.usuario = usuario;

  res.redirect('/');
});

router.get('/register', (req, res) => {
  res.render('register', { title: 'Registro' , error: null});
})

router.post('/register', (req, res) => {
  const { email: correo, contrasenya: password } = req.body;
  const { usuarios } = store;

  console.log("¡Nuevo registro recibido!");
  console.table(req.body);

  const existe = usuarios.find(u => u.correo === correo);
  if(existe){
    return res.render('register', {error: 'El correo ya está registrado'});
  }

  try {
    const hash = password;
    // const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const nuevoUser = {
      nombre: req.body.nombre,
      correo,
      password: hash,
      rol: 'empleado',
      id_concesionario: req.body.concesionario
    };

    usuarios.push(nuevoUser);
    //lo logeamos directamente?? o q tenga q hacer el login?
    req.session.usuario = {
      nombre: nuevoUser.nombre,
      correo: nuevoUser.correo,
      rol: nuevoUser.rol,
      id_concesionario: nuevoUser.id_concesionario
    };

    console.table(store.usuarios);
    res.redirect('/');
  } catch(err) {
    console.error(err);
    res.render('register', { title: 'Registro', error: 'Error al registrar usuario' });
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
      return res.redirect('/login');
  }
  res.render('perfil', { title: 'Mi Información', usuario });
});


// --- Rutas Estáticas ---

router.get('/contacto', (req, res) => {
  res.render('contacto', { title: 'Contacto' });
});

module.exports = router;
