$(document).ready(function() {

    // 1. Cuando se abre el modal, capturamos ID y nombre del usuario
    $("#confirmarEliminarUsuarioModal").on("show.bs.modal", function(event) {
        const button = $(event.relatedTarget); // Botón que disparó el modal
        const id = button.data("id");
        const nombre = button.data("name");

        const $submitBtn = $("#formEliminarUsuario").find("button[type='submit']");
        $submitBtn.data("id", id);
        $submitBtn.data("name", nombre);

        $("#textoConfirmacion").text(`¿Estás seguro de que deseas eliminar el usuario "${nombre}"?`);
    });

    // 2. Al enviar el formulario dentro del modal
    $("#formEliminarUsuario").on("submit", function(e) {
        e.preventDefault();

        const $btn = $(this).find("button[type='submit']");
        const idUsuario = $btn.data("id");
        const nombreUsuario = $btn.data("name");

        if (!idUsuario) return;

        // Deshabilitar botón para evitar doble click
        $btn.prop("disabled", true);

        $.ajax({
            url: `/api/usuarios/${idUsuario}`,
            type: "DELETE",
            dataType: "json",
            success: function(data) {
                // Ocultar modal
                const modalEl = document.getElementById('confirmarEliminarUsuarioModal');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();

                if (data.ok) {
                    mostrarAlerta("success", `Usuario eliminado: ${nombreUsuario}`);
                    // Actualizar badge en la fila si existe
                    $(`#filaUsuario${idUsuario} .badge-estado`).removeClass("bg-success").addClass("bg-danger").text("Eliminado");
                    // Deshabilitar botones de la fila
                    $(`#filaUsuario${idUsuario} button, #filaUsuario${idUsuario} a`).prop("disabled", true).addClass("disabled");
                } else {
                    mostrarAlerta("danger", data.error || "Error al eliminar el usuario");
                    $btn.prop("disabled", false);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                const modalEl = document.getElementById('confirmarEliminarUsuarioModal');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();

                console.error("Error AJAX:", errorThrown);
                mostrarAlerta("danger", "Error de conexión al eliminar.");
                $btn.prop("disabled", false);
            }
        });
    });

    // 3. Función auxiliar para mostrar alertas
    function mostrarAlerta(tipo, mensaje) {
        const html = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $("#alertas").html(html);

        setTimeout(function() {
            $("#alertas .alert").fadeOut("slow", function() {
                $(this).remove();
            });
        }, 5000);
    }
});
