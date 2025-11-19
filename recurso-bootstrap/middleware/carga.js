module.exports = async (req, res, next) => {
    const rutasPermitidas = [
        '/carga-inicial/setup', 
        '/carga-inicial/previsualizar-importacion', 
        '/carga-inicial/ejecutar-importacion'
    ];

    if (rutasPermitidas.includes(req.path) || 
        req.path.startsWith('/css') || 
        req.path.startsWith('/js') || 
        req.path.startsWith('/img')) {
        return next();
    }

    try {
        const [rows] = await req.db.query('SELECT count(*) as count FROM usuarios');
        if (rows[0].count === 0) {
            return res.redirect('/carga-inicial/setup');
        }
        next();
    } catch (err) {
        next(err);
    }
};