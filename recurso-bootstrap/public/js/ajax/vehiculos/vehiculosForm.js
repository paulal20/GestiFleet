/* public/js/ajax/vehiculos/vehiculoForm.js
   Versión corregida SIN method-override y con PUT real
*/

$(document).ready(function () {
    const $form = $("#vehiculoForm");
    if ($form.length === 0) return;

    // Detectar modo edición por la existencia del input oculto _method=PUT en el EJS
    const isEditMode = $form.find('input[name="_method"][value="PUT"]').length > 0;

    $form.on("submit", function (e) {
        e.preventDefault(); // evitar submit tradicional

        // Limpiar errores previos
        $(".alert").remove();
        $(".is-invalid").removeClass("is-invalid");
        $(".error").text("");

        // Recoger FormData (soporta archivos)
        const formData = new FormData(this);

        // Acción y método AJAX
        const actionUrl = $form.attr("action"); // "/api/vehiculos" o "/api/vehiculos/:id"
        const method = isEditMode ? "PUT" : "POST"; // ← AHORA SÍ

        $.ajax({
            url: actionUrl,
            type: method,
            data: formData,
            processData: false,
            contentType: false,

            beforeSend: function () {
                $form.find("button[type=submit]").prop("disabled", true);
            },

            success: function (data) {
                if (!data.ok) {
                    if (data.fieldErrors) {
                        $.each(data.fieldErrors, function (field, msg) {
                            $("#error-" + field).text(msg);
                            $("#" + field).addClass("is-invalid");
                        });
                    } else {
                        mostrarAlertaFormulario("danger", data.error || "Error desconocido al guardar.");
                    }
                    return;
                }

                // La API SIEMPRE manda redirectUrl, úsala
                if (data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                } else if (data.id) {
                    window.location.href = "/vehiculos/" + data.id;
                } else {
                    window.location.href = "/vehiculos";
                }
            },

            error: function (jqXHR) {
                if (jqXHR.responseJSON && jqXHR.responseJSON.fieldErrors) {
                    $.each(jqXHR.responseJSON.fieldErrors, function (field, msg) {
                        $("#error-" + field).text(msg);
                        $("#" + field).addClass("is-invalid");
                    });
                } else if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                    mostrarAlertaFormulario("danger", jqXHR.responseJSON.error);
                } else {
                    mostrarAlertaFormulario("danger", "Error de conexión o servidor caído.");
                }
            },

            complete: function () {
                $form.find("button[type=submit]").prop("disabled", false);
            }
        });
    });
});

function mostrarAlertaFormulario(tipo, mensaje) {
    const html = `
        <div class="alert alert-${tipo} mt-2" role="alert">
            ${mensaje}
        </div>
    `;
    $("#vehiculoForm").prepend(html);
}
