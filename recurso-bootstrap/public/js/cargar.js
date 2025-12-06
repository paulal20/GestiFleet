$(document).ready(function() {
    
    // --- PASO 1: Concesionarios ---
    $('#btnStep1').on('click', function() {
        procesarPaso(
            '#fileConcesionarios', 
            '/carga-inicial/paso1-concesionarios', 
            function(success) {
                if (success) habilitarPaso2();
            }
        );
    });

    // --- PASO 2: Vehículos ---
    $('#btnStep2').on('click', function() {
        procesarPaso(
            '#fileVehiculos', 
            '/carga-inicial/paso2-vehiculos', 
            function(success) {
                if (success) habilitarPaso3();
            }
        );
    });

    // --- PASO 3: Usuarios ---
    $('#btnStep3').on('click', function() {
        procesarPaso(
            '#fileUsuarios', 
            '/carga-inicial/paso3-usuarios', 
            function(success) {
                // Paso 3 es opcional
            }
        );
    });

    // --- Función Genérica de Proceso ---
    function procesarPaso(inputId, endpoint, callbackExito) {
        const fileInput = $(inputId)[0];
        
        // LIMPIEZA DE ALERTAS PREVIAS
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
                
                // Deshabilitar botón para evitar doble click
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
                            // Actualizar contadores del modal
                            $('#modalSuccessCount').text(response.successCount);
                            $('#modalFailCount').text(response.failCount);
                            
                            // 1. Mostrar Alertas detalladas si hubo errores parciales
                            if (response.errorDetails && response.errorDetails.length > 0) {
                                let htmlErrors = '<ul class="mb-0 text-start small">';
                                response.errorDetails.forEach(err => {
                                    htmlErrors += `<li>${err}</li>`;
                                });
                                htmlErrors += '</ul>';

                                $('#setupAlertContainer').html(`
                                    <div class="alert alert-warning alert-dismissible fade show shadow-sm" role="alert">
                                        <strong><img src="/bootstrap-icons-1.13.1/exclamation-triangle-fill.svg" class="bi-svg" alt="" style="filter: invert(1); width: 20px; height: 20px;"> Carga con incidencias:</strong> 
                                        Algunos elementos no se procesaron:
                                        <hr class="my-2">
                                        ${htmlErrors}
                                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                    </div>
                                `);
                            } else if (response.successCount > 0) {
                                // 2. Alerta de éxito total
                                $('#setupAlertContainer').html(`
                                    <div class="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
                                        <strong><img src="/bootstrap-icons-1.13.1/check-circle-fill.svg" class="bi-svg" alt="" style="width: 20px; height: 20px;"> ¡Éxito!</strong> 
                                        Carga completada correctamente sin errores.
                                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                    </div>
                                `);
                            }

                            // 3. Mostrar el Modal
                            const modal = new bootstrap.Modal(document.getElementById('modalResumen'));
                            modal.show();

                            // Lógica de validación: Con que haya 1 éxito, pasamos al siguiente
                            if (response.successCount > 0) {
                                callbackExito(true);
                            } else {
                                mostrarAlertaError("El archivo no contenía ningún elemento válido nuevo.");
                            }

                        } else {
                            // Error controlado desde el servidor
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

    // --- Helpers visuales ---

    function mostrarAlertaError(msg) {
        // Inyecta alerta Bootstrap roja
        $('#setupAlertContainer').html(`
            <div class="alert alert-danger alert-dismissible fade show shadow-sm border-danger" role="alert">
                <img src="/bootstrap-icons-1.13.1/x-circle-fill.svg" class="bi-svg" alt="" style="width: 20px; height: 20px;"> ${msg}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `);
        // Scroll suave hacia arriba
        $('html, body').animate({ scrollTop: 0 }, 'fast');
    }

    function habilitarPaso2() {
        // Finalizar Paso 1
        $('#btnStep1').hide();
        $('#status-step1').removeClass('d-none');
        $('#card-step1').addClass('border-success shadow-sm');
        
        // Habilitar Paso 2
        $('#card-step2').css({ 'opacity': '1', 'pointer-events': 'auto' });
        $('#header-step2').removeClass('bg-secondary').addClass('bg-primary');
        $('#fileVehiculos').prop('disabled', false);
        // Cambiamos estilo del botón de gris a azul
        $('#btnStep2').prop('disabled', false).removeClass('btn-secondary').addClass('btn-primary');
    }

    function habilitarPaso3() {
        // Finalizar Paso 2
        $('#btnStep2').hide();
        $('#status-step2').removeClass('d-none');
        $('#card-step2').addClass('border-success shadow-sm');

        // Habilitar Paso 3
        $('#card-step3').css({ 'opacity': '1', 'pointer-events': 'auto' });
        $('#header-step3').removeClass('bg-secondary').addClass('bg-primary');
        $('#fileUsuarios').prop('disabled', false);
        // Cambiamos estilo del botón de gris a azul
        $('#btnStep3').prop('disabled', false).removeClass('btn-secondary').addClass('btn-primary');

        // Habilitar Botón Finalizar
        $('#btnFinish').removeClass('disabled');
    }
});