document.addEventListener("DOMContentLoaded", () => {
    // Escuchamos el evento custom que lanza el validador frontend cuando todo está OK
    const form = document.getElementById("usuarioForm");
    if (!form) return;

    // Leemos el dataset
    const isEditMode = form.dataset.editmode === "true";
    const idUsuario = form.dataset.id; 

    form.addEventListener("form-valid", () => {
        // Limpiar alertas generales anteriores (los spans se limpian en la validación, aquí la alerta superior)
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

        // --- CORRECCIÓN AQUÍ ---
        // La ruta PUT correcta es /api/usuarios/${idUsuario}
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
                // Si la API devuelve errores específicos (ej. duplicados)
                if (data.errors) {
                    Object.keys(data.errors).forEach(field => {
                        const errorEl = document.getElementById(`error-${field}`);
                        if (errorEl) errorEl.textContent = data.errors[field];
                        
                        const input = document.getElementById(field);
                        if (input) {
                            // Importante: Quitamos el verde (is-valid) si el backend dice que está mal
                            input.classList.remove("is-valid");
                            input.classList.add("is-invalid");
                        }
                    });
                } 
                
                // Mostrar mensaje global de error arriba
                const div = document.createElement("div");
                div.className = "alert alert-danger mt-2";
                div.textContent = data.error || "Error desconocido al guardar.";
                form.prepend(div);
                
                return;
            }

            // Éxito: Redirigir
            // Si es edición, redirigimos a la ficha. Si es nuevo, usamos el ID que devuelve el insert.
            const redirectId = isEditMode ? idUsuario : data.id;
            window.location.href = `/usuarios/${redirectId}`;
        })
        .catch(err => {
            console.error("Error enviando formulario:", err);
            const div = document.createElement("div");
            div.className = "alert alert-danger mt-2";
            div.textContent = "Error de conexión al enviar el formulario.";
            form.prepend(div);
        });
    });
});