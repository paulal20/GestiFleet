$(document).ready(function () {

    // Inicializar valores de sliders desde el HTML
    $("#precio-val").text($("#precio_max").val());
    $("#autonomia-val").text($("#autonomia_min").val());

    $("#precio_max").on("input", function () {
        $("#precio-val").text($(this).val());
    });

    $("#autonomia_min").on("input", function () {
        $("#autonomia-val").text($(this).val());
    });

    // Cargar lista inicial
    cargarVehiculos();

    // Aplicar filtros (AJAX)
    $("#formFiltros").on("submit", function (e) {
        e.preventDefault();
        cargarVehiculos();
    });

    // Limpiar filtros
    $("#limpiarFiltros").on("click", function () {
        $("#formFiltros")[0].reset();
        cargarVehiculos();
    });

    configurarModalEliminarVehiculo();
});


// ==========================
//   CARGAR VEHÍCULOS
// ==========================
function cargarVehiculos() {

    const params = $("#formFiltros").serialize(); // Envia todo lo del form
    const contenedor = document.getElementById('vehiculosApp');
    const usuarioSesion = JSON.parse(contenedor.dataset.usuario);
    $.ajax({

        type: "GET",
        url: "/api/vehiculos",
        data: params,
        cache: false,

        beforeSend: function () {
            $("#contenedor-vehiculos").html(`
                <div class="text-center p-5">
                    <div class="spinner-border"></div>
                    <p class="mt-2">Cargando vehículos...</p>
                </div>
            `);
        },

        success: function (data) {
            if (!data.ok)
                return mostrarAlertaVehiculos("danger", data.error);
            pintarVehiculos(data.vehiculos, usuarioSesion);
        },

        error: function () {
            mostrarAlertaVehiculos("danger", "Error de conexión");
        }
    });
}



// ==========================
//   PINTAR LISTA
// ==========================
function pintarVehiculos(lista, usuarioSesion) {
    const $cont = $("#contenedor-vehiculos");
    $cont.empty();

    const esAdmin = usuarioSesion?.rol === "Admin"; 
    
    if (!lista || lista.length === 0) {
        $cont.html(`
            <div class="alert alert-info text-center">
                <h5>No hay vehículos</h5>
            </div>
        `);
    } else {
        lista.forEach(v => {
            const estadoBadge =
                v.estado === "disponible"
                    ? '<span class="badge bg-success">Disponible</span>'
                    : v.estado === "reservado"
                        ? '<span class="badge bg-warning text-dark">Reservado</span>'
                        : '<span class="badge bg-danger">Mantenimiento</span>';

            let footerHtml = esAdmin
                ? `
                    <div class="card-footer d-flex gap-2">
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
                : `
                    <div class="card-footer">
                        <a class="btn btn-primary w-100" href="/reserva?idVehiculo=${v.id_vehiculo}">
                            Reservar
                        </a>
                    </div>`;

            $cont.append(`
              <div class="col">
                <div class="vehiculo-card card-base h-100 d-flex flex-column">
                    <a href="/vehiculos/${v.id_vehiculo}" style="text-decoration:none;">
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

    //  ✅ Al final, si es admin, agregamos la tarjeta “Añadir Vehículo”
    if (esAdmin) agregarTarjetaAgregarVehiculo($cont);
}


function agregarTarjetaAgregarVehiculo($cont) {
    $cont.append(`
      <div class="col">
        <a href="/vehiculos/nuevo" class="d-block text-decoration-none h-100">
          <div class="vehiculo-card card-base h-100 d-flex flex-column align-items-center justify-content-center">
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

// ==========================
//   MODAL ELIMINAR
// ==========================
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

            success: function () {
                bootstrap.Modal.getInstance($modal[0]).hide();
                cargarVehiculos(); // refrescar lista
            },

            error: function () {
                bootstrap.Modal.getInstance($modal[0]).hide();
                mostrarAlertaVehiculos("danger", "Error al eliminar.");
            }
        });
    });
}



// ==========================
//   ALERTAS
// ==========================
function mostrarAlertaVehiculos(tipo, mensaje) {

    if (!$("#alertasVehiculos").length) {
        $(".vehiculos-content").prepend(`<div id="alertasVehiculos"></div>`);
    }

    $("#alertasVehiculos").html(`
        <div class="alert alert-${tipo} alert-dismissible fade show">
            ${mensaje}
            <button class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
}
