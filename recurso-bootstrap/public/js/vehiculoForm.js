/* public/js/vehiculoForm.js */

// Almacén para guardar valores que el servidor ha rechazado
let valoresInvalidosServidor = {};

// ==========================================
// 1. FUNCIONES AUXILIARES
// ==========================================
function obtenerCampos() {
    return {
      matricula: document.getElementById("matricula"),
      marca: document.getElementById("marca"),
      modelo: document.getElementById("modelo"),
      anyo_matriculacion: document.getElementById("anyo_matriculacion"),
      precio: document.getElementById("precio"),
      id_concesionario: document.getElementById("id_concesionario"),
      numero_plazas: document.getElementById("numero_plazas"),
      autonomia_km: document.getElementById("autonomia_km"),
      color: document.getElementById("color"),
      descripcion: document.getElementById("descripcion"),
      imagen: document.getElementById("imagen"),
    };
}

function estaVacio(val) {
    return val == null || String(val).trim() === "";
}

function calcularErrorCampo(key, campos) {
    const input = campos[key];
    if (!input) return "";
    const v = String(input.value || "").trim();

    // 1. NUEVO: Verificar si este valor específico fue rechazado por el servidor
    // Si lo que hay escrito es exactamente lo que el servidor rechazó, mantenemos el error.
    if (valoresInvalidosServidor[key] && valoresInvalidosServidor[key].valor === v) {
        return valoresInvalidosServidor[key].mensaje;
    }

    // 2. Validación estándar (Formato)
    switch (key) {
        case "matricula":
            if (estaVacio(v)) return "La matrícula es obligatoria.";
            if (!/^\d{4}[A-Z]{3}$/i.test(v)) return "Formato inválido (ej: 1234ABC).";
            break;
        case "marca":
        case "modelo":
            if (estaVacio(v)) return "Campo obligatorio.";
            if (v.length < 2) return "Mínimo 2 caracteres.";
            break;
        case "anyo_matriculacion":
            if (estaVacio(v)) return "Año obligatorio.";
            const year = parseInt(v, 10);
            const actual = new Date().getFullYear();
            if (isNaN(year) || year < 1900 || year > actual) return `Año entre 1900 y ${actual}.`;
            break;
        case "precio":
            if (estaVacio(v)) return "Precio obligatorio.";
            if (parseFloat(v) <= 0) return "Debe ser positivo.";
            break;
        case "id_concesionario":
            if (estaVacio(v) || v === "0") return "Seleccione un concesionario.";
            break;
        case "numero_plazas":
            if (!estaVacio(v)) {
                 const p = parseInt(v);
                 if (p < 1 || p > 9) return "Entre 1 y 9.";
            }
            break;
        case "autonomia_km":
             if (!estaVacio(v) && parseFloat(v) < 0) return "Debe ser positivo.";
             break;
        case "descripcion":
             if (!estaVacio(v) && (v.length < 10 || v.length > 500)) return "Entre 10 y 500 caracteres.";
             break;
    }
    return "";
}

function actualizarEstadoCampo(input, errorSpan) {
    if (!input) return;
    input.classList.remove("is-valid", "is-invalid");
    
    // Si hay mensaje de error, ponemos rojo
    if (errorSpan && errorSpan.textContent.trim() !== "") {
        input.classList.add("is-invalid");
    } 
    // Si no hay error Y tiene valor, ponemos verde
    else if (!estaVacio(input.value) && input.value !== "0") {
        input.classList.add("is-valid");
    }
}

// ==========================================
// 2. EXPORTAR VALIDACIÓN GLOBAL
// ==========================================
window.validarFormularioCompleto = function() {
    const form = document.getElementById("vehiculoForm");
    if (!form) return true;

    const campos = obtenerCampos();
    let valido = true;

    Object.keys(campos).forEach((key) => {
        const msg = calcularErrorCampo(key, campos);
        const errorSpan = document.getElementById(`error-${key}`);
        if (msg) {
            if(errorSpan) errorSpan.textContent = msg;
            valido = false;
        } else {
             if(errorSpan) errorSpan.textContent = "";
        }
        actualizarEstadoCampo(campos[key], errorSpan);
    });

    if (!valido) {
        const primerError = Object.keys(campos).find(k => {
             const span = document.getElementById(`error-${k}`);
             return span && span.textContent !== "";
        });
        if (primerError && campos[primerError]) campos[primerError].focus();
    }

    return valido;
};

// ==========================================
// 3. NUEVO: REGISTRAR ERROR DEL SERVIDOR (AJAX LO LLAMARÁ)
// ==========================================
window.registrarErrorServidor = function(campoId, mensaje) {
    const input = document.getElementById(campoId);
    if (!input) return;

    // Guardamos que "ESTE valor exacto" da error
    valoresInvalidosServidor[campoId] = {
        valor: input.value.trim(), // Guardamos "1234ABC"
        mensaje: mensaje
    };

    // Forzamos la re-validación visual inmediata
    const campos = obtenerCampos();
    const errorSpan = document.getElementById(`error-${campoId}`);
    
    // Al llamar a esto, calcularErrorCampo verá que coincide con el valor prohibido
    const msg = calcularErrorCampo(campoId, campos); 
    if(errorSpan) errorSpan.textContent = msg;
    actualizarEstadoCampo(input, errorSpan);
};


// ==========================================
// 4. INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    const campos = obtenerCampos();
    
    // Crear spans
    Object.keys(campos).forEach((key) => {
      if (campos[key] && !document.getElementById(`error-${key}`)) {
        const span = document.createElement("span");
        span.id = `error-${key}`;
        span.classList.add("error");
        campos[key].insertAdjacentElement("afterend", span);
      }
    });

    const validarCampoIndividual = (key) => {
        const el = campos[key];
        const span = document.getElementById(`error-${key}`);
        if(!el) return;

        const msg = calcularErrorCampo(key, campos);
        if(span) span.textContent = msg;
        actualizarEstadoCampo(el, span);
    };

    // Listeners
    Object.keys(campos).forEach((key) => {
        const el = campos[key];
        if (!el) return;
        el.addEventListener("input", () => validarCampoIndividual(key));
        el.addEventListener("blur", () => validarCampoIndividual(key));
        el.addEventListener("change", () => validarCampoIndividual(key));
    });

    // Validación Inicial
    Object.keys(campos).forEach((key) => {
        const el = campos[key];
        if (el && !estaVacio(el.value) && el.value !== "0") {
            validarCampoIndividual(key);
        }
    });
});