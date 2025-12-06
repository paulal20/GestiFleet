/* public/js/ajax/vehiculos/vehiculosLista.js */

let fechaFijadaPorUsuario = false;

$(document).ready(function () {

    const paramsUrl = new URLSearchParams(window.location.search);
    if (paramsUrl.has('fecha') && paramsUrl.get('fecha') !== '') {
        fechaFijadaPorUsuario = true;
    }

    actualizarTextosSliders();

    $("#precio_max, #autonomia_min").on("input", actualizarTextosSliders);

    cargarVehiculos();

    // AUTO-RECARGA
    setInterval(function() {
        if (!fechaFijadaPorUsuario) {
            actualizarInputFechaAAhora();
            cargarVehiculos();
        }
    }, 30000);

    $("#fecha_max").on("change", function() {
        fechaFijadaPorUsuario = $(this).val() !== "";
        cargarVehiculos();
    });

    // Filtros distintos a fecha
    $("#formFiltros input:not(#fecha_max)").on("change", cargarVehiculos);

    $("#btnLimpiarFiltros").on("click", function () {
        $("#formFiltros")[0].reset();

        const precioMax = $("#precio_max").attr("max");
        const autoMin = $("#autonomia_min").attr("min");
        $("#precio_max").val(precioMax);
        $("#autonomia_min").val(autoMin);

        fechaFijadaPorUsuario = false;
        actualizarInputFechaAAhora();
        actualizarTextosSliders();
        cargarVehiculos();
    });

    $("#btnAhora").on("click", function() {
        fechaFijadaPorUsuario = true;
        actualizarInputFechaAAhora();
        cargarVehiculos();
    });

    configurarModalEliminarVehiculo();
});

function actualizarTextosSliders() {
    $("#precio-val").text($("#precio_max").val());
    $("#autonomia-val").text($("#autonomia_min").val());
}

function actualizarInputFechaAAhora() {
    const ahora = new Date();
    const local = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60000));
    const stringFecha = local.toISOString().slice(0, 16);
    $("#fecha_max").val(stringFecha);
}

function cargarVehiculos() {
    if (!fechaFijadaPorUsuario) {
        actualizarInputFechaAAhora();
    }

    const params = $("#formFiltros").serialize();
    const contenedor = document.getElementById('vehiculosApp');
    if (!contenedor) return;

    const usuarioSesion = JSON.parse(contenedor.dataset.usuario);

    $.ajax({
        type: "GET",
        url: "/api/vehiculos",
        data: params,
        cache: false,
        beforeSend: function () {
            $("#contenedor-vehiculos").css("opacity", "0.5");
        },
        success: function (data) {
            $("#contenedor-vehiculos").css("opacity", "1");
            if (!data.ok)
                return mostrarAlertaVehiculos("danger", data.error);

            pintarVehiculos(data.vehiculos, usuarioSesion);
            actualizarContadoresSidebar(data.vehiculos);
        },
        error: function () {
            $("#contenedor-vehiculos").css("opacity", "1");
            mostrarAlertaVehiculos("danger", "Error de conexión con el servidor");
        }
    });
}

function actualizarContadoresSidebar(lista) {
    const conteos = { tipo: {}, color: {}, plazas: {}, estado: {}, concesionario: {} };

    lista.forEach(v => {
        if (v.tipo) conteos.tipo[v.tipo] = (conteos.tipo[v.tipo] || 0) + 1;
        if (v.color) conteos.color[v.color] = (conteos.color[v.color] || 0) + 1;
        if (v.numero_plazas) conteos.plazas[v.numero_plazas] = (conteos.plazas[v.numero_plazas] || 0) + 1;
        if (v.id_concesionario) conteos.concesionario[v.id_concesionario] = (conteos.concesionario[v.id_concesionario] || 0) + 1;

        const estadoKey = v.estado_dinamico || 'disponible';
        conteos.estado[estadoKey] = (conteos.estado[estadoKey] || 0) + 1;
    });

    ['tipo', 'color', 'plazas', 'estado', 'concesionario'].forEach(categoria => {
        $(`input[name="${categoria}"]`).each(function() {
            const $input = $(this);
            const val = $input.val();
            const $label = $input.next('label');

            let cantidad = val === "" ? lista.length : (conteos[categoria][val] || 0);

            let textoActual = $label.text().trim();
            const parentesisIndex = textoActual.lastIndexOf('(');
            let nombreBase = parentesisIndex !== -1 ? textoActual.substring(0, parentesisIndex).trim() : textoActual;

            $label.text(`${nombreBase} (${cantidad})`);

            if (cantidad === 0 && !$input.is(':checked')) {
                $label.addClass('text-muted').css('opacity', '0.5');
            } else {
                $label.removeClass('text-muted').css('opacity', '1');
            }
        });
    });
}

