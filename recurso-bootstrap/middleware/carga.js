module.exports = (req, res, next) => {
    // Lista blanca de rutas permitidas durante el setup
    const rutasPermitidas = [
        '/carga-inicial/setup', 
        '/carga-inicial/paso1-concesionarios', 
        '/carga-inicial/paso2-vehiculos', 
        '/carga-inicial/paso3-usuarios',
        '/login',
        '/logout'
    ];

    // Permitir recursos estáticos y rutas api internas si es necesario
    if (rutasPermitidas.includes(req.path) || 
        req.path.startsWith('/css') || 
        req.path.startsWith('/js') || 
        req.path.startsWith('/img')) {
        return next();
    }

    if (!req.session.usuario) {
        return next();
    }

    if (req.session.usuario.rol === 'Admin') {
        req.db.query('SELECT count(*) as count FROM concesionarios', (err, rows) => {
            if (err) return next(err);

            // Si NO hay concesionarios, forzamos ir al setup
            if (rows[0].count === 0) {
                return res.redirect('/carga-inicial/setup');
            }

            // Si hay datos, continuamos normal
            next();
        });
    } else {
        // Empleados pasan (verán su dashboard vacío o limitado)
        next();
    }
};