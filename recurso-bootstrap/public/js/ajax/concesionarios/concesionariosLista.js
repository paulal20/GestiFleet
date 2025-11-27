/* public/js/ajax/concesionarios/concesionariosLista.js
   Adaptado a jQuery y $.ajax según especificaciones del PDF
*/

$(document).ready(function() {
    // 1. Cargar datos iniciales
    cargarCiudades();
    cargarConcesionarios();

    // 2. Configurar filtros
    $("#filtroCiudad").on("change", function() {
        cargarConcesionarios();
    });

    $("#btnFiltrar").on("click", function() {
        cargarConcesionarios();
    });

    $("#btnLimpiar").on("click", function() {
        $("#filtroCiudad").val('');
        cargarConcesionarios();
    });

    // 3. Configurar Modal de Eliminación
    configurarModalEliminar();
});

// --- FUNCIONES LÓGICA ---

function cargarCiudades() {
    $.ajax({
        type: "GET",
        url: "/api/concesionarios/lista",
        cache: false, // Evitar caché del navegador (304)
        success: function(data) {
            if (data.ok) {
                let $filtro = $("#filtroCiudad");
                let valorActual = $filtro.val();

                $filtro.find('option:not([value=""])').remove();

                let ciudades = [];
                if (data.concesionarios) {
                    $.each(data.concesionarios, function(i, c) {
                        if ($.inArray(c.ciudad, ciudades) === -1) {
                            ciudades.push(c.ciudad);
                        }
                    });
                }
                
                $.each(ciudades, function(i, ciudad) {
                    $filtro.append('<option value="' + ciudad + '">' + ciudad + '</option>');
                });

                if(valorActual) $filtro.val(valorActual);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error cargando ciudades:", errorThrown);
        }
    });
}

function cargarConcesionarios() {
    let ciudad = $("#filtroCiudad").val();

    $.ajax({
        type: "GET",
        url: "/api/concesionarios/lista",
        data: { ciudad: ciudad },
        cache: false,
        success: function(data) {
            if (typeof data === 'string' && data.indexOf('<html') !== -1) {
                window.location.href = '/login';
                return;
            }

            if (data.ok) {
                pintarTabla(data.concesionarios);
            } else {
                mostrarAlerta('danger', data.error || 'Error al cargar la lista.');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error cargando concesionarios:", errorThrown);
            mostrarAlerta('danger', 'Error de conexión al cargar datos.');
        }
    });
}

function pintarTabla(lista) {
    let $tbody = $("#tablaConcesionariosBody");
    let $contador = $("#contadorConcesionarios");
    
    $tbody.empty();

    if (!lista || !lista.length) {
        $tbody.html('<tr><td colspan="6" class="text-center text-muted">No hay resultados</td></tr>');
        if ($contador.length) $contador.text("0");
        return;
    }

    let html = "";
    
    $.each(lista, function(i, c) {
        let claseDisabled = !c.activoBool ? "disabled" : "";
        let pointerEvents = !c.activoBool ? 'style="pointer-events: none;"' : ""; 
        let btnDisabledAttr = !c.activoBool ? "disabled" : "";

        html += '<tr>';
        html += '<td class="fila-click" style="cursor:pointer;" data-href="/concesionarios/' + c.id_concesionario + '">' + (c.nombre || '') + '</td>';
        html += '<td class="fila-click" style="cursor:pointer;" data-href="/concesionarios/' + c.id_concesionario + '">' + (c.ciudad || '') + '</td>';
        html += '<td class="fila-click" style="cursor:pointer;" data-href="/concesionarios/' + c.id_concesionario + '">' + (c.direccion || '') + '</td>';
        html += '<td class="fila-click" style="cursor:pointer;" data-href="/concesionarios/' + c.id_concesionario + '">' + (c.telefono_contacto || '') + '</td>';
        html += '<td class="fila-click" style="cursor:pointer;" data-href="/concesionarios/' + c.id_concesionario + '">' + pintarEstadoConcesionario(c.activoBool) + '</td>';
        
        html += '<td>';
        html +=   '<button type="button" class="btn btn-secondary btn-sm mb-1 me-2" ';
        html +=     'data-bs-toggle="modal" data-bs-target="#confirmarEliminarConcesionarioModal" ';
        html +=     'data-id="' + c.id_concesionario + '" data-name="' + c.nombre + '" ';
        html +=     btnDisabledAttr + '>';
        html +=     'Eliminar';
        html +=   '</button>';
        
        html +=   '<a href="/concesionarios/' + c.id_concesionario + '/editar" ';
        html +=     'class="btn btn-primary btn-sm mb-1 ' + claseDisabled + '" ' + pointerEvents + '>';
        html +=     'Editar';
        html +=   '</a>';
        html += '</td>';
        html += '</tr>';
    });

    $tbody.html(html);
    
    if ($contador.length) $contador.text(lista.length);

    activarFilaClick();
}

function configurarModalEliminar() {
    let $modal = $("#confirmarEliminarConcesionarioModal");
    let $form = $("#formEliminarConcesionario");

    // Al abrir el modal, pasar datos al botón de confirmar
    $modal.on("show.bs.modal", function(event) {
        let btn = $(event.relatedTarget);
        let id = btn.data("id");
        let nombre = btn.data("name");
        
        let $btnSubmit = $form.find("button[type='submit']");
        $btnSubmit.data("id", id);
        $btnSubmit.data("name", nombre);
        
        $("#textoConfirmacionConcesionario").text('¿Estás seguro de que deseas eliminar el concesionario "' + nombre + '"?');
    });

    // Al confirmar (submit del formulario en el modal)
    $form.on("submit", function(e) {
        e.preventDefault();
        
        let $btnSubmit = $form.find("button[type='submit']");
        let id = $btnSubmit.data("id");
        let nombre = $btnSubmit.data("name");

        if (!id) return;

        $.ajax({
            type: "DELETE",
            url: "/api/concesionarios/" + id + "/eliminar",
            success: function(data) {
                // Cerrar modal
                let modalEl = document.getElementById('confirmarEliminarConcesionarioModal');
                let modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();

                if (!data.ok) {
                    mostrarAlerta('danger', data.error || 'Error al eliminar.');
                } else {
                    mostrarAlerta('success', 'Concesionario eliminado: ' + nombre);
                    
                    // Actualización visual rápida (optimista)
                    let $btnTabla = $("button[data-id='" + id + "']");
                    if ($btnTabla.length) {
                        $btnTabla.prop("disabled", true).text("Eliminar");
                        $btnTabla.closest("tr").find("td:nth-child(5)").html('<span class="badge bg-danger">Eliminado</span>');
                        $btnTabla.siblings(".btn-primary").addClass("disabled").css("pointer-events", "none");
                    }
                }
            },
            error: function(xhr, status, error) {
                // Cerrar modal antes de mostrar alerta
                let modalEl = document.getElementById('confirmarEliminarConcesionarioModal');
                let modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();

                // --- CORRECCIÓN CLAVE: LEER MENSAJE DE ERROR DEL JSON ---
                let mensaje = 'Error de conexión al eliminar.';
                
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    mensaje = xhr.responseJSON.error;
                    
                    // Opcional: personalizar el mensaje si es el de vehículos
                    if (mensaje === 'Tiene vehículos asociados') {
                        mensaje = 'No se puede eliminar: tiene vehículos asociados.';
                    }
                }
                
                mostrarAlerta('danger', mensaje);
            }
        });
    });
}

// --- AUXILIARES ---

function pintarEstadoConcesionario(activo) {
    return activo 
        ? '<span class="badge bg-success">Activo</span>' 
        : '<span class="badge bg-danger">Eliminado</span>';
}

function activarFilaClick() {
    $(".fila-click").off("click").on("click", function() {
        let destino = $(this).data("href");
        if (destino) window.location.href = destino;
    });
}

function mostrarAlerta(tipo, mensaje) {
    let $cont = $("#alertas");
    if (!$cont.length) return;

    let html = 
        '<div class="alert alert-' + tipo + ' alert-dismissible fade show" role="alert">' +
            mensaje +
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
        '</div>';
    
    $cont.html(html);
    
    setTimeout(function() {
        $cont.find(".alert").alert('close'); 
    }, 5000);
}