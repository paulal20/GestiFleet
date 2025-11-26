/* public/js/ajax/concesionarios/concesionarioDetalle.js
   Adaptado a jQuery $.ajax (PDF) pero manteniendo tu lógica visual original
*/

$(document).ready(function() {
    // 1. Obtener datos iniciales
    const data = document.getElementById("pageData");
    const id = data.dataset.id;
    // Parsear usuario de sesión de forma segura
    let usuarioSesionStr = data.dataset.user || "null";
    try {
        window.usuarioSesion = JSON.parse(usuarioSesionStr);
    } catch (e) {
        window.usuarioSesion = null;
    }

    // 2. Cargar datos
    cargarConcesionario(id);
    cargarVehiculos(id);

    // 3. Configurar el Modal Genérico de Eliminación
    // Esta función ahora gestiona tanto eliminar vehículos como concesionarios
    configurarModalGenerico();
});

// --- MODAL GENÉRICO Y LÓGICA DE ELIMINACIÓN ---

function configurarModalGenerico() {
    const $modal = $("#modalEliminar");
    const $btnConfirmar = $("#btnConfirmarEliminar");
    const $textoNombre = $("#nombreAEliminar");

    // Variables para saber qué vamos a borrar
    let idParaBorrar = null;
    let tipoParaBorrar = null; // 'vehiculo' o 'concesionario'

    // Al abrir el modal, capturamos los datos del botón que se pulsó
    $modal.on("show.bs.modal", function(event) {
        const $boton = $(event.relatedTarget);
        
        idParaBorrar = $boton.data("id");
        tipoParaBorrar = $boton.data("tipo"); // Importante: el botón debe tener data-tipo
        const nombre = $boton.data("nombre");

        $textoNombre.text(nombre || "este elemento");
    });

    // Al hacer clic en "Eliminar" dentro del modal
    $btnConfirmar.off("click").on("click", function() {
        if (!idParaBorrar || !tipoParaBorrar) return;

        if (tipoParaBorrar === 'vehiculo') {
            eliminarVehiculo(idParaBorrar);
        } else if (tipoParaBorrar === 'concesionario') {
            eliminarConcesionario(idParaBorrar);
        }
    });
}

// --- FUNCIONES AJAX (DELETE) ---

function eliminarVehiculo(id) {
    $.ajax({
        type: "DELETE",
        url: "/api/vehiculos/" + id + "/eliminar",
        success: function(data) {
            cerrarModal();
            if (data.ok) {
                mostrarAlerta('success', 'Vehículo eliminado correctamente.');
                
                // Actualizar la interfaz visualmente
                let $btn = $("button[data-id='" + id + "'][data-tipo='vehiculo']");
                if ($btn.length) {
                    $btn.prop("disabled", true).text("Eliminado");
                    $btn.closest("tr").find("td:nth-child(5)").html('<span class="badge bg-danger">Eliminado</span>');
                    $btn.siblings("a").addClass("disabled").css("pointer-events", "none");
                }
            } else {
                mostrarAlerta('danger', data.error || 'Error al eliminar vehículo.');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            cerrarModal();
            console.error("Error AJAX:", errorThrown);
            mostrarAlerta('danger', 'Error de conexión al eliminar vehículo.');
        }
    });
}

function eliminarConcesionario(id) {
    $.ajax({
        type: "DELETE",
        url: "/api/concesionarios/" + id + "/eliminar",
        success: function(data) {
            cerrarModal();
            if (data.ok) {
                window.location.href = "/concesionarios";
            } else {
                mostrarAlerta('danger', data.error || 'Error al eliminar concesionario.');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            cerrarModal();
            
            // LÓGICA PERSONALIZADA PARA ERROR DE VEHÍCULOS ASOCIADOS
            let mensaje = "Error de conexión o servidor caído.";
            
            // Si el servidor devuelve el error específico (status 400)
            if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                // Si el mensaje es el de vehículos asociados, lo personalizamos o usamos el del servidor
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

// --- FUNCIONES DE CARGA (GET) ---

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

// --- PINTADO DEL DOM (Manteniendo tu estructura HTML original) ---

function pintarInfoConcesionario(c) {
    $("#tituloConcesionario").text(c.nombre);

    let accionesAdmin = "";
    if (window.usuarioSesion && window.usuarioSesion.rol === "Admin" && c.activoBool) {
        // Aquí añadimos data-tipo="concesionario" para que el modal sepa qué borrar
        accionesAdmin = `
        <div class="perfil-actions d-flex gap-2 mt-3">
            <button type="button"
                    class="btn btn-outline-secondary flex-fill"
                    data-bs-toggle="modal"
                    data-bs-target="#modalEliminar"
                    data-id="${c.id_concesionario}"
                    data-nombre="${c.nombre}"
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

function pintarVehiculos(lista) {
    let $tbody = $("#tablaVehiculosBody");
    $tbody.empty();

    if (!lista || !lista.length) {
        $tbody.html('<tr><td colspan="6" class="text-center text-muted">No hay vehículos</td></tr>');
        return;
    }

    let html = "";
    $.each(lista, function(i, v) {
        let accionesAdmin = "";
        
        if (window.usuarioSesion && window.usuarioSesion.rol === "Admin") {
            let btnDisabledAttr = !v.activoBool ? "disabled" : "";
            // Aquí añadimos data-tipo="vehiculo"
            accionesAdmin = `
                <button class="btn btn-outline-secondary btn-sm me-2" 
                    data-bs-toggle="modal" 
                    data-bs-target="#modalEliminar" 
                    data-id="${v.id_vehiculo}" 
                    data-name="${v.marca} ${v.modelo}"
                    data-tipo="vehiculo"
                    ${btnDisabledAttr}>
                    Eliminar
                </button>
                <a href="/vehiculos/${v.id_vehiculo}/editar" class="btn btn-primary btn-sm">Editar</a>
            `;
        }

        html += `
            <tr>
                <td class="fila-click" data-href="/vehiculos/${v.id_vehiculo}">${v.matricula}</td>
                <td class="fila-click" data-href="/vehiculos/${v.id_vehiculo}">${v.marca}</td>
                <td class="fila-click" data-href="/vehiculos/${v.id_vehiculo}">${v.modelo}</td>
                <td class="fila-click" data-href="/vehiculos/${v.id_vehiculo}">${pintarSituacion(v.estado)}</td>
                <td class="fila-click" data-href="/vehiculos/${v.id_vehiculo}">${pintarEstado(v.activoBool)}</td>
                <td>
                    ${accionesAdmin}
                    <a href="/reserva?idVehiculo=${v.id_vehiculo}" class="btn btn-primary btn-sm">Reservar</a>
                </td>
            </tr>`;
    });

    $tbody.html(html);
    activarFilaClick();
}

// --- AUXILIARES ---

function cerrarModal() {
    // Método robusto para cerrar modal Bootstrap 5
    let modalEl = document.getElementById('modalEliminar');
    if (modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
}

function mostrarAlerta(tipo, mensaje) {
    let $cont = $("#contenedor-alertas");
    
    // Si no existe el contenedor en el HTML, fallback a alert nativo o consola
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

function activarFilaClick() {
    $(".fila-click").off("click").on("click", function() {
        let destino = $(this).data("href");
        if (destino) window.location.href = destino;
    });
}