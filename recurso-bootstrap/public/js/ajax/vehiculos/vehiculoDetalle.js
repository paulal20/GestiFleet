/* public/js/ajax/vehiculos/vehiculoDetalle.js */

$(document).ready(function () {
    // Inicializamos la configuración del modal
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
        const $btn = $(event.relatedTarget); // El botón "Eliminar" de la tarjeta
        const id = $btn.data("id");
        const nombre = $btn.data("name");

        // Pintamos el nombre en el cuerpo del modal
        $spanNombre.text(nombre);
        
        // Guardamos el ID en el formulario para usarlo al enviar
        $form.data("id", id);
    });

    // 2. Interceptamos el envío del formulario del modal
    $form.on("submit", function (e) {
        e.preventDefault(); // Evitamos el submit tradicional (POST)
        
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
    // Como no tiene ID, buscamos el párrafo que contiene el texto "Activo:"
    const $badgeContainer = $("p.card-text").filter(function() {
        return $(this).text().indexOf("Activo:") > -1;
    });

    if ($badgeContainer.length) {
        $badgeContainer.find(".badge")
            .removeClass("bg-success")
            .addClass("bg-danger")
            .text("Eliminado");
    }

    // 2. Ocultar botones de acción (Eliminar/Editar/Reservar)
    // Seleccionamos el contenedor de acciones
    const $accionesDiv = $(".perfil-actions");
    
    // Vaciamos los botones y ponemos un texto informativo
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
    // Buscamos si ya existe el contenedor de alertas, si no, lo creamos
    // Lo insertamos justo antes de la tarjeta del vehículo
    let $cont = $("#contenedor-alertas-dinamico");
    
    if ($cont.length === 0) {
        $(".vehiculo-card").before('<div id="contenedor-alertas-dinamico" class="mx-auto" style="max-width: 900px;"></div>');
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