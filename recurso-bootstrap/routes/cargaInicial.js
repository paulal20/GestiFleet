const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const { isEmpty } = require('../middleware/auth');

// RUTA SETUP: Renderiza la vista
router.get('/setup', isEmpty, (req, res) => {
    res.render('setup', { 
        title: 'Instalación Inicial',
        usuarioSesion: req.session.usuario 
    });
});

// =========================================================================
// PASO 1: CONCESIONARIOS
// =========================================================================
router.post('/paso1-concesionarios', isEmpty, (req, res) => {
    const datosJSON = req.body.datos; // El JS envía { datos: objetoJSON }
    
    // Filtramos solo lo que nos interesa
    const lista = datosJSON.concesionarios || []; 

    if (!lista.length) {
        return res.json({ ok: false, error: "El archivo JSON no contiene una lista válida de 'concesionarios'." });
    }

    let successCount = 0;
    let failCount = 0;
    let errorDetails = [];

    // Procesamos secuencialmente con promesas simuladas para simplificar el flujo asíncrono en bucle
    // Nota: Usamos callbacks anidados o promesas. Aquí usaré promesas wrappeando la query para limpieza.
    const processItem = (item) => {
        return new Promise((resolve) => {
            const { nombre, ciudad, direccion, telefono_contacto } = item;
            
            // Validaciones básicas (replicando api/concesionarios)
            if (!nombre || nombre.length < 3) return resolve({ ok: false, msg: `Nombre inválido en concesionario ID ${item.id_concesionario}` });
            if (!ciudad) return resolve({ ok: false, msg: `Ciudad faltante en concesionario ${nombre}` });
            
            // Query de inserción (INSERT IGNORE evita duplicados por PK, pero queremos controlar duplicados de lógica)
            // Primero comprobamos duplicados lógicos
            const sqlCheck = "SELECT id_concesionario FROM concesionarios WHERE nombre = ? OR direccion = ? OR telefono_contacto = ?";
            req.db.query(sqlCheck, [nombre, direccion, telefono_contacto], (err, rows) => {
                if (err) return resolve({ ok: false, msg: `Error SQL Check: ${err.message}` });
                if (rows.length > 0) return resolve({ ok: false, msg: `Duplicado: Concesionario ${nombre} ya existe (Nombre, dir o tel).` });

                // Insertar
                const sqlInsert = "INSERT INTO concesionarios (id_concesionario, nombre, ciudad, direccion, telefono_contacto, activo) VALUES (?, ?, ?, ?, ?, 1)";
                req.db.query(sqlInsert, [item.id_concesionario, nombre, ciudad, direccion, telefono_contacto], (errIns) => {
                    if (errIns) return resolve({ ok: false, msg: `Error Insert ID ${item.id_concesionario}: ${errIns.message}` });
                    resolve({ ok: true });
                });
            });
        });
    };

    // Ejecutar todas las promesas
    // (Nota: En producción masiva sería mejor hacerlo en batches, pero para carga inicial está bien)
    Promise.all(lista.map(item => processItem(item))).then(results => {
        results.forEach(r => {
            if (r.ok) successCount++;
            else {
                failCount++;
                errorDetails.push(r.msg);
            }
        });
        res.json({ ok: true, successCount, failCount, errorDetails });
    });
});

