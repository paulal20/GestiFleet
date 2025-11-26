$(document).ready(function() {
    // 1. Obtener datos iniciales del div oculto
    let $pageData = $("#pageData");
    let idConcesionario = $pageData.data("id");
    // Parsear usuario de sesión (si existe)
    window.usuarioSesion = $pageData.data("user") || null;

    // 2. Cargar datos iniciales
    cargarConcesionario(idConcesionario);
    cargarVehiculos(idConcesionario);

    // 3. Configurar el Modal Genérico de Eliminación
    let $modalEliminar = $("#modalEliminar");
    let $btnConfirmar = $("#btnConfirmarEliminar");
    
    // Variables para saber qué estamos borrando
    let idParaBorrar = null;
    let tipoParaBorrar = null; // 'vehiculo' o 'concesionario'

    // Evento al abrir el modal: Capturamos qué botón lo abrió
    $modalEliminar.on("show.bs.modal", function(event) {
        let $boton = $(event.relatedTarget); // El botón que hizo click
        
        idParaBorrar = $boton.data("id");
        tipoParaBorrar = $boton.data("tipo"); // 'vehiculo' o 'concesionario'
        let nombre = $boton.data("nombre");

        // Actualizamos el texto del modal
        $("#nombreAEliminar").text(nombre);
    });

    // Evento al confirmar el borrado (Click en botón "Eliminar" del modal)
    $btnConfirmar.on("click", function() {
        if (!idParaBorrar || !tipoParaBorrar) return;

        if (tipoParaBorrar === 'vehiculo') {
            eliminarVehiculo(idParaBorrar);
        } else if (tipoParaBorrar === 'concesionario') {
            eliminarConcesionario(idParaBorrar);
        }
    });
});

// --- FUNCIONES DE LÓGICA (AJAX) ---

