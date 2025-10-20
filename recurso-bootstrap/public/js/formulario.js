document.addEventListener("DOMContentLoaded", function(){
    const form = document.getElementById("revistaForm");

    const campos = {
        nombre: document.getElementById("nombre"),
        apellido1: document.getElementById("apellido1"),
        apellido2: document.getElementById("apellido2"),
        email: document.getElementById("email"),
        contrasenya: document.getElementById("contrasenya"),
        vehiculo: document.getElementById("vehiculo"),
        fechaInicio: document.getElementById("fechaInicio"),
        fechaFin: document.getElementById("fechaFin"),
        duracion: document.getElementById("duracion")
    };

    const errores = {
        nombre: document.getElementById("error-nombre"),
        apellido1: document.getElementById("error-apellido1"),
        apellido2: document.getElementById("error-apellido2"),
        email: document.getElementById("error-email"),
        contrasenya: document.getElementById("error-contrasenya"),
        vehiculo: document.getElementById("error-vehiculo"),
        fechaInicio: document.getElementById("error-fecha-inicio"),
        fechaFin: document.getElementById("error-fecha-fin"),
        duracion: document.getElementById("error-duracion")
    };

    function limpiarErrores() {
        Object.values(errores).forEach(span => {
            if (span) {
                span.textContent = "";
            }
        });
    }

    form.addEventListener("submit", function (e){
        e.preventDefault(); //evitamos que se envíe el doc si hay errores
        limpiarErrores();

        let valido = true;

        if (!campos.nombre.value.trim()){
            errores.nombre.textContent = "El nombre es obligatorio.";
            valido = false;
        } else if(campos.nombre.value.trim().length < 3){
            errores.nombre.textContent = "El nombre debe tener al menos 3 caracteres.";
            valido = false;
        }

        if (!campos.apellido1.value.trim()){
            errores.apellido1.textContent = "El primer apellido es obligatorio.";
            valido = false;
        } else if(campos.apellido1.value.trim().length < 3){
            errores.apellido1.textContent = "El primer apellido debe tener al menos 3 caracteres.";
            valido = false;
        }

        const emailForm = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!campos.email.value.trim()){
            errores.email.textContent = "El email es obligatorio.";
            valido = false;
        } else if(!emailForm.test(campos.email.value.trim())){
            errores.email.textContent = "El correo no tiene un formato válido.";
            valido = false;
        }

        const contrasenyaForm = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if(!campos.contrasenya.value.trim()){
            errores.contrasenya.textContent = "La contraseña es obligatoria";
            valido = false;
        } else if(!contrasenyaForm.test(campos.contrasenya.value.trim())){ //locura meter el error específico, si es menor de 8, si no tiene mayúscula, etc...
            errores.contrasenya.textContent = "La contraseña no tiene un formato válido";
            valido = false;
        }

        if(!campos.vehiculo.value){
            errores.vehiculo.textContent = "Debes seleccionar un tipo de vehículo.";
            valido = false;
        }

        if(campos.fechaInicio.value.trim()){
            const fechaActual = new Date();
            const fechaDatos = new Date(campos.fechaInicio.value);

            if(fechaDatos < fechaActual) {
                errores.fechaInicio.textContent = "La fecha y hora introducidas deben ser posteriores a la presente.";
                valido = false;
            }
        } else {
            errores.fechaInicio.textContent = "La fecha y hora de inicio son obligatorias.";
            valido = false;
        }

        if(campos.duracion.value < 0){
            errores.duracion.textContent = "La duración debe ser mayor a 0."
            valido = false;
        }

        actualizarTodos();

        if (valido) {
            alert("Formulario enviado correctamente.");
            form.submit();
        }

    });

    
    form.addEventListener("reset", function () {
        setTimeout(() => {
            Object.values(campos).forEach(input => {
            if (input) input.classList.remove("is-valid", "is-invalid");
            });

            Object.values(errores).forEach(span => { if (span) span.textContent = ""; });
        }, 0);
    });





    // ---------- Inicio: actualización visual mínima (pegar dentro de DOMContentLoaded) ----------
    // ---------- Inicio: actualización visual mínima (REEMPLAZAR la versión anterior) ----------
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

    // 1) validación visual en tiempo real:
    // añadimos listeners 'input' y también 'change' para selects / datetime / number
    Object.keys(campos).forEach(key => {
        const el = campos[key];
        if (!el) return;

        // siempre escuchar 'input' (funciona para text, email, number, etc.)
        el.addEventListener("input", () => {
            // si quieres que al escribir se borre automáticamente el mensaje de error,
            // descomenta la siguiente línea:
            if (errores[key]) errores[key].textContent = "";
            actualizarEstadoCampo(el, errores[key]);
        });

        // además escuchar 'change' para <select>, datetime-local y para cubrir casos en que 'input' no se dispare
        el.addEventListener("change", () => {
            actualizarEstadoCampo(el, errores[key]);
        });

        // opcional: escuchar blur para recalcular al salir del campo
        el.addEventListener("blur", () => {
            actualizarEstadoCampo(el, errores[key]);
        });
    });


});