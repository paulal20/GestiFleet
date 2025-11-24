document.addEventListener("DOMContentLoaded", () => {
    const dataPage = document.getElementById("pageData"); 
    window.usuarioSesion = dataPage ? JSON.parse(dataPage.dataset.user || "null") : null;

    cargarReservas();

    const filtros = ["filtroVehiculo", "filtroEstado", "fechaDesde", "fechaHasta"];
    filtros.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener("change", cargarReservas);
        }
    });

    const btnLimpiar = document.getElementById("btnLimpiar");
    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", () => {
            filtros.forEach(id => {
                const input = document.getElementById(id);
                if (input) input.value = '';
            });
            cargarReservas();
        });
    }

    configurarModalCancelarLista();
});

function cargarReservas() {
    const vehiculo = document.getElementById("filtroVehiculo")?.value || "";
    const estado = document.getElementById("filtroEstado")?.value || "";
    const fechaDesde = document.getElementById("fechaDesde")?.value || "";
    const fechaHasta = document.getElementById("fechaHasta")?.value || "";

    // Determinamos el endpoint según el rol
    const esAdmin = window.usuarioSesion?.rol === 'Admin';
    const endpoint = esAdmin ? '/api/reservas/listareservas' : '/api/reservas/mis-reservas';

    // Construir Query Params
    const params = new URLSearchParams({
        vehiculo,
        estado,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta
    });

    fetch(`${endpoint}?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                pintarTabla(data.reservas, esAdmin);
            } else {
                mostrarAlerta('danger', data.error || 'Error al cargar reservas.');
            }
        })
        .catch(err => {
            console.error("Error AJAX:", err);
            mostrarAlerta('danger', 'Error de conexión al cargar reservas.');
        });
}

function pintarTabla(lista, esAdmin) {
    const tbody = document.getElementById("tablaReservasBody");
    const contador = document.getElementById('contadorReservas');
    tbody.innerHTML = "";

    if (!lista || !lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${esAdmin ? 7 : 6}" class="text-center text-muted">No se encontraron reservas</td>
            </tr>
        `;
        if (contador) contador.textContent = 0;
        return;
    }

    if (contador) contador.textContent = lista.length;

    lista.forEach(r => {
        // Formatear fechas
        const inicio = new Date(r.fecha_inicio).toLocaleString();
        const fin = new Date(r.fecha_fin).toLocaleString();

        // Columna de usuario solo para admin
        const colUsuario = esAdmin ? `<td>${r.nombre_usuario} <br><small class="text-muted">${r.email_usuario}</small></td>` : '';

        // Botón de cancelar solo si está activa
        let btnCancelar = '';
        if (r.estado === 'activa') {
            btnCancelar = `
                <button type="button" 
                    class="btn btn-outline-danger btn-sm"
                    data-bs-toggle="modal"
                    data-bs-target="#confirmarCancelarModal"
                    data-id="${r.id_reserva}"
                    data-detalle="Reserva del ${r.marca} ${r.modelo}">
                    Cancelar
                </button>
            `;
        }

        tbody.innerHTML += `
            <tr>
                ${colUsuario}
                <td>
                    <a href="/reserva/${r.id_reserva}" class="text-decoration-none fw-bold">
                        ${r.marca} ${r.modelo}
                    </a>
                    <br><small>${r.matricula}</small>
                </td>
                <td>${inicio}</td>
                <td>${fin}</td>
                <td>${pintarEstadoReserva(r.estado)}</td>
                <td>
                    <div class="d-flex gap-1">
                        <a href="/reserva/${r.id_reserva}" class="btn btn-primary btn-sm">Ver</a>
                        ${btnCancelar}
                    </div>
                </td>
            </tr>
        `;
    });
}

function pintarEstadoReserva(estado) {
    const clases = {
        'activa': 'bg-success',
        'cancelada': 'bg-danger',
        'finalizada': 'bg-secondary'
    };
    const clase = clases[estado] || 'bg-light text-dark';
    return `<span class="badge ${clase}">${estado.toUpperCase()}</span>`;
}

function configurarModalCancelarLista() {
    const modal = document.getElementById("confirmarCancelarModal");
    const form = document.getElementById("formCancelarReserva"); // Asegúrate de tener este form en el HTML del modal

    if (!modal || !form) return;

    modal.addEventListener("show.bs.modal", (event) => {
        const btn = event.relatedTarget;
        const id = btn.dataset.id;
        const detalle = btn.dataset.detalle;

        const btnSubmit = form.querySelector("button[type='submit']");
        btnSubmit.dataset.id = id;

        const texto = modal.querySelector(".modal-body p");
        if (texto) texto.textContent = `¿Seguro que deseas cancelar la ${detalle}?`;
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btnSubmit = form.querySelector("button[type='submit']");
        const id = btnSubmit.dataset.id;

        try {
            const res = await fetch(`/api/reservas/${id}/cancelar`, { method: "PUT" });
            const data = await res.json();

            if (data.ok) {
                mostrarAlerta('success', 'Reserva cancelada correctamente.');
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) modalInstance.hide();
                cargarReservas(); // Recargar la tabla
            } else {
                mostrarAlerta('danger', data.error || 'No se pudo cancelar la reserva.');
            }
        } catch (err) {
            console.error(err);
            mostrarAlerta('danger', 'Error de red al cancelar.');
        }
    });
}

function mostrarAlerta(tipo, mensaje) {
    const cont = document.getElementById('alertas');
    if (!cont) return;
    cont.innerHTML = `<div class="alert alert-${tipo}" role="alert">${mensaje}</div>`;
    setTimeout(() => cont.innerHTML = '', 4000);
}