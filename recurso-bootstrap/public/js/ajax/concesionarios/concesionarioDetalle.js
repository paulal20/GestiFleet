/* public/js/ajax/concesionarios/concesionarioDetalle.js
   Adaptado a jQuery $.ajax (PDF) pero manteniendo tu lógica visual original
*/

$(document).ready(function() {
    // 1. Obtener datos iniciales (Mantenemos tu lógica original de dataset)
    const data = document.getElementById("pageData");
    const id = data.dataset.id;
    window.usuarioSesion = JSON.parse(data.dataset.user || "null");

    // 2. Cargar datos
    cargarConcesionario(id);
    cargarVehiculos(id);

    // 3. Lógica del formulario de eliminar (Vehículo)
    const formEliminar = document.getElementById("formEliminarVehiculo");
    if (formEliminar) {
        // Usamos .on de jQuery para el evento submit
        $(formEliminar).on("submit", function(e) {
            e.preventDefault();

            const btnModal = formEliminar.querySelector("button[type='submit']");
            const modalEl = document.getElementById("confirmarEliminarVehiculoModal");
            const idVehiculo = btnModal.dataset.id;

            if (!idVehiculo) return;

            // --- CAMBIO CLAVE: FETCH -> $.AJAX (Requisito PDF) ---
            $.ajax({
                type: "DELETE",
                url: "/api/vehiculos/" + idVehiculo + "/eliminar",
                success: function(data) {
                    if (!data.ok) {
                        mostrarAlerta('danger', data.error || 'Error al eliminar el vehículo.');
                    } else {
                        mostrarAlerta('success', 'Vehículo eliminado: ' + btnModal.dataset.name);

                        // Tu lógica visual original para desactivar el botón
                        const btn = document.querySelector('button[data-id="' + idVehiculo + '"]');
                        if (btn) {
                            btn.disabled = true;
                            btn.textContent = "Eliminado";
                            const filaActivo = btn.closest("tr").querySelector("td:nth-child(5)");
                            if (filaActivo)
                                filaActivo.innerHTML = '<span class="badge bg-danger">Eliminado</span>';
                        }

                        // Cerrar modal
                        const modalInstance = bootstrap.Modal.getInstance(modalEl);
                        if (modalInstance) modalInstance.hide();
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error("Error AJAX:", errorThrown);
                    mostrarAlerta('danger', 'Error al eliminar el vehículo.');
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                }
            });
        });
    }

    // 4. Eventos del Modal
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
                texto.textContent = '¿Estás seguro de que deseas eliminar el vehículo "' + nombre + '"?';
            }
        });
    }
    
    // Configurar modal concesionario (si existe la función externa o local)
    if (typeof configurarModalEliminar === 'function') {
        configurarModalEliminar(id);
    }
});

// --- FUNCIONES DE CARGA (Adaptadas a $.ajax) ---

function cargarConcesionario(id) {
    $.ajax({
        type: "GET",
        url: "/api/concesionarios/" + id,
        cache: false,
        success: function(data) {
            if (data.ok) pintarInfoConcesionario(data.concesionario);
        },
        error: function(e) { console.error("Error cargando concesionario:", e); }
    });
}

function cargarVehiculos(id) {
    $.ajax({
        type: "GET",
        url: "/api/concesionarios/" + id,
        cache: false,
        success: function(data) {
            if (data.ok) pintarVehiculos(data.vehiculos);
        },
        error: function(e) { console.error("Error cargando vehículos:", e); }
    });
}

// --- TUS FUNCIONES VISUALES ORIGINALES (INTACTAS) ---

function pintarInfoConcesionario(c) {
    document.getElementById("tituloConcesionario").textContent = c.nombre;

    let accionesAdmin = "";
    if (window.usuarioSesion && window.usuarioSesion.rol === "Admin" && c.activoBool) {
        accionesAdmin = `
        <div class="perfil-actions d-flex gap-2 mt-3">
            <button type="button"
                    class="btn btn-outline-secondary flex-fill"
                    data-bs-toggle="modal"
                    data-bs-target="#confirmarEliminarConcesionarioModal"
                    data-id="${c.id_concesionario}"
                    data-name="${c.nombre}">
              Eliminar
            </button>

            <a href="/concesionarios/${c.id_concesionario}/editar" 
               class="btn btn-primary flex-fill" >
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

function pintarVehiculos(lista) {
    const tbody = document.getElementById("tablaVehiculosBody");
    tbody.innerHTML = "";

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">No hay vehículos</td>
            </tr>
        `;
        return;
    }

    lista.forEach(v => {
        let accionesAdmin = "";

        if (window.usuarioSesion && window.usuarioSesion.rol === "Admin") {
            accionesAdmin = `
                <button type="button"
                    class="btn btn-outline-secondary btn-sm me-2"
                    data-bs-toggle="modal"
                    data-bs-target="#confirmarEliminarVehiculoModal"
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
            <tr>
                <td class="fila-click" data-href="/vehiculos/${v.id_vehiculo}">${v.matricula}</td>
                <td class="fila-click" data-href="/vehiculos/${v.id_vehiculo}">${v.marca}</td>
                <td class="fila-click" data-href="/vehiculos/${v.id_vehiculo}">${v.modelo}</td>
                <td class="fila-click" data-href="/vehiculos/${v.id_vehiculo}">${pintarSituacion(v.estado)}</td>
                <td class="fila-click" data-href="/vehiculos/${v.id_vehiculo}">${pintarEstado(v.activoBool)}</td>
                <td>${accionesAdmin}
                    <a href="/reserva?idVehiculo=${v.id_vehiculo}" 
                        class="btn btn-primary btn-sm">
                        Reservar
                    </a>
                </td>
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
        const id = btn.getAttribute("data-id");
        const nombre = btn.getAttribute("data-name");

        const btnSubmit = formEliminar.querySelector("button[type='submit']");
        btnSubmit.dataset.id = id;
        btnSubmit.dataset.name = nombre;

        const txt = modal.querySelector("#textoConfirmacionConcesionario");
        if (txt) txt.textContent = `¿Estás seguro de que deseas eliminar el concesionario "${nombre}"?`;
    });

    // Usamos jQuery para el submit también aquí para consistencia con AJAX
    $(formEliminar).on("submit", function(e) {
        e.preventDefault();

        const btnSubmit = formEliminar.querySelector("button[type='submit']");
        const id = btnSubmit.dataset.id;

        $.ajax({
            type: "DELETE",
            url: "/api/concesionarios/" + id + "/eliminar",
            success: function(data) {
                if (!data.ok) {
                    alert(data.error || "Error al eliminar concesionario");
                } else {
                    window.location.href = "/concesionarios";
                }
            },
            error: function(xhr, status, error) {
                console.error("Error eliminando:", error);
                alert("Error al eliminar concesionario");
            }
        });
    });
}

// Función auxiliar para mostrar alertas (Si la usas globalmente)
function mostrarAlerta(tipo, mensaje) {
    const cont = document.getElementById('alertas') || document.getElementById('contenedor-alertas');
    if (cont) {
        cont.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        if(window.jQuery) {
            setTimeout(() => $(cont).find('.alert').alert('close'), 5000);
        }
    } else {
        console.log(`[Alerta ${tipo}]: ${mensaje}`);
    }
}