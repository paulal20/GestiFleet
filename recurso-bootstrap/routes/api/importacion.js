const express = require('express');
const router = express.Router();
const { isAdmin } = require('../../middleware/auth');

// POST /api/importacion/analizar
router.post('/analizar', isAdmin, (req, res) => {
    const datos = req.body.datos || {};
    const reporte = {
        concesionarios: { nuevos: [], conflictos: [], presente: false },
        vehiculos: { nuevos: [], conflictos: [], presente: false },
        usuarios: { nuevos: [], conflictos: [], presente: false }
    };

    // Función interna para finalizar y enviar respuesta
    const finalizar = () => {
        res.json({ ok: true, reporte: reporte });
    };

    const procesarUsuarios = () => {
        if (datos.usuarios && Array.isArray(datos.usuarios) && datos.usuarios.length > 0) {
            reporte.usuarios.presente = true;
            
            const sql = "SELECT id_usuario, correo, telefono, nombre FROM usuarios";
            req.db.query(sql, (err, rows) => {
                if (err) {
                    console.error("Error SQL Usuarios:", err);
                    return res.status(500).json({ ok: false, error: "Error consultando usuarios" });
                }

                datos.usuarios.forEach(item => {
                    const coincidencia = rows.find(dbItem => 
                        (dbItem.correo && item.correo && dbItem.correo.toLowerCase() === item.correo.toLowerCase()) ||
                        (dbItem.telefono && item.telefono && dbItem.telefono === item.telefono)
                    );

                    if (coincidencia) {
                        const esCorreo = coincidencia.correo && item.correo && coincidencia.correo.toLowerCase() === item.correo.toLowerCase();
                        
                        reporte.usuarios.conflictos.push({
                            nuevo: item,
                            actual: coincidencia,
                            razon: esCorreo ? 'Correo existente' : 'Teléfono existente'
                        });
                    } else {
                        reporte.usuarios.nuevos.push(item);
                    }
                });
                finalizar();
            });
        } else {
            finalizar();
        }
    };

    const procesarVehiculos = () => {
        if (datos.vehiculos && Array.isArray(datos.vehiculos) && datos.vehiculos.length > 0) {
            reporte.vehiculos.presente = true;

            const sql = "SELECT id_vehiculo, matricula, modelo, marca FROM vehiculos";
            req.db.query(sql, (err, rows) => {
                if (err) {
                    console.error("Error SQL Vehículos:", err);
                    return res.status(500).json({ ok: false, error: "Error consultando vehículos" });
                }

                datos.vehiculos.forEach(item => {
                    const coincidencia = rows.find(dbItem => 
                        dbItem.matricula && item.matricula && dbItem.matricula.toUpperCase() === item.matricula.toUpperCase()
                    );

                    if (coincidencia) {
                        reporte.vehiculos.conflictos.push({
                            nuevo: item,
                            actual: coincidencia,
                            razon: 'Matrícula existente'
                        });
                    } else {
                        reporte.vehiculos.nuevos.push(item);
                    }
                });
                procesarUsuarios();
            });
        } else {
            procesarUsuarios();
        }
    };

    if (datos.concesionarios && Array.isArray(datos.concesionarios) && datos.concesionarios.length > 0) {
        reporte.concesionarios.presente = true;

        const sql = "SELECT id_concesionario, nombre, direccion FROM concesionarios";
        req.db.query(sql, (err, rows) => {
            if (err) {
                console.error("Error SQL Concesionarios:", err);
                return res.status(500).json({ ok: false, error: "Error consultando concesionarios" });
            }

            datos.concesionarios.forEach(item => {
                const coincidencia = rows.find(dbItem => 
                    (item.id_concesionario && dbItem.id_concesionario == item.id_concesionario) || 
                    (dbItem.nombre && item.nombre && dbItem.nombre.toLowerCase() === item.nombre.toLowerCase())
                );

                if (coincidencia) {
                    const esId = item.id_concesionario && item.id_concesionario == coincidencia.id_concesionario;
                    reporte.concesionarios.conflictos.push({
                        nuevo: item,
                        actual: coincidencia,
                        razon: esId ? 'ID Duplicado' : 'Nombre Duplicado'
                    });
                } else {
                    reporte.concesionarios.nuevos.push(item);
                }
            });

            procesarVehiculos();
        });
    } else {
        procesarVehiculos();
    }
});

module.exports = router;