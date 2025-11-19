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

router.post('/previsualizar', isInstallationOrImport, async (req, res) => {
    try {
        const datos = req.body.datosJSON;

        if (!datos || !datos.concesionarios || !datos.vehiculos) {
            return res.status(400).json({ exito: false, mensaje: "El JSON debe contener 'concesionarios' y 'vehiculos'." });
        }

        const informe = { 
            nuevosVehiculos: [], conflictosVehiculos: [],
            nuevosConcesionarios: [], conflictosConcesionarios: [],
            infoConcesionarios: datos.concesionarios.length
        };

        for (const c of datos.concesionarios) {
            const [rows] = await req.db.query('SELECT * FROM concesionarios WHERE id_concesionario = ?', [c.id_concesionario]);
            if (rows.length > 0) informe.conflictosConcesionarios.push({ nuevo: c, viejo: rows[0] });
            else informe.nuevosConcesionarios.push(c);
        }

        for (const v of datos.vehiculos) {
            const [rows] = await req.db.query('SELECT * FROM vehiculos WHERE matricula = ?', [v.matricula]);
            if (rows.length > 0) informe.conflictosVehiculos.push({ nuevo: v, viejo: rows[0] });
            else informe.nuevosVehiculos.push(v);
        }
        
        res.json({ exito: true, data: informe, raw: datos });

    } catch (error) {
        console.error(error);
        res.status(500).json({ exito: false, mensaje: "Error procesando los datos: " + error.message });
    }
});

router.post('/ejecutar', isInstallationOrImport, async (req, res) => {
    const { matriculasAActualizar, idsConcesionariosAActualizar, datosCompletos } = req.body;
    const connection = req.db; 
    
    try {
        await connection.beginTransaction();

        if (datosCompletos.concesionarios && datosCompletos.concesionarios.length > 0) {
            for (const c of datosCompletos.concesionarios) {
                const esActivo = (c.activo !== undefined) ? c.activo : true;
                
                if (idsConcesionariosAActualizar && (idsConcesionariosAActualizar.includes(c.id_concesionario.toString()) || idsConcesionariosAActualizar.includes(c.id_concesionario))) {
                    await connection.query(
                        `UPDATE concesionarios SET nombre=?, ciudad=?, direccion=?, telefono_contacto=?, activo=? WHERE id_concesionario=?`,
                        [c.nombre, c.ciudad, c.direccion, c.telefono_contacto, esActivo, c.id_concesionario]
                    );
                } else {
                    await connection.query(
                        `INSERT IGNORE INTO concesionarios (id_concesionario, nombre, ciudad, direccion, telefono_contacto, activo) VALUES (?, ?, ?, ?, ?, ?)`,
                        [c.id_concesionario, c.nombre, c.ciudad, c.direccion, c.telefono_contacto, esActivo]
                    );
                }
            }
        }

        if (datosCompletos.vehiculos && datosCompletos.vehiculos.length > 0) {
            for (const v of datosCompletos.vehiculos) {
                let imagenBlob = null;
                if (v.imagen_nombre) {
                    const rutaImagen = path.join(__dirname, '../public/img/vehiculos', v.imagen_nombre);
                    try {
                        if (fs.existsSync(rutaImagen)) imagenBlob = fs.readFileSync(rutaImagen);
                    } catch (e) {}
                }

                const esActivo = (v.activo !== undefined) ? v.activo : true;

                if (matriculasAActualizar && matriculasAActualizar.includes(v.matricula)) {
                    await connection.query(
                        `UPDATE vehiculos SET marca=?, modelo=?, precio=?, imagen=?, estado=?, id_concesionario=?, activo=? WHERE matricula=?`,
                        [v.marca, v.modelo, v.precio, imagenBlob, v.estado, v.id_concesionario, esActivo, v.matricula]
                    );
                } else {
                    await connection.query(
                        `INSERT IGNORE INTO vehiculos (matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [v.matricula, v.marca, v.modelo, v.anyo_matriculacion, v.descripcion, v.tipo, v.precio, v.numero_plazas, v.autonomia_km, v.color, imagenBlob, v.estado, v.id_concesionario, esActivo]
                    );
                }
            }
        }

        const [usersExist] = await connection.query('SELECT count(*) as c FROM usuarios');
        if (usersExist[0].c === 0) {
            const hash = await bcrypt.hash(ADMIN_DEFAULT.pass_plana, 10);
            await connection.query(
                `INSERT INTO usuarios (nombre, correo, contrasenya, rol, telefono, id_concesionario) VALUES (?, ?, ?, ?, ?, ?)`,
                [ADMIN_DEFAULT.nombre, ADMIN_DEFAULT.correo, hash, ADMIN_DEFAULT.rol, ADMIN_DEFAULT.telefono, ADMIN_DEFAULT.id_concesionario]
            );
        }

        await connection.commit();
        res.json({ exito: true, mensaje: "Operación completada con éxito." });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ exito: false, mensaje: "Error: " + error.message });
    }
});

router.get('/setup', async (req, res) => {
    try {
        const [rows] = await req.db.query('SELECT count(*) as c FROM usuarios');
        if (rows[0].c > 0) {
            return res.redirect('/login');
        }
        res.render('setup', { 
            title: 'Instalación Inicial',
            usuarioSesion: null 
        });
    } catch (err) {
        res.status(500).send("Error de conexión");
    }
});

module.exports = router;