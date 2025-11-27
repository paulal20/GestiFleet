/* public/js/ajax/reservas/reservasLista.js 
   Versión final corregida, segura y totalmente funcional
*/

$(document).ready(function() {
    // Obtener datos del usuario embebidos en la vista
    const dataPage = document.getElementById("pageData"); 
    try {
        window.usuarioSesion = (dataPage && dataPage.dataset.user) 
            ? JSON.parse(dataPage.dataset.user) 
            : null;
    } catch(e) { 
        window.usuarioSesion = null; 
    }

    // Cargar reservas al iniciar
    cargarReservas();

    // Filtros automáticos
    $("#filtroVehiculo, #filtroEstado, #filtroFechaDesde, #filtroFechaHasta, #filtroUsuario")
        .on("change", function() {
        cargarReservas();
    });

    // Evitar submit tradicional
    $("form").on("submit", function(e) {
        e.preventDefault();
        cargarReservas();
    });

    // Botón limpiar filtros
    $("#btnLimpiar").on("click", function(e) {
        e.preventDefault();

        $("#filtroVehiculo").val("");
        $("#filtroEstado").val("");
        $("#filtroUsuario").val("");
        $("#filtroFechaDesde").val("");
        $("#filtroFechaHasta").val("");

        cargarReservas();
    });

    // Configurar modal cancelar
    configurarModalCancelarLista();
});

/* ================================
   FUNCIÓN PRINCIPAL CARGAR RESERVAS
================================= */

function cargarReservas() {
    const vehiculo = $("#filtroVehiculo").val() || "";
    const estado = $("#filtroEstado").val() || "";
    const fechaDesde = $("#filtroFechaDesde").val() || "";
    const fechaHasta = $("#filtroFechaHasta").val() || "";
    const usuario = $("#filtroUsuario").val() || ""; 

    const esAdmin = window.location.pathname.includes("/listareservas");

    const endpoint = esAdmin 
        ? '/api/reservas/listareservas'
        : '/api/reservas/mis-reservas';

    // ✔ Corrección importante: usuario normal envía su propio ID
    let datos = {
        vehiculo,
        estado,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        id: esAdmin 
            ? usuario 
            : (window.usuarioSesion ? window.usuarioSesion.id_usuario : "")
    };

    $.ajax({
        type: "GET",
        url: endpoint,
        data: datos,
        cache: false,
        success: function(data) {
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
            mostrarAlerta('danger', 'Error de conexión al cargar reservas.');
        }
    });
}

/* ================================
    PINTAR TABLA
================================= */

function pintarTabla(lista, esAdmin) {
    const $tbody = $("#tablaReservasBody");
    const $contador = $("#contadorReservas");

    $tbody.empty();

    if (!lista.length) {
        let colspan = esAdmin ? 7 : 6;
        $tbody.html('<tr><td colspan="' + colspan + '" class="text-center text-muted">No se encontraron reservas</td></tr>');
        $contador.text("0");
        return;
    }

    $contador.text(lista.length);

    let html = "";

    $.each(lista, function(i, r) {
        let inicio = r.fecha_inicio ? new Date(r.fecha_inicio).toLocaleString() : '-';
        let fin = r.fecha_fin ? new Date(r.fecha_fin).toLocaleString() : '-';

        let marca = r.marca || 'Desconocido';
        let modelo = r.modelo || '';
        let matricula = r.matricula || '';
        let nombreUsuario = r.nombre_usuario || 'Usuario';
        let emailUsuario = r.email_usuario || '';
        let estado = r.estado || 'activa';

        let colUsuario = "";
        if (esAdmin) {
            colUsuario = 
                '<td class="fila-click" data-href="/reserva/' + r.id_reserva + '">' +
                    nombreUsuario + '<br>' +
                    '<small class="text-muted">' + emailUsuario + '</small>' +
                '</td>';
        }

        let btnCancelar = '';
        if (estado === 'activa') {
            let detalle = "Reserva del " + marca + " " + modelo;
            detalle = detalle.replace(/'/g, "&#39;");

            btnCancelar =
                '<button class="btn btn-primary btn-sm" ' +
                'data-bs-toggle="modal" data-bs-target="#confirmarCancelarModal" ' +
                'data-id="' + r.id_reserva + '" data-detalle="' + detalle + '">' +
                'Cancelar</button>';
        }

        html += '<tr>' +
                    colUsuario +
                    '<td class="fila-click" data-href="/reserva/' + r.id_reserva + '">' +
                        '<span class="fw-bold">' + marca + ' ' + modelo + '</span><br>' +
                        '<small>' + matricula + '</small>' +
                    '</td>' +
                    '<td class="fila-click" data-href="/reserva/' + r.id_reserva + '">' + inicio + '</td>' +
                    '<td class="fila-click" data-href="/reserva/' + r.id_reserva + '">' + fin + '</td>' +
                    '<td class="fila-click" data-href="/reserva/' + r.id_reserva + '">' +
                        pintarEstadoReserva(estado) +
                    '</td>' +
                    '<td>' + btnCancelar + '</td>' +
                '</tr>';
    });

    $tbody.html(html);
    activarFilaClick();
}

function pintarEstadoReserva(estado) {
    let clase = 'bg-light text-dark';
    if (estado === 'activa') clase = 'bg-success';
    if (estado === 'cancelada') clase = 'bg-danger';
    if (estado === 'finalizada') clase = 'bg-secondary';

    return '<span class="badge ' + clase + '">' + estado.toUpperCase() + '</span>';
}

/* ================================
    MODAL CANCELAR RESERVA
================================= */

function configurarModalCancelarLista() {
    const $modal = $("#confirmarCancelarModal");
    const $form = $("#formCancelarReserva");

    $modal.on("show.bs.modal", function(event) {
        const $btn = $(event.relatedTarget);
        const id = $btn.data("id");
        const detalle = $btn.data("detalle");

        $("#textoCancelar").text(
            "¿Estás seguro de que quieres cancelar la " + (detalle || "reserva") + "?"
        );

        $form.find("button[type='submit']").data("id", id);
    });

    $form.on("submit", function(e) {
        e.preventDefault();

        const id = $(this).find("button[type='submit']").data("id");

        $.ajax({
            type: "PUT",
            url: "/api/reservas/" + id + "/cancelar",
            success: function(data) {
                bootstrap.Modal.getInstance(document.getElementById('confirmarCancelarModal')).hide();

                if (data.ok) {
                    mostrarAlerta('success', 'Reserva cancelada correctamente.');
                    cargarReservas();
                } else {
                    mostrarAlerta('danger', data.error || 'No se pudo cancelar.');
                }
            },
            error: function(xhr) {
                bootstrap.Modal.getInstance(document.getElementById('confirmarCancelarModal')).hide();
                mostrarAlerta('danger', xhr.responseJSON?.error || 'Error al cancelar.');
            }
        });
    });
}

/* ================================
    AUXILIARES
================================= */

function activarFilaClick() {
    $(".fila-click").off("click").on("click", function() {
        const destino = $(this).data("href");
        if (destino) window.location.href = destino;
    });
}

function mostrarAlerta(tipo, mensaje) {
    const $cont = $("#alertas");
    if (!$cont.length) return;

    $cont.html(
        '<div class="alert alert-' + tipo + ' alert-dismissible fade show">' +
        mensaje +
        '<button class="btn-close" data-bs-dismiss="alert"></button>' +
        '</div>'
    );

    setTimeout(() => $cont.find(".alert").alert('close'), 4000);
}
