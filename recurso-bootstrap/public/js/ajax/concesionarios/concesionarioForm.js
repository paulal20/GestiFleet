document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("concesionarioForm");
    if (!form) return;

    const isEditMode = form.dataset.id && form.dataset.id !== "";
    const idConcesionario = form.dataset.id;

    form.addEventListener("form-valid", async () => {
        document.querySelectorAll(".alert").forEach(el => el.remove());
        document.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid")); 

        const formData = {
            nombre: document.getElementById("nombre").value.trim(),
            ciudad: document.getElementById("ciudad").value.trim(),
            direccion: document.getElementById("direccion").value.trim(),
            telefono_contacto: document.getElementById("telefono_contacto").value.trim()
        };

        try {
            const url = isEditMode
                ? `/api/concesionarios/${idConcesionario}/editar`
                : `/api/concesionarios/nuevo`;
            const method = isEditMode ? "PUT" : "POST";

            fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            .then(res => res.json())
            .then(data => {
                if (!data.ok) {
                    if (data.fieldErrors) {
                        Object.keys(data.fieldErrors).forEach(field => {
                            const errorEl = document.getElementById(`error-${field}`);
                            if (errorEl) errorEl.textContent = data.fieldErrors[field];
                            
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

                const redirectId = isEditMode ? idConcesionario : data.id;
                window.location.href = `/concesionarios/${redirectId}`;
            })
            .catch(err => {
                console.error("Error en la petición:", err);
                const div = document.createElement("div");
                div.className = "alert alert-danger mt-2";
                div.textContent = "Error de conexión o servidor caído.";
                form.prepend(div);
            });

        } catch (err) {
            console.error("Error general:", err);
            const div = document.createElement("div");
            div.className = "alert alert-danger mt-2";
            div.textContent = "Error inesperado en el cliente.";
            form.prepend(div);
        }
    });
});