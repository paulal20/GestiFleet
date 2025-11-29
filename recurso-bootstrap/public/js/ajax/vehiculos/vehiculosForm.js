/* public/js/ajax/vehiculos/vehiculosForm.js */

$(document).ready(function () {
    const $form = $("#vehiculoForm");
    if ($form.length === 0) return;

    $form.on("submit", function (e) {
        e.preventDefault(); 

        // Validación frontend
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
                let errorEspecificoEncontrado = false;

                if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                    msg = jqXHR.responseJSON.error;

                    // === MATRÍCULA DUPLICADA ===
                    if (msg.includes("La matrícula ya existe") || msg.includes("pertenece a otro vehículo")) {
                        if (typeof window.registrarErrorServidor === 'function') {
                            window.registrarErrorServidor("matricula", msg);
                            
                            // Llamamos a la función corregida
                            irAlCampo("matricula");
                            
                            errorEspecificoEncontrado = true;
                        }
                    }
                } 
                else if (jqXHR.status === 404) {
                    msg = "Ruta de API no encontrada.";
                }

                if (!errorEspecificoEncontrado) {
                    mostrarErrorForm("danger", msg);
                }
            },

            complete: function () {
                $btn.prop("disabled", false).text(isPut ? "Actualizar Vehículo" : "Crear Vehículo");
            }
        });
    });
});

// ==========================================
// FUNCIÓN CORREGIDA PARA EL FOCUS
// ==========================================
function irAlCampo(campoId) {
    const $input = $("#" + campoId);
    
    if ($input.length) {
        // 1. Marcar visualmente en rojo
        $input.addClass("is-invalid");

        // 2. Obtener el elemento nativo de HTML (sacarlo del objeto jQuery)
        const elementoNativo = $input[0];

        // 3. Scroll Nativo Suave
        // 'block: center' pone el input en MITAD de la pantalla (así no se tapa con el menú de arriba)
        elementoNativo.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });

        // 4. Focus inteligente
        // 'preventScroll: true' evita que el focus pegue un salto brusco peleando con el scroll
        setTimeout(() => {
            elementoNativo.focus({ preventScroll: true });
        }, 100); // Pequeño retraso imperceptible para asegurar que el navegador procesó la orden de scroll
    }
}

function mostrarErrorForm(tipo, mensaje) {
    const html = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    $("#alertasFormContainer").html(html);
    $('html, body').animate({ scrollTop: 0 }, 'fast');
}