document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById('confirmarEliminarModal');
  if (modal)  {
    modal.addEventListener('show.bs.modal', function (event) {
      const button = event.relatedTarget;
      const id = button.getAttribute('data-id');
      const name = button.getAttribute('data-name');
      const spanVehiculo = modal.querySelector('#vehiculoAEliminar');
      const form = modal.querySelector('#formEliminar');
  
      spanVehiculo.textContent = `"${name}"`;
      form.setAttribute('action', `/vehiculos/${id}/eliminar`);
    });
  }

  const modalConcesionario = document.getElementById('confirmarEliminarConcesionarioModal');
  if (modalConcesionario){
    modalConcesionario.addEventListener('show.bs.modal', event => {
      const button = event.relatedTarget;
      const id = button.getAttribute('data-id');
      const name = button.getAttribute('data-name');

      const modalTitle = modalConcesionario.querySelector('#concesionarioAEliminar');
      modalTitle.textContent = name;

      const form = modalConcesionario.querySelector('#formEliminarConcesionario');
      form.action = '/concesionarios/' + id + '/eliminar';
    });
  }
  

  const modalReserva = document.getElementById('confirmarCancelarReservaModal');
  if(modalReserva) {
    modalReserva.addEventListener('show.bs.modal', event => {
      const button = event.relatedTarget;
      const id = button.getAttribute('data-id');
      const name = button.getAttribute('data-name');

      const modalTitle = modalReserva.querySelector('#reservaACancelar');
      modalTitle.textContent = name;

      const form = modalReserva.querySelecor('#formCancelarReserva');
      form.action = '/reserva/' + id + '/cancelar';
    });
  }

  const modalUsuario = document.getElementById("confirmarEliminarUsuarioModal");
  if (modalUsuario) {
    modalUsuario.addEventListener("show.bs.modal", function (event) {
        const button = event.relatedTarget;
        const id = button.getAttribute("data-id");
        const nombre = button.getAttribute("data-name");
        console.log("Eliminar usuario:", id, nombre);
        
        // Elementos dentro del modal
        const texto = modalUsuario.querySelector("#textoConfirmacion");
        const form = modalUsuario.querySelector("#formEliminarUsuario");
  
        texto.textContent = `¿Estás seguro de que quieres eliminar al usuario "${nombre}"?`;
  
        // Actualizar acción del formulario
        form.setAttribute('action', `/usuarios/${id}/eliminar`);
        // form.action = `/usuarios/${id}/eliminar`;
    });
  }
});