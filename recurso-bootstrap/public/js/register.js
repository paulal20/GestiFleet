document.addEventListener("DOMContentLoaded", function(){
    const form = document.getElementById("registerForm");
    
    // Si ya existe en el HTML (ejs), lo usamos, si no, lo insertamos arriba
    const existingAlert = document.querySelector(".alert.alert-danger");
    if(existingAlert) {
        existingAlert.style.display = 'none'; 
    }

    if (form) {
        // Mapeo de campos
        const campos = {
            nombre: document.getElementById("nombre"),
            apellido1: document.getElementById("apellido1"),
            apellido2: document.getElementById("apellido2"),
            email: document.getElementById("email"),
            confemail: document.getElementById("confemail"),
            contrasenya: document.getElementById("contrasenya"),
            telefono: document.getElementById("telefono")
        };

        // Mapeo de spans de error
        const spansErrores = {
            nombre: document.getElementById("error-nombre"),
            apellido1: document.getElementById("error-apellido1"),
            apellido2: document.getElementById("error-apellido2"),
            email: document.getElementById("error-email"),
            confemail: document.getElementById("error-confemail"),
            contrasenya: document.getElementById("error-contrasenya"),
            telefono: document.getElementById("error-telefono")
        };

        const mostrarContrasenya = document.getElementById("mostrarContrasenya");

        // --- FUNCIONES DE UTILIDAD ---

        function limpiarErroresUI() {
            Object.values(spansErrores).forEach(span => {
                if (span) span.textContent = "";
            });
            Object.values(campos).forEach(input => {
                if(input) input.classList.remove("is-invalid");
            });
            
            const alert = document.querySelector(".alert.alert-danger");
            if (alert) {
                alert.textContent = "";
                alert.style.display = "none";
            }
        }

        let errorTimer; 

        function mostrarErrorGlobal(mensaje) {
            let alert = document.querySelector(".alert.alert-danger");
            if (!alert) {
                alert = document.createElement("div");
                alert.className = "alert alert-danger mt-2";
                alert.role = "alert";
                form.insertBefore(alert, form.firstChild);
            }
            
            alert.textContent = mensaje;
            alert.style.display = "block";
            alert.scrollIntoView({ behavior: 'smooth', block: 'center' });

            if (errorTimer) clearTimeout(errorTimer);
            errorTimer = setTimeout(() => {
                alert.style.display = "none";
            }, 5000); 
        }

        // ... (Tus funciones calcularErrorCampoLocal y validarCampoEnTiempoReal SE QUEDAN IGUAL) ...
        function estaVacio(val) { return val == null || String(val).trim() === ""; }

        function calcularErrorCampoLocal(key) {
             const input = campos[key];
             if (!input) return "";
             const v = String(input.value || "").trim();
 
             if (key === "nombre" || key === "apellido1") {
                 if (estaVacio(v)) return "Este campo es obligatorio.";
                 if (v.length < 3) return "Debe tener al menos 3 caracteres.";
             }
 
             if (key === "apellido2") {
                 if (v.length > 0 && v.length < 3) return "Debe tener al menos 3 caracteres.";
             }
 
             if (key === "email") {
                 if (estaVacio(v)) return "El email es obligatorio.";
                 const re = /^[a-zA-Z0-9._%+-]+@(gestifleet\.es|gestifleet\.com)$/;
                 if (!re.test(v)) return "El correo no tiene un formato válido (@gestifleet.es/com).";
             }
 
             if (key === "confemail") {
                 if (estaVacio(v)) return "Confirma tu correo.";
                 const emailOriginal = String(campos.email?.value || "").trim();
                 if (v !== emailOriginal) return "Los correos no coinciden.";
             }
 
             if (key === "contrasenya") {
                 if (estaVacio(v)) return "La contraseña es obligatoria.";
                 const contrasenyaForm = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
                 if (!contrasenyaForm.test(v)) return "Mín. 8 chars, 1 mayús, 1 minús, 1 num y 1 símbolo.";
             }
 
             if (key === "telefono") {
                 if (estaVacio(v)) return "El teléfono es obligatorio.";
                 if (!/^\d{9}$/.test(v)) return "Formato inválido. Solo 9 dígitos.";
             }
             return "";
        }

        function validarCampoEnTiempoReal(key) {
             const input = campos[key];
             const span = spansErrores[key];
             if (!input) return;
 
             const msg = calcularErrorCampoLocal(key);
 
             if (span) span.textContent = msg;
 
             input.classList.remove("is-valid", "is-invalid");
             if (msg) {
                 input.classList.add("is-invalid");
             } else if (!estaVacio(input.value)) {
                 input.classList.add("is-valid");
             }
 
             if (key === "email" && !estaVacio(campos.confemail?.value)) {
                 const confMsg = calcularErrorCampoLocal("confemail");
                 if (spansErrores["confemail"]) spansErrores["confemail"].textContent = confMsg;
                 const confInput = campos["confemail"];
                 confInput.classList.remove("is-valid", "is-invalid");
                 if (confMsg) confInput.classList.add("is-invalid");
                 else confInput.classList.add("is-valid");
             }
        }

        // --- EVENT LISTENERS ---
        Object.keys(campos).forEach(key => {
            const el = campos[key];
            if (!el) return;
            ['input', 'blur'].forEach(evt => {
                el.addEventListener(evt, () => validarCampoEnTiempoReal(key));
            });
        });

        if (mostrarContrasenya && campos.contrasenya) {
            mostrarContrasenya.addEventListener("change", function () {
                campos.contrasenya.type = this.checked ? "text" : "password";
            });
        }

        // --- SUBMIT CON AJAX ---
        form.addEventListener("submit", async function (e) {
            e.preventDefault(); 
            limpiarErroresUI();

            // 1. Validación Local
            let hayErroresLocales = false;
            Object.keys(campos).forEach(key => {
                const msg = calcularErrorCampoLocal(key);
                if (msg) {
                    if (spansErrores[key]) spansErrores[key].textContent = msg;
                    if (campos[key]) campos[key].classList.add("is-invalid");
                    hayErroresLocales = true;
                }
            });

            if (hayErroresLocales) {
                mostrarErrorGlobal("Por favor, corrige los errores antes de enviar.");
                return; 
            }

            // 2. Datos
            const formData = {
                nombre: campos.nombre.value,
                apellido1: campos.apellido1.value,
                apellido2: campos.apellido2.value,
                email: campos.email.value,
                confemail: campos.confemail.value,
                contrasenya: campos.contrasenya.value,
                telefono: campos.telefono.value
            };

            // 3. Petición Fetch AJAX
            try {
                const btnSubmit = form.querySelector('button[type="submit"]');
                const textoOriginal = btnSubmit.innerHTML;
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = "Enviando...";

                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                btnSubmit.disabled = false;
                btnSubmit.innerHTML = textoOriginal;

                if (data.ok) {
                    // =========================================================
                    // CAMBIO AQUÍ: MOSTRAR MODAL EN VEZ DE REDIRIGIR DIRECTO
                    // =========================================================
                    
                    // Instanciar el modal de Bootstrap
                    // Asegúrate de que bootstrap.bundle.min.js esté cargado en tu layout
                    const modalElement = document.getElementById('modalExito');
                    if (modalElement && window.bootstrap) {
                        const modalExito = new bootstrap.Modal(modalElement);
                        modalExito.show();

                        // Configurar botón para ir al login
                        const btnLogin = document.getElementById('btnIrLogin');
                        btnLogin.addEventListener('click', () => {
                            window.location.href = '/login';
                        });
                        
                        // Opcional: Si cierran el modal de otra forma, también ir al login
                        modalElement.addEventListener('hidden.bs.modal', function () {
                            window.location.href = '/login';
                        });

                    } else {
                        // Fallback por si falla Bootstrap JS
                        alert("Registro completado. Tus funciones estarán limitadas hasta asignación.");
                        window.location.href = '/login';
                    }

                } else {
                    // ERRORES
                    if (data.error) {
                        mostrarErrorGlobal(data.error);
                    }

                    if (data.fieldErrors) {
                        Object.keys(data.fieldErrors).forEach(key => {
                            if (spansErrores[key]) spansErrores[key].textContent = data.fieldErrors[key];
                            if (campos[key]) {
                                campos[key].classList.add("is-invalid");
                                campos[key].classList.remove("is-valid");
                            }
                        });
                    }
                }

            } catch (error) {
                console.error("Error AJAX:", error);
                mostrarErrorGlobal("Ocurrió un error de conexión. Inténtalo de nuevo.");
                const btnSubmit = form.querySelector('button[type="submit"]');
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = "Enviar";
            }
        });

        // Reset
        form.addEventListener("reset", function () {
            setTimeout(() => {
                limpiarErroresUI();
                Object.values(campos).forEach(input => {
                    if(input) {
                        input.classList.remove("is-valid", "is-invalid");
                        input.value = "";
                    }
                });
            }, 10);
        });
    }
});