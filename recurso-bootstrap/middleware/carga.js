module.exports = (req, res, next) => {
    const rutasPermitidas = [
        '/carga-inicial/setup', 
        '/carga-inicial/previsualizar', 
        '/carga-inicial/ejecutar'
    ];

    // Esta parte es síncrona, se queda igual
    if (rutasPermitidas.includes(req.path) || 
        req.path.startsWith('/css') || 
        req.path.startsWith('/js') || 
        req.path.startsWith('/img')) {
        return next();
    }

    // CAMBIO: Sustituimos await por callback
    req.db.query('SELECT count(*) as count FROM usuarios', (err, rows) => {
        // 1. Manejo de errores
        if (err) {
            return next(err);
        }

        // 2. Lógica de negocio dentro del callback
        // En mysql2 estándar, 'rows' es un array de resultados directos
        if (rows && rows.length > 0 && rows[0].count === 0) {
            return res.redirect('/carga-inicial/setup');
        }

        // 3. Continuar si hay usuarios
        next();
    });
};