document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key.toLowerCase() === 'r') {
      window.location.href = 'reservas.html';
    }
    if (e.altKey && e.key.toLowerCase() === 'i') {
      window.location.href = 'index.html';
    }
    if (e.altKey && e.key.toLowerCase() === 'v') {
      window.location.href = 'vehiculos.html';
    }
    if (e.altKey && e.key.toLowerCase() === 'c') {
      window.location.href = 'contacto.html';
    }
  });
  