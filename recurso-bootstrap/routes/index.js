const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'Inicio' });
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Inicio de Sesión' });
})

router.post('/login', (req, res) => {
  const { correo, password } = req.body;
  const { usuarios } = req.app.locals.store;

  // --- ¡AQUÍ EMPIEZA EL LAB 7! ---
  // 1. Buscar el usuario en el array 'usuarios'
  // 2. Comparar la contraseña (con bcrypt en el futuro)
  // 3. Si es correcto, guardar usuario en req.session.usuario
  // 4. Redirigir al inicio
  // 5. Si es incorrecto, mostrar mensaje de error en la vista de login

  console.log("¡Nuevo login recibido!");
  console.table(req.body);

  res.redirect('/login'); // Temporal, redirigir a '/' si es exitoso
});

// GET /registro (Próximo paso LAB 7)
// router.get('/registro', (req, res) => { ... });

// POST /registro (Próximo paso LAB 7)
// router.post('/registro', (req, res) => { ... });

// GET /logout (Próximo paso LAB 7)
// router.get('/logout', (req, res) => { ... });


// --- Rutas Estáticas ---

router.get('/contacto', (req, res) => {
  res.render('contacto', { title: 'Contacto' });
});

module.exports = router;