// =========================================================================
// PASO 2: VEHÍCULOS
// =========================================================================
router.post('/paso2-vehiculos', isEmpty, (req, res) => {
    const datosJSON = req.body.datos;
    const lista = datosJSON.vehiculos || [];

    if (!lista.length) {
        return res.json({ ok: false, error: "El archivo JSON no contiene una lista válida de 'vehiculos'." });
    }

    let successCount = 0;
    let failCount = 0;
    let errorDetails = [];

    const processItem = (item) => {
        return new Promise((resolve) => {
            const { matricula, marca, modelo, anyo_matriculacion, precio, id_concesionario, tipo, imagen_nombre } = item;

            // Validación básica
            if (!matricula || !marca || !modelo || !precio || !id_concesionario) {
                return resolve({ ok: false, msg: `Datos faltantes en vehículo ${matricula || 'Desconocido'}` });
            }

            // Verificar si el concesionario existe
            req.db.query("SELECT id_concesionario FROM concesionarios WHERE id_concesionario = ?", [id_concesionario], (errC, rowsC) => {
                if (errC) return resolve({ ok: false, msg: `Error SQL Conc: ${errC.message}` });
                if (rowsC.length === 0) return resolve({ ok: false, msg: `Vehículo ${matricula}: Concesionario ID ${id_concesionario} no existe.` });

                // Preparar imagen (Lectura del FS basada en el nombre del JSON)
                let imagenBlob = null;
                if (imagen_nombre) {
                    const rutaImg = path.join(__dirname, '../public/img/vehiculos', imagen_nombre);
                    try {
                        if (fs.existsSync(rutaImg)) imagenBlob = fs.readFileSync(rutaImg);
                    } catch(e) {}
                }

                // Insertar
                const sqlInsert = `INSERT INTO vehiculos (matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, numero_plazas, autonomia_km, color, imagen, id_concesionario, activo) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
                const params = [
                    matricula, marca, modelo, anyo_matriculacion, item.descripcion||'', 
                    tipo||'coche', precio, item.numero_plazas||5, item.autonomia_km||null, 
                    item.color||null, imagenBlob, id_concesionario
                ];

                req.db.query(sqlInsert, params, (errIns) => {
                    if (errIns) {
                        // Detectar duplicado de matrícula
                        if (errIns.code === 'ER_DUP_ENTRY') return resolve({ ok: false, msg: `Matrícula duplicada: ${matricula}` });
                        return resolve({ ok: false, msg: `Error SQL Vehículo ${matricula}: ${errIns.message}` });
                    }
                    resolve({ ok: true });
                });
            });
        });
    };

    Promise.all(lista.map(item => processItem(item))).then(results => {
        results.forEach(r => {
            if (r.ok) successCount++;
            else {
                failCount++;
                errorDetails.push(r.msg);
            }
        });
        res.json({ ok: true, successCount, failCount, errorDetails });
    });
});

// =========================================================================
// PASO 3: USUARIOS
// =========================================================================
router.post('/paso3-usuarios', isEmpty, (req, res) => {
    const datosJSON = req.body.datos;
    const lista = datosJSON.usuarios || [];

    // Nota: El JSON de usuarios podría no tener la clave "usuarios" raíz si es un array directo,
    // pero asumimos estructura { usuarios: [...] } por consistencia.
    // Si la carga es opcional, lista vacía no es error.

    let successCount = 0;
    let failCount = 0;
    let errorDetails = [];

    const processItem = (item) => {
        return new Promise((resolve) => {
            const { nombre, correo, contrasenya, rol, telefono, id_concesionario } = item;
            
            // Validaciones
            if (!nombre || !correo || !contrasenya) return resolve({ ok: false, msg: `Datos incompletos usuario ${correo}` });

            // Verificar duplicados
            req.db.query("SELECT id_usuario FROM usuarios WHERE correo = ? OR telefono = ?", [correo, telefono], (errDup, rowsDup) => {
                if (errDup) return resolve({ ok: false, msg: `Error SQL Check User: ${errDup.message}` });
                if (rowsDup.length > 0) return resolve({ ok: false, msg: `Usuario duplicado (email/tel): ${correo}` });

                // Encriptar pass
                bcrypt.hash(contrasenya, 10, (errHash, hash) => {
                    if (errHash) return resolve({ ok: false, msg: `Error Hash: ${errHash.message}` });

                    const sqlInsert = "INSERT INTO usuarios (nombre, correo, contrasenya, rol, telefono, id_concesionario, activo) VALUES (?, ?, ?, ?, ?, ?, 1)";
                    req.db.query(sqlInsert, [nombre, correo, hash, rol||'Empleado', telefono, id_concesionario||null], (errIns) => {
                        if (errIns) return resolve({ ok: false, msg: `Error Insert User ${correo}: ${errIns.message}` });
                        resolve({ ok: true });
                    });
                });
            });
        });
    };

    Promise.all(lista.map(item => processItem(item))).then(results => {
        results.forEach(r => {
            if (r.ok) successCount++;
            else {
                failCount++;
                errorDetails.push(r.msg);
            }
        });
        res.json({ ok: true, successCount, failCount, errorDetails });
    });
});

module.exports = router;