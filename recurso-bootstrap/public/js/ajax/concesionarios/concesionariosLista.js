document.addEventListener("DOMContentLoaded", () => {
    cargarCiudades();
    cargarConcesionarios();

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

    const formEliminar = document.getElementById("formEliminarConcesionario");
    if (formEliminar) {
        formEliminar.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btnModal = formEliminar.querySelector("button[type='submit']");
            const modal = document.getElementById("confirmarEliminarConcesionarioModal");
            const idConcesionarioAEliminar = btnModal.dataset.id;
            if (!idConcesionarioAEliminar) return;

            try {
                const res = await fetch(`/api/concesionarios/${idConcesionarioAEliminar}/eliminar`, {
                    method: "DELETE"
                });
                const data = await res.json();
                if (!data.ok) {
                    mostrarAlerta('danger', data.error || 'Error al eliminar el concesionario.');
                } else {
                    mostrarAlerta('success', `Concesionario eliminado: ${btnModal.dataset.name}`);
                    const btn = document.querySelector(`button[data-id="${idConcesionarioAEliminar}"]`);
                    if (btn) {
                        btn.disabled = true;
                        btn.textContent = "Eliminar";
                        const filaActivo = btn.closest("tr").querySelector("td:nth-child(5)");
                        if (filaActivo) filaActivo.innerHTML = `<span class="badge bg-danger">Eliminado</span>`;
                    }
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) modalInstance.hide();
                }
            } catch (err) {
                console.error("Error al eliminar concesionario:", err);
                mostrarAlerta('danger', 'Error al eliminar el concesionario.');
            } finally {
                // Cerrar el modal siempre
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) modalInstance.hide();
            }
        });
    }

    const modalEliminar = document.getElementById("confirmarEliminarConcesionarioModal");
    if (modalEliminar) {
        modalEliminar.addEventListener("show.bs.modal", (event) => {
            const button = event.relatedTarget;
            const id = button.getAttribute("data-id");
            const nombre = button.getAttribute("data-name");

            const btnSubmit = formEliminar.querySelector("button[type='submit']");
            btnSubmit.dataset.id = id;
            btnSubmit.dataset.name = nombre;

            const texto = modalEliminar.querySelector("#textoConfirmacionConcesionario");
            if (texto) {
                texto.textContent = `¿Estás seguro de que deseas eliminar el concesionario "${nombre}"?`;
            }
        });
    }
});

function cargarCiudades() {
    fetch('/api/concesionarios/lista')
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                const filtro = document.getElementById('filtroCiudad');
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

function pintarTabla(lista) {
    const tbody = document.getElementById("tablaConcesionariosBody");
    const contador = document.getElementById('contadorConcesionarios');
    tbody.innerHTML = "";

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">No hay resultados</td>
            </tr>
        `;
        if (contador) contador.textContent = 0;
        return;
    }

    lista.forEach(c => {
        const claseDisabled = !c.activoBool ? "disabled" : "";

        tbody.innerHTML += `
            <tr>
                <td class="fila-click" data-href="/concesionarios/${c.id_concesionario}">${c.nombre}</td>
                <td class="fila-click" data-href="/concesionarios/${c.id_concesionario}">${c.ciudad}</td>
                <td class="fila-click" data-href="/concesionarios/${c.id_concesionario}">${c.direccion}</td>
                <td class="fila-click" data-href="/concesionarios/${c.id_concesionario}">${c.telefono_contacto}</td>
                <td class="fila-click" data-href="/concesionarios/${c.id_concesionario}">${pintarEstadoConcesionario(c.activoBool)}</td>
                <td>
                    <button 
                        type="button" 
                        class="btn btn-secondary btn-sm mb1"
                        data-bs-toggle="modal"
                        data-bs-target="#confirmarEliminarConcesionarioModal"
                        data-id="${c.id_concesionario}"
                        data-name="${c.nombre}"
                        ${!c.activoBool ? "disabled" : ""}>
                        Eliminar
                    </button>
                    
                    <a href="/concesionarios/${c.id_concesionario}/editar" 
                        class="btn btn-primary btn-sm me-2 mb-1 ${claseDisabled}" >
                        Editar
                    </a>
                </td>
            </tr>
        `;
    });

    if (contador) contador.textContent = lista.length;

    activarFilaClick();
}

function pintarEstadoConcesionario(activo) {
    // activo debe ser booleano: true = activo, false = eliminado
    const clases = {
        true: "bg-success",   // verde
        false: "bg-danger"    // rojo
    };

    const texto = activo ? "Activo" : "Eliminado";
    const clase = clases[activo] || "bg-light text-dark";

    return `<span class="badge ${clase}">${texto}</span>`;
}

function activarFilaClick() {
    document.querySelectorAll(".fila-click").forEach(td => {
        td.addEventListener("click", () => {
            const destino = td.getAttribute("data-href");
            if (destino) window.location.href = destino;
        });
    });
}

function mostrarAlerta(tipo, mensaje) {//no me gusta pero lo dejo
    const cont = document.getElementById('alertas');
    if (!cont) return;
    cont.innerHTML = `
        <div class="alert alert-${tipo}" role="alert">
            ${mensaje}
        </div>
    `;
    setTimeout(() => cont.innerHTML = '', 5000); 
}
