/* public/js/ajax/vehiculos/vehiculoDetalle.js */

$(document).ready(function () {
    configurarModalEliminar();
});

// ==========================
//  CONFIGURACIÓN DEL MODAL
// ==========================
function configurarModalEliminar() {
    const $modal = $("#confirmarEliminarModal");
    const $form = $("#formEliminar");
    const $spanNombre = $("#vehiculoAEliminar");

    // 1. Al abrir el modal, capturamos los datos del botón que lo activó
    $modal.on("show.bs.modal", function (event) {
        const $btn = $(event.relatedTarget);
        const id = $btn.data("id");
        const nombre = $btn.data("name");

        // Pintamos el nombre en el cuerpo del modal
        $spanNombre.text(nombre);
        
        // Guardamos el ID en el formulario para usarlo al enviar
        $form.data("id", id);
    });

    // 2. Interceptamos el envío del formulario
    $form.on("submit", function (e) {
        e.preventDefault(); // Evitamos el submit tradicional para que no recargue
        
        const id = $(this).data("id");
        if (id) {
            eliminarVehiculo(id);
        }
    });
}

// ==========================
//  LÓGICA AJAX (DELETE)
// ==========================
function eliminarVehiculo(id) {
    $.ajax({
        type: "DELETE",
        url: "/api/vehiculos/" + id,
        beforeSend: function() {
            // Deshabilitar botón para evitar doble clic
            $("#formEliminar button[type='submit']").prop("disabled", true);
        },
        success: function (data) {
            cerrarModal();
            
            if (data.ok) {
                mostrarAlerta("success", "Vehículo eliminado correctamente.");
                actualizarVistaEliminado();
            } else {
                mostrarAlerta("danger", data.error || "Error al eliminar el vehículo.");
            }
        },
        error: function (jqXHR) {
            cerrarModal();
            let mensaje = "Error de conexión.";
            if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                mensaje = jqXHR.responseJSON.error;
            }
            mostrarAlerta("danger", mensaje);
        },
        complete: function() {
             $("#formEliminar button[type='submit']").prop("disabled", false);
        }
    });
}

// ==========================
//  ACTUALIZACIÓN VISUAL (DOM)
// ==========================
function actualizarVistaEliminado() {
    // 1. Cambiar el Badge de estado (Activo -> Eliminado)
    // Buscamos los badges dentro de la tarjeta
    const $badges = $(".card-text .badge");
    
    // Filtramos para encontrar el badge de "Activo" y cambiarlo
    $badges.each(function() {
        if ($(this).text().trim() === "Activo") {
            $(this).removeClass("bg-success").addClass("bg-danger").text("Eliminado");
        }
    });

    // 2. Ocultar botones de acción (Eliminar/Editar/Reservar) y mostrar mensaje
    const $accionesDiv = $(".perfil-actions");
    
    $accionesDiv.fadeOut(300, function() {
        $(this).html('<span class="text-muted fst-italic w-100 text-center">Este vehículo ha sido eliminado y no admite acciones.</span>').fadeIn(300);
    });
}

// ==========================
//  AUXILIARES
// ==========================
function cerrarModal() {
    const modalEl = document.getElementById('confirmarEliminarModal');
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
}

function mostrarAlerta(tipo, mensaje) {
    // Si no existe el contenedor dinámico, lo creamos antes de la tarjeta
    let $cont = $("#contenedor-alertas-dinamico");
    
    if ($cont.length === 0) {
        $(".vehiculo-card").before('<div id="contenedor-alertas-dinamico" class="mx-auto mb-3" style="max-width: 900px;"></div>');
        $cont = $("#contenedor-alertas-dinamico");
    }

    const html = `
        <div class="alert alert-${tipo} alert-dismissible fade show shadow-sm" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
    
    $cont.html(html);

    // Auto-cerrar a los 5 segundos
    setTimeout(function() {
        $cont.find(".alert").alert('close'); 
    }, 5000);
}