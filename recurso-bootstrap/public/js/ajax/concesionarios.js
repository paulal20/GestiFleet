document.addEventListener("DOMContentLoaded", () => {
    cargarCiudades();       // primero cargamos las ciudades
    cargarConcesionarios(); // luego la tabla

    const filtroCiudad = document.getElementById("filtroCiudad");
    if (filtroCiudad) {
        filtroCiudad.addEventListener("change", cargarConcesionarios);
    }

    const btnFiltrar = document.getElementById("btnFiltrar");
    if (btnFiltrar) {
        btnFiltrar.addEventListener("click", cargarConcesionarios);
    }

    const btnLimpiar = document.getElementById("btnLimpiar");
    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", () => {
            filtroCiudad.value = '';
            cargarConcesionarios();
        });
    }
});

// ========== CARGAR CIUDADES EN EL FILTRO ==========
function cargarCiudades() {
    fetch('/api/concesionarios/lista')
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                const filtro = document.getElementById('filtroCiudad');
                // Limpiar opciones excepto la primera "Todas las Ciudades"
                filtro.querySelectorAll('option:not([value=""])').forEach(opt => opt.remove());

                const ciudades = [...new Set(data.concesionarios.map(c => c.ciudad))];
                ciudades.forEach(ciudad => {
                    const option = document.createElement('option');
                    option.value = ciudad;
                    option.textContent = ciudad;
                    filtro.appendChild(option);
                });
            }
        })
        .catch(err => console.error("Error cargando ciudades:", err));
}

// ========== PETICIÓN AJAX ==========
function cargarConcesionarios() {
    const ciudad = document.getElementById("filtroCiudad").value;

    fetch(`/api/concesionarios/lista?ciudad=${encodeURIComponent(ciudad)}`)
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                pintarTabla(data.concesionarios);
            } else {
                mostrarAlerta('danger', data.error || 'Error al cargar concesionarios.');
            }
        })
        .catch(err => {
            console.error("Error AJAX:", err);
            mostrarAlerta('danger', 'Error al cargar concesionarios.');
        });
}

// ========== PINTAR TABLA ==========
function pintarTabla(lista) {
    const tbody = document.getElementById("tablaConcesionariosBody");
    const contador = document.getElementById('contadorConcesionarios');
    tbody.innerHTML = "";

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">No hay resultados</td>
            </tr>
        `;
        if (contador) contador.textContent = 0;
        return;
    }

    lista.forEach(c => {

        tbody.innerHTML += `
            <tr>
                <td class="fila-click" data-href="/concesionarios/${c.id_concesionario}">${c.nombre}</td>
                <td class="fila-click" data-href="/concesionarios/${c.id_concesionario}">${c.ciudad}</td>
                <td class="fila-click" data-href="/concesionarios/${c.id_concesionario}">${c.direccion}</td>
                <td class="fila-click" data-href="/concesionarios/${c.id_concesionario}">${c.telefono_contacto}</td>
                <td class="fila-click" data-href="/concesionarios/${c.id_concesionario}">${c.activo}</td>
                <td>
                    <button 
                        type="button" 
                        class="btn btn-secondary btn-sm mb1"
                        data-bs-toggle="modal"
                        data-bs-target="#confirmarEliminarConcesionarioModal"
                        data-id="${c.id_concesionario}"
                        data-name="${c.nombre}">
                        Eliminar
                    </button>
                    <a href="/concesionarios/${c.id_concesionario}/editar" 
                        class="btn btn-primary btn-sm me-2 mb-1">
                        Editar
                    </a>
                </td>
            </tr>
        `;
    });

    if (contador) contador.textContent = lista.length;

    activarFilaClick();
}

// ========== CLICK EN FILAS ==========
function activarFilaClick() {
    document.querySelectorAll(".fila-click").forEach(td => {
        td.addEventListener("click", () => {
            const destino = td.getAttribute("data-href");
            if (destino) window.location.href = destino;
        });
    });
}

// ========== FUNCION AUXILIAR PARA ALERTAS ==========
function mostrarAlerta(tipo, mensaje) {
    const cont = document.getElementById('alertas');
    if (!cont) return;
    cont.innerHTML = `
        <div class="alert alert-${tipo}" role="alert">
            ${mensaje}
        </div>
    `;
    setTimeout(() => cont.innerHTML = '', 5000); // desaparece a los 5s
}
