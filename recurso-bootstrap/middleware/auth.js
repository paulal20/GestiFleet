
function isAuth(req, res, next) {
    
    if (req.session.usuario) {
        return next();
    }

    req.session.errorMessage = 'Debes iniciar sesión para acceder a esa página.';
    
    res.redirect('/login');
}

function isAdmin(req, res, next) {
    if (req.session.usuario && req.session.usuario.rol === 'admin') {
        return next();
    }

    req.session.errorMessage = 'Acceso denegado. Solo los administradores pueden hacer eso.';
    
    res.redirect('/');
}

module.exports = {
    isAuth,
    isAdmin
};

