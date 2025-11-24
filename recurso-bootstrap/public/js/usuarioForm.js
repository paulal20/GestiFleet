document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("usuarioForm");
    if (!form) return;

    const isEditMode = form.dataset.editmode === "true";

    const campos = {
        nombre: document.getElementById("nombre"),
        apellido1: document.getElementById("apellido1"),
        apellido2: document.getElementById("apellido2"),
        email: document.getElementById("email"),
        confemail: document.getElementById("confemail"),
        contrasenya: document.getElementById("contrasenya"),
        telefono: document.getElementById("telefono"),
        rol: document.getElementById("rol"),
        id_concesionario: document.getElementById("id_concesionario"),
        preferencias_accesibilidad: document.getElementById("preferencias_accesibilidad")
    };

    const errores = {
        nombre: document.getElementById("error-nombre"),
        apellido1: document.getElementById("error-apellido1"),
        apellido2: document.getElementById("error-apellido2"),
        email: document.getElementById("error-email"),
        confemail: document.getElementById("error-confemail"),
        contrasenya: document.getElementById("error-contrasenya"),
        telefono: document.getElementById("error-telefono"),
        rol: document.getElementById("error-rol"),
        id_concesionario: document.getElementById("error-id_concesionario")
    };

    function estaVacio(val) { return val == null || String(val).trim() === ""; }

    function limpiarErrores() {
        Object.values(errores).forEach(span => { if(span) span.textContent = ""; });
        document.querySelectorAll(".alert").forEach(el => el.remove());
    }

    function calcularErrorCampo(key) {
        const v = campos[key] ? String(campos[key].value || "").trim() : "";
        switch (key) {
            case "nombre":
            case "apellido1":
                if (estaVacio(v)) return "Este campo es obligatorio.";
                if (v.length < 3) return "Debe tener al menos 3 caracteres.";
                return "";
            case "apellido2":
                if (!estaVacio(v) && v.length < 3) return "Debe tener al menos 3 caracteres.";
                return "";
            case "email":
                if (estaVacio(v)) return "El correo es obligatorio.";
                if (!/^[a-zA-Z0-9._%+-]+@(gestifleet\.es|gestifleet\.com)$/.test(v)) return "Formato de correo no válido.";
                return "";
            case "confemail":
                if (!isEditMode) {
                    if (estaVacio(v)) return "Debes confirmar el correo.";
                    if (v !== (campos.email?.value || "").trim()) return "Los correos no coinciden.";
                }
                return "";
            case "contrasenya":
                if (!isEditMode || !estaVacio(v)) {
                    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
                    if (!estaVacio(v) && !re.test(v)) return "Mín. 8 caracteres, mayúscula, número y símbolo.";
                    if (!isEditMode && estaVacio(v)) return "La contraseña es obligatoria.";
                }
                return "";
            case "telefono":
                if (!estaVacio(v) && !/^[0-9]{9,15}$/.test(v)) return "Formato no válido (9-15 dígitos).";
                return "";
            case "rol":
                if (estaVacio(v)) return "Debes seleccionar un rol.";
                return "";
            case "id_concesionario":
                if (campos.id_concesionario && (estaVacio(v) || v === "0")) return "Debes seleccionar un concesionario.";
                return "";
            default: return "";
        }
    }

    function actualizarEstadoCampo(input, errorSpan) {
        if (!input) return;
        input.classList.remove("is-valid","is-invalid");
        if (errorSpan && errorSpan.textContent) input.classList.add("is-invalid");
        else if (!estaVacio(input.value)) input.classList.add("is-valid");
    }

    function validarCampoEnTiempoReal(key) {
        if (!campos[key]) return;
        if (errores[key]) errores[key].textContent = calcularErrorCampo(key);
        actualizarEstadoCampo(campos[key], errores[key]);
        if (key === "email") validarCampoEnTiempoReal("confemail");
    }

    Object.keys(campos).forEach(key => {
        if (!campos[key]) return;
        ["input","change","blur"].forEach(ev => campos[key].addEventListener(ev, () => validarCampoEnTiempoReal(key)));
    });

    // Mostrar contraseña
    const mostrarContrasenya = document.getElementById("mostrarContrasenya");
    if (mostrarContrasenya && campos.contrasenya) {
        mostrarContrasenya.addEventListener("change", function(){
            campos.contrasenya.type = this.checked ? "text" : "password";
        });
    }

    form.addEventListener("submit", function(e){
        e.preventDefault();
        limpiarErrores();

        let valido = true;
        Object.keys(campos).forEach(key => {
            const msg = calcularErrorCampo(key);
            if(msg) {
                if(errores[key]) errores[key].textContent = msg;
                valido = false;
            }
        });

        Object.keys(campos).forEach(key => actualizarEstadoCampo(campos[key], errores[key]));

        if(valido) form.dispatchEvent(new CustomEvent("form-valid", { bubbles: true }));
    });
});
