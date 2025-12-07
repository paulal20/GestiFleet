$(document).ready(function() {
    cargarUsuarios();
    
    //se actualice la tabla al cambiar filtros
    $("#filtroConcesionario, #filtroEstado").on("change", function() {
        cargarUsuarios();
    });

    $("#btnLimpiar").on("click", function() {
        $("#filtroConcesionario").val("0");
        $("#filtroEstado").val("");
        cargarUsuarios();
    });

    $("#confirmarEliminarUsuarioModal").on("show.bs.modal", function(event) {
        const btn = $(event.relatedTarget); 
        const id = btn.data("id");
        const nombre = btn.data("name");

        const $submitBtn = $("#formEliminarUsuario").find("button[type='submit']");
        $submitBtn.data("id", id);
        $submitBtn.data("name", nombre);

        $("#textoConfirmacion").text(`¿Estás seguro de que deseas eliminar el usuario "${nombre}"?`);
    });

    $("#formEliminarUsuario").on("submit", function(e) {
        e.preventDefault();
        
        const $btn = $(this).find("button[type='submit']");
        const idUsuario = $btn.data("id");
        const nombreUsuario = $btn.data("name");

        if (!idUsuario) return;

        //eliminar usuario con la api
        $.ajax({
            url: `/api/usuarios/${idUsuario}`,
            type: "DELETE",
            success: function(data) {
                const modalEl = document.getElementById('confirmarEliminarUsuarioModal');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();

                if (data.ok) {
                    mostrarAlerta("success", `Usuario eliminado: ${nombreUsuario}`);
                    cargarUsuarios(); 
                } else {
                    mostrarAlerta("danger", data.error || "Error al eliminar el usuario");
                }
            },
            error: function(jqXHR) {
                const modalEl = document.getElementById('confirmarEliminarUsuarioModal');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();

                let msg = "Error de conexión al eliminar.";
                if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                    msg = jqXHR.responseJSON.error; 
                }

                mostrarAlerta("danger", msg);
            }
        });

    });

    //asginamos concesionario al usuario con un modal
    $(document).on("click", ".btnAsignar", function (e) {
        e.stopPropagation(); 

        const idUsuario = $(this).data("id");
        const nombreUsuario = $(this).data("name");

        $("#btnConfirmarAsignar").data("id", idUsuario);

        $("#textoAsignarUsuario").text(`Asignar concesionario al usuario ${nombreUsuario}`);

        const modal = new bootstrap.Modal(document.getElementById("modalAsignarConcesionario"));
        modal.show();
    });

    // Confirmar asignación de concesionario
    $("#btnConfirmarAsignar").on("click", function () {
        const idUsuario = $(this).data("id");
        const idConcesionario = $("#selectConcesionario").val();
        const $error = $("#errorConcesionario");

        $error.text("");

        if (!idConcesionario || idConcesionario === "0") {
            $error.text("Debes seleccionar un concesionario");
            return;
        }

        $.ajax({
            url: `/api/usuarios/${idUsuario}/asignar-concesionario`,
            type: "PATCH",
            data: { id_concesionario: idConcesionario },
            success: function (data) {
                if (!data.ok) {
                    mostrarAlerta("danger", data.error || "Error al asignar concesionario");
                    return;
                }

                const modal = bootstrap.Modal.getInstance(document.getElementById("modalAsignarConcesionario"));
                modal.hide();

                mostrarAlerta("success", "Concesionario asignado correctamente");

                cargarUsuarios(); // recargar la tabla
            },
            error: function () {
                mostrarAlerta("danger", "Error de conexión al asignar concesionario");
            }
        });
    });

    

});

