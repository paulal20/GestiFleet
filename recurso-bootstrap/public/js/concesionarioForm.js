document.addEventListener("DOMContentLoaded", function() {
    // 1. Apuntar al ID correcto del formulario
    const form = document.getElementById("concesionarioForm");

    if (form) {

        // 2. Definir los campos específicos de ESTE formulario
        const campos = {
            nombre: document.getElementById("nombre"),
            ciudad: document.getElementById("ciudad"),
            direccion: document.getElementById("direccion"),
            telefono_contacto: document.getElementById("telefono_contacto")
        };

        // 3. Definir los spans de error de ESTE formulario
        const errores = {
            nombre: document.getElementById("error-nombre"),
            ciudad: document.getElementById("error-ciudad"),
            direccion: document.getElementById("error-direccion"),
            telefono_contacto: document.getElementById("error-telefono")
        };

        // 4. Calcular el total de campos (todos son 'required')
        let totalCampos = Object.values(campos).filter(el => el && el.required).length;

        function limpiarErrores() {
            Object.values(errores).forEach(span => {
                if (span) span.textContent = "";
            });
        }

        function estaVacio(val) {
            return val == null || String(val).trim() === "";
        }

        // 5. Definir las reglas de validación para ESTOS campos
        function calcularErrorCampo(key) {
            const input = campos[key];
            if (!input) return "";

            const v = String(input.value || "").trim();

            // Regla para nombre y ciudad
            if (key === "nombre" || key === "ciudad") {
                if (estaVacio(v)) {
                    return "Este campo es obligatorio.";
                }
                if (v.length < 3) {
                    return "Debe tener al menos 3 caracteres.";
                }
                return "";
            }

            // Regla para dirección
            if (key === "direccion") {
                if (estaVacio(v)) {
                    return "Este campo es obligatorio.";
                }
                if (v.length < 5) {
                    return "Debe tener al menos 5 caracteres.";
                }
                return "";
            }

            // Regla para teléfono
            if (key === "telefono_contacto") {
                if (estaVacio(v)) {
                    return "El teléfono es obligatorio.";
                }
                // Expresión regular simple (ej: 9 dígitos)
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
            const initValid = Array.isArray(window.initialValidFields) ? window.initialValidFields : [];
            const initFieldErrors = (window.initialFieldErrors && typeof window.initialFieldErrors === 'object') ? window.initialFieldErrors : {};

            Object.keys(campos).forEach(key => {
                const input = campos[key];
                const span = errores[key];

                if (initValid.includes(key)) {
                if (span) span.textContent = "";
                if (input) {
                    input.classList.add("is-valid");
                }
                } else {
                // campo no válido => borrar valor (el servidor ya lo dejó vacío)
                if (input) {
                    input.value = '';
                    input.classList.remove("is-valid", "is-invalid");
                }
                if (span) {
                    span.textContent = initFieldErrors[key] || "";
                    if (span.textContent && input) input.classList.add("is-invalid");
                }
                }
            });
        }

        // 6. Asignar los listeners (sin la barra de progreso)
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

        // 7. Lógica del Submit
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

        // 8. Lógica del Reset (sin la barra de progreso)
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