document.addEventListener("DOMContentLoaded", function(){
    const form = document.getElementById("registerForm");

    if (form) {

        const campos = {
            nombre: document.getElementById("nombre"),
            apellido1: document.getElementById("apellido1"),
            apellido2: document.getElementById("apellido2"),
            email: document.getElementById("email"),
            confemail: document.getElementById("confemail"),
            contrasenya: document.getElementById("contrasenya"),
            concesionario: document.getElementById("concesionario"),
            telefono: document.getElementById("telefono")
        };

        const errores = {
            nombre: document.getElementById("error-nombre"),
            apellido1: document.getElementById("error-apellido1"),
            apellido2: document.getElementById("error-apellido2"),
            email: document.getElementById("error-email"),
            confemail: document.getElementById("error-confemail"),
            contrasenya: document.getElementById("error-contrasenya"),
            concesionario: document.getElementById("error-concesionario"),
            telefono: document.getElementById("error-telefono")
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

            if (key === "nombre" || key === "apellido1") {
                if (estaVacio(v)) {
                    return "Este campo es obligatorio.";
                }
                if (v.length < 3) {
                    return "Debe tener al menos 3 caracteres.";
                }
                return "";
            }

            if (key == "apellido2"){
                if(v.length != 0) {
                    if (v.length < 3) {
                        return "Debe tener al menos 3 caracteres.";
                    }
                }
                return "";
            }

            if (key === "email") {
                if (estaVacio(v)) {
                    return "El email es obligatorio.";
                }
                const re = /^[a-zA-Z0-9._%+-]+@(gestifleet\.es|gestifleet\.com)$/;
                if (!re.test(v)) {
                    return "El correo no tiene un formato válido (@gestifleet.es/com).";
                }
                return "";
            }   

            if(key === "confemail") {
                if (estaVacio(v)) {
                    return "El email es obligatorio.";
                }
                const re = /^[a-zA-Z0-9._%+-]+@(gestifleet\.es|gestifleet\.com)$/;
                if (!re.test(v)) {
                    return "El correo no tiene un formato válido (@gestifleet.es/com).";
                }
                const emailOriginal = String(campos.email?.value || "").trim();
                if (v !== emailOriginal) {
                    return "Los correos no coinciden.";
                }
                return "";
            }

            if (key === "contrasenya") {
                if (estaVacio(v)) {
                    return "La contraseña es obligatoria.";
                }
                const contrasenyaForm = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
                if (!contrasenyaForm.test(v)) {
                    return "La contraseña debe tener mín. 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.";
                }
                return "";
            }

            if (key === "concesionario") {
                if (!v) return "Debes seleccionar un concesionario.";
                return "";
            }

            if (key === "telefono") {
                if (estaVacio(v)) return "El teléfono es obligatorio.";
                const re = /^[0-9]{9,15}$/; 
                if (!re.test(v)) return "Formato de teléfono no válido. Solo números, 9-15 dígitos.";
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

            if (key === "email" && !estaVacio(campos.confemail?.value)) {
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
                        if (input) {
                            input.classList.remove("is-valid", "is-invalid");
                            
                            if (input.tagName === 'SELECT') {
                                input.selectedIndex = 0; 
                            } else {
                                input.value = "";
                            }
                        }
                    });
                    Object.values(errores).forEach(span => { if (span) span.textContent = ""; });
                    if (campos.contrasenya) campos.contrasenya.type = "password";
                    if (mostrarContrasenya) mostrarContrasenya.checked = false;
                    
                }, 0);
            }
        });

        validarCamposIniciales();

    }
});