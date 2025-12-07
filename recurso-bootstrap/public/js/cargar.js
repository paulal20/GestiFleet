$(document).ready(function() {
    
    //Concesionarios 
    $('#btnStep1').on('click', function() {
        procesarPaso(
            '#fileConcesionarios', 
            '/carga-inicial/paso1-concesionarios', 
            function(success) {
                if (success) habilitarPaso2();
            }
        );
    });

    //Vehículos
    $('#btnStep2').on('click', function() {
        procesarPaso(
            '#fileVehiculos', 
            '/carga-inicial/paso2-vehiculos', 
            function(success) {
                if (success) habilitarPaso3();
            }
        );
    });

    //Usuarios
    $('#btnStep3').on('click', function() {
        procesarPaso(
            '#fileUsuarios', 
            '/carga-inicial/paso3-usuarios', 
            function(success) {
                if (success) {
                    //Aparece como completado y no te deja cargar más veces el JSON
                    $('#btnStep3').hide();
                    $('#status-step3').removeClass('d-none');
                    $('#card-step3').addClass('border-success shadow-sm');
                    $('#fileUsuarios').prop('disabled', true);
                    $('#btnFinish').removeClass('disabled');
                }
            }
        );
    });

    function procesarPaso(inputId, endpoint, callbackExito) {
        const fileInput = $(inputId)[0];
        
        $('#setupAlertContainer').empty();

        if (fileInput.files.length === 0) {
            mostrarAlertaError("Por favor, selecciona un archivo JSON antes de cargar.");
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const jsonContent = JSON.parse(e.target.result);
                
                // Deshabilitar botón 
                const $btn = $(inputId).closest('.perfil-card-body').find('button');
                const btnTextOriginal = $btn.html();
                $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Procesando...');

                $.ajax({
                    type: "POST",
                    url: endpoint,
                    data: JSON.stringify({ datos: jsonContent }),
                    contentType: "application/json",
                    success: function(response) {
                        $btn.prop('disabled', false).html(btnTextOriginal);

                        if (response.ok) {
                            $('#modalSuccessCount').text(response.successCount);
                            $('#modalFailCount').text(response.failCount);
                            
                            if (response.errorDetails && response.errorDetails.length > 0) {
                                let htmlErrors = '<ul class="mb-0 text-start small">';
                                response.errorDetails.forEach(err => {
                                    htmlErrors += `<li>${err}</li>`;
                                });
                                htmlErrors += '</ul>';

                                $('#setupAlertContainer').html(`
                                    <div class="alert alert-warning alert-dismissible fade show shadow-sm" role="alert">
                                        <strong> Carga con incidencias:</strong> 
                                        Algunos elementos no se procesaron:
                                        <hr class="my-2">
                                        ${htmlErrors}
                                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                    </div>
                                `);
                            } else if (response.successCount > 0) {
                                $('#setupAlertContainer').html(`
                                    <div class="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
                                        <strong> ¡Éxito!</strong> 
                                        Carga completada correctamente sin errores.
                                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                    </div>
                                `);
                            }

                            const modal = new bootstrap.Modal(document.getElementById('modalResumen'));
                            modal.show();

                            if (response.successCount > 0) {
                                callbackExito(true);
                            } else {
                                mostrarAlertaError("El archivo no contenía ningún elemento válido nuevo.");
                            }

                        } else {
                            mostrarAlertaError(response.error || "Error desconocido al procesar la solicitud.");
                        }
                    },
                    error: function(err) {
                        $btn.prop('disabled', false).html(btnTextOriginal);
                        mostrarAlertaError("Error de conexión o fallo crítico en el servidor.");
                        console.error(err);
                    }
                });

            } catch (error) {
                mostrarAlertaError("El archivo seleccionado no tiene un formato JSON válido.");
                console.error(error);
            }
        };

        reader.readAsText(file);
    }

    function mostrarAlertaError(msg) {
        $('#setupAlertContainer').html(`
            <div class="alert alert-danger alert-dismissible fade show shadow-sm border-danger" role="alert">
                ${msg}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
        $('html, body').animate({ scrollTop: 0 }, 'fast');
    }

    function habilitarPaso2() {
        //termino concesionarios
        $('#btnStep1').hide();
        $('#status-step1').removeClass('d-none');
        $('#card-step1').addClass('border-success shadow-sm');
        
        //empiezo vehiculos
        $('#card-step2').css({ 'opacity': '1', 'pointer-events': 'auto' });
        $('#header-step2').removeClass('bg-secondary').addClass('bg-primary');
        $('#fileVehiculos').prop('disabled', false);
        $('#btnStep2').prop('disabled', false).removeClass('btn-secondary').addClass('btn-primary');
    }

    function habilitarPaso3() {
        //termino vehiculos
        $('#btnStep2').hide();
        $('#status-step2').removeClass('d-none');
        $('#card-step2').addClass('border-success shadow-sm');

        //empiezo usuarios si quiero
        $('#card-step3').css({ 'opacity': '1', 'pointer-events': 'auto' });
        $('#header-step3').removeClass('bg-secondary').addClass('bg-primary');
        $('#fileUsuarios').prop('disabled', false);
        $('#btnStep3').prop('disabled', false).removeClass('btn-secondary').addClass('btn-primary');

        // Habilitar botón finalizar
        $('#btnFinish').removeClass('disabled');
    }
});