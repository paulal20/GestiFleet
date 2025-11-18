document.addEventListener("DOMContentLoaded", function(){
    // Referencia al formulario principal (Español)
    const form = document.getElementById("revistaForm");
    
    // Referencias para el Modal
    const confirmBtn = document.getElementById('confirmarReservaBtn');
    const confirmacionModalEl = document.getElementById('confirmacionModal');
    let modalInstance = null;

    // Inicializamos la instancia del Modal de Bootstrap (asumiendo Bootstrap 5+)
    if (confirmacionModalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        modalInstance = new bootstrap.Modal(confirmacionModalEl);
    }

    if (form) {

        const campos = {
            vehiculo: document.getElementById("vehiculo"),
            fechaInicio: document.getElementById("fechaInicio"),
            fechaFin: document.getElementById("fechaFin"),
            condiciones: document.getElementById("condiciones")
        };

        // LISTA DE ERRORES COMPLETA Y CORRECTA
        const errores = {
            vehiculo: document.getElementById("error-vehiculo"),
            fechaInicio: document.getElementById("error-fecha-inicio"),
            fechaFin: document.getElementById("error-fecha-fin"),
            condiciones: document.getElementById("error-condiciones")
        };

        const barraProgreso = document.getElementById("formProgress");
        const textoProgreso = document.getElementById("progressPercent");

        let totalCampos = Object.values(campos).filter(el => el && el.required).length;

        const opcionalesActivos = new Set();

        function actualizarProgreso() {
            let validos = 0;

            Object.keys(campos).forEach(key => {
                const input = campos[key];
                // Quitamos la referencia a 'error' aquí ya que no se usa.
                if (!input) return;

                const esValido = input.classList.contains("is-valid");
                const esVacio = (input.type !== 'checkbox') ? (!input.value || String(input.value).trim() === "") : !input.checked;
                const esOpcional = !input.required;

                if (esOpcional && !esVacio) {
                    opcionalesActivos.add(key);
                }
                else if (esOpcional && esVacio) {
                    opcionalesActivos.delete(key);
                }

                if (esValido) validos++;
            });

            const totalDinamico = totalCampos + opcionalesActivos.size;

            const porcentaje = totalDinamico > 0 ? Math.round((validos / totalDinamico) * 100) : 0;
            if (barraProgreso) barraProgreso.value = porcentaje;
            if (textoProgreso) textoProgreso.textContent = porcentaje + "%";
        }


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

            if (key === "vehiculo") {
                if (!v) return "Debes seleccionar un vehículo."; // Corregido: 'tipo de vehículo' a 'vehículo'
                return "";
            }

            if (key === "fechaInicio") {
                if (estaVacio(v)) return "La fecha y hora de inicio son obligatorias.";
                const fechaI = new Date(v);
                const ahora = new Date();
                
                // Aseguramos que la fecha es válida y es en el futuro (dando un pequeño margen)
                if (isNaN(fechaI.getTime()) || fechaI.getTime() <= ahora.getTime() + 60000) { // +60s de margen
                    return "La fecha y hora introducidas deben ser posteriores a la presente.";
                }

                const fechaFinInput = campos.fechaFin;
                if (fechaFinInput && !estaVacio(fechaFinInput.value)) {
                    const fechaFinDatos = new Date(fechaFinInput.value);
                    if (fechaI >= fechaFinDatos) {
                        return "La fecha de inicio debe ser anterior a la fecha de fin.";
                    }
                }
                return "";
            }

            if (key === "fechaFin") {
                if (estaVacio(v)) return "La fecha y hora de fin son obligatorias.";
                const fechaF = new Date(v);
                const ahora = new Date();

                if (isNaN(fechaF.getTime()) || fechaF.getTime() <= ahora.getTime() + 60000) {
                    return "La fecha y hora introducidas deben ser posteriores a la presente.";
                }

                const fechaInicioInput = campos.fechaInicio;
                if (fechaInicioInput && !estaVacio(fechaInicioInput.value)) {
                    const fechaInicioDatos = new Date(fechaInicioInput.value);
                    if (fechaF <= fechaInicioDatos) {
                        return "La fecha de fin debe ser posterior a la fecha de inicio.";
                    }
                }
                return "";
            }

            if (key === "condiciones") {
                if (!input.checked) {
                    return "Debes aceptar los términos y condiciones.";
                }
                return "";
            }

            return "";
        }

        function actualizarEstadoCampo(input, errorSpan) {
            if (!input) return;
            input.classList.remove("is-valid", "is-invalid");

            // Si es un checkbox, validamos si está marcado
            if (input.type === 'checkbox') {
                 if (errorSpan && errorSpan.textContent.trim() !== "") {
                    input.classList.add("is-invalid");
                 } else if (input.checked) {
                    input.classList.add("is-valid");
                 }
                 return;
            }

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
            
            // Lógica duplicada de actualizarEstadoCampo para la reactividad en tiempo real
            input.classList.remove("is-valid", "is-invalid");
            if (msg) {
                input.classList.add("is-invalid");
            } else if (input.type !== 'checkbox' && !estaVacio(input.value)) {
                input.classList.add("is-valid");
            } else if (input.type === 'checkbox' && input.checked) {
                input.classList.add("is-valid");
            }
            // Disparamos la revalidación de la fecha opuesta si cambiamos una fecha
            if (key === "fechaInicio" && campos.fechaFin) {
                validarCampoEnTiempoReal("fechaFin");
            } else if (key === "fechaFin" && campos.fechaInicio) {
                validarCampoEnTiempoReal("fechaInicio");
            }
        }

        function validarCamposIniciales() {
            Object.keys(campos).forEach(key => {
                const input = campos[key];
                // Comprobamos si el input existe y si su valor no está vacío
                if (input && (input.type === 'checkbox' ? input.checked : !estaVacio(input.value))) {
                    validarCampoEnTiempoReal(key);
                }
            });
        }

        Object.keys(campos).forEach(key => {
            const el = campos[key];
            if (!el) return;

            el.addEventListener("input", () => {
                validarCampoEnTiempoReal(key);
                actualizarProgreso();
            });

            el.addEventListener("change", () => {
                validarCampoEnTiempoReal(key);
                actualizarProgreso();
            });

            el.addEventListener("blur", () => {
                validarCampoEnTiempoReal(key);
                actualizarProgreso();
            });
        });

        // ============================================================
        // MODIFICACIÓN CLAVE: INTERCEPTAR SUBMIT Y ABRIR MODAL
        // ============================================================
        form.addEventListener("submit", function (e){
            e.preventDefault(); // Detenemos el envío automático
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
                console.log("Formulario válido. Abriendo modal...");
                if (modalInstance) {
                    modalInstance.show(); // Abrir el modal en lugar de enviar
                } else {
                    form.submit(); // Fallback si el modal no se pudo inicializar
                }
            } else {
                const primeraClaveInvalida = Object.keys(campos).find(k => errores[k] && errores[k].textContent);
                if (primeraClaveInvalida && campos[primeraClaveInvalida]) {
                    campos[primeraClaveInvalida].focus();
                }
            }
        });

        // ============================================================
        // NUEVO LISTENER: BOTÓN CONFIRMAR EN MODAL
        // ============================================================
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function () {
                console.log("Confirmación recibida. Enviando formulario...");
                // Esto envía el formulario al action definido en el HTML: /reserva
                form.submit();
            });
        }

        form.addEventListener("reset", function () {
            if (form) {
                setTimeout(() => {
                    Object.values(campos).forEach(input => {
                        if (input) input.classList.remove("is-valid", "is-invalid");
                    });

                    Object.values(errores).forEach(span => { if (span) span.textContent = ""; });
                    actualizarProgreso();
                }, 0);
            }
        });

        validarCamposIniciales();
        actualizarProgreso();
    }
});