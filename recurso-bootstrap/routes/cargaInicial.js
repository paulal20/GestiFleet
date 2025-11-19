const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const ADMIN_DEFAULT = {
    nombre: "Administrador Jefe",
    correo: "admin@gestifleet.com",
    pass_plana: "Admin^12",
    rol: "Admin",
    telefono: "111111111",
    id_concesionario: null 
};

router.post('/previsualizar', async (req, res) => {
    try {
        const datos = req.body.datosJSON;

        if (!datos || !datos.concesionarios || !datos.vehiculos) {
            return res.status(400).json({ exito: false, mensaje: "El JSON debe contener 'concesionarios' y 'vehiculos'." });
        }

        const informe = { 
            nuevos: [], 
            conflictos: [],
            infoConcesionarios: 0
        };

        informe.infoConcesionarios = datos.concesionarios.length;

        for (const v of datos.vehiculos) {
            const [rows] = await req.db.query('SELECT * FROM vehiculos WHERE matricula = ?', [v.matricula]);
            
            if (rows.length > 0) {
                informe.conflictos.push({ nuevo: v, viejo: rows[0] });
            } else {
                informe.nuevos.push(v);
            }
        }
        
        res.json({ exito: true, data: informe, raw: datos });

    } catch (error) {
        console.error(error);
        res.status(500).json({ exito: false, mensaje: "Error procesando los datos." });
    }
});

router.post('/ejecutar', async (req, res) => {
    const { matriculasAActualizar, datosCompletos } = req.body;
    const connection = await req.db.getConnection();
    
    try {
        await connection.beginTransaction();

        if (datosCompletos.concesionarios.length > 0) {
            for (const c of datosCompletos.concesionarios) {
                await connection.query(
                    `INSERT IGNORE INTO concesionarios (id_concesionario, nombre, ciudad, direccion, telefono_contacto) VALUES (?, ?, ?, ?, ?)`,
                    [c.id_concesionario, c.nombre, c.ciudad, c.direccion, c.telefono_contacto]
                );
            }
            console.log(`> Procesados ${datosCompletos.concesionarios.length} concesionarios.`);
        }

        if (datosCompletos.vehiculos.length > 0) {
            for (const v of datosCompletos.vehiculos) {
                let imagenBlob = null;
                if (v.imagen_nombre) {
                    const rutaImagen = path.join(__dirname, '../public/img/vehiculos', v.imagen_nombre);
                    try {
                        if (fs.existsSync(rutaImagen)) imagenBlob = fs.readFileSync(rutaImagen);
                    } catch (e) { console.error("Imagen no encontrada: ", v.imagen_nombre); }
                }

                if (matriculasAActualizar.includes(v.matricula)) {
                    await connection.query(
                        `UPDATE vehiculos SET marca=?, modelo=?, precio=?, imagen=?, estado=?, id_concesionario=? WHERE matricula=?`,
                        [v.marca, v.modelo, v.precio, imagenBlob, v.estado, v.id_concesionario, v.matricula]
                    );
                } else {
                    await connection.query(
                        `INSERT IGNORE INTO vehiculos (matricula, marca, modelo, anyo_matriculacion, descripcion, tipo, precio, numero_plazas, autonomia_km, color, imagen, estado, id_concesionario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [v.matricula, v.marca, v.modelo, v.anyo_matriculacion, v.descripcion, v.tipo, v.precio, v.numero_plazas, v.autonomia_km, v.color, imagenBlob, v.estado, v.id_concesionario]
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
        res.json({ exito: true, mensaje: "Carga completada (Concesionarios, Vehículos y Admin)." });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ exito: false, mensaje: error.message });
    } finally {
        connection.release();
    }
});

router.get('/setup', (req, res) => {
    res.render('setup', { 
        title: 'Instalación Inicial',
        usuarioSesion: null 
    });
});

module.exports = router;