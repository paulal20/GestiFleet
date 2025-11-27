/* public/js/ajax/reservas/reservasLista.js 
   Adaptado a jQuery $.ajax (PDF) - Versión Final UI Mejorada
*/

$(document).ready(function() {
    // Intentar obtener la sesión del usuario de forma segura
    const dataPage = document.getElementById("pageData"); 
    try {
        window.usuarioSesion = (dataPage && dataPage.dataset.user) 
            ? JSON.parse(dataPage.dataset.user) 
            : null;
    } catch(e) { 
        window.usuarioSesion = null; 
    }

    // Cargar Reservas Iniciales
    cargarReservas();

    // Eventos de Filtros (Automáticos)
    // Al cambiar cualquier input, recargamos la tabla automáticamente
    $("#filtroVehiculo, #filtroEstado, #filtroFechaDesde, #filtroFechaHasta, #filtroUsuario").on("change", function() {
        cargarReservas();
    });

    // Evitar submit del formulario (por si alguien pulsa Enter)
    $("form").on("submit", function(e) {
        e.preventDefault();
        cargarReservas();
    });

    // Botón Limpiar
    $("#btnLimpiar").on("click", function(e) {
        e.preventDefault(); 
        // Reseteamos al valor por defecto (vacio) que significa 'Todos'
        $("#filtroVehiculo").val("");
        $("#filtroEstado").val("");
        $("#filtroUsuario").val("");
        $("#filtroFechaDesde").val("");
        $("#filtroFechaHasta").val("");
        cargarReservas();
    });

    // Configurar Modal Cancelar
    configurarModalCancelarLista();
});

// --- FUNCIONES DE CARGA ---

