$(document).ready(function () {

    let idParaBorrar = null;
    let nombreParaBorrar = null;

    const $modal = $("#modalEliminarUsuario");
    const $btnConfirmar = $("#btnConfirmarEliminarUsuario");

    $modal.on("show.bs.modal", function (event) {
        const $boton = $(event.relatedTarget);
        idParaBorrar = $boton.data("id");
        nombreParaBorrar = $boton.data("name");

        if (!idParaBorrar) console.error("No se encontró ID en el botón de eliminar");

        $("#nombreUsuarioAEliminar").text(nombreParaBorrar);
    });

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

                    $("#badgeActivo")
                        .removeClass("bg-success bg-primary")
                        .addClass("bg-danger")
                        .text("Eliminado");

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

function cerrarModal() {
    let modalEl = document.getElementById("modalEliminarUsuario");
    if(modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
    }
}

function mostrarAlertaPerfil(tipo, mensaje) {
    const $cont = $("#alertasPerfil");
    if (!$cont.length) return;

    $cont.html(`
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);

    setTimeout(() => {
        $cont.find(".alert").alert("close");
    }, 5000);
}