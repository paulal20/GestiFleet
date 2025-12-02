document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("usuarioForm");
    if (!form) return;

    // Detectamos si es modo edición comprobando el atributo del form o la URL
    // Usamos el atributo data que pusiste en el EJS: data-editmode
    const isEditMode = form.dataset.editmode === "true";

    const campos = {
        nombre: document.getElementById("nombre"),
        apellido1: document.getElementById("apellido1"),
        apellido2: document.getElementById("apellido2"),
        email: document.getElementById("email"),
        confemail: document.getElementById("confemail"),
        contrasenya: document.getElementById("contrasenya"),
        telefono: document.getElementById("telefono"),
        rol: document.getElementById("rol"),
        id_concesionario: document.getElementById("id_concesionario"),
        preferencias_accesibilidad: document.getElementById("preferencias_accesibilidad")
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

    function estaVacio(val) { return val == null || String(val).trim() === ""; }

    function limpiarErrores() {
        Object.values(errores).forEach(span => { if(span) span.textContent = ""; });
        document.querySelectorAll(".alert").forEach(el => el.remove());
    }

    function calcularErrorCampo(key) {
        // Si el elemento no existe en el DOM (por ejemplo, id_concesionario al editar admin), no hay error.
        if (!campos[key]) return "";
        
        const v = String(campos[key].value || "").trim();
        
        switch (key) {
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
                if (!/^[a-zA-Z0-9._%+-]+@(gestifleet\.es|gestifleet\.com)$/.test(v)) return "Formato de correo no válido (gestifleet.es/com).";
                return "";
            case "confemail":
                // Si estamos en Edit Mode, confemail puede que no exista en el DOM.
                if (!isEditMode && campos.confemail) {
                    if (estaVacio(v)) return "Debes confirmar el correo.";
                    if (!/^[a-zA-Z0-9._%+-]+@(gestifleet\.es|gestifleet\.com)$/.test(v)) return "Formato de correo no válido.";
                    if (v !== (campos.email?.value || "").trim()) return "Los correos no coinciden.";
                }
                return "";
            case "contrasenya":
                // En modo edición es opcional
                if (!isEditMode) {
                    if (estaVacio(v)) return "La contraseña es obligatoria.";
                    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
                    if (!re.test(v)) return "Mín. 8 caracteres, mayúscula, número y símbolo.";
                } else {
                    // Si escribe algo en edit mode, lo validamos
                    if (!estaVacio(v)) {
                        const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
                        if (!re.test(v)) return "Mín. 8 caracteres, mayúscula, número y símbolo.";
                    }
                }
                return "";
            case "telefono":
                // Teléfono es opcional, pero si se pone debe tener formato correcto
                if (!estaVacio(v) && !/^[0-9]{9,15}$/.test(v)) return "Formato no válido (9-15 dígitos).";
                return "";
            case "rol":
                if (estaVacio(v)) return "Debes seleccionar un rol.";
                return "";
            case "id_concesionario":
                // Solo validamos si existe el campo en el DOM y el rol seleccionado es Empleado
                // (Aunque la lógica de negocio dice que solo empleados necesitan concesionario,
                // aquí validamos si el campo está visible y requiere selección).
                // Nota: campos.id_concesionario puede ser null si no se renderizó.
                if (campos.id_concesionario && (estaVacio(v) || v === "0")) return "Debes seleccionar un concesionario.";
                return "";
            default: return "";
        }
    }

    function actualizarEstadoCampo(input, errorSpan) {
        if (!input) return;
        input.classList.remove("is-valid","is-invalid");
        
        // Si hay mensaje de error, rojo
        if (errorSpan && errorSpan.textContent) {
            input.classList.add("is-invalid");
        } 
        // Si no hay error y NO está vacío, verde.
        // (Excepción: en edit mode, contraseña vacía es válida pero no la ponemos verde para no confundir, o sí, según gusto)
        else if (!estaVacio(input.value)) {
            input.classList.add("is-valid");
        }
    }

    function validarCampoEnTiempoReal(key) {
        if (!campos[key]) return;
        
        const msg = calcularErrorCampo(key);
        if (errores[key]) errores[key].textContent = msg;
        
        actualizarEstadoCampo(campos[key], errores[key]);
        
        // Si cambia email, revalidar confirmación
        if (key === "email" && campos.confemail) validarCampoEnTiempoReal("confemail");
    }

    // --- NUEVO: Validación inicial en carga (verde si ok) ---
    // Recorremos todos los campos. Si tienen valor y son válidos, los ponemos en verde.
    // Si están vacíos o inválidos, NO mostramos error todavía (para no molestar al entrar).
    Object.keys(campos).forEach(key => {
        if (!campos[key]) return;
        
        // Verificamos si tiene valor
        if (!estaVacio(campos[key].value)) {
            const msg = calcularErrorCampo(key);
            // Solo si NO hay error, pintamos verde. Si hay error, no pintamos rojo aún (usuario no ha tocado).
            if (!msg) {
                campos[key].classList.add("is-valid");
            }
        }
        
        // Listeners para validación en tiempo real
        ["input","change","blur"].forEach(ev => campos[key].addEventListener(ev, () => validarCampoEnTiempoReal(key)));
    });

    // Mostrar contraseña
    const mostrarContrasenya = document.getElementById("mostrarContrasenya");
    if (mostrarContrasenya && campos.contrasenya) {
        mostrarContrasenya.addEventListener("change", function(){
            campos.contrasenya.type = this.checked ? "text" : "password";
        });
    }

    // Evento Submit
    form.addEventListener("submit", function(e){
        e.preventDefault();
        limpiarErrores();

        let valido = true;
        Object.keys(campos).forEach(key => {
            // Si el campo no existe en el DOM (ej. id_concesionario oculto), saltar
            if (!campos[key]) return;

            const msg = calcularErrorCampo(key);
            if(msg) {
                if(errores[key]) errores[key].textContent = msg;
                valido = false;
            }
        });

        // Actualizar colores
        Object.keys(campos).forEach(key => actualizarEstadoCampo(campos[key], errores[key]));

        if(valido) {
            form.dispatchEvent(new CustomEvent("form-valid", { bubbles: true }));
        }
    });
});