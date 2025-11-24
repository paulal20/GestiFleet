document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("concesionarioForm");
    if (!form) return;

    const campos = {
        nombre: document.getElementById("nombre"),
        ciudad: document.getElementById("ciudad"),
        direccion: document.getElementById("direccion"),
        telefono_contacto: document.getElementById("telefono_contacto")
    };

    const errores = {
        nombre: document.getElementById("error-nombre"),
        ciudad: document.getElementById("error-ciudad"),
        direccion: document.getElementById("error-direccion"),
        telefono_contacto: document.getElementById("error-telefono")
    };

    const estaVacio = val => val == null || String(val).trim() === "";

    const calcularErrorCampo = key => {
        const v = String(campos[key].value || "").trim();
        if (key === "nombre" || key === "ciudad") {
            if (estaVacio(v)) return "Este campo es obligatorio.";
            if (v.length < 3) return "Debe tener al menos 3 caracteres.";
        }
        if (key === "direccion") {
            if (estaVacio(v)) return "Este campo es obligatorio.";
            if (v.length < 5) return "Debe tener al menos 5 caracteres.";
        }
        if (key === "telefono_contacto") {
            if (estaVacio(v)) return "El teléfono es obligatorio.";
            if (!/^\d{9}$/.test(v)) return "El teléfono debe tener 9 dígitos.";
        }
        return "";
    };

    const validarCampoEnTiempoReal = key => {
        const msg = calcularErrorCampo(key);
        errores[key].textContent = msg;
        campos[key].classList.remove("is-valid", "is-invalid");
        if (msg) campos[key].classList.add("is-invalid");
        else if (!estaVacio(campos[key].value)) campos[key].classList.add("is-valid");
    };

    Object.keys(campos).forEach(key => {
        ["input", "change", "blur"].forEach(ev =>
            campos[key].addEventListener(ev, () => validarCampoEnTiempoReal(key))
        );
    });

    form.addEventListener("submit", e => {
        e.preventDefault();
        let valido = true;
        Object.keys(campos).forEach(key => {
            const msg = calcularErrorCampo(key);
            errores[key].textContent = msg;
            if (msg) valido = false;
        });

        // Actualizar clases
        Object.keys(campos).forEach(key => {
            campos[key].classList.remove("is-valid", "is-invalid");
            if (errores[key].textContent) campos[key].classList.add("is-invalid");
            else if (!estaVacio(campos[key].value)) campos[key].classList.add("is-valid");
        });

        if (valido) {
            //dispara evento custom para AJAX
            form.dispatchEvent(new CustomEvent("form-valid", { bubbles: true }));
        }
    });
});
