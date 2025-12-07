$(document).ready(function() {
    const data = document.getElementById("pageData");
    const id = data.dataset.id;
    let usuarioSesionStr = data.dataset.user || "null";
    try {
        window.usuarioSesion = JSON.parse(usuarioSesionStr);
    } catch (e) {
        window.usuarioSesion = null;
    }

    cargarConcesionario(id);
    cargarVehiculos(id);

    configurarModalGenerico();
});

//MODAL DE ELIMINAR YA SEA PARA CONCESIONARIO O VEHICULO
function configurarModalGenerico() {
    const $modal = $("#modalEliminar");
    const $btnConfirmar = $("#btnConfirmarEliminar");
    const $tituloModal = $("#modalTitulo");
    const $textoCuerpo = $("#nombreAEliminar");

    let idParaBorrar = null;
    let tipoParaBorrar = null; 

    $modal.on("show.bs.modal", function(event) {
        const $boton = $(event.relatedTarget);
        
        idParaBorrar = $boton.data("id");
        tipoParaBorrar = $boton.data("tipo");

        if (tipoParaBorrar === 'vehiculo') {
            $tituloModal.text("Eliminar vehículo");
            $textoCuerpo.text("este vehículo");
        } else if (tipoParaBorrar === 'concesionario') {
            $tituloModal.text("Eliminar concesionario");
            $textoCuerpo.text("este concesionario");
        } else {
            $tituloModal.text("Eliminar elemento");
            $textoCuerpo.text("este elemento");
        }
    });

    $btnConfirmar.off("click").on("click", function() {
        if (!idParaBorrar || !tipoParaBorrar) return;

        if (tipoParaBorrar === 'vehiculo') {
            eliminarVehiculo(idParaBorrar);
        } else if (tipoParaBorrar === 'concesionario') {
            eliminarConcesionario(idParaBorrar);
        }
    });
}

//Eliminamos vehiculo con la api de vehiculos
function eliminarVehiculo(id) {
    $.ajax({
        type: "DELETE",
        url: "/api/vehiculos/" + id,
        success: function(data) {
            cerrarModal();

            if (data.ok) {
                mostrarAlerta('success', 'Vehículo eliminado correctamente.');

                let $btn = $("button[data-id='" + id + "'][data-tipo='vehiculo']");

                if ($btn.length) {
                    let $row = $btn.closest("tr");

                    $row.find("td:nth-child(5)")
                        .html('<span class="badge bg-danger">Eliminado</span>');

                    // COmo eliminamos quitamos las acciones
                    $row.find("td:last").html(`
                        <span class="text-muted fst-italic">Sin acciones</span>
                    `);
                }

            } else {
                mostrarAlerta('danger', data.error || 'Error al eliminar vehículo.');
            }
        },
        error: function() {
            cerrarModal();
            mostrarAlerta('danger', 'Error de conexión al eliminar vehículo.');
        }
    });
}

//Eliminamos concesionario con la api de concesionarios
function eliminarConcesionario(id) {
    $.ajax({
        type: "DELETE",
        url: "/api/concesionarios/" + id + "/eliminar",
        success: function(data) {
            cerrarModal();
            if (data.ok) {
                mostrarAlerta('success', 'Concesionario eliminado correctamente.');
                cargarConcesionario(id); 
            } else {
                mostrarAlerta('danger', data.error || 'Error al eliminar concesionario.');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            cerrarModal();
            
            let mensaje = "Error de conexión o servidor caído.";
            
            if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                if (jqXHR.responseJSON.error.includes("Tiene vehículos asociados")) {
                    mensaje = "No se puede eliminar, tiene vehículos asociados.";
                } else {
                    mensaje = jqXHR.responseJSON.error;
                }
            }
            mostrarAlerta('danger', mensaje);
        }
    });
}

//FUNCION DE CARGAR CONCESIONARIO
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

//FUNCION DE CARGAR LOS VEHICULOS DEL CONCESIONARIO
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

//FUNCION DE PINTAR LA INFO DEL CONCESIONARIO
function pintarInfoConcesionario(c) {
    $("#tituloConcesionario").text(c.nombre);

    let accionesAdmin = "";
    if (window.usuarioSesion && window.usuarioSesion.rol === "Admin" && c.activoBool) {
        accionesAdmin = `
        <div class="perfil-actions d-flex gap-2 mt-3">
            <button type="button"
                    class="btn btn-outline-secondary flex-fill"
                    data-bs-toggle="modal"
                    data-bs-target="#modalEliminar"
                    data-id="${c.id_concesionario}"
                    data-tipo="concesionario">
              Eliminar
            </button>

            <a href="/concesionarios/${c.id_concesionario}/editar" 
               class="btn btn-primary flex-fill">
               Editar
            </a>
        </div>`;
    }

    $("#infoConcesionario").html(`
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
    `);
}

