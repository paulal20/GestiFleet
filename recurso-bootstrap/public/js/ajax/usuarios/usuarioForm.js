document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("usuarioForm");
    if (!form) return;

    const isEditMode = form.dataset.editmode === "true";
    const idUsuario = form.dataset.id; 

    form.addEventListener("form-valid", () => {
        // Limpiamos alertas previas
        document.querySelectorAll(".alert").forEach(el => el.remove());

        const formData = {
            nombre: document.getElementById("nombre").value.trim(),
            apellido1: document.getElementById("apellido1").value.trim(),
            apellido2: document.getElementById("apellido2").value.trim(),
            email: document.getElementById("email").value.trim(),
            confemail: document.getElementById("confemail")?.value.trim(),
            contrasenya: document.getElementById("contrasenya").value.trim(),
            telefono: document.getElementById("telefono").value.trim(),
            rol: document.getElementById("rol").value,
            id_concesionario: document.getElementById("id_concesionario")?.value,
            preferencias_accesibilidad: document.getElementById("preferencias_accesibilidad").value.trim()
        };

        const url = isEditMode
            ? `/api/usuarios/${idUsuario}` 
            : `/api/usuarios/nuevo`;
            
        const method = isEditMode ? "PUT" : "POST";

        fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        })
        .then(res => res.json())
        .then(data => {
            if (!data.ok) {
                if (data.errors) {
                    Object.keys(data.errors).forEach(field => {
                        const errorEl = document.getElementById(`error-${field}`);
                        if (errorEl) errorEl.textContent = data.errors[field];
                        
                        const input = document.getElementById(field);
                        if (input) {
                            input.classList.remove("is-valid");
                            input.classList.add("is-invalid");
                            
                            // GUARDAR VETO: Guardamos el valor actual como inválido en el formulario
                            // para que la validación JS no lo ponga verde al hacer click fuera.
                            if (!form.valoresVetados) form.valoresVetados = {};
                            form.valoresVetados[field] = input.value.trim();
                        }
                    });
                } 
                
                const div = document.createElement("div");
                div.className = "alert alert-danger mt-2";
                div.textContent = data.error || "Error desconocido al guardar.";
                form.prepend(div);
                
                // NUEVO: Eliminar alerta a los 5 segundos
                setTimeout(() => {
                    if (div) div.remove();
                }, 5000);
                
                return;
            }

            // Éxito
            const redirectId = isEditMode ? idUsuario : data.id;
            window.location.href = `/usuarios/${redirectId}`;
        })
        .catch(err => {
            console.error("Error enviando formulario:", err);
            const div = document.createElement("div");
            div.className = "alert alert-danger mt-2";
            div.textContent = "Error de conexión al enviar el formulario.";
            form.prepend(div);

            // Eliminar alerta de conexión también a los 5s
            setTimeout(() => {
                if (div) div.remove();
            }, 5000);
        });
    });
});