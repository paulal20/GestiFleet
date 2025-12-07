document.addEventListener("DOMContentLoaded", () => {

  //VEHICULOS
  const modalVehiculo = document.getElementById('confirmarEliminarModal');
  if (modalVehiculo) {
    modalVehiculo.addEventListener('show.bs.modal', event => {
      const button = event.relatedTarget;
      const id = button.getAttribute('data-id');
      const name = button.getAttribute('data-name');
      modalVehiculo.querySelector('#vehiculoAEliminar').textContent = `"${name}"`;
      modalVehiculo.querySelector('#formEliminar').action = `/vehiculos/${id}/eliminar`;
    });
  }

  //CONCESIONARIOS
  const modalConcesionario = document.getElementById('confirmarEliminarConcesionarioModal');
  if (modalConcesionario) {
    modalConcesionario.addEventListener('show.bs.modal', event => {

      const button = event.relatedTarget;
      const id = button.getAttribute('data-id');
      const name = button.getAttribute('data-name');

      modalConcesionario.querySelector("#textoConfirmacionConcesionario")
        .textContent = `¿Estás seguro de que deseas eliminar el concesionario "${name}"?`;

      modalConcesionario.querySelector('#formEliminarConcesionario')
        .action = `/concesionarios/${id}/eliminar`;
    });
  }

  //RESERVAS
  const modalReserva = document.getElementById('confirmarCancelarReservaModal');
  if (modalReserva) {
    modalReserva.addEventListener('show.bs.modal', event => {
      const button = event.relatedTarget;
      const id = button.getAttribute('data-id');
      const name = button.getAttribute('data-name');

      modalReserva.querySelector('#reservaACancelar').textContent = name;
      modalReserva.querySelector('#formCancelarReserva').action =
        `/reserva/${id}/cancelar`;
    });
  }

  //USUARIOS
  const modalUsuario = document.getElementById("confirmarEliminarUsuarioModal");
  if (modalUsuario) {
    modalUsuario.addEventListener("show.bs.modal", event => {
      const button = event.relatedTarget;
      const id = button.getAttribute("data-id");
      const nombre = button.getAttribute("data-name");

      modalUsuario.querySelector("#textoConfirmacion")
        .textContent = `¿Estás seguro de que quieres eliminar al usuario "${nombre}"?`;

      modalUsuario.querySelector("#formEliminarUsuario")
        .action = `/usuarios/${id}/eliminar`;
    });
  }

});
