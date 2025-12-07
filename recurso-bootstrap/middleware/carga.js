module.exports = (req, res, next) => {
    // Lista de rutas del setup --> carga
    const rutasPermitidas = [
        '/carga-inicial/setup', 
        '/carga-inicial/paso1-concesionarios', 
        '/carga-inicial/paso2-vehiculos', 
        '/carga-inicial/paso3-usuarios',
        '/login',
        '/logout'
    ];

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

            // Si NO hay concesionarios, forzamos la carga incial
            if (rows[0].count === 0) {
                return res.redirect('/carga-inicial/setup');
            }

            next();
        });
    } else {
        next();
    }
};