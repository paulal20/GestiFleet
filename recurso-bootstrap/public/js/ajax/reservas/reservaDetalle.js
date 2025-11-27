$(function() {
    // Referencias a elementos
    const $btnConfirmar = $("#btnConfirmarCancelar");
    const $modal = $("#modalCancelarDetalle");
    
    // Variable para guardar el ID de la reserva a cancelar
    let idReservaACancelar = null;

    // 1. Cuando se abre el modal, capturamos el ID del botón que lo abrió
    // Esto es útil si hay varios botones, aunque aquí sea uno solo.
    $('#modalCancelarDetalle').on('show.bs.modal', function (event) {
        const button = $(event.relatedTarget); // Botón que disparó el modal
        idReservaACancelar = button.data('id'); // Extraer info de data-id
    });

    // 2. Al hacer clic en "Sí, Cancelar" dentro del modal
    $btnConfirmar.on("click", function() {
        if (!idReservaACancelar) return;

        // Deshabilitar botón para evitar doble click
        $btnConfirmar.prop("disabled", true);

        // Llamada AJAX al estilo del PDF
        $.ajax({
            type: "PUT", // Tu API espera un PUT en /api/reservas/:id/cancelar
            url: "/api/reservas/" + idReservaACancelar + "/cancelar",
            dataType: "json",
            
            success: function(data, textStatus, jqXHR) {
                if (data.ok) {
                    mostrarAlerta('success', 'Reserva cancelada exitosamente.');

                    // Ocultar el modal usando jQuery + Bootstrap 5
                    const modalInstance = bootstrap.Modal.getInstance($modal[0]);
                    modalInstance.hide();

                    // Actualizar la interfaz (DOM) sin recargar la página
                    // 1. Cambiar el badge a Rojo/Cancelada
                    $("#badgeEstado")
                        .removeClass("bg-success bg-secondary")
                        .addClass("bg-danger")
                        .text("Cancelada");

                    // 2. Eliminar/Ocultar el botón de cancelar original
                    $("#btnAbrirModal").remove();
                    $("#contenedorBotones").append('<p class="text-muted text-center w-100 mb-0"><small>Reserva cancelada.</small></p>');

                } else {
                    mostrarAlerta('danger', data.error || 'Error desconocido al cancelar.');
                    $btnConfirmar.prop("disabled", false);
                }
            },
            
            error: function(jqXHR, textStatus, errorThrown) {
                // Manejo de errores 404, 500, 403, etc.
                console.error("Error AJAX:", textStatus, errorThrown);
                
                let mensaje = "Error de conexión.";
                if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                    mensaje = jqXHR.responseJSON.error;
                }
                
                mostrarAlerta('danger', mensaje);
                $btnConfirmar.prop("disabled", false);
            }
        });
    });

    // Función auxiliar para mostrar alertas en el contenedor
    function mostrarAlerta(tipo, mensaje) {
        const html = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $("#alertasDetalle").html(html);
    }
});