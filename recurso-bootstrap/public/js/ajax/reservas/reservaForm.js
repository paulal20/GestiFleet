$(document).ready(function() {
    const $fechaInicio = $("#fechaInicio");
    const $vehiculoSelect = $("#vehiculo");
    const $errorVehiculoSpan = $("#error-vehiculo"); 

    $fechaInicio.on('change', function() {
        const nuevaFecha = $(this).val();
        if (!nuevaFecha) return;

        const idPrevio = $vehiculoSelect.val();

        $vehiculoSelect.prop('disabled', true);
        
        $vehiculoSelect.html('<option>Cargando disponibles...</option>');

        //para ver qué vehículos están disponibles en esa fecha
        $.ajax({
            type: "GET",
            url: "/api/reservas/disponibles",
            data: { fecha: nuevaFecha },
            success: function(response) {
                $vehiculoSelect.empty();
                $vehiculoSelect.append('<option value="">Seleccione un vehículo</option>');
                
                if (response.ok && response.vehiculos.length > 0) {
                    response.vehiculos.forEach(v => {
                        $vehiculoSelect.append(
                            `<option value="${v.id_vehiculo}">${v.marca} ${v.modelo} (${v.matricula})</option>`
                        );
                    });
                } else {
                    $vehiculoSelect.append('<option value="" disabled>No hay vehículos disponibles a esta hora</option>');
                }

                if (idPrevio) {
                    $vehiculoSelect.val(idPrevio);
                }

                const cocheSigueAhi = $vehiculoSelect.val(); 

                if (idPrevio && !cocheSigueAhi) {
                    $vehiculoSelect.val("");
                    $vehiculoSelect.removeClass('is-valid').addClass('is-invalid');
                    $errorVehiculoSpan.text("El vehículo seleccionado no está disponible para esta fecha. Por favor, elige otro.");
                } 
                else if (cocheSigueAhi) {
                    $vehiculoSelect.removeClass('is-invalid').addClass('is-valid');
                    $errorVehiculoSpan.text(""); 
                }
                else {
                    $vehiculoSelect.removeClass('is-valid is-invalid');
                    $errorVehiculoSpan.text("");
                }

                $vehiculoSelect.prop('disabled', false);
            },
            error: function() {
                $vehiculoSelect.html('<option value="">Error al cargar</option>');
                $vehiculoSelect.prop('disabled', false);
                $errorVehiculoSpan.text("Error de conexión al buscar vehículos.");
            }
        });
    });

    const confirmBtn = document.getElementById('confirmarReservaBtn');
    
    if (confirmBtn) {
        const nuevoBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(nuevoBtn, confirmBtn);

        $(nuevoBtn).on('click', function(e) {
            e.preventDefault();

            $(".error").text(""); 
            $(".form-control").removeClass("is-invalid");
            $("#alertasForm").html(""); 

            const formData = {
                "vehiculo": $("#vehiculo").val(),
                "fechaInicio": $("#fechaInicio").val(),
                "fechaFin": $("#fechaFin").val()
            };

            const $btn = $(this);
            const textoOriginal = $btn.text();
            $btn.prop('disabled', true).text("Procesando...");

            //al confirmar la reserva hacemos la petición a la api
            $.ajax({
                type: "POST",
                url: "/api/reservas",
                contentType: "application/json",
                data: JSON.stringify(formData),
                
                success: function(data) {
                    if (data.ok) {
                        window.location.href = data.redirectUrl;
                    }
                },
                
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error("Error AJAX:", errorThrown);
                    
                    let mensaje = 'Error desconocido.';
                    if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                        mensaje = jqXHR.responseJSON.error;
                    }

                    $btn.prop('disabled', false).text(textoOriginal);

                    const modalEl = document.getElementById('confirmacionModal');
                    if (typeof bootstrap !== 'undefined' && modalEl) {
                        const modalInstance = bootstrap.Modal.getInstance(modalEl);
                        if (modalInstance) modalInstance.hide();
                    }

                    if (jqXHR.status === 409) {
                        $("#error-fecha-fin").text(mensaje).show();
                        $("#fechaFin").addClass("is-invalid");
                    } 
                    else if (jqXHR.status === 400) {
                        if (mensaje.toLowerCase().includes('fecha')) {
                             $("#error-fecha-fin").text(mensaje);
                             $("#fechaFin").addClass("is-invalid");
                        } else {
                            mostrarAlertaForm('warning', mensaje);
                        }
                    }
                    else {
                        mostrarAlertaForm('danger', mensaje);
                    }
                }
            });
        });
    }
});