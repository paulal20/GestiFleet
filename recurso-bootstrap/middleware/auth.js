
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
    res.redirect('/');
}

function isAdmin(req, res, next) {
    if (req.session.usuario && req.session.usuario.rol === 'Admin') {
        return next();
    }
    req.session.errorMessage = 'Acceso denegado. Solo los administradores pueden hacer eso.';
    res.redirect('/');
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

    req.session.errorMessage = 'Acceso denegado. No tienes permisos para ver este perfil.';
    res.redirect('back');
}

function isInstallationOrImport(req, res, next) {
    if (req.session.usuario && req.session.usuario.rol === 'Admin') {
        return next();
    }

    req.db.query('SELECT count(*) as c FROM usuarios', (err, rows) => {
        if (err) {
            console.error("Error en auth middleware:", err);
            return res.status(500).json({ exito: false, mensaje: "Error de servidor verificando permisos." });
        }

        if (rows[0].c === 0) {
            return next();
        }

        return res.status(403).json({ 
            exito: false, 
            mensaje: "Acceso denegado. No tienes permisos de administrador y el sistema ya está instalado." 
        });
    });
}

function isAdminOrWorker(req, res, next) {
    if (!req.session.usuario) {
        req.session.errorMessage = 'Debes iniciar sesión para acceder a esa página.';
        return res.redirect('/login');
    }

    if (req.session.usuario.rol === 'Admin') {
        return next();
    }

    const concesionarioIdRuta = parseInt(req.params.id, 10);
    const concesionarioIdUsuario = req.session.usuario.id_concesionario;

    if (!isNaN(concesionarioIdRuta) && concesionarioIdUsuario === concesionarioIdRuta) {
        return next();
    }

    req.session.errorMessage = 'Acceso denegado. No trabajas en este concesionario.';
    res.redirect('/');
}

function isEmpty(req, res, next) {
    if (!req.session.usuario || req.session.usuario.rol !== 'Admin') {
        req.session.errorMessage = 'Acceso denegado. Solo los administradores pueden realizar la carga inicial.';
        return res.redirect('/');
    }

    const query = `
        SELECT 
            (SELECT count(*) FROM concesionarios) as total_concesionarios,
            (SELECT count(*) FROM vehiculos) as total_vehiculos
    `;

    req.db.query(query, (err, rows) => {
        if (err) {
            console.error("Error verificando estado de la BD:", err);
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(500).json({ ok: false, msg: "Error de servidor verificando permisos." });
            }
            req.session.errorMessage = "Error verificando el estado de la base de datos.";
            return res.redirect('/');
        }

        const concesionarios = rows[0].total_concesionarios;
        const vehiculos = rows[0].total_vehiculos;

        if (concesionarios === 0 && vehiculos === 0) {
            return next();
        }

        const mensajeError = 'La carga inicial ya se ha realizado (la base de datos no está vacía).';

        if (req.method === 'POST') {
            return res.status(403).json({ ok: false, msg: mensajeError });
        } else {
            req.session.errorMessage = mensajeError;
            return res.redirect('/');
        }
    });
}

module.exports = {
    isAuth,
    isGuest,
    isAdmin,
    isAdminOrSelf,
    isInstallationOrImport,
    isAdminOrWorker,
    isEmpty
};

