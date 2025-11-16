document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("usuarioForm");

    if (!form) return;

    const isEditMode = form.dataset.editmode === 'true';

    const campos = {
        nombre: document.getElementById("nombre"),
        apellido1: document.getElementById("apellido1"),
        apellido2: document.getElementById("apellido2"),
        email: document.getElementById("email"),
        confemail: document.getElementById("confemail"), 
        contrasenya: document.getElementById("contrasenya"),
        telefono: document.getElementById("telefono"),
        rol: document.getElementById("rol"),
        id_concesionario: document.getElementById("id_concesionario")
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

    function limpiarErrores() {
        Object.values(errores).forEach(span => {
            if(span) span.textContent = "";
        });
    }

    function estaVacio(valor) {
        return valor == null || String(valor).trim() === "";
    }

    function calcularErrorCampo(key) {
        const input = campos[key];
        if (!input) return ""; 

        const v = String(input.value || "").trim();

        switch(key) {
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
                if (estaVacio(v)) return "Debes confirmar el correo.";
                if (!/^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(v)) return "Formato de correo no válido.";
                if (v !== String(campos.email?.value || "").trim()) return "Los correos no coinciden.";
                return "";

            case "contrasenya":
                if (!estaVacio(v)) {
                    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
                    if (!re.test(v)) return "Mín. 8 caracteres, mayúscula, número y símbolo.";
                } else if (!isEditMode) {
                    return "La contraseña es obligatoria.";
                }
                return "";

            case "telefono":
                if (!estaVacio(v) && !/^[0-9]{9,15}$/.test(v)) return "Formato no válido. Solo números (9-15 dígitos).";
                return "";

            case "rol":
                if (estaVacio(v)) return "Debes seleccionar un rol.";
                return "";

            case "id_concesionario":
                if (estaVacio(v) || v === "0") return "Debes seleccionar un concesionario.";
                return "";

            default:
                return "";
        }
    }

    function actualizarEstadoCampo(input, errorSpan) {
        if(!input) return;
        input.classList.remove("is-valid", "is-invalid");

        const msg = errorSpan ? errorSpan.textContent : '';
        if (msg && msg.trim() !== "") {
            input.classList.add("is-invalid");
        } else if (!estaVacio(input.value)) {
            if (input.type === 'password' && isEditMode && estaVacio(input.value)) {
            } else {
                input.classList.add("is-valid");
            }
        }
    }

    function validarCampoEnTiempoReal(key) {
        const input = campos[key];
        const span = errores[key];
        if (!input) return;

        const msg = calcularErrorCampo(key);
        if (span) span.textContent = msg;

        actualizarEstadoCampo(input, span);

        if (key === "email" && campos.confemail) {
            validarCampoEnTiempoReal("confemail");
        }
    }

    function validarCamposIniciales() {
        Object.keys(campos).forEach(key => {
            const input = campos[key];
            if (input && !estaVacio(input.value)) {
                validarCampoEnTiempoReal(key);
            }
        });
    }


    Object.keys(campos).forEach(key => {
        const el = campos[key];
        if (!el) return;
        el.addEventListener("input", () => validarCampoEnTiempoReal(key));
        el.addEventListener("change", () => validarCampoEnTiempoReal(key));
        el.addEventListener("blur", () => validarCampoEnTiempoReal(key));
    });

    if (mostrarContrasenya && campos.contrasenya) {
        mostrarContrasenya.addEventListener("change", function () {
            campos.contrasenya.type = this.checked ? "text" : "password";
        });
    }

    form.addEventListener("submit", function(e){
        e.preventDefault();
        limpiarErrores();

        let valido = true;
        Object.keys(campos).forEach(key => {
            if (campos[key]) {
                const msg = calcularErrorCampo(key);
                if(msg) {
                    if (errores[key]) errores[key].textContent = msg;
                    valido = false;
                }
            }
        });

        Object.keys(campos).forEach(key => {
            if (campos[key]) {
                actualizarEstadoCampo(campos[key], errores[key]);
            }
        });

        if(valido) {
            form.submit();
        } else {
            const primeraClaveInvalida = Object.keys(campos).find(k => errores[k] && errores[k].textContent);
            if(primeraClaveInvalida && campos[primeraClaveInvalida]) {
                campos[primeraClaveInvalida].focus();
            }
        }
    });

    form.addEventListener("reset", function(){
        setTimeout(() => {
            Object.values(campos).forEach(input => input?.classList.remove("is-valid","is-invalid"));
            Object.values(errores).forEach(span => { if(span) span.textContent = ""; });
        }, 0);
    });

    validarCamposIniciales();
});