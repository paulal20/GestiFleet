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
