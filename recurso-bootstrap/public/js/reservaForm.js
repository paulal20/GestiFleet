document.addEventListener("DOMContentLoaded", function(){
    const form = document.getElementById("revistaForm");

    if (form) {

        const campos = {
            vehiculo: document.getElementById("vehiculo"),
            fechaInicio: document.getElementById("fechaInicio"),
            fechaFin: document.getElementById("fechaFin"),
            condiciones: document.getElementById("condiciones")
        };

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
                const error = errores[key];
                if (!input) return;

                const esValido = input.classList.contains("is-valid");
                const esVacio = !input.value || String(input.value).trim() === "";
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
                if (!v) return "Debes seleccionar un tipo de vehículo.";
                return "";
            }

            if (key === "fechaInicio") {
                if (estaVacio(v)) return "La fecha y hora de inicio son obligatorias.";
                const fechaI = new Date(v);
                const ahora = new Date();
                if (isNaN(fechaI.getTime()) || fechaI <= ahora) {
                    return "La fecha y hora introducidas deben ser posteriores a la presente.";
                }

                const fechaFinInput = campos.fechaFin;
                if (!estaVacio(fechaFinInput.value)) {
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

                if (isNaN(fechaF.getTime()) || fechaF <= ahora) {
                    return "La fecha y hora introducidas deben ser posteriores a la presente.";
                }

                const fechaInicioInput = campos.fechaInicio;
                if (!estaVacio(fechaInicioInput.value)) {
                    const fechaInicioDatos = new Date(fechaInicioInput.value);
                    if (fechaF <= fechaInicioDatos) {
                        return "La fecha de fin debe ser posterior a la fecha de inicio.";
                    }
                }
                return "";
            }

            if (key === "condiciones") {
                if (!input.checked) {
                    return "Debes aceptar las condiciones.";
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
                // Comprobamos si el input existe y si su valor no está vacío
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
                    actualizarProgreso();
                }, 0);
            }
        });

        validarCamposIniciales();

        actualizarProgreso();
    }
});