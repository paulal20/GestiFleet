document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("usuarioForm");
    if (!form) return;

    // Inicializamos objeto para guardar valores duplicados detectados por el servidor
    form.valoresVetados = {};

    // Detectamos si es modo edición
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
        // No borramos la alerta superior aquí para que el usuario la vea si la hubo
    }

    function calcularErrorCampo(key) {
        if (!campos[key]) return "";
        
        const v = String(campos[key].value || "").trim();

        // 1. COMPROBACIÓN DE VETADOS (NUEVO)
        // Si el valor actual coincide con el que el servidor dijo que estaba duplicado, devolvemos error.
        if (form.valoresVetados && form.valoresVetados[key] && form.valoresVetados[key] === v) {
            return "Este valor ya está registrado en el sistema.";
        }
        
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
                if (!/^[a-zA-Z0-9._%+-]+@(gestifleet\.es|gestifleet\.com)$/.test(v)) return "Formato de correo no válido (gestifleet.es/com).";
                return "";
            case "confemail":
                if (!isEditMode && campos.confemail) {
                    if (estaVacio(v)) return "Debes confirmar el correo.";
                    if (!/^[a-zA-Z0-9._%+-]+@(gestifleet\.es|gestifleet\.com)$/.test(v)) return "Formato de correo no válido.";
                    if (v !== (campos.email?.value || "").trim()) return "Los correos no coinciden.";
                }
                return "";
            case "contrasenya":
                if (!isEditMode) {
                    if (estaVacio(v)) return "La contraseña es obligatoria.";
                    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
                    if (!re.test(v)) return "Mín. 8 caracteres, mayúscula, número y símbolo.";
                } else {
                    if (!estaVacio(v)) {
                        const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
                        if (!re.test(v)) return "Mín. 8 caracteres, mayúscula, número y símbolo.";
                    }
                }
                return "";
            case "telefono":
                if (estaVacio(v)) return "El teléfono es obligatorio.";
                if (!/^[0-9]{9}$/.test(v)) return "Formato no válido (debe tener exactamente 9 dígitos).";
                return "";
            case "rol":
                if (estaVacio(v)) return "Debes seleccionar un rol.";
                return "";
            case "id_concesionario":
                const rolVal = document.getElementById("rol")?.value;
                if (rolVal === 'Empleado') {
                    if (estaVacio(v) || v === "0") return "Debes seleccionar un concesionario.";
                }
                return "";
            default: return "";
        }
    }

    function actualizarEstadoCampo(input, errorSpan) {
        if (!input) return;
        input.classList.remove("is-valid","is-invalid");
        
        if (errorSpan && errorSpan.textContent) {
            input.classList.add("is-invalid");
        } else if (!estaVacio(input.value)) {
            input.classList.add("is-valid");
        }
    }

    function validarCampoEnTiempoReal(key) {
        if (!campos[key]) return;
        
        const msg = calcularErrorCampo(key);
        if (errores[key]) errores[key].textContent = msg;
        
        actualizarEstadoCampo(campos[key], errores[key]);
        
        if (key === "email" && campos.confemail) validarCampoEnTiempoReal("confemail");
    }

    // Validación inicial (poner en verde lo que venga bien de base)
    Object.keys(campos).forEach(key => {
        if (!campos[key]) return;
        if (!estaVacio(campos[key].value)) {
            const msg = calcularErrorCampo(key);
            if (!msg) campos[key].classList.add("is-valid");
        }
        ["input","change","blur"].forEach(ev => campos[key].addEventListener(ev, () => validarCampoEnTiempoReal(key)));
    });

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
            if (!campos[key]) return;
            const msg = calcularErrorCampo(key);
            if(msg) {
                if(errores[key]) errores[key].textContent = msg;
                valido = false;
            }
        });

        Object.keys(campos).forEach(key => actualizarEstadoCampo(campos[key], errores[key]));

        if(valido) {
            form.dispatchEvent(new CustomEvent("form-valid", { bubbles: true }));
        }
    });
});