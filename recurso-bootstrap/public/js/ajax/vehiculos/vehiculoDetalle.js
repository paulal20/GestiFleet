$(document).ready(function () {
    configurarModalEliminar();
});

//FUNCIÓN MODAL ELIMINAR VEHÍCULO
function configurarModalEliminar() {
    const $modal = $("#confirmarEliminarModal");
    const $form = $("#formEliminar");
    const $spanNombre = $("#vehiculoAEliminar");

    $modal.on("show.bs.modal", function (event) {
        const $btn = $(event.relatedTarget);
        const id = $btn.data("id");
        const nombre = $btn.data("name");

        $spanNombre.text(nombre);
        
        $form.data("id", id);
    });

    $form.on("submit", function (e) {
        e.preventDefault();
        
        const id = $(this).data("id");
        if (id) {
            eliminarVehiculo(id);
        }
    });
}

//FUNCIÓN ELIMINAR VEHÍCULO
function eliminarVehiculo(id) {
    $.ajax({
        type: "DELETE",
        url: "/api/vehiculos/" + id,
        beforeSend: function() {
            // Deshabilitar botón 
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

//actualizamos la vista tras eliminar el vehículo quitando los botones
function actualizarVistaEliminado() {
    const $badges = $(".card-text .badge");
    
    $badges.each(function() {
        if ($(this).text().trim() === "Activo") {
            $(this).removeClass("bg-success").addClass("bg-danger").text("Eliminado");
        }
    });

    const $accionesDiv = $(".perfil-actions");
    
    $accionesDiv.fadeOut(300, function() {
        $(this).html('<span class="text-muted fst-italic w-100 text-center">Este vehículo ha sido eliminado y no admite acciones.</span>').fadeIn(300);
    });
}

function cerrarModal() {
    const modalEl = document.getElementById('confirmarEliminarModal');
    if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
}

function mostrarAlerta(tipo, mensaje) {
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

    setTimeout(function() {
        $cont.find(".alert").fadeOut(500, function() {
            $(this).remove();
        });
    }, 5000);
}