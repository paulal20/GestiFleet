$(document).ready(function() {
    // Carga inicial
    cargarUsuarios();

    // 1. Filtrar automáticamente al cambiar cualquier select
    $("#filtroConcesionario, #filtroEstado").on("change", function() {
        cargarUsuarios();
    });

    // 2. Limpiar filtros
    $("#btnLimpiar").on("click", function() {
        $("#filtroConcesionario").val("0");
        $("#filtroEstado").val("");
        cargarUsuarios();
    });

    // 3. Configuración del Modal de Eliminación
    $("#confirmarEliminarUsuarioModal").on("show.bs.modal", function(event) {
        const btn = $(event.relatedTarget); 
        const id = btn.data("id");
        const nombre = btn.data("name");

        const $submitBtn = $("#formEliminarUsuario").find("button[type='submit']");
        $submitBtn.data("id", id);
        $submitBtn.data("name", nombre);

        $("#textoConfirmacion").text(`¿Estás seguro de que deseas eliminar el usuario "${nombre}"?`);
    });

    // 4. Eliminar Usuario
    $("#formEliminarUsuario").on("submit", function(e) {
        e.preventDefault();
        
        const $btn = $(this).find("button[type='submit']");
        const idUsuario = $btn.data("id");
        const nombreUsuario = $btn.data("name");

        if (!idUsuario) return;

        $.ajax({
            url: `/api/usuarios/${idUsuario}`,
            type: "DELETE",
            success: function(data) {
                const modalEl = document.getElementById('confirmarEliminarUsuarioModal');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();

                if (data.ok) {
                    mostrarAlerta("success", `Usuario eliminado: ${nombreUsuario}`);
                    cargarUsuarios(); // Recargar tabla
                } else {
                    mostrarAlerta("danger", data.error || "Error al eliminar el usuario");
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                const modalEl = document.getElementById('confirmarEliminarUsuarioModal');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();

                console.error("Error AJAX:", errorThrown);
                mostrarAlerta("danger", "Error de conexión al eliminar.");
            }
        });
    });
});

/* ================================
   FUNCIÓN CARGAR USUARIOS
================================= */
function cargarUsuarios() {
    const concesionario = $("#filtroConcesionario").val();
    const estado = $("#filtroEstado").val();
    const $tbody = $("#tablaUsuariosBody");
    const $contador = $("#contadorUsuarios");

    $tbody.html('<tr><td colspan="7" class="text-center text-muted">Cargando...</td></tr>');
    $contador.text("0");

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

            // Construir HTML
            let html = "";
            $.each(data.usuarios, function(i, u) {
                
                // Determinamos si el usuario está eliminado para deshabilitar acciones
                const estaEliminado = !u.activoBool;
                const disabledAttr = estaEliminado ? 'disabled' : '';
                const disabledClass = estaEliminado ? 'disabled' : ''; // Para el enlace <a>

                // Botón de eliminar
                let btnEliminar = "";
                if (u.rol === "Admin") {
                    // Admin nunca se puede eliminar (ya estaba así)
                    btnEliminar = `<button type="button" class="btn btn-secondary btn-sm" disabled title="No se puede eliminar un administrador">Eliminar</button>`;
                } else {
                    // Si está eliminado, añadimos disabled
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

                // Botón editar
                // Si está eliminado, añadimos clase disabled de bootstrap y pointer-events-none por si acaso
                const btnEditar = `<a href="/usuarios/${u.id_usuario}/editar" class="btn btn-primary btn-sm ${disabledClass}" ${estaEliminado ? 'aria-disabled="true" tabindex="-1"' : ''}>Editar</a>`;

                // Construcción de la fila
                html += `
                    <tr class="fila-click" data-href="/usuarios/${u.id_usuario}" >
                        <td>${u.nombre || ''}</td>
                        <td>${u.correo || ''}</td>
                        <td>${u.rol || ''}</td>
                        <td>${u.telefono || '—'}</td>
                        <td>${u.nombre_concesionario || '—'}</td>
                        <td>${pintarEstado(u.activoBool)}</td>
                        <td>
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

function pintarEstado(activoBool) {
    if (activoBool) {
        return `<span class="badge bg-success">Activo</span>`;
    } else {
        return `<span class="badge bg-danger">Eliminado</span>`;
    }
}

function activarFilaClick() {
    $(".fila-click").off("click").on("click", function(e) {
        if ($(e.target).closest("button, a").length > 0) {
            return;
        }
        const destino = $(this).data("href");
        if (destino) window.location.href = destino;
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