function eliminarVehiculo(id) {
    $.ajax({
        type: "DELETE",
        url: "/api/vehiculos/" + id + "/eliminar",
        success: function(data) {
            // Cerrar modal usando la instancia de Bootstrap 5
            let modalEl = document.getElementById('modalEliminar');
            let modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            if (data.ok) {
                mostrarAlerta('success', 'Vehículo eliminado correctamente.');
                // Actualizar interfaz visual (bloquear botón y cambiar estado)
                let $btn = $("button[data-id='" + id + "'][data-tipo='vehiculo']");
                $btn.prop("disabled", true).text("Eliminado");
                $btn.closest("tr").find("td:nth-child(5)").html('<span class="badge bg-danger">Eliminado</span>');
            } else {
                mostrarAlerta('danger', data.error || 'Error al eliminar vehículo.');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            mostrarAlerta('danger', 'Error de conexión: ' + errorThrown);
            let modalEl = document.getElementById('modalEliminar');
            let modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
        }
    });
}

function eliminarConcesionario(id) {
    $.ajax({
        type: "DELETE",
        url: "/api/concesionarios/" + id + "/eliminar",
        success: function(data) {
            if (data.ok) {
                // Redirigir al listado tras borrar
                window.location.href = "/concesionarios";
            } else {
                let modalEl = document.getElementById('modalEliminar');
                let modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
                mostrarAlerta('danger', data.error || 'Error al eliminar concesionario.');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            let modalEl = document.getElementById('modalEliminar');
            let modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            mostrarAlerta('danger', 'Error de conexión: ' + errorThrown);
        }
    });
}

function cargarConcesionario(id) {
    $.ajax({
        type: "GET",
        url: "/api/concesionarios/" + id,
        success: function(data) {
            if (data.ok) pintarInfoConcesionario(data.concesionario);
        },
        error: function(e) { console.error(e); }
    });
}

function cargarVehiculos(id) {
    $.ajax({
        type: "GET",
        url: "/api/concesionarios/" + id,
        success: function(data) {
            if (data.ok) pintarVehiculos(data.vehiculos);
        },
        error: function(e) { console.error(e); }
    });
}

// --- FUNCIONES DE PINTADO (DOM) ---

function pintarInfoConcesionario(c) {
    $("#tituloConcesionario").text(c.nombre);

    let accionesAdmin = "";
    // Solo mostramos botón borrar si es Admin y está activo
    if (window.usuarioSesion && window.usuarioSesion.rol === "Admin" && c.activoBool) {
        accionesAdmin = `
            <div class="mt-3 d-flex gap-2">
                <button type="button" class="btn btn-outline-danger flex-fill"
                    data-bs-toggle="modal" 
                    data-bs-target="#modalEliminar"
                    data-id="${c.id_concesionario}"
                    data-nombre="${c.nombre}"
                    data-tipo="concesionario">
                    Eliminar Concesionario
                </button>
                <a href="/concesionarios/${c.id_concesionario}/editar" class="btn btn-primary flex-fill">
                    Editar
                </a>
            </div>`;
    }

    $("#infoConcesionario").html(`
      <div class="card mb-4 shadow-sm">
        <div class="row g-0">
          <div class="col-md-4 bg-light d-flex align-items-center justify-content-center">
             <img src="/img/concesionario.png" class="img-fluid rounded-start" alt="Concesionario" style="max-height:200px;">
          </div>
          <div class="col-md-8">
            <div class="card-body">
              <h5 class="card-title">Datos de Contacto</h5>
              <p class="card-text mb-1"><strong>Ciudad:</strong> ${c.ciudad}</p>
              <p class="card-text mb-1"><strong>Dirección:</strong> ${c.direccion}</p>
              <p class="card-text mb-1"><strong>Teléfono:</strong> ${c.telefono_contacto}</p>
              <p class="card-text"><strong>Estado:</strong> ${pintarEstado(c.activoBool)}</p>
              ${accionesAdmin}
            </div>
          </div>
        </div>
      </div>
    `);
}

function pintarVehiculos(lista) {
    let $tbody = $("#tablaVehiculosBody");
    $tbody.empty();

    if (!lista || !lista.length) {
        $tbody.html('<tr><td colspan="6" class="text-center text-muted">No hay vehículos registrados</td></tr>');
        return;
    }

    let html = "";
    lista.forEach(function(v) {
        let accionesAdmin = "";
        
        if (window.usuarioSesion && window.usuarioSesion.rol === "Admin") {
            // Nota: data-tipo="vehiculo" es clave aquí
            accionesAdmin = `
                <button class="btn btn-outline-danger btn-sm" 
                    data-bs-toggle="modal" 
                    data-bs-target="#modalEliminar" 
                    data-id="${v.id_vehiculo}" 
                    data-nombre="${v.marca} ${v.modelo}"
                    data-tipo="vehiculo"
                    ${!v.activoBool ? "disabled" : ""}>
                    Eliminar
                </button>
                <a href="/vehiculos/${v.id_vehiculo}/editar" class="btn btn-primary btn-sm">Editar</a>
            `;
        }

        html += `
            <tr>
                <td><a href="/vehiculos/${v.id_vehiculo}" class="text-decoration-none fw-bold">${v.matricula}</a></td>
                <td>${v.marca}</td>
                <td>${v.modelo}</td>
                <td>${pintarSituacion(v.estado)}</td>
                <td>${pintarEstado(v.activoBool)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        ${accionesAdmin}
                        <a href="/reserva?idVehiculo=${v.id_vehiculo}" class="btn btn-success btn-sm ms-1">Reservar</a>
                    </div>
                </td>
            </tr>`;
    });

    $tbody.html(html);
}

// --- AUXILIARES ---

function mostrarAlerta(tipo, mensaje) {
    let htmlAlerta = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
    
    // Inyectamos en el div que añadiste al EJS
    $("#contenedor-alertas").html(htmlAlerta);

    // Auto-cierre a los 5 segundos
    setTimeout(function() {
        $(".alert").alert('close'); 
    }, 5000);
}

function pintarEstado(activoBool) {
    return activoBool 
        ? '<span class="badge bg-success">Activo</span>' 
        : '<span class="badge bg-danger">Eliminado</span>';
}

function pintarSituacion(est) {
    let color = "secondary";
    if(est === "disponible") color = "success";
    if(est === "reservado") color = "warning text-dark";
    
    return `<span class="badge bg-${color}">${est}</span>`;
}