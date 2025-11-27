$(document).ready(function() {
    const confirmBtn = document.getElementById('confirmarReservaBtn');
    
    // Verificamos que existan los elementos antes de actuar
    if (confirmBtn) {
        // Clonamos el nodo para eliminar los event listeners previos (del validador síncrono)
        // Mantenemos esta lógica tuya porque es necesaria para "desactivar" el submit normal.
        const nuevoBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(nuevoBtn, confirmBtn);

        // Añadimos el listener al nuevo botón usando jQuery
        $(nuevoBtn).on('click', function(e) {
            e.preventDefault();

            // Limpiar alertas previas si existen
            $("#alertasForm").html(""); 

            // Recoger datos del formulario
            // Nota: En JSON las claves van entre comillas [cite: 366]
            const formData = {
                "vehiculo": $("#vehiculo").val(),
                "fechaInicio": $("#fechaInicio").val(),
                "fechaFin": $("#fechaFin").val()
            };

            // UI Feedback: Deshabilitar botón y cambiar texto
            const $btn = $(this);
            const textoOriginal = $btn.text();
            $btn.prop('disabled', true).text("Procesando...");

            // Petición AJAX según el PDF [cite: 1076]
            $.ajax({
                type: "POST", // Método HTTP [cite: 598]
                url: "/api/reservas",
                contentType: "application/json", // Especificamos que enviamos JSON [cite: 1247]
                data: JSON.stringify(formData), // Convertimos objeto a string JSON [cite: 1248]
                
                // Función callback de éxito [cite: 1090]
                success: function(data, textStatus, jqXHR) {
                    if (data.ok) {
                        // Redirección controlada por el cliente
                        window.location.href = data.redirectUrl;
                    } else {
                        // Error lógico (ej. fechas ocupadas)
                        mostrarAlertaForm('danger', data.error || 'Error al crear la reserva.');
                        
                        // Ocultar modal usando Bootstrap (si está disponible)
                        const modalEl = document.getElementById('confirmacionModal');
                        if (typeof bootstrap !== 'undefined') {
                            const modalInstance = bootstrap.Modal.getInstance(modalEl);
                            if (modalInstance) modalInstance.hide();
                        }
                    }
                    // Restaurar botón (solo si no redirigimos)
                    if (!data.ok) {
                        $btn.prop('disabled', false).text(textoOriginal);
                    }
                },
                
                // Función callback de error [cite: 1104]
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error("Error AJAX:", errorThrown);
                    
                    let mensaje = 'Error de comunicación con el servidor.';
                    if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                        mensaje = jqXHR.responseJSON.error;
                    }
                    
                    mostrarAlertaForm('danger', mensaje);
                    
                    // Restaurar botón
                    $btn.prop('disabled', false).text(textoOriginal);
                    
                    // Ocultar modal también en caso de error de red
                    const modalEl = document.getElementById('confirmacionModal');
                    if (typeof bootstrap !== 'undefined') {
                        const modalInstance = bootstrap.Modal.getInstance(modalEl);
                        if (modalInstance) modalInstance.hide();
                    }
                }
            });
        });
    }
});

// Función auxiliar para mostrar alertas (Integrada con jQuery)
function mostrarAlertaForm(tipo, mensaje) {
    const alertaHtml = `
        <div class="alert alert-${tipo} mt-3 alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    // Prependemos al formulario principal
    $("#revistaForm").prepend(alertaHtml);
    
    // Scroll suave hacia la alerta
    $('html, body').animate({
        scrollTop: $("#revistaForm").offset().top - 20
    }, 500);
}