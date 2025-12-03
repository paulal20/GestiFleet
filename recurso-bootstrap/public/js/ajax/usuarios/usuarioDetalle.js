$(document).ready(function () {

    let idParaBorrar = null;
    let nombreParaBorrar = null;

    const $modal = $("#modalEliminarUsuario");
    const $btnConfirmar = $("#btnConfirmarEliminarUsuario");

    // --- CAPTURAR DATOS AL ABRIR EL MODAL ---
    $modal.on("show.bs.modal", function (event) {
        const $boton = $(event.relatedTarget);
        idParaBorrar = $boton.data("id");
        nombreParaBorrar = $boton.data("name");

        // Control de errores por si acaso
        if (!idParaBorrar) console.error("No se encontró ID en el botón de eliminar");

        $("#nombreUsuarioAEliminar").text(nombreParaBorrar);
    });

    // --- CLICK EN EL BOTÓN “ELIMINAR” (CONFIRMACIÓN) ---
    $btnConfirmar.off("click").on("click", function () {
        if (!idParaBorrar) return;

        $.ajax({
            type: "DELETE",
            url: "/api/usuarios/" + idParaBorrar,
            dataType: "json",

            success: function (data) {
                cerrarModal();

                if (data.ok) {
                    mostrarAlertaPerfil("success", "Usuario eliminado: " + nombreParaBorrar);

                    // 1. Cambiamos visualmente el estado a Eliminado (Rojo)
                    $("#badgeActivo")
                        .removeClass("bg-success bg-primary") // Quitamos verde o azul
                        .addClass("bg-danger")
                        .text("Eliminado");

                    // 2. ELIMINAMOS TODOS LOS BOTONES DE ACCIÓN (Editar y Eliminar)
                    // Como el div padre tiene id="accionesUsuario", lo borramos entero.
                    $("#accionesUsuario").remove();

                } else {
                    mostrarAlertaPerfil("danger", data.error || "Error al eliminar usuario.");
                }
            },

            error: function (xhr) {
                cerrarModal();
                let msg = "Error de conexión.";
                if (xhr.responseJSON?.error) msg = xhr.responseJSON.error;
                mostrarAlertaPerfil("danger", msg);
            }
        });
    });
});

/* ------------------ FUNCIONES AUXILIARES ------------------- */
function cerrarModal() {
    // Usamos la API nativa de Bootstrap 5 para cerrar el modal limpiamente
    let modalEl = document.getElementById("modalEliminarUsuario");
    if(modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
}

function mostrarAlertaPerfil(tipo, mensaje) {
    const $cont = $("#alertasPerfil");
    if (!$cont.length) return;

    // Inyectamos la alerta
    $cont.html(`
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);

    // Auto-cierre a los 4 segundos
    setTimeout(() => {
        $cont.find(".alert").alert("close");
    }, 5000);
}