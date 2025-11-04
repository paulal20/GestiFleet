const concesionarios = [
    { id_concesionario: 1, nombre: 'GestiFleet Madrid', ciudad: 'Madrid', direccion: 'Calle Falsa 123' },
    { id_concesionario: 2, nombre: 'GestiFleet Barcelona', ciudad: 'Barcelona', direccion: 'Avenida Siempre Viva 742' }
];

const usuarios = [
    {
        id_usuario: 1,
        nombre: 'Administrador',
        correo: 'admin@gestifleet.com',
        password: 'Admin^12', // Temporal - Cambiar a hash
        rol: 'admin',
        id_concesionario: 1
    },
    {
        id_usuario: 2,
        nombre: 'Empleado Ejemplo',
        correo: 'empleado@gestifleet.com',
        password: 'Empleado^1', // Temporal - Cambiar a hash
        rol: 'empleado',
        id_concesionario: 2
    }
];

const vehiculos = [
    { id: 1, nombre: 'byd_seal1', marca: 'BYD', modelo: 'Seal 1', anyo: 2023, descripcion: 'Sedán eléctrico moderno con diseño aerodinámico y rendimiento eficiente para ciudad y carretera.', tipo: 'coche', precio: '40.000', id_concesionario: 1, estado: 'disponible' },
    { id: 2, nombre: 'byd_seal2', marca: 'BYD', modelo: 'Seal 2', anyo: 2023, descripcion: 'Sedán eléctrico eficiente con interiores tecnológicos y autonomía optimizada.', tipo: 'coche', precio: '42.000', id_concesionario: 1, estado: 'disponible' },
    { id: 3, nombre: 'byd_seal3', marca: 'BYD', modelo: 'Seal 3', anyo: 2024, descripcion: 'Versión deportiva con prestaciones mejoradas y diseño elegante.', tipo: 'coche', precio: '45.000', id_concesionario: 2, estado: 'mantenimiento' },
    { id: 4, nombre: 'tesla1', marca: 'Tesla', modelo: 'Model S', anyo: 2023, descripcion: 'Sedán eléctrico de lujo con aceleración impresionante y tecnología avanzada.', tipo: 'coche', precio: '95.000', id_concesionario: 1, estado: 'reservado' },
    { id: 5, nombre: 'tesla2', marca: 'Tesla', modelo: 'Model 3', anyo: 2024, descripcion: 'Versión con interiores premium y sistema de conducción autónoma.', tipo: 'coche', precio: '98.000', id_concesionario: 1, estado: 'disponible' },
    { id: 6, nombre: 'tesla3', marca: 'Tesla', modelo: 'Model X', anyo: 2023, descripcion: 'Modelo con batería de larga duración y autonomía extendida.', tipo: 'coche', precio: '100.000', id_concesionario: 2, estado: 'disponible' },
    { id: 7, nombre: 'tesla4', marca: 'Tesla', modelo: 'Model Y', anyo: 2024, descripcion: 'Edición deportiva con máxima aceleración y diseño moderno.', tipo: 'coche', precio: '105.000', id_concesionario: 1, estado: 'disponible' },
    { id: 8, nombre: 'tesla5', marca: 'Tesla', modelo: 'Model 3 Urban', anyo: 2023, descripcion: 'Versión urbana con eficiencia energética optimizada.', tipo: 'coche', precio: '92.000', id_concesionario: 2, estado: 'reservado' },
    { id: 9, nombre: 'tesla6', marca: 'Tesla', modelo: 'Model X Family', anyo: 2024, descripcion: 'Modelo familiar con tecnología de asistencia y confort superior.', tipo: 'coche', precio: '97.000', id_concesionario: 1, estado: 'disponible' },
    { id: 10, nombre: 'volvo1', marca: 'Volvo', modelo: 'XC90', anyo: 2023, descripcion: 'SUV seguro y confortable con interior espacioso y tecnología de asistencia.', tipo: 'suv', precio: '70.000', id_concesionario: 2, estado: 'disponible' },
    { id: 11, nombre: 'volvo2', marca: 'Volvo', modelo: 'XC90 Advanced', anyo: 2024, descripcion: 'Versión avanzada con sistemas de seguridad de última generación.', tipo: 'suv', precio: '72.000', id_concesionario: 1, estado: 'mantenimiento' },
    { id: 12, nombre: 'volvo3', marca: 'Volvo', modelo: 'XC90 Premium', anyo: 2023, descripcion: 'SUV premium con interiores amplios y acabados de lujo.', tipo: 'suv', precio: '75.000', id_concesionario: 2, estado: 'disponible' },
    { id: 13, nombre: 'VW1', marca: 'Volkswagen', modelo: 'T-Cross', anyo: 2023, descripcion: 'Compacto eficiente y versátil, ideal para la ciudad y viajes familiares.', tipo: 'suv', precio: '62.000', id_concesionario: 1, estado: 'disponible' },
    { id: 14, nombre: 'VW2', marca: 'Volkswagen', modelo: 'T-Roc', anyo: 2024, descripcion: 'Versión con diseño moderno y prestaciones equilibradas.', tipo: 'suv', precio: '64.000', id_concesionario: 2, estado: 'reservado' },
    { id: 15, nombre: 'VW3', marca: 'Volkswagen', modelo: 'Tiguan', anyo: 2023, descripcion: 'Modelo urbano con eficiencia energética optimizada.', tipo: 'suv', precio: '66.000', id_concesionario: 1, estado: 'disponible' },
    { id: 16, nombre: 'VW4', marca: 'Volkswagen', modelo: 'Tiguan Sport', anyo: 2024, descripcion: 'Edición deportiva con mayor potencia y estilo moderno.', tipo: 'suv', precio: '68.000', id_concesionario: 2, estado: 'disponible' },
    { id: 17, nombre: 'VW5', marca: 'Volkswagen', modelo: 'Tiguan Family', anyo: 2023, descripcion: 'Versión familiar con espacio extra y confort superior.', tipo: 'suv', precio: '70.000', id_concesionario: 1, estado: 'disponible' }
];

const reservas = [];

module.exports = {
    usuarios,
    concesionarios,
    vehiculos,
    reservas
};