//FUNCIÓN CARGAR USUARIOS
function cargarUsuarios() {
    const concesionario = $("#filtroConcesionario").val();
    const estado = $("#filtroEstado").val();
    const $tbody = $("#tablaUsuariosBody");
    const $contador = $("#contadorUsuarios");

    $tbody.html('<tr><td colspan="7" class="text-center text-muted">Cargando...</td></tr>');
    $contador.text("0");

    //llamar a la api para obtener usuarios
    $.ajax({
        url: "/api/usuarios",
        type: "GET",
        data: { 
            concesionario: concesionario,
            estado: estado 
        },
        dataType: "json",
        success: function(data) {
            if (!data.ok) {
                mostrarAlerta("danger", data.error || "Error cargando usuarios");
                return;
            }

            if (!data.usuarios || data.usuarios.length === 0) {
                $tbody.html('<tr><td colspan="7" class="text-center text-muted">No hay resultados</td></tr>');
                $contador.text("0");
                return;
            }

            let html = "";
            
            const currentUserId = data.idUsuarioSesion; 

            $.each(data.usuarios, function(i, u) {
                
                const estaEliminado = !u.activoBool;
                const disabledAttr = estaEliminado ? 'disabled' : '';
                const disabledClass = estaEliminado ? 'disabled pe-none' : ''; 

                let btnEliminar = "";

                if (u.id_usuario === currentUserId) {
                    btnEliminar = `<button type="button" class="btn btn-secondary btn-sm" disabled>Eliminar</button>`;
                } else {
                    btnEliminar = `
                        <button type="button" class="btn btn-secondary btn-sm" ${disabledAttr}
                            data-bs-toggle="modal"
                            data-bs-target="#confirmarEliminarUsuarioModal"
                            data-id="${u.id_usuario}"
                            data-name="${u.nombre}">
                            Eliminar
                        </button>
                    `;
                }

                const btnEditar = `<a href="/usuarios/${u.id_usuario}/editar" class="btn btn-primary btn-sm ${disabledClass}" ${estaEliminado ? 'aria-disabled="true" tabindex="-1"' : ''}>Editar</a>`;

                let celdaConcesionario = "—";

                if (u.rol !== "Admin") {
                    if (u.nombre_concesionario) {
                        celdaConcesionario = u.nombre_concesionario;
                    } else {
                        // Botón asignar
                        celdaConcesionario =
                            `<button class="btn btn-primary btn-sm btnAsignar celda-acciones" 
                                    data-id="${u.id_usuario}"
                                    data-name="${u.nombre}">
                                Asignar concesionario
                            </button>`;
                    }
                }
                    
                html += `
                    <tr class="fila-click" data-href="/usuarios/${u.id_usuario}" tabindex="0" style="cursor: pointer;">
                        <td>${u.nombre || ''}</td>
                        <td>${u.correo || ''}</td>
                        <td>${u.rol || ''}</td>
                        <td>${u.telefono || '—'}</td>
                        <td>${celdaConcesionario}</td>
                        <td>${pintarEstado(u.activoBool)}</td>

                        <td class="celda-acciones" style="cursor: default;">
                            <div class="d-flex gap-1">
                                ${btnEliminar}
                                ${btnEditar}
                            </div>
                        </td>
                    </tr>
                `;
            });

            $tbody.html(html);
            $contador.text(data.usuarios.length);
            activarFilaClick();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error AJAX:", errorThrown);
            $tbody.html('<tr><td colspan="7" class="text-center text-danger">Error cargando usuarios</td></tr>');
            mostrarAlerta("danger", "Error de conexión con el servidor.");
        }
    });
}

//si estado activo o eliminado
function pintarEstado(activoBool) {
    if (activoBool) {
        return `<span class="badge bg-success">Activo</span>`;
    } else {
        return `<span class="badge bg-danger">Eliminado</span>`;
    }
}

function activarFilaClick() {
    $(".fila-click").off("click").on("click", function(e) {
        if ($(e.target).closest("button, a").length > 0) return;
        if ($(e.target).closest(".celda-acciones").length > 0) return;

        const destino = $(this).data("href");
        if (destino) window.location.href = destino;
    });

    $(".fila-click").off("keydown").on("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const destino = $(this).data("href");
            if (destino) window.location.href = destino;
        }
    });
}

function mostrarAlerta(tipo, mensaje) {
    const $cont = $("#alertas");
    if (!$cont.length) return;

    $cont.html(`
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `);

    setTimeout(() => {
        $cont.find(".alert").alert('close');
    }, 5000);
}
