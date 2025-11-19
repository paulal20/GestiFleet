
function isAuth(req, res, next) {
    if (req.session.usuario) {
        return next();
    }
    req.session.errorMessage = 'Debes iniciar sesión para acceder a esa página.';
    res.redirect('/login');
}

function isGuest(req, res, next) {
    if (!req.session.usuario) {
        return next();
    }
    req.session.errorMessage = 'Ya tienes una sesión iniciada.';
    res.redirect('back');
}

function isAdmin(req, res, next) {
    if (req.session.usuario && req.session.usuario.rol === 'Admin') {
        return next();
    }
    req.session.errorMessage = 'Acceso denegado. Solo los administradores pueden hacer eso.';
    res.redirect('back');
}

function isAdminOrSelf(req, res, next) {
    if (!req.session.usuario) {
        req.session.errorMessage = 'Debes iniciar sesión para acceder a esa página.';
        return res.redirect('/login');
    }

    if (req.session.usuario.rol === 'Admin') {
        return next();
    }

    const paramId = parseInt(req.params.id, 10);
    const sessionId = req.session.usuario.id_usuario;

    if (!isNaN(paramId) && paramId === sessionId) {
        return next();
    }

    req.session.errorMessage = 'Acceso denegado. No tienes permisos para editar este perfil.';
    res.redirect('back');
}

async function isInstallationOrImport(req, res, next) {
    try {
        if (req.session.usuario && req.session.usuario.rol === 'Admin') {
            return next();
        }
        const [rows] = await req.db.query('SELECT count(*) as c FROM usuarios');
        
        if (rows[0].c === 0) {
            return next();
        }
        return res.status(403).json({ 
            exito: false, 
            mensaje: "Acceso denegado. No tienes permisos de administrador y el sistema ya está instalado." 
        });

    } catch (err) {
        console.error("Error en auth middleware:", err);
        return res.status(500).json({ exito: false, mensaje: "Error de servidor verificando permisos." });
    }
}

module.exports = {
    isAuth,
    isGuest,
    isAdmin,
    isAdminOrSelf,
    isInstallationOrImport
};

