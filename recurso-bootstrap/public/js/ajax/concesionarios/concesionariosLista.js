/* public/js/ajax/concesionarios/concesionariosLista.js - VERSIÓN DEPURACIÓN */

$(document).ready(function() {
    console.log("✅ [DEBUG] DOM cargado. Iniciando scripts...");

    // Verificar si existen los elementos clave en el HTML
    if ($("#tablaConcesionariosBody").length === 0) {
        console.error("❌ [DEBUG] CRÍTICO: No se encuentra el tbody con id='tablaConcesionariosBody'. Revisa el EJS.");
    } else {
        console.log("✅ [DEBUG] Tabla encontrada correctamente.");
    }

    // 1. Cargar datos iniciales
    console.log("🔄 [DEBUG] Llamando a cargarCiudades() y cargarConcesionarios()...");
    cargarCiudades();
    cargarConcesionarios();

    // 2. Eventos
    $("#filtroCiudad").on("change", function() {
        console.log("Changed filtro ciudad");
        cargarConcesionarios();
    });

    $("#btnFiltrar").on("click", function() {
        cargarConcesionarios();
    });

    $("#btnLimpiar").on("click", function() {
        $("#filtroCiudad").val('');
        cargarConcesionarios();
    });

    // 4. Configurar Modal de Eliminación
    configurarModalEliminar();
});

// --- FUNCIONES AJAX ---

function cargarCiudades() {
    $.ajax({
        type: "GET",
        url: "/api/concesionarios/lista",
        success: function(data) {
            if (typeof data === 'string') return; // Ignorar HTML (login)
            
            if (data.ok) {
                console.log("✅ [DEBUG] Ciudades cargadas. Total concesionarios brutos:", data.concesionarios.length);
                let $filtro = $("#filtroCiudad");
                $filtro.find('option:not([value=""])').remove();
                let ciudades = [...new Set(data.concesionarios.map(function(c) { return c.ciudad; }))];
                ciudades.forEach(function(ciudad) {
                    $filtro.append('<option value="' + ciudad + '">' + ciudad + '</option>');
                });
            }
        },
        error: function(e) { console.error("Error cargando ciudades: ", e); }
    });
}

