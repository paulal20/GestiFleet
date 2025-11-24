document.addEventListener("DOMContentLoaded", () => {
    const btnCancelar = document.getElementById("btnCancelarReservaDetalle");
    const modal = document.getElementById("modalCancelarDetalle");
    const btnConfirmar = document.getElementById("btnConfirmarCancelar");

    if (btnCancelar && modal && btnConfirmar) {
        
        btnConfirmar.addEventListener("click", async () => {
            const idReserva = btnCancelar.dataset.id;
            
            btnConfirmar.disabled = true;

            try {
                const res = await fetch(`/api/reservas/${idReserva}/cancelar`, {
                    method: "PUT"
                });

                const data = await res.json();

                if (data.ok) {+
                    mostrarAlerta('success', 'Reserva cancelada exitosamente.');
                    
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) modalInstance.hide();

                    const badgeEstado = document.getElementById("badgeEstadoReserva");
                    if (badgeEstado) {
                        badgeEstado.className = "badge bg-danger";
                        badgeEstado.textContent = "CANCELADA";
                    }

                    btnCancelar.style.display = "none";

                } else {
                    mostrarAlerta('danger', data.error || 'Error al cancelar la reserva.');
                    btnConfirmar.disabled = false;
                }

            } catch (err) {
                console.error("Error al cancelar:", err);
                mostrarAlerta('danger', 'Error de conexión.');
                btnConfirmar.disabled = false;
            }
        });
    }
});

function mostrarAlerta(tipo, mensaje) {
    const cont = document.getElementById('alertasDetalle');
    if (!cont) return;
    cont.innerHTML = `<div class="alert alert-${tipo} mt-3" role="alert">${mensaje}</div>`;
}