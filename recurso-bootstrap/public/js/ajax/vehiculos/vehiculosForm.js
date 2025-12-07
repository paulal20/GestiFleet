$(document).ready(function () {
    const $form = $("#vehiculoForm");
    if ($form.length === 0) return;

    $form.on("submit", function (e) {
        e.preventDefault(); 

        if (typeof window.validarFormularioCompleto === 'function') {
            const esValido = window.validarFormularioCompleto();
            if (!esValido) return; 
        }

        $("#alertasFormContainer").html(""); 
        
        const $btn = $form.find("button[type=submit]");
        const isPut = $form.find('input[name="_method"][value="PUT"]').length > 0;
        const method = isPut ? "PUT" : "POST";
        const url = $form.attr("action");
        const formData = new FormData(this);

        $.ajax({
            url: url,
            type: method,
            data: formData,
            processData: false, 
            contentType: false, 
            
            beforeSend: function () {
                $btn.prop("disabled", true).text("Procesando...");
            },

            success: function (data) {
                if (data.ok) {
                    window.location.href = data.redirectUrl || "/vehiculos";
                } else {
                    mostrarErrorForm("danger", data.error || "Error desconocido.");
                }
            },

            error: function (jqXHR) {
                let msg = "Error al procesar la solicitud.";
                
                if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                    msg = jqXHR.responseJSON.error;

                    if (msg.includes("La matrícula ya existe") || msg.includes("pertenece a otro vehículo")) {
                        if (typeof window.registrarErrorServidor === 'function') {
                            window.registrarErrorServidor("matricula", msg);
                            
                            mostrarErrorForm("danger", "La matrícula introducida ya está registrada en otro vehículo.");

                            irAlCampo("matricula");
                            return;
                        }
                    }
                } 
                else if (jqXHR.status === 404) {
                    msg = "Ruta de API no encontrada.";
                }

                mostrarErrorForm("danger", msg);
            },

            complete: function () {
                $btn.prop("disabled", false).text(isPut ? "Actualizar Vehículo" : "Crear Vehículo");
            }
        });
    });
});

function irAlCampo(campoId) {
    const $input = $("#" + campoId);
    
    if ($input.length) {
        $input.addClass("is-invalid");
        const elementoNativo = $input[0];

        elementoNativo.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });

        setTimeout(function() {
            elementoNativo.focus({ preventScroll: true });
        }, 100); 
    }
}

function mostrarErrorForm(tipo, mensaje) {
    const html = `
        <div class="alert alert-${tipo} alert-dismissible fade show shadow-sm" role="alert">
            <strong>Atención:</strong> ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    const $container = $("#alertasFormContainer");
    $container.html(html);
    
    $('html, body').animate({ scrollTop: 0 }, 'fast');

    setTimeout(function() {
        $container.find(".alert").fadeOut(500, function() {
            $(this).remove();
        });
    }, 5000);
}