function cargarReservas() {
    // Recoger valores de los filtros
    const vehiculo = $("#filtroVehiculo").val() || "";
    const estado = $("#filtroEstado").val() || "";
    const fechaDesde = $("#filtroFechaDesde").val() || "";
    const fechaHasta = $("#filtroFechaHasta").val() || "";
    const usuario = $("#filtroUsuario").val() || ""; 

    // Determinar endpoint (Admin o Usuario) basado en la URL
    const esAdmin = window.location.pathname.indexOf("/listareservas") !== -1;
    const endpoint = esAdmin ? '/api/reservas/listareservas' : '/api/reservas/mis-reservas';

    // Construir objeto de datos
    let datos = {
        vehiculo: vehiculo,
        estado: estado,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        id: usuario
    };

    // Petición AJAX
    $.ajax({
        type: "GET",
        url: endpoint,
        data: datos,
        cache: false, // Evitar caché
        success: function(data) {
            // Si devuelve HTML (login), redirigir
            if (typeof data === 'string' && data.indexOf('<html') !== -1) {
                window.location.href = '/login';
                return;
            }

            if (data.ok) {
                pintarTabla(data.reservas || [], esAdmin);
            } else {
                mostrarAlerta('danger', data.error || 'Error al cargar reservas.');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error AJAX:", errorThrown);
            mostrarAlerta('danger', 'Error de conexión al cargar reservas.');
        }
    });
}

function pintarTabla(lista, esAdmin) {
    const $tbody = $("#tablaReservasBody");
    const $contador = $("#contadorReservas");
    
    $tbody.empty();

    if (!lista || !lista.length) {
        let colspan = esAdmin ? 7 : 6;
        $tbody.html('<tr><td colspan="' + colspan + '" class="text-center text-muted">No se encontraron reservas</td></tr>');
        if ($contador.length) $contador.text("0");
        return;
    }

    if ($contador.length) $contador.text(lista.length);

    let html = "";
    
    // Iterar sobre la lista de reservas
    $.each(lista, function(i, r) {
        // Formatear fechas
        let inicio = r.fecha_inicio ? new Date(r.fecha_inicio).toLocaleString() : '-';
        let fin = r.fecha_fin ? new Date(r.fecha_fin).toLocaleString() : '-';
        
        // Datos seguros con valores por defecto
        let marca = r.marca || 'Desconocido';
        let modelo = r.modelo || '';
        let matricula = r.matricula || '';
        let nombreUsuario = r.nombre_usuario || 'Usuario';
        let emailUsuario = r.email_usuario || '';
        let estado = r.estado || 'activa';

        // Columna usuario (solo admin)
        let colUsuario = "";
        if (esAdmin) {
            colUsuario = '<td class="fila-click" style="cursor:pointer;" data-href="/reserva/' + r.id_reserva + '">' + nombreUsuario + '<br><small class="text-muted">' + emailUsuario + '</small></td>';
        }

        // Botón cancelar (solo si activa)
        let btnCancelar = '';
        if (estado === 'activa') {
            let detalle = "Reserva del " + marca + " " + modelo;
            detalle = detalle.replace(/'/g, "&#39;"); // Escapar comillas simples
            
            // Botón azul (primary)
            btnCancelar = 
                '<button type="button" class="btn btn-primary btn-sm" ' +
                    'data-bs-toggle="modal" ' +
                    'data-bs-target="#confirmarCancelarModal" ' +
                    'data-id="' + r.id_reserva + '" ' +
                    'data-detalle="' + detalle + '">' +
                    'Cancelar' +
                '</button>';
        }

        html += '<tr>';
        html +=   colUsuario;
        // Celda clicable para ir al detalle
        html +=   '<td class="fila-click" style="cursor:pointer;" data-href="/reserva/' + r.id_reserva + '">';
        html +=     '<span class="fw-bold">' + marca + ' ' + modelo + '</span><br><small>' + matricula + '</small>';
        html +=   '<td class="fila-click" style="cursor:pointer;" data-href="/reserva/' + r.id_reserva + '">' + inicio + '</td>';
        html +=   '<td class="fila-click" style="cursor:pointer;" data-href="/reserva/' + r.id_reserva + '">' + fin + '</td>';
        html +=   '<td class="fila-click" style="cursor:pointer;" data-href="/reserva/' + r.id_reserva + '">' + pintarEstadoReserva(estado) + '</td>';
        html +=   '<td>' + btnCancelar + '</td>';
        html += '</tr>';
    });

    $tbody.html(html);
    
    // Reactivar eventos de click en las nuevas filas
    activarFilaClick();
}

function pintarEstadoReserva(estado) {
    let clase = 'bg-light text-dark';
    if (estado === 'activa') clase = 'bg-success';
    if (estado === 'cancelada') clase = 'bg-danger';
    if (estado === 'finalizada') clase = 'bg-secondary';
    
    return '<span class="badge ' + clase + '">' + (estado ? estado.toUpperCase() : '') + '</span>';
}

// --- LÓGICA MODAL CANCELAR ---

function configurarModalCancelarLista() {
    const $modal = $("#confirmarCancelarModal");
    const $form = $("#formCancelarReserva");

    // Al abrir el modal
    $modal.on("show.bs.modal", function(event) {
        const $btn = $(event.relatedTarget);
        const id = $btn.data("id");
        const detalle = $btn.data("detalle");

        const $btnSubmit = $form.find("button[type='submit']");
        $btnSubmit.data("id", id);

        let $body = $modal.find(".modal-body");
        let texto = "¿Estás seguro de que quieres cancelar la " + (detalle || "reserva") + "?";
        
        // Actualizar texto manteniendo la estructura (botones, etc)
        let contenido = $body.html();
        let corte = contenido.indexOf('<div');
        if (corte !== -1) {
            $body.html(texto + '<br>' + contenido.substring(corte));
        } else {
             $body.contents().filter(function(){ return this.nodeType === 3; }).first().replaceWith(texto);
        }
    });

    // Al enviar el formulario (Cancelar)
    $form.off("submit").on("submit", function(e) {
        e.preventDefault();
        const $btnSubmit = $(this).find("button[type='submit']");
        const id = $btnSubmit.data("id");

        if (!id) return;

        $.ajax({
            type: "PUT", 
            url: "/api/reservas/" + id + "/cancelar",
            success: function(data) {
                let modalEl = document.getElementById('confirmarCancelarModal');
                if(modalEl) {
                    let modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                }

                if (data.ok) {
                    mostrarAlerta('success', 'Reserva cancelada correctamente.');
                    cargarReservas(); 
                } else {
                    mostrarAlerta('danger', data.error || 'No se pudo cancelar.');
                }
            },
            error: function(xhr) {
                let modalEl = document.getElementById('confirmarCancelarModal');
                if(modalEl) {
                    let modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                }
                let msg = 'Error de red al cancelar.';
                if (xhr.responseJSON && xhr.responseJSON.error) msg = xhr.responseJSON.error;
                mostrarAlerta('danger', msg);
            }
        });
    });
}

// --- AUXILIARES ---

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
    }, 4000);
}