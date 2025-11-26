$(document).ready(function() {
    let $form = $("#concesionarioForm");

    // Si el formulario no existe, no hacemos nada
    if ($form.length === 0) return;

    // Detectar modo edición leyendo el atributo data-id
    let idConcesionario = $form.data("id");
    // Verificamos si hay ID (jQuery .data maneja tipos, así que comprobamos truthy)
    let isEditMode = idConcesionario ? true : false;

    // Escuchamos el evento personalizado 'form-valid'
    // (Asumimos que tu script de validación frontal dispara este evento)
    $form.on("form-valid", function() {
        
        // 1. Limpiar errores previos
        $(".alert").remove(); // Eliminar alertas generales
        $(".is-invalid").removeClass("is-invalid"); // Quitar bordes rojos
        $(".error").text(""); // Limpiar textos de los spans de error

        // 2. Recoger datos del formulario
        let formData = {
            nombre: $("#nombre").val().trim(),
            ciudad: $("#ciudad").val().trim(),
            direccion: $("#direccion").val().trim(),
            telefono_contacto: $("#telefono_contacto").val().trim()
        };

        // 3. Configurar la petición AJAX
        let url = isEditMode 
            ? "/api/concesionarios/" + idConcesionario + "/editar" 
            : "/api/concesionarios/nuevo";
        
        let method = isEditMode ? "PUT" : "POST";

        // 4. Ejecutar $.ajax según especificación del PDF
        $.ajax({
            type: method,
            url: url,
            contentType: "application/json", // Importante para enviar JSON
            data: JSON.stringify(formData),  // Convertir objeto a string JSON
            success: function(data) {
                if (!data.ok) {
                    // A) Manejo de errores de campos específicos
                    if (data.fieldErrors) {
                        // $.each es el bucle de jQuery para objetos
                        $.each(data.fieldErrors, function(field, msg) {
                            // Pintar mensaje en el span error-CAMPO
                            $("#error-" + field).text(msg);
                            // Añadir clase invalida al input
                            $("#" + field).addClass("is-invalid");
                        });
                    } else {
                        // B) Error general (sin campos específicos)
                        mostrarAlertaFormulario("danger", data.error || "Error desconocido");
                    }
                } else {
                    // Éxito: Redirección
                    // Si es edición, volvemos al mismo ID, si es nuevo, al ID que devuelve el server
                    let redirectId = isEditMode ? idConcesionario : data.id;
                    window.location.href = "/concesionarios/" + redirectId;
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("Error en la petición: " + errorThrown);
                mostrarAlertaFormulario("danger", "Error de conexión o servidor caído.");
            }
        });
    });
});

// Función auxiliar para inyectar alertas al principio del formulario
function mostrarAlertaFormulario(tipo, mensaje) {
    let htmlAlerta = 
        '<div class="alert alert-' + tipo + ' mt-2" role="alert">' +
            mensaje +
        '</div>';
    
    // prepend() añade el elemento al principio del formulario
    $("#concesionarioForm").prepend(htmlAlerta);
}