function pintarVehiculos(lista, usuarioSesion) {
    const $cont = $("#contenedor-vehiculos");
    $cont.empty();
    const esAdmin = usuarioSesion?.rol === "Admin";
    const valFecha = $("#fecha_max").val();
    const queryFechaAmpersand = valFecha ? `&fecha=${valFecha}` : '';
    const queryFecha = valFecha ? `?fecha=${valFecha}` : '';

    if (!lista || lista.length === 0) {
        $cont.html(`
            <div class="alert alert-info text-center w-100">
                <h5>No se encontraron vehículos</h5>
            </div>
        `);
    } else {
        lista.forEach(v => {
            const estadoBadge = v.estado_dinamico === "disponible"
                ? '<span class="badge bg-success">Disponible</span>'
                : '<span class="badge bg-warning text-dark">Reservado</span>';

            let footerHtml = esAdmin
                ? `<div class="card-footer d-flex gap-2">
                       <button class="btn btn-outline-secondary w-50"
                               data-bs-toggle="modal"
                               data-bs-target="#confirmarEliminarModal"
                               data-id="${v.id_vehiculo}"
                               data-name="${v.marca} ${v.modelo}">
                           Eliminar
                       </button>
                       <a href="/vehiculos/${v.id_vehiculo}/editar" class="btn btn-primary flex-fill">
                           Editar
                       </a>
                   </div>`
                : `<div class="card-footer p-0 border-0">
                       <a class="btn btn-primary w-100 rounded-bottom" href="/reserva?idVehiculo=${v.id_vehiculo}${queryFechaAmpersand}">
                           Reservar
                       </a>
                   </div>`;

            $cont.append(`
              <div class="col">
                <div class="vehiculo-card card-base h-100 d-flex flex-column">
                    <a href="/vehiculos/${v.id_vehiculo}${queryFecha}" style="text-decoration:none;">
                        <div class="vehiculo-img-container">
                            ${v.tiene_imagen
                                ? `<img src="/vehiculos/${v.id_vehiculo}/imagen" class="card-img-top">`
                                : `<div class="text-center p-4 text-muted">Sin imagen</div>`}
                        </div>
                        <div class="card-body">
                            <h5>${v.marca} ${v.modelo || ""}</h5>
                            <p>${v.descripcion || ""}</p>
                            <p><strong>Estado:</strong> ${estadoBadge}</p>
                            <p class="text-muted">Desde ${v.precio} €</p>
                        </div>
                    </a>
                    ${footerHtml}
                </div>
              </div>
            `);
        });
    }

    if (esAdmin) agregarTarjetaAgregarVehiculo($cont);
}

function agregarTarjetaAgregarVehiculo($cont) {
    $cont.append(`
      <div class="col">
        <a href="/vehiculos/nuevo" class="d-block text-decoration-none h-100">
          <div class="vehiculo-card card-base h-100 d-flex flex-column align-items-center justify-content-center" style="min-height: 100%;">
            <div class="vehiculo-img-container d-flex align-items-center justify-content-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16" style="font-size: 4rem; color: var(--color-primary-hover)">
                <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
              </svg>
            </div>
            <div class="card-body align-content-center text-center">
              <h5 class="card-title" style="color: var(--color-primary-hover)">Añadir Vehículo</h5>
              <p class="card-text" style="color: var(--color-text)">Agrega un nuevo vehículo al catálogo</p>
            </div>
          </div>
        </a>
      </div>
    `);
}

function configurarModalEliminarVehiculo() {
    const $modal = $("#confirmarEliminarModal");
    const $btnConfirmar = $("#btnConfirmarEliminarVehiculo");

    $modal.on("show.bs.modal", function (event) {
        const btn = $(event.relatedTarget);
        $("#vehiculoAEliminar").text(btn.data("name"));
        $btnConfirmar.data("id", btn.data("id"));
    });

    $btnConfirmar.on("click", function () {
        const id = $(this).data("id");
        $.ajax({
            type: "DELETE",
            url: "/api/vehiculos/" + id,
            success: function (data) {
                $modal.one('hidden.bs.modal', function () {
                    if (!data.ok) mostrarAlertaVehiculos("danger", data.error || "Error desconocido al eliminar.");
                });
                bootstrap.Modal.getInstance($modal[0]).hide();
                if (data.ok) cargarVehiculos();
            },
            error: function (jqXHR) {
                let mensaje = "Error al eliminar el vehículo.";
                if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                    mensaje = jqXHR.responseJSON.error;
                }
                $modal.one('hidden.bs.modal', function () {
                    mostrarAlertaVehiculos("danger", mensaje);
                });
                bootstrap.Modal.getInstance($modal[0]).hide();
            }
        });
    });
}

function mostrarAlertaVehiculos(tipo, mensaje) {
    if (!$("#alertasVehiculos").length) {
        $(".vehiculos-content").prepend(`<div id="alertasVehiculos"></div>`);
    }

    $("#alertasVehiculos").html(`
        <div class="alert alert-${tipo} alert-dismissible fade show" tabindex="-1">
            <strong>Atención:</strong> ${mensaje}
            <button class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    
    window.scrollTo(0, 0);
    $("#alertasVehiculos .alert").focus();
    
    setTimeout(function() {
        $("#alertasVehiculos .alert").fadeOut(500, function() {
            $(this).remove();
        });
    }, 5000);
}