function cargarConcesionarios() {
    let ciudad = $("#filtroCiudad").val();
    console.log("📡 [DEBUG] Solicitando concesionarios a la API. Filtro Ciudad:", ciudad || "Ninguna");

    $.ajax({
        type: "GET",
        url: "/api/concesionarios/lista",
        data: { ciudad: ciudad }, 
        success: function(data) {
            console.log("📥 [DEBUG] Respuesta recibida del servidor:", data);

            if (typeof data === 'string') {
                console.warn("⚠️ [DEBUG] Se recibió HTML en lugar de JSON. Posible redirección de Login.");
                return;
            }

            if (data.ok) {
                console.log("✅ [DEBUG] data.ok es true. Array de concesionarios:", data.concesionarios);
                
                if (!data.concesionarios) {
                    console.error("❌ [DEBUG] data.concesionarios es UNDEFINED o NULL.");
                    return;
                }

                console.log("🖌️ [DEBUG] Llamando a pintarTabla con " + data.concesionarios.length + " elementos.");
                pintarTabla(data.concesionarios);
            } else {
                console.error("❌ [DEBUG] data.ok es false. Error del servidor:", data.error);
                mostrarAlerta('danger', data.error || 'Error al cargar concesionarios.');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("❌ [DEBUG] Fallo AJAX:", textStatus, errorThrown);
            console.error("❌ [DEBUG] Respuesta completa:", jqXHR.responseText);
            mostrarAlerta('danger', 'Error de conexión al cargar datos.');
        }
    });
}

function pintarTabla(lista) {
    let $tbody = $("#tablaConcesionariosBody");
    let $contador = $("#contadorConcesionarios");
    
    // Verificación paranoica
    if ($tbody.length === 0) {
        console.error("❌ [DEBUG] pintarTabla: No encuentro #tablaConcesionariosBody en el DOM.");
        return;
    }

    console.log("🧹 [DEBUG] Limpiando tabla...");
    $tbody.empty(); 

    if (!lista || !lista.length) {
        console.log("ℹ️ [DEBUG] La lista está vacía o es nula.");
        $tbody.html('<tr><td colspan="6" class="text-center text-muted">No hay resultados</td></tr>');
        if ($contador.length) $contador.text("0");
        return;
    }

    let html = "";
    console.log("🔨 [DEBUG] Generando HTML para " + lista.length + " filas...");

    lista.forEach(function(c, index) {
        // Log de la primera fila para ver la estructura
        if (index === 0) console.log("🔎 [DEBUG] Estructura primera fila:", c);

        let claseDisabled = !c.activoBool ? "disabled" : "";
        let pointerEvents = !c.activoBool ? 'style="pointer-events: none;"' : ""; 
        let btnDisabledAttr = !c.activoBool ? "disabled" : "";

        html += 
            '<tr>' +
                '<td class="fila-click" data-href="/concesionarios/' + c.id_concesionario + '">' + (c.nombre || 'Sin nombre') + '</td>' +
                '<td class="fila-click" data-href="/concesionarios/' + c.id_concesionario + '">' + (c.ciudad || '') + '</td>' +
                '<td class="fila-click" data-href="/concesionarios/' + c.id_concesionario + '">' + (c.direccion || '') + '</td>' +
                '<td class="fila-click" data-href="/concesionarios/' + c.id_concesionario + '">' + (c.telefono_contacto || '') + '</td>' +
                '<td class="fila-click" data-href="/concesionarios/' + c.id_concesionario + '">' + pintarEstadoConcesionario(c.activoBool) + '</td>' +
                '<td>' +
                    '<button type="button" class="btn btn-secondary btn-sm mb-1 me-2" ' +
                        'data-bs-toggle="modal" ' +
                        'data-bs-target="#confirmarEliminarConcesionarioModal" ' +
                        'data-id="' + c.id_concesionario + '" ' +
                        'data-name="' + c.nombre + '" ' +
                        btnDisabledAttr + '>' +
                        'Eliminar' +
                    '</button>' +
                    '<a href="/concesionarios/' + c.id_concesionario + '/editar" ' +
                        'class="btn btn-primary btn-sm mb-1 ' + claseDisabled + '" ' + pointerEvents + '>' +
                        'Editar' +
                    '</a>' +
                '</td>' +
            '</tr>';
    });

    console.log("📝 [DEBUG] Insertando HTML en el DOM...");
    $tbody.html(html);
    
    if ($contador.length) {
        $contador.text(lista.length);
    } else {
        console.warn("⚠️ [DEBUG] No encuentro #contadorConcesionarios para actualizar el número.");
    }

    activarFilaClick();
    console.log("✅ [DEBUG] Tabla pintada correctamente.");
}

function configurarModalEliminar() {
    let $modalEliminar = $("#confirmarEliminarConcesionarioModal");
    let $formEliminar = $("#formEliminarConcesionario");

    $modalEliminar.on("show.bs.modal", function(event) {
        let btn = $(event.relatedTarget);
        let id = btn.data("id");
        let nombre = btn.data("name");
        let $btnSubmit = $formEliminar.find("button[type='submit']");
        $btnSubmit.data("id", id);
        $btnSubmit.data("name", nombre);
        $("#textoConfirmacionConcesionario").text('¿Estás seguro de que deseas eliminar el concesionario "' + nombre + '"?');
    });

    $formEliminar.on("submit", function(e) {
        e.preventDefault();
        let $btnSubmit = $formEliminar.find("button[type='submit']");
        let id = $btnSubmit.data("id");
        let nombre = $btnSubmit.data("name");

        if (!id) return;

        $.ajax({
            type: "DELETE",
            url: "/api/concesionarios/" + id + "/eliminar",
            success: function(data) {
                let modalEl = document.getElementById('confirmarEliminarConcesionarioModal');
                let modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

                if (typeof data === 'string' && data.includes('<html')) {
                    window.location.href = '/login';
                    return;
                }

                if (!data.ok) {
                    mostrarAlerta('danger', data.error || 'Error al eliminar.');
                } else {
                    mostrarAlerta('success', 'Concesionario eliminado: ' + nombre);
                    // Actualización visual rápida
                    let $btnTabla = $("button[data-id='" + id + "']");
                    if ($btnTabla.length) {
                        $btnTabla.prop("disabled", true).text("Eliminar");
                        $btnTabla.closest("tr").find("td:nth-child(5)").html('<span class="badge bg-danger">Eliminado</span>');
                        $btnTabla.siblings(".btn-primary").addClass("disabled").css("pointer-events", "none");
                    }
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("Error AJAX Eliminar:", errorThrown);
                mostrarAlerta('danger', 'Error de conexión al eliminar.');
            }
        });
    });
}

function pintarEstadoConcesionario(activo) {
    let clase = activo ? "bg-success" : "bg-danger";
    let texto = activo ? "Activo" : "Eliminado";
    return '<span class="badge ' + clase + '">' + texto + '</span>';
}

function activarFilaClick() {
    $(".fila-click").on("click", function() {
        let destino = $(this).data("href");
        if (destino) window.location.href = destino;
    });
}

function mostrarAlerta(tipo, mensaje) {
    let $cont = $("#alertas");
    if (!$cont.length) {
        console.error("❌ [DEBUG] No existe #alertas en el HTML para mostrar el mensaje:", mensaje);
        return;
    }
    let html = 
        '<div class="alert alert-' + tipo + ' alert-dismissible fade show" role="alert">' +
            mensaje +
            '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
        '</div>';
    $cont.html(html);
    setTimeout(function() { $(".alert").alert('close'); }, 5000);
}