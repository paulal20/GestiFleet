let fechaFijadaPorUsuario = false;

$(document).ready(function () {

    const paramsUrl = new URLSearchParams(window.location.search);
    if (paramsUrl.has('fecha') && paramsUrl.get('fecha') !== '') {
        fechaFijadaPorUsuario = true;
    }

    actualizarTextosSliders();

    $("#precio_max, #autonomia_min").on("input", function () {
        actualizarTextosSliders();
    });

    cargarVehiculos();

    // AUTO-RECARGA
    setInterval(function() {
        if (!fechaFijadaPorUsuario) {
            actualizarInputFechaAAhora();
            cargarVehiculos();
        }
    }, 30000);

    $("#fecha_max").on("change", function() {
        fechaFijadaPorUsuario = true; 
        if ($(this).val() === "") {
            fechaFijadaPorUsuario = false;
        }
        cargarVehiculos();
    });

    // Resto de inputs (color, plazas, etc)
    $("#formFiltros input:not(#fecha_max)").on("change", function () {
        cargarVehiculos();
    });

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
    
    if(!contenedor) return;

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
            
            // 1. Pintamos las tarjetas
            pintarVehiculos(data.vehiculos, usuarioSesion);
            
            // 2. NUEVO: Actualizamos los números del filtro basándonos en lo recibido
            actualizarContadoresSidebar(data.vehiculos);
        },
        error: function () {
            $("#contenedor-vehiculos").css("opacity", "1");
            mostrarAlertaVehiculos("danger", "Error de conexión");
        }
    });
}

function actualizarContadoresSidebar(lista) {
    // 1. Inicializar contadores a 0
    const conteos = {
        tipo: {},
        color: {},
        plazas: {},
        estado: {},
        concesionario: {}
    };

    // 2. Recorrer los vehículos devueltos por la API y sumar
    lista.forEach(v => {
        if(v.tipo) conteos.tipo[v.tipo] = (conteos.tipo[v.tipo] || 0) + 1;
        if(v.color) conteos.color[v.color] = (conteos.color[v.color] || 0) + 1;
        if(v.numero_plazas) conteos.plazas[v.numero_plazas] = (conteos.plazas[v.numero_plazas] || 0) + 1;
        if(v.id_concesionario) conteos.concesionario[v.id_concesionario] = (conteos.concesionario[v.id_concesionario] || 0) + 1;
        
        // Usamos el valor exacto (singular) de la API
        const estadoKey = v.estado_dinamico || 'disponible';
        conteos.estado[estadoKey] = (conteos.estado[estadoKey] || 0) + 1;
    });

    // 3. Recorrer el DOM y actualizar textos
    const filtros = ['tipo', 'color', 'plazas', 'estado', 'concesionario'];

    filtros.forEach(categoria => {
        
        // --- CORRECCIÓN CLAVE ---
        // Verificamos si este filtro está "activo" (si el usuario ha seleccionado algo que no sea "Todos")
        const valorSeleccionado = $(`input[name="${categoria}"]:checked`).val();

        // Si el usuario está filtrando por esta categoría (ej: ha marcado "reservado"),
        // NO actualizamos los textos de esta categoría. Mantenemos los números antiguos.
        // Así, "Disponibles" seguirá mostrando (5) aunque no estén en pantalla.
        if (valorSeleccionado && valorSeleccionado !== "") {
            return; // Saltamos a la siguiente categoría sin tocar el DOM de esta
        }
        // ------------------------

        // Seleccionamos todos los inputs radio de esa categoría
        $(`input[name="${categoria}"]`).each(function() {
            const $input = $(this);
            const val = $input.val(); 
            const $label = $input.next('label'); 

            let cantidad = 0;

            if (val === "") {
                // Opción "Todos": Es igual al total de la lista actual
                cantidad = lista.length;
            } else {
                // Opción específica: Buscamos en nuestro objeto 'conteos'
                cantidad = conteos[categoria][val] || 0;
            }

            // Actualizar el texto conservando el nombre original
            let textoActual = $label.text().trim();
            const parentesisIndex = textoActual.lastIndexOf('(');
            
            let nombreBase = textoActual;
            if (parentesisIndex !== -1) {
                nombreBase = textoActual.substring(0, parentesisIndex).trim();
            }

            // Aplicamos el nuevo texto
            $label.text(`${nombreBase} (${cantidad})`);
        });
    });
}

function pintarVehiculos(lista, usuarioSesion) {
    const $cont = $("#contenedor-vehiculos");
    $cont.empty();

    const esAdmin = usuarioSesion?.rol === "Admin";
    
    const valFecha = $("#fecha_max").val();
    const queryFecha = valFecha ? `?fecha=${valFecha}` : ''; 
    const queryFechaAmpersand = valFecha ? `&fecha=${valFecha}` : '';

    if (!lista || lista.length === 0) {
        $cont.html(`
            <div class="alert alert-info text-center w-100">
                <h5>No se encontraron vehículos</h5>
            </div>
        `);
    } else {
        lista.forEach(v => {
            const estadoBadge =
            v.estado_dinamico === "disponible"
            ? '<span class="badge bg-success">Disponible</span>'
            : '<span class="badge bg-warning text-dark">Reservado</span>';

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
                    <!-- AQUÍ ESTÁ EL CAMBIO: p-0 y border-0 para eliminar espacios y bordes -->
                    <div class="card-footer p-0 border-0">
                        <!-- rounded-bottom para que encaje abajo -->
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