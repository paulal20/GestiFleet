/* public/js/ajax/concesionarios/concesionarioForm.js 
   Adaptado a jQuery $.ajax (PDF) y con manejo correcto de errores de validación
*/

$(document).ready(function() {
    let $form = $("#concesionarioForm");

    // Si el formulario no existe, salir
    if ($form.length === 0) return;

    // Detectar modo edición
    let idConcesionario = $form.data("id");
    // Comprobación robusta de truthy (string no vacío o número)
    let isEditMode = (idConcesionario !== "" && idConcesionario !== undefined);

    // Escuchar evento personalizado 'form-valid'
    // (Asumimos que tu script de validación frontal dispara este evento cuando el usuario pulsa submit y pasa validaciones HTML5)
    $form.on("form-valid", function() {
        
        // 1. Limpiar errores previos antes de enviar
        $(".alert").remove(); // Quitar alertas generales
        $(".is-invalid").removeClass("is-invalid"); // Quitar marcos rojos
        $(".error").text(""); // Quitar textos de error

        // 2. Recoger datos
        let formData = {
            nombre: $("#nombre").val().trim(),
            ciudad: $("#ciudad").val().trim(),
            direccion: $("#direccion").val().trim(),
            telefono_contacto: $("#telefono_contacto").val().trim()
        };

        // 3. Configurar petición
        let url = isEditMode 
            ? "/api/concesionarios/" + idConcesionario + "/editar" 
            : "/api/concesionarios/nuevo";
        
        let method = isEditMode ? "PUT" : "POST";

        // 4. Ejecutar AJAX
        $.ajax({
            type: method,
            url: url,
            contentType: "application/json",
            data: JSON.stringify(formData),
            success: function(data) {
                // Si la respuesta NO es OK
                if (!data.ok) {
                    // CASO A: Errores de campos específicos (validación o duplicados)
                    if (data.fieldErrors) {
                        // Iteramos sobre el objeto de errores { campo: "mensaje", ... }
                        $.each(data.fieldErrors, function(field, msg) {
                            // Escribir el mensaje en el span correspondiente (ej: #error-nombre)
                            $("#error-" + field).text(msg);
                            // Añadir clase de error al input (ej: #nombre)
                            $("#" + field).addClass("is-invalid");
                        });
                    } 
                    // CASO B: Error general que no pertenece a un campo específico
                    else {
                        mostrarAlertaFormulario("danger", data.error || "Error desconocido al guardar.");
                    }
                } 
                // Si la respuesta ES OK
                else {
                    // Éxito: Redirigir al detalle del concesionario
                    let redirectId = isEditMode ? idConcesionario : data.id;
                    window.location.href = "/concesionarios/" + redirectId;
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // Errores de red o del servidor (500, 404, etc.) que no devolvieron JSON controlado
                console.error("Error petición:", errorThrown);
                
                // Intentar leer si el servidor envió un JSON de error aunque el status sea 400/500
                if (jqXHR.responseJSON && jqXHR.responseJSON.fieldErrors) {
                     $.each(jqXHR.responseJSON.fieldErrors, function(field, msg) {
                        $("#error-" + field).text(msg);
                        $("#" + field).addClass("is-invalid");
                    });
                } else if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                    mostrarAlertaFormulario("danger", jqXHR.responseJSON.error);
                } else {
                    mostrarAlertaFormulario("danger", "Error de conexión o servidor caído.");
                }
            }
        });
    });
});

function mostrarAlertaFormulario(tipo, mensaje) {
    let html = 
        '<div class="alert alert-' + tipo + ' mt-2" role="alert">' +
            mensaje +
        '</div>';
    
    $("#concesionarioForm").prepend(html);
}