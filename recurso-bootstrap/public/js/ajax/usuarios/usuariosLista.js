document.addEventListener("DOMContentLoaded", () => {
    cargarUsuarios();

    const filtroConcesionario = document.getElementById("filtroConcesionario");
    const formFiltros = document.getElementById("formFiltrosUsuarios");
    const btnLimpiar = document.getElementById("btnLimpiar");
    const formEliminar = document.getElementById("formEliminarUsuario");
    const modalEliminar = document.getElementById("confirmarEliminarUsuarioModal");

    // Filtrar usuarios
    formFiltros.addEventListener("submit", e => {
        e.preventDefault();
        cargarUsuarios();
    });

    // Limpiar filtros
    btnLimpiar.addEventListener("click", () => {
        filtroConcesionario.value = "0";
        cargarUsuarios();
    });

    // Modal de eliminación
    if (modalEliminar) {
        modalEliminar.addEventListener("show.bs.modal", event => {
            const button = event.relatedTarget;
            const id = button.getAttribute("data-id");
            const nombre = button.getAttribute("data-name");

            const btnSubmit = formEliminar.querySelector("button[type='submit']");
            btnSubmit.dataset.id = id;
            btnSubmit.dataset.name = nombre;

            const texto = modalEliminar.querySelector("#textoConfirmacion");
            if (texto) {
                texto.textContent = `¿Estás seguro de que deseas eliminar el usuario "${nombre}"?`;
            }
        });
    }

    // Eliminar usuario
    formEliminar.addEventListener("submit", e => {
        e.preventDefault();
        const btnSubmit = formEliminar.querySelector("button[type='submit']");
        const idUsuario = btnSubmit.dataset.id;
        if (!idUsuario) return;

        fetch(`/api/usuarios/${idUsuario}`, { method: "DELETE" })
            .then(res => res.json())
            .then(data => {
                if (!data.ok) {
                    mostrarAlerta("danger", data.error || "Error al eliminar el usuario");
                } else {
                    mostrarAlerta("success", `Usuario eliminado: ${btnSubmit.dataset.name}`);
                    cargarUsuarios();

                    const modalInstance = bootstrap.Modal.getInstance(modalEliminar);
                    if (modalInstance) modalInstance.hide();
                }
            })
            .catch(err => {
                console.error(err);
                mostrarAlerta("danger", "Error al eliminar el usuario");
            });
    });
});

function cargarUsuarios() {
    const filtro = document.getElementById("filtroConcesionario").value;
    const tbody = document.getElementById("tablaUsuariosBody");
    const contador = document.getElementById("contadorUsuarios");

    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Cargando...</td></tr>`;
    contador.textContent = 0;

    fetch(`/api/usuarios?concesionario=${encodeURIComponent(filtro)}`)
        .then(res => res.json())
        .then(data => {
            if (!data.ok) throw new Error(data.error || "Error cargando usuarios");

            if (!data.usuarios.length) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No hay resultados</td></tr>`;
                contador.textContent = 0;
                return;
            }

            tbody.innerHTML = "";
            data.usuarios.forEach(u => {
                tbody.innerHTML += `
                    <tr>
                        <td class="fila-click" data-href="/usuarios/${u.id_usuario}">${u.nombre}</td>
                        <td class="fila-click" data-href="/usuarios/${u.id_usuario}">${u.correo}</td>
                        <td class="fila-click" data-href="/usuarios/${u.id_usuario}">${u.rol}</td>
                        <td class="fila-click" data-href="/usuarios/${u.id_usuario}">${u.telefono || '—'}</td>
                        <td class="fila-click" data-href="/usuarios/${u.id_usuario}">${u.nombre_concesionario || '—'}</td>
                        <td class="fila-click" data.href="/usuarios/${u.id_usuario}">${pintarEstado(u.activoBool)}</th>
                        <td>
                            ${u.rol === "Admin" ? `
                                <button type="button" class="btn btn-secondary btn-sm" disabled title="No se puede eliminar un administrador">Eliminar</button>
                            ` : `
                                <button type="button" class="btn btn-secondary btn-sm"
                                        data-bs-toggle="modal"
                                        data-bs-target="#confirmarEliminarUsuarioModal"
                                        data-id="${u.id_usuario}"
                                        data-name="${u.nombre}">
                                    Eliminar
                                </button>
                            `}
                            <a href="/usuarios/${u.id_usuario}/editar" class="btn btn-primary btn-sm">Editar</a>
                        </td>
                    </tr>
                `;
            });

            contador.textContent = data.usuarios.length;
            activarFilaClick();
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error cargando usuarios</td></tr>`;
        });
}

function pintarEstado(activoBool) {
    if (activoBool) {
        return `<span class="badge bg-success">Activo</span>`;
    } else {
        return `<span class="badge bg-danger">Eliminado</span>`;
    }
}

function activarFilaClick() {
    document.querySelectorAll(".fila-click").forEach(td => {
        td.addEventListener("click", () => {
            const destino = td.getAttribute("data-href");
            if (destino) window.location.href = destino;
        });
    });
}

function mostrarAlerta(tipo, mensaje) {
    const cont = document.getElementById("alertas");
    if (!cont) return;
    cont.innerHTML = `<div class="alert alert-${tipo}" role="alert">${mensaje}</div>`;
    setTimeout(() => cont.innerHTML = "", 5000);
}
