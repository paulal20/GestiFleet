document.addEventListener("DOMContentLoaded", function(){
    const form = document.getElementById("loginForm");

    if (form) {

        const campos = {
            email: document.getElementById("email"),
            contrasenya: document.getElementById("contrasenya")
        };

        const errores = {
            email: document.getElementById("error-email"),
            contrasenya: document.getElementById("error-contrasenya")
        };

        const mostrarContrasenya = document.getElementById("mostrarContrasenya");

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

            if (key === "email") {
                if (estaVacio(v)) {
                    return "El email es obligatorio.";
                }
                const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!re.test(v)) {
                    return "El correo no tiene un formato válido.";
                }
                return "";
            }   

            if (key === "contrasenya") {
                if (estaVacio(v)) {
                    return "La contraseña es obligatoria.";
                }
                const contrasenyaForm = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
                if (!contrasenyaForm.test(v)) {
                    return "La contraseña debe tener mín. 8 caracteres, una mayúscula, un número y un símbolo.";
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

        Object.keys(campos).forEach(key => {
            const el = campos[key];
            if (!el) return;

            el.addEventListener("input", () => {
                validarCampoEnTiempoReal(key);
            });

            el.addEventListener("change", () => {
                validarCampoEnTiempoReal(key);
            });

            el.addEventListener("blur", () => {
                validarCampoEnTiempoReal(key);
            });
        });

        if (mostrarContrasenya && campos.contrasenya) {
            mostrarContrasenya.addEventListener("change", function () {
                campos.contrasenya.type = this.checked ? "text" : "password";
            });
        }

        form.addEventListener("submit", function (e){
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
                console.log("Formulario válido. Enviando...");
                
                alert("Formulario enviado correctamente.");
                form.submit();
            } else {
                const primeraClaveInvalida = Object.keys(campos).find(k => errores[k] && errores[k].textContent);
                if (primeraClaveInvalida && campos[primeraClaveInvalida]) {
                    campos[primeraClaveInvalida].focus();
                }
            }
        });

        form.addEventListener("reset", function () {
            if (form) {
                setTimeout(() => {
                    Object.values(campos).forEach(input => {
                        if (input) input.classList.remove("is-valid", "is-invalid");
                    });

                    Object.values(errores).forEach(span => { if (span) span.textContent = ""; });
                    if (campos.contrasenya) campos.contrasenya.type = "password";
                    if (mostrarContrasenya) mostrarContrasenya.checked = false;
                    
                }, 0);
            }
        });
    }
});
