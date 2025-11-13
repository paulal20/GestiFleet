const modal = document.getElementById('confirmarEliminarModal');
modal.addEventListener('show.bs.modal', function (event) {
  const button = event.relatedTarget;
  const id = button.getAttribute('data-id');
  const name = button.getAttribute('data-name');
  const spanVehiculo = modal.querySelector('#vehiculoAEliminar');
  const form = modal.querySelector('#formEliminar');

  spanVehiculo.textContent = `"${name}"`;
  form.setAttribute('action', `/vehiculos/${id}/eliminar`);
});

const modalConcesionario = document.getElementById('confirmarEliminarConcesionarioModal');
  modalConcesionario.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget;
    const id = button.getAttribute('data-id');
    const name = button.getAttribute('data-name');

    const modalTitle = modalConcesionario.querySelector('#concesionarioAEliminar');
    modalTitle.textContent = name;

    const form = modalConcesionario.querySelector('#formEliminarConcesionario');
    form.action = '/concesionarios/' + id + '/eliminar';
  });

  const modalReserva = document.getElementById('confirmarCancelarReservaModal');
  modalReserva.addEventListener('show.bs.modal', event => {
    const button = event.relatedTarget;
    const id = button.getAttribute('data-id');
    const name = button.getAttribute('data-name');

    const modalTitle = modalReserva.querySelector('#reservaACancelar');
    modalTitle.textContent = name;

    const form = modalReserva.querySelector('#formCancelarReserva');
    form.action = '/reserva/' + id + '/cancelar';
  });