//FUNCION DE PINTAR LOS VEHICULOS DEL CONCESIONARIO
function pintarVehiculos(lista) {
    let $tbody = $("#tablaVehiculosBody");
    $tbody.empty();

    if (!lista || !lista.length) {
        $tbody.html('<tr><td colspan="6" class="text-center text-muted">No hay vehículos</td></tr>');
        return;
    }

    const ahora = new Date();
    const offsetMs = ahora.getTimezoneOffset() * 60 * 1000;
    const fechaLocal = new Date(ahora.getTime() - offsetMs);
    const fechaActualStr = fechaLocal.toISOString().slice(0, 16);

    let html = "";
    $.each(lista, function(i, v) {
        let accionesAdmin = "";
        let reservaBtn = "";
        let htmlDisponibilidad = "";
        if (v.estaReservado) {
            htmlDisponibilidad = '<span class="badge bg-warning text-dark">Reservado</span>';
        } else {
            htmlDisponibilidad = '<span class="badge bg-success">Disponible</span>';
        }

        if (window.usuarioSesion && window.usuarioSesion.rol === "Admin") {
            if(v.activoBool){
                let btnDisabledAttr = !v.activoBool ? "disabled" : "";
                accionesAdmin = `
                    <button class="btn btn-outline-secondary btn-sm me-2" 
                        data-bs-toggle="modal" 
                        data-bs-target="#modalEliminar" 
                        data-id="${v.id_vehiculo}" 
                        data-tipo="vehiculo"
                        ${btnDisabledAttr}>
                        Eliminar
                    </button>
                    <a href="/vehiculos/${v.id_vehiculo}/editar" class="btn btn-primary btn-sm">Editar</a>
                `;
            } else {
                accionesAdmin = `
                <span class="text-muted fst-italic">Sin acciones</span>
                `;
            }
        }

        // Solo mostramos reservar si está activo Y NO está reservado actualmente
        if(v.activoBool && !v.estaReservado){
            reservaBtn = `<a href="/reserva?idVehiculo=${v.id_vehiculo}&fechaInicio=${fechaActualStr}" class="btn btn-primary btn-sm ms-1">Reservar</a>`;
        } else if (v.activoBool && v.estaReservado) {
            reservaBtn = `<button class="btn btn-primary btn-sm ms-1" disabled>Ocupado</button>`;
        } else if (v.activoBool){
            reservaBtn = `<button class="btn btn-primary btn-sm ms-1" disabled>Reservar</button>`;
        } else {
            reservaBtn = "";
        }

        html += `
            <tr class="fila-click" tabindex="0" data-href="/vehiculos/${v.id_vehiculo}">
                <td>${v.matricula}</td>
                <td>${v.marca}</td>
                <td>${v.modelo}</td>
                <td>${htmlDisponibilidad}</td>
                <td>${pintarEstado(v.activoBool)}</td>
                <td class="celda-acciones" style="cursor: default;">
                    <div class="d-flex gap-1">
                        ${accionesAdmin}
                        ${reservaBtn}
                    </div>
                </td>
            </tr>`;
    });

    $tbody.html(html);
    activarFilaClick();
}


function cerrarModal() {
    let modalEl = document.getElementById('modalEliminar');
    if (modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
}

function mostrarAlerta(tipo, mensaje) {
    let $cont = $("#contenedor-alertas");
    
    if ($cont.length === 0) {
        console.warn("No existe #contenedor-alertas en el HTML. Mensaje:", mensaje);
        alert(mensaje);
        return;
    }

    let html = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
    
    $cont.html(html);

    setTimeout(function() {
        $cont.find(".alert").alert('close'); 
    }, 5000);
}

//si está o no activo
function pintarEstado(activoBool) {
    return activoBool 
        ? '<span class="badge bg-success">Activo</span>' 
        : '<span class="badge bg-danger">Eliminado</span>';
}

function activarFilaClick() {

    //para el click del ratón
    $(".fila-click").off("click").on("click", function(e) {
        if ($(e.target).closest("button, a").length > 0) return;
        if ($(e.target).closest(".celda-acciones").length > 0) return;

        const destino = $(this).data("href");
        if (destino) window.location.href = destino;
    });

    //para acceder por teclado ya sea con enter o espacio --> ACCESIBILIDAD
    $(".fila-click").off("keydown").on("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const destino = $(this).data("href");
            if (destino) window.location.href = destino;
        }
    });
}