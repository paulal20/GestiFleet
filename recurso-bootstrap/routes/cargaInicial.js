const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const { isInstallationOrImport } = require('../middleware/auth');

const ADMIN_DEFAULT = {
    nombre: "Administrador Jefe",
    correo: "admin@gestifleet.com",
    pass_plana: "Admin^12",
    rol: "Admin",
    telefono: "111111111",
    id_concesionario: null 
};

// --- RUTA PREVISUALIZAR (Callbacks) ---
router.post('/previsualizar', isInstallationOrImport, (req, res) => {
    const datos = req.body.datosJSON;

    if (!datos || !datos.concesionarios || !datos.vehiculos) {
        return res.status(400).json({ exito: false, mensaje: "El JSON debe contener 'concesionarios' y 'vehiculos'." });
    }

    const informe = { 
        nuevosVehiculos: [], conflictosVehiculos: [],
        nuevosConcesionarios: [], conflictosConcesionarios: []
    };

    // Función auxiliar recursiva para procesar concesionarios secuencialmente
    function procesarConcesionarios(index, callbackFinal) {
        if (index >= datos.concesionarios.length) {
            return callbackFinal(); // Terminamos concesionarios, pasamos al siguiente paso
        }

        const c = datos.concesionarios[index];
        req.db.query('SELECT * FROM concesionarios WHERE id_concesionario = ?', [c.id_concesionario], (err, rows) => {
            if (err) return res.status(500).json({ exito: false, mensaje: "Error SQL: " + err.message });

            if (rows.length > 0) informe.conflictosConcesionarios.push({ nuevo: c, viejo: rows[0] });
            else informe.nuevosConcesionarios.push(c);

            // Llamada recursiva al siguiente
            procesarConcesionarios(index + 1, callbackFinal);
        });
    }

    // Función auxiliar recursiva para procesar vehículos secuencialmente
    function procesarVehiculos(index, callbackFinal) {
        if (index >= datos.vehiculos.length) {
            return callbackFinal();
        }

        const v = datos.vehiculos[index];
        req.db.query('SELECT * FROM vehiculos WHERE matricula = ?', [v.matricula], (err, rows) => {
            if (err) return res.status(500).json({ exito: false, mensaje: "Error SQL: " + err.message });

            if (rows.length > 0) informe.conflictosVehiculos.push({ nuevo: v, viejo: rows[0] });
            else informe.nuevosVehiculos.push(v);

            procesarVehiculos(index + 1, callbackFinal);
        });
    }

    // Ejecución en cadena
    procesarConcesionarios(0, () => {
        procesarVehiculos(0, () => {
            // Todo terminado, enviamos respuesta
            res.json({ exito: true, data: informe, raw: datos });
        });
    });
});

// --- RUTA EJECUTAR (Callbacks + Transacción) ---
router.post('/ejecutar', isInstallationOrImport, (req, res) => {
    const { matriculasAActualizar, idsConcesionariosAActualizar, datosCompletos } = req.body;
    const connection = req.db; 
    
    // Iniciar Transacción
    connection.beginTransaction((errTrans) => {
        if (errTrans) return res.status(500).json({ exito: false, mensaje: "Error iniciando transacción: " + errTrans.message });

        // Paso 1: Procesar Concesionarios
        procesarGuardadoConcesionarios(0, () => {
            // Paso 2: Procesar Vehículos
            procesarGuardadoVehiculos(0, () => {
                // Paso 3: Verificar/Crear Admin
                verificarYCrearAdmin(() => {
                    // Paso 4: Commit
                    connection.commit((errCommit) => {
                        if (errCommit) {
                            return connection.rollback(() => {
                                res.status(500).json({ exito: false, mensaje: "Error en commit: " + errCommit.message });
                            });
                        }
                        res.json({ exito: true, mensaje: "Operación completada con éxito." });
                    });
                });
            });
        });
    });

    // -- Funciones Auxiliares para 'Ejecutar' --

    function procesarGuardadoConcesionarios(index, cb) {
        if (!datosCompletos.concesionarios || index >= datosCompletos.concesionarios.length) {
            return cb();
        }

        const c = datosCompletos.concesionarios[index];
        const esActivo = (c.activo !== undefined) ? c.activo : true;
        let sql = '';
        let params = [];

        // Comprobar si hay que actualizar o insertar
        if (idsConcesionariosAActualizar && (idsConcesionariosAActualizar.includes(c.id_concesionario.toString()) || idsConcesionariosAActualizar.includes(c.id_concesionario))) {
            sql = `UPDATE concesionarios SET nombre=?, ciudad=?, direccion=?, telefono_contacto=?, activo=? WHERE id_concesionario=?`;
            params = [c.nombre, c.ciudad, c.direccion, c.telefono_contacto, esActivo, c.id_concesionario];
        } else {
            sql = `INSERT IGNORE INTO concesionarios (id_concesionario, nombre, ciudad, direccion, telefono_contacto, activo) VALUES (?, ?, ?, ?, ?, ?)`;
            params = [c.id_concesionario, c.nombre, c.ciudad, c.direccion, c.telefono_contacto, esActivo];
        }

        connection.query(sql, params, (err) => {
            if (err) {
                return connection.rollback(() => {
                    res.status(500).json({ exito: false, mensaje: "Error guardando concesionario: " + err.message });
                });
            }
            procesarGuardadoConcesionarios(index + 1, cb);
        });
    }

    function procesarGuardadoVehiculos(index, cb) {
        if (!datosCompletos.vehiculos || index >= datosCompletos.vehiculos.length) {
            return cb();
        }

        const v = datosCompletos.vehiculos[index];
        let imagenBlob = null;
        if (v.imagen_nombre) {
            const rutaImagen = path.join(__dirname, '../public/img/vehiculos', v.imagen_nombre);
            try {
                if (fs.existsSync(rutaImagen)) imagenBlob = fs.readFileSync(rutaImagen);
            } catch (e) {}
        }

        const esActivo = (v.activo !== undefined) ? v.activo : true;
        let sql = '';
        let params = [];

        if (matriculasAActualizar && matriculasAActualizar.includes(v.matricula)) {
            sql = `UPDATE vehiculos SET marca=?, modelo=?, precio=?, imagen=?, id_concesionario=?, activo=? WHERE matricula=?`;
            params = [v.marca, v.modelo, v.precio, imagenBlob, v.id_concesionario, esActivo, v.matricula];
        } else {
            sql = `INSERT IGNORE INTO vehiculos (matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, numero_plazas, autonomia_km, color, imagen, id_concesionario, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            params = [v.matricula, v.marca, v.modelo, v.anyo_matriculacion, v.descripcion, v.tipo, v.precio, v.numero_plazas, v.autonomia_km, v.color, imagenBlob, v.id_concesionario, esActivo];
        }

        connection.query(sql, params, (err) => {
            if (err) {
                return connection.rollback(() => {
                    res.status(500).json({ exito: false, mensaje: "Error guardando vehículo: " + err.message });
                });
            }
            procesarGuardadoVehiculos(index + 1, cb);
        });
    }

    function verificarYCrearAdmin(cb) {
        connection.query('SELECT count(*) as c FROM usuarios', (err, usersExist) => {
            if (err) {
                return connection.rollback(() => {
                    res.status(500).json({ exito: false, mensaje: "Error verificando usuarios: " + err.message });
                });
            }

            if (usersExist[0].c === 0) {
                // Crear hash con callback
                bcrypt.hash(ADMIN_DEFAULT.pass_plana, 10, (errHash, hash) => {
                    if (errHash) {
                        return connection.rollback(() => {
                            res.status(500).json({ exito: false, mensaje: "Error encriptando contraseña: " + errHash.message });
                        });
                    }

                    connection.query(
                        `INSERT INTO usuarios (nombre, correo, contrasenya, rol, telefono, id_concesionario) VALUES (?, ?, ?, ?, ?, ?)`,
                        [ADMIN_DEFAULT.nombre, ADMIN_DEFAULT.correo, hash, ADMIN_DEFAULT.rol, ADMIN_DEFAULT.telefono, ADMIN_DEFAULT.id_concesionario],
                        (errInsert) => {
                            if (errInsert) {
                                return connection.rollback(() => {
                                    res.status(500).json({ exito: false, mensaje: "Error creando admin: " + errInsert.message });
                                });
                            }
                            cb(); // Admin creado, continuar
                        }
                    );
                });
            } else {
                cb(); // Ya hay usuarios, continuar
            }
        });
    }
});

// --- RUTA SETUP (Callbacks) ---
router.get('/setup', (req, res) => {
    req.db.query('SELECT count(*) as c FROM usuarios', (err, rows) => {
        if (err) {
            return res.status(500).send("Error de conexión");
        }

        if (rows[0].c > 0) {
            return res.redirect('/login');
        }

        res.render('setup', { 
            title: 'Instalación Inicial',
            usuarioSesion: null 
        });
    });
});

module.exports = router;