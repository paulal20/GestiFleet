document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("usuarioForm");
    if (!form) return;

    const isEditMode = form.dataset.editmode === "true";
    const idUsuario = form.dataset.id; // asigna data-id en el form si es edición

    form.addEventListener("form-valid", () => {
        // Limpiar alertas anteriores
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

        // Diferenciamos URL y método según modo
        const url = isEditMode
            ? `/api/usuarios/${idUsuario}/editar`   // edición
            : `/api/usuarios/nuevo`;              // creación
        const method = isEditMode ? "PUT" : "POST";

        fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        })
        .then(res => res.json())
        .then(data => {
            if (!data.ok) {
                // errores por campo
                if (data.errors) {
                    Object.keys(data.errors).forEach(field => {
                        const errorEl = document.getElementById(`error-${field}`);
                        if (errorEl) errorEl.textContent = data.errors[field];
                        const input = document.getElementById(field);
                        if (input) input.classList.add("is-invalid");
                    });
                } else {
                    const div = document.createElement("div");
                    div.className = "alert alert-danger mt-2";
                    div.textContent = data.error || "Error desconocido";
                    form.prepend(div);
                }
                return;
            }

            // redirigir al detalle
            const redirectId = isEditMode ? idUsuario : data.id;
            window.location.href = `/usuarios/${redirectId}`;
        })
        .catch(err => {
            console.error("Error enviando formulario:", err);
            const div = document.createElement("div");
            div.className = "alert alert-danger mt-2";
            div.textContent = "Error al enviar el formulario.";
            form.prepend(div);
        });
    });
});
