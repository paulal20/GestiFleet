document.addEventListener("DOMContentLoaded", () => {
    const data = document.getElementById("pageData");
    const id = data.dataset.id;
    window.usuarioSesion = JSON.parse(data.dataset.user || "null");

    cargarConcesionario(id);
    cargarVehiculos(id);

    configurarModalEliminar(id);
});

function cargarConcesionario(id) {
    fetch(`/api/concesionarios/${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.ok) pintarInfoConcesionario(data.concesionario);
        })
        .catch(err => console.error("Error cargando concesionario:", err));
}

function pintarInfoConcesionario(c) {
    document.getElementById("tituloConcesionario").textContent = c.nombre;

    // Acciones admin
    let accionesAdmin = "";
    if (window.usuarioSesion?.rol === "Admin") {
        accionesAdmin = `
        <div class="perfil-actions d-flex gap-2 mt-3">
            <button type="button"
                    class="btn btn-outline-secondary flex-fill"
                    data-bs-toggle="modal"
                    data-bs-target="#modalEliminar"
                    data-nombre="${c.nombre}"
                    ${!c.activoBool ? "disabled" : ""}>
              Eliminar
            </button>

            <a href="/concesionarios/${c.id_concesionario}/editar"
               class="btn btn-primary flex-fill">
               Editar
            </a>
        </div>`;
    }

    document.getElementById("infoConcesionario").innerHTML = `
      <div class="vehiculo-card card mx-auto" style="max-width: 900px;">
        <div class="row g-0">

          <div class="col-md-4">
            <div class="vehiculo-img-container h-100 d-flex align-items-center justify-content-center bg-light">
              <img src="/img/concesionario.png" 
                   class="rounded-end img-cover" 
                   alt="${c.nombre}"
                   style="max-height: 300px; object-fit: cover;">
            </div>
          </div>

          <div class="col-md-8 d-flex flex-column">
            <div class="card-body flex-grow-1">
              <h5 class="card-title">Información de Contacto</h5>
              
              <div class="row mb-2">
                <div class="col-sm-6 fw-bold">Ciudad:</div>
                <div class="col-sm-6">${c.ciudad}</div>
              </div>
              <div class="row mb-2">
                <div class="col-sm-6 fw-bold">Dirección:</div>
                <div class="col-sm-6">${c.direccion}</div>
              </div>
              <div class="row mb-2">
                <div class="col-sm-6 fw-bold">Teléfono:</div>
                <div class="col-sm-6">${c.telefono_contacto}</div>
              </div>
              <div class="row mb-2">
                <div class="col-sm-6 fw-bold">Estado:</div>
                <div class="col-sm-6">${pintarEstadoConcesionario(c.activoBool)}</div>
              </div>
            </div>

            ${accionesAdmin}

          </div>
        </div>
      </div>
    `;
}

function pintarEstadoConcesionario(activoBool) {
    if (activoBool) {
        return `<span class="badge bg-success">Activo</span>`;
    } else {
        return `<span class="badge bg-danger">Eliminado</span>`;
    }
}

function cargarVehiculos(id) {
    fetch(`/api/concesionarios/${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.ok) pintarVehiculos(data.vehiculos);
        })
        .catch(err => console.error("Error cargando vehículos:", err));
}

function pintarVehiculos(lista) {
    const tbody = document.getElementById("tablaVehiculosBody");
    tbody.innerHTML = "";

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">No hay vehículos</td>
            </tr>
        `;
        return;
    }

    lista.forEach(v => {
        tbody.innerHTML += `
            <tr>
                <td>${v.matricula}</td>
                <td>${v.marca}</td>
                <td>${v.modelo}</td>
                <td>${pintarEstado(v.estado)}</td>
                <td>
                    <a href="/vehiculos/${v.id_vehiculo}" class="btn btn-primary btn-sm">
                        Ver
                    </a>
                </td>
            </tr>
        `;
    });
}

function pintarEstado(est) {
    const clases = {
        disponible: "bg-success",
        reservado: "bg-warning text-dark",
        mantenimiento: "bg-secondary"
    };

    const clase = clases[est] || "bg-light text-dark";
    return `<span class="badge ${clase}">${est}</span>`;
}

function configurarModalEliminar(idConcesionario) {
    const modal = document.getElementById("modalEliminar");
    const nombreSpan = document.getElementById("nombreAEliminar");
    const btnConfirmar = document.getElementById("btnConfirmarEliminar");

    modal.addEventListener("show.bs.modal", (ev) => {
        const btn = ev.relatedTarget;
        nombreSpan.textContent = btn.dataset.nombre;
    });

    btnConfirmar.addEventListener("click", () => {
        fetch(`/api/concesionarios/${idConcesionario}`, {
            method: "DELETE"
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                window.location.href = "/concesionarios";
            } else {
                alert("Error al eliminar");
            }
        });
    });
}
