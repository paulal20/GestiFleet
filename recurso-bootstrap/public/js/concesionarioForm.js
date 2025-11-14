document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("concesionarioForm");

    if (form) {

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

        function limpiarErrores() {
            Object.values(errores).forEach(span => {
                if (span) span.textContent = "";
            });
        }

        function estaVacio(val) {
            return val == null || String(val).trim() === "";
        }

        function calcularErrorCampo(key) {
            const input = campos[key];
            if (!input) return "";

            const v = String(input.value || "").trim();

            if (key === "nombre" || key === "ciudad") {
                if (estaVacio(v)) {
                    return "Este campo es obligatorio.";
                }
                if (v.length < 3) {
                    return "Debe tener al menos 3 caracteres.";
                }
                return "";
            }

            if (key === "direccion") {
                if (estaVacio(v)) {
                    return "Este campo es obligatorio.";
                }
                if (v.length < 5) {
                    return "Debe tener al menos 5 caracteres.";
                }
                return "";
            }

            if (key === "telefono_contacto") {
                if (estaVacio(v)) {
                    return "El teléfono es obligatorio.";
                }
                const re = /^\d{9}$/;
                if (!re.test(v)) {
                    return "El teléfono debe tener 9 dígitos.";
                }
                return "";
            }

            return "";
        }

        function actualizarEstadoCampo(input, errorSpan) {
            if (!input) return;
            input.classList.remove("is-valid", "is-invalid");

            if (errorSpan && errorSpan.textContent.trim() !== "") {
                input.classList.add("is-invalid");
            } else if (input.value != null && String(input.value).trim() !== "") {
                input.classList.add("is-valid");
            }
        }

        function actualizarTodos() {
            Object.keys(campos).forEach(key => {
                actualizarEstadoCampo(campos[key], errores[key]);
            });
        }

        function validarCampoEnTiempoReal(key) {
            const input = campos[key];
            const span = errores[key];
            if (!input) return;

            const msg = calcularErrorCampo(key);

            if (span) {
                span.textContent = msg;
            }

            input.classList.remove("is-valid", "is-invalid");
            if (msg) {
                input.classList.add("is-invalid");
            } else if (!estaVacio(input.value)) {
                input.classList.add("is-valid");
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

            const listener = () => {
                validarCampoEnTiempoReal(key);
            };

            el.addEventListener("input", listener);
            el.addEventListener("change", listener);
            el.addEventListener("blur", listener);
        });

        form.addEventListener("submit", function(e) {
            e.preventDefault();
            limpiarErrores();

            let valido = true;

            Object.keys(campos).forEach(key => {
                const mensaje = calcularErrorCampo(key);
                if (mensaje) {
                    if (errores[key]) errores[key].textContent = mensaje;
                    valido = false;
                }
            });

            actualizarTodos();

            if (valido) {
                console.log("Formulario de concesionario válido. Enviando...");
                form.submit();
            } else {
                const primeraClaveInvalida = Object.keys(campos).find(k => errores[k] && errores[k].textContent);
                if (primeraClaveInvalida && campos[primeraClaveInvalida]) {
                    campos[primeraClaveInvalida].focus();
                }
            }
        });

        form.addEventListener("reset", function() {
            if (form) {
                setTimeout(() => {
                    Object.values(campos).forEach(input => {
                        if (input) input.classList.remove("is-valid", "is-invalid");
                    });
                    Object.values(errores).forEach(span => { if (span) span.textContent = ""; });
                }, 0);
            }
        });

        validarCamposIniciales();
    }
});