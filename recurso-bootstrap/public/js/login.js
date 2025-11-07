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

    const modalOlvido = document.getElementById('modalOlvidoPassword');
    const modalForm = document.getElementById('formOlvidoPassword');
    const modalEmailInput = document.getElementById('email-reset');
    const modalErrorSpan = document.getElementById('error-email-reset');
    const modalGeneralError = document.getElementById('error-modal-general');
    const modalSubmitBtn = document.getElementById('btnEnviarEnlaceModal');

    if (modalOlvido && modalForm && modalEmailInput && modalErrorSpan && modalGeneralError && modalSubmitBtn) {

        function validarEmailModal() {
            if (typeof estaVacio === 'undefined') {
                 window.estaVacio = (val) => val == null || String(val).trim() === "";
            }

            const v = String(modalEmailInput.value || "").trim();
            if (estaVacio(v)) {
                return "El email es obligatorio.";
            }
            const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!re.test(v)) {
                return "El correo no tiene un formato válido.";
            }
            return "";
        }

        modalEmailInput.addEventListener('input', () => {
            const errorMsg = validarEmailModal();
            modalErrorSpan.textContent = errorMsg;
            modalEmailInput.classList.remove('is-valid', 'is-invalid');
            
            if (errorMsg) {
                modalEmailInput.classList.add('is-invalid');
            } else if (!estaVacio(modalEmailInput.value)) {
                modalEmailInput.classList.add('is-valid');
            }
            modalGeneralError.classList.add('d-none');
        });

        modalSubmitBtn.addEventListener('click', async function() {
            const errorMsg = validarEmailModal();
            modalEmailInput.classList.remove('is-valid', 'is-invalid');
            modalGeneralError.classList.add('d-none'); 

            if (errorMsg) {
                modalErrorSpan.textContent = errorMsg;
                modalEmailInput.classList.add('is-invalid');
                modalEmailInput.focus();
                return; 
            }

            modalErrorSpan.textContent = "";
            modalEmailInput.classList.add('is-valid');
            
            const email = modalEmailInput.value.trim();

            try {
                const response = await fetch('/check-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: email })
                });

                const data = await response.json();

                if (response.ok && data.exists) {
                    console.log("Email encontrado. Redirigiendo...");
                    window.location.href = '/'; 
                } else {
                    modalGeneralError.textContent = data.message || "El correo electrónico no se encuentra registrado.";
                    modalGeneralError.classList.remove('d-none'); 
                    modalEmailInput.classList.add('is-invalid');
                }

            } catch (error) {
                console.error('Error al verificar el email:', error);
                
                if (!response) {
                    modalGeneralError.textContent = "Error de conexión. Inténtalo de nuevo.";
                    modalGeneralError.classList.remove('d-none');
                }
            }
        });

        modalOlvido.addEventListener('hidden.bs.modal', function () {
            modalEmailInput.value = "";
            modalEmailInput.classList.remove('is-valid', 'is-invalid');
            modalErrorSpan.textContent = "";
            modalGeneralError.classList.add('d-none');
            modalGeneralError.textContent = "";
        });
    }

});
