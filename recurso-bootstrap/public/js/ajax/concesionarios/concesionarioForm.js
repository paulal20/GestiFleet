$(document).ready(function() {
    let $form = $("#concesionarioForm");

    if ($form.length === 0) return;

    // Detectar modo edición
    let idConcesionario = $form.data("id");
    let isEditMode = (idConcesionario !== "" && idConcesionario !== undefined);

    $form.on("form-valid", function() {
        
        // Limpiar errores previos
        $(".alert").remove(); 
        $(".is-invalid").removeClass("is-invalid");
        $(".error").text(""); 

        let formData = {
            nombre: $("#nombre").val().trim(),
            ciudad: $("#ciudad").val().trim(),
            direccion: $("#direccion").val().trim(),
            telefono_contacto: $("#telefono_contacto").val().trim()
        };

        //depende de si estamos creando o editando
        let url = isEditMode 
            ? "/api/concesionarios/" + idConcesionario + "/editar" 
            : "/api/concesionarios/nuevo";
        
        let method = isEditMode ? "PUT" : "POST";

        $.ajax({
            type: method,
            url: url,
            contentType: "application/json",
            data: JSON.stringify(formData),
            success: function(data) {
                if (!data.ok) {
                    if (data.fieldErrors) {
                        $.each(data.fieldErrors, function(field, msg) {
                            $("#error-" + field).text(msg);
                            $("#" + field).addClass("is-invalid");
                        });
                    } 
                    else {
                        mostrarAlertaFormulario("danger", data.error || "Error al guardar.");
                    }
                } 
                else {
                    let redirectId = isEditMode ? idConcesionario : data.id;
                    window.location.href = "/concesionarios/" + redirectId;
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("Error petición:", errorThrown);
                
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