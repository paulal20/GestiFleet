$(function() {
    const $btnConfirmar = $("#btnConfirmarCancelar");
    const $modal = $("#modalCancelarDetalle");
    
    let idReservaACancelar = null;

    $('#modalCancelarDetalle').on('show.bs.modal', function (event) {
        const button = $(event.relatedTarget); 
        idReservaACancelar = button.data('id'); 
    });

    $btnConfirmar.on("click", function() {
        if (!idReservaACancelar) return;

        $btnConfirmar.prop("disabled", true);

        //cancelar reserva con la api
        $.ajax({
            type: "PUT",
            url: "/api/reservas/" + idReservaACancelar + "/cancelar",
            dataType: "json",
            
            success: function(data, textStatus, jqXHR) {
                if (data.ok) {
                    mostrarAlerta('success', 'Reserva cancelada exitosamente.');

                    const modalInstance = bootstrap.Modal.getInstance($modal[0]);
                    modalInstance.hide();

                    $("#badgeEstado")
                        .removeClass("bg-success bg-secondary")
                        .addClass("bg-danger")
                        .text("Cancelada");

                    $("#btnAbrirModal").remove();
                    $("#contenedorBotones").append('<p class="text-muted text-center w-100 mb-0"><small>Reserva cancelada.</small></p>');

                } else {
                    mostrarAlerta('danger', data.error || 'Error desconocido al cancelar.');
                    $btnConfirmar.prop("disabled", false);
                }
            },
            
            error: function(jqXHR, textStatus, errorThrown) {
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

    function mostrarAlerta(tipo, mensaje) {
        const html = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $("#alertasDetalle").html(html);

        setTimeout(function() {
            $("#alertasDetalle .alert").fadeOut('slow', function() {
                $(this).remove(); 
            });
        }, 5000); 
    }
});