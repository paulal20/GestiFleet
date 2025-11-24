document.addEventListener("DOMContentLoaded", () => {
    const data = document.getElementById("pageData");
    const id = data.dataset.id;
    window.usuarioSesion = JSON.parse(data.dataset.user || "null");

    cargarConcesionario(id);
    cargarVehiculos(id);

    const formEliminar = document.getElementById("formEliminarVehiculo");
    if (formEliminar) {
        formEliminar.addEventListener("submit", async (e) => {
            e.preventDefault();

            const btnModal = formEliminar.querySelector("button[type='submit']");
            const modal = document.getElementById("confirmarEliminarVehiculoModal");
            const idVehiculo = btnModal.dataset.id;

            if (!idVehiculo) return;

            try {
                const res = await fetch(`/api/vehiculos/${idVehiculo}/eliminar`, {
                    method: "DELETE"
                });

                const data = await res.json();

                if (!data.ok) {
                    mostrarAlerta('danger', data.error || 'Error al eliminar el vehículo.');
                } else {
                    mostrarAlerta('success', `Vehículo eliminado: ${btnModal.dataset.name}`);

                    // Desactivar el botón de la tabla
                    const btn = document.querySelector(`button[data-id="${idVehiculo}"]`);
                    if (btn) {
                        btn.disabled = true;
                        btn.textContent = "Eliminar";
                        const filaActivo = btn.closest("tr").querySelector("td:nth-child(5)");
                        if (filaActivo)
                            filaActivo.innerHTML = `<span class="badge bg-danger">Eliminado</span>`;
                    }

                    // Cerrar modal
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) modalInstance.hide();
                }

            } catch (err) {
                console.error("Error al eliminar vehículo:", err);
                mostrarAlerta('danger', 'Error al eliminar el vehículo.');
            } finally {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) modalInstance.hide();
            }
        });
    }

    // EVENTO show.bs.modal (igual que concesionarios)
    const modalEliminar = document.getElementById("confirmarEliminarVehiculoModal");
    if (modalEliminar) {
        modalEliminar.addEventListener("show.bs.modal", (event) => {

            const button = event.relatedTarget;
            const id = button.getAttribute("data-id");
            const nombre = button.getAttribute("data-name");

            const btnSubmit = formEliminar.querySelector("button[type='submit']");
            btnSubmit.dataset.id = id;
            btnSubmit.dataset.name = nombre;

            const texto = modalEliminar.querySelector("#textoConfirmacionVehiculo");
            if (texto) {
                texto.textContent = `¿Estás seguro de que deseas eliminar el vehículo "${nombre}"?`;
            }
        });
    }
});

function cargarConcesionario(id) {
    fetch(`/api/concesionarios/${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.ok) pintarInfoConcesionario(data.concesionario);
        })
        .catch(err => console.error("Error cargando concesionario:", err));
}

function pintarInfoConcesionario(c) {
    document.getElementById("tituloConcesionario").textContent = c.nombre;

    // Acciones admin
    let accionesAdmin = "";
    if (window.usuarioSesion?.rol === "Admin") {
        accionesAdmin = `
        <div class="perfil-actions d-flex gap-2 mt-3">
            <button type="button"
                    class="btn btn-outline-secondary flex-fill"
                    data-bs-toggle="modal"
                    data-bs-target="#modalEliminar"
                    data-nombre="${c.nombre}"
                    ${!c.activoBool ? "disabled" : ""}>
              Eliminar
            </button>

            <a href="/concesionarios/${c.id_concesionario}/editar"
               class="btn btn-primary flex-fill">
               Editar
            </a>
        </div>`;
    }

    document.getElementById("infoConcesionario").innerHTML = `
      <div class="vehiculo-card card mx-auto" style="max-width: 900px;">
        <div class="row g-0">

          <div class="col-md-4">
            <div class="vehiculo-img-container h-100 d-flex align-items-center justify-content-center bg-light">
              <img src="/img/concesionario.png" 
                   class="rounded-end img-cover" 
                   alt="${c.nombre}"
                   style="max-height: 300px; object-fit: cover;">
            </div>
          </div>

          <div class="col-md-8 d-flex flex-column">
            <div class="card-body flex-grow-1">
              <h5 class="card-title">Información de Contacto</h5>
              
              <div class="row mb-2">
                <div class="col-sm-6 fw-bold">Ciudad:</div>
                <div class="col-sm-6">${c.ciudad}</div>
              </div>
              <div class="row mb-2">
                <div class="col-sm-6 fw-bold">Dirección:</div>
                <div class="col-sm-6">${c.direccion}</div>
              </div>
              <div class="row mb-2">
                <div class="col-sm-6 fw-bold">Teléfono:</div>
                <div class="col-sm-6">${c.telefono_contacto}</div>
              </div>
              <div class="row mb-2">
                <div class="col-sm-6 fw-bold">Estado:</div>
                <div class="col-sm-6">${pintarEstado(c.activoBool)}</div>
              </div>
            </div>

            ${accionesAdmin}

          </div>
        </div>
      </div>
    `;
}

function pintarEstado(activoBool) {
    if (activoBool) {
        return `<span class="badge bg-success">Activo</span>`;
    } else {
        return `<span class="badge bg-danger">Eliminado</span>`;
    }
}

function cargarVehiculos(id) {
    fetch(`/api/concesionarios/${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.ok) pintarVehiculos(data.vehiculos);
        })
        .catch(err => console.error("Error cargando vehículos:", err));
}

function pintarVehiculos(lista) {
    const tbody = document.getElementById("tablaVehiculosBody");
    tbody.innerHTML = "";

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">No hay vehículos</td>
            </tr>
        `;
        return;
    }

    lista.forEach(v => {

        let accionesAdmin = "";

        if (window.usuarioSesion?.rol === "Admin") {
            accionesAdmin = `
                <button type="button"
                    class="btn btn-outline-secondary btn-sm me-2"
                    data-bs-toggle="modal"
                    data-bs-target="#confirmarEliminarModal"
                    data-id="${v.id_vehiculo}"
                    data-name="${v.marca} ${v.modelo}"
                    ${!v.activoBool ? "disabled" : ""}>
                    Eliminar
                </button>

                <a href="/vehiculos/${v.id_vehiculo}/editar" 
                    class="btn btn-primary btn-sm">
                    Editar
                </a>
            `;
        }

        tbody.innerHTML += `
            <tr class="fila-click" data-href="/vehiculos/${v.id_vehiculo}">
                <td>${v.matricula}</td>
                <td>${v.marca}</td>
                <td>${v.modelo}</td>
                <td>${pintarSituacion(v.estado)}</td>
                <td>${pintarEstado(v.activoBool)}</td>
                <td>${accionesAdmin}</td>

            </tr>
        `;
    });
    activarFilaClick();
}

function pintarSituacion(est) {
    const clases = {
        disponible: "bg-success",
        reservado: "bg-warning text-dark",
        mantenimiento: "bg-secondary"
    };

    const clase = clases[est] || "bg-light text-dark";
    return `<span class="badge ${clase}">${est}</span>`;
}

function activarFilaClick() {
    document.querySelectorAll(".fila-click").forEach(td => {
        td.addEventListener("click", () => {
            const destino = td.getAttribute("data-href");
            if (destino) window.location.href = destino;
        });
    });
}


function configurarModalEliminar(idConcesionario) {

    const formEliminar = document.getElementById("formEliminarConcesionario");
    const modal = document.getElementById("confirmarEliminarConcesionarioModal");

    if (!formEliminar || !modal) return;

    modal.addEventListener("show.bs.modal", (event) => {
        const btn = event.relatedTarget;

        const id = btn.dataset.id;
        const nombre = btn.dataset.name;

        const btnSubmit = formEliminar.querySelector("button[type='submit']");
        btnSubmit.dataset.id = id;
        btnSubmit.dataset.name = nombre;

        const txt = modal.querySelector("#textoConfirmacionConcesionario");
        txt.textContent = `¿Estás seguro de que deseas eliminar el concesionario "${nombre}"?`;
    });

    formEliminar.addEventListener("submit", async (e) => {
        e.preventDefault();

        const btnSubmit = formEliminar.querySelector("button[type='submit']");
        const id = btnSubmit.dataset.id;

        try {
            const res = await fetch(`/api/concesionarios/${id}/eliminar`, { method: "DELETE" });
            const data = await res.json();

            if (!data.ok) {
                alert(data.error || "Error al eliminar concesionario");
                return;
            }

            window.location.href = "/concesionarios";

        } catch (err) {
            console.error("Error eliminando:", err);
            alert("Error al eliminar concesionario");
        }
    });
}
