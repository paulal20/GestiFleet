document.addEventListener("DOMContentLoaded", () => {
    const confirmBtn = document.getElementById('confirmarReservaBtn');
    const form = document.getElementById("revistaForm"); 

    if (confirmBtn && form) {
        const nuevoBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(nuevoBtn, confirmBtn);

        nuevoBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            
            const alertas = document.getElementById("alertasForm");
            if(alertas) alertas.innerHTML = "";

            const formData = {
                vehiculo: document.getElementById("vehiculo").value,
                fechaInicio: document.getElementById("fechaInicio").value,
                fechaFin: document.getElementById("fechaFin").value,
            };

            const textoOriginal = nuevoBtn.textContent;
            nuevoBtn.disabled = true;
            nuevoBtn.textContent = "Procesando...";

            try {
                const res = await fetch('/api/reservas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await res.json();

                if (data.ok) {
                    window.location.href = data.redirectUrl;
                } else {
                    mostrarAlertaForm('danger', data.error || 'Error al crear la reserva.');
                    
                    const modalEl = document.getElementById('confirmacionModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                }

            } catch (err) {
                console.error("Error envío reserva:", err);
                mostrarAlertaForm('danger', 'Error de comunicación con el servidor.');
            } finally {
                nuevoBtn.disabled = false;
                nuevoBtn.textContent = textoOriginal;
            }
        });
    }
});

function mostrarAlertaForm(tipo, mensaje) {
    const form = document.getElementById("revistaForm");
    const div = document.createElement("div");
    div.className = `alert alert-${tipo} mt-3`;
    div.textContent = mensaje;
    form.prepend(div);
    
    div.scrollIntoView({ behavior: 'smooth' });
}