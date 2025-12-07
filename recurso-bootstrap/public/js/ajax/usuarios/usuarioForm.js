$(document).ready(function() {
    const $form = $("#usuarioForm");
    if (!$form.length) return;

    const isEditMode = $form.data("editmode") === true || $form.data("editmode") === "true";
    const idUsuario = $form.data("id");

    const $campos = {
        nombre: $("#nombre"),
        apellido1: $("#apellido1"),
        apellido2: $("#apellido2"),
        email: $("#email"),
        confemail: $("#confemail"),
        contrasenya: $("#contrasenya"),
        telefono: $("#telefono"),
        rol: $("#rol"),
        id_concesionario: $("#id_concesionario")
    };

    const $errores = {
        nombre: $("#error-nombre"),
        apellido1: $("#error-apellido1"),
        apellido2: $("#error-apellido2"),
        email: $("#error-email"),
        confemail: $("#error-confemail"),
        contrasenya: $("#error-contrasenya"),
        telefono: $("#error-telefono"),
        rol: $("#error-rol"),
        id_concesionario: $("#error-id_concesionario")
    };

    // Mostrar u ocultar campo concesionario según rol
    function toggleConcesionario() {
        const val = $campos.rol.val();
        const $divConc = $("#div-concesionario");

        if (val === "Empleado") {
            $divConc.slideDown(200); 
            $campos.id_concesionario.prop("required", true);
        } else {
            $divConc.slideUp(200);
            $campos.id_concesionario.prop("required", false);
            
            $campos.id_concesionario.val("0").removeClass("is-valid is-invalid");
            $errores.id_concesionario.text("");
        }
    }

    $campos.rol.on("change", toggleConcesionario);
    
    toggleConcesionario();

    $form.on("submit", function(e) {
        e.preventDefault();
        $(".alert").remove(); // Limpiar alertas previas

        const formData = {
            nombre: $campos.nombre.val().trim(),
            apellido1: $campos.apellido1.val().trim(),
            apellido2: $campos.apellido2.val().trim(),
            email: $campos.email.val().trim(),
            confemail: $campos.confemail?.val()?.trim(),
            contrasenya: $campos.contrasenya.val().trim(),
            telefono: $campos.telefono.val().trim(),
            rol: $campos.rol.val(),
            // Si el rol es Admin, enviamos null para id_concesionario
            id_concesionario: ($campos.rol.val() === 'Empleado') ? $campos.id_concesionario.val() : null
        };

        const url = isEditMode ? `/api/usuarios/${idUsuario}` : `/api/usuarios/nuevo`;
        const method = isEditMode ? "PUT" : "POST";

        $.ajax({
            url: url,
            method: method,
            contentType: "application/json",
            data: JSON.stringify(formData),
            success: function(data) {
                if (!data.ok) {
                    if (data.errors) {
                        $.each(data.errors, function(field, msg) {
                            $(`#error-${field}`).text(msg);
                            const $input = $(`#${field}`);
                            $input.removeClass("is-valid").addClass("is-invalid");

                            if (!$form.valoresVetados) $form.valoresVetados = {};
                            $form.valoresVetados[field] = $input.val().trim();
                        });
                    }

                    const $alert = $('<div class="alert alert-danger mt-2"></div>').text(data.error || "Error desconocido al guardar.");
                    $form.prepend($alert);
                    
                    $('html, body').animate({ scrollTop: 0 }, 'fast');
                    
                    setTimeout(() => { $alert.remove(); }, 5000);
                    return;
                }

                const redirectId = isEditMode ? idUsuario : data.id;
                window.location.href = `/usuarios/${redirectId}`;
            },
            error: function(xhr, status, err) {
                console.error("Error enviando formulario:", err);
                const $alert = $('<div class="alert alert-danger mt-2"></div>').text("Error de conexión al enviar el formulario.");
                $form.prepend($alert);
                $('html, body').animate({ scrollTop: 0 }, 'fast');
                setTimeout(() => { $alert.remove(); }, 5000);
            }
        });
    });

    $("#mostrarContrasenya").on("change", function() {
        $campos.contrasenya.attr("type", this.checked ? "text" : "password");
    });
});