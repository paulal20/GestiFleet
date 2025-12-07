let valoresInvalidosServidor = {};

//validación de campos del formulario
function obtenerCampos() {
    return {
      matricula: document.getElementById("matricula"),
      marca: document.getElementById("marca"),
      modelo: document.getElementById("modelo"),
      tipo: document.getElementById("tipo"), 
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

    if (valoresInvalidosServidor[key] && valoresInvalidosServidor[key].valor === v) {
        return valoresInvalidosServidor[key].mensaje;
    }

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

        case "tipo":
            const tiposValidos = ['coche', 'suv', 'furgoneta', 'moto', 'deportivo', 'todoterreno', 'cabrio', 'pickup', 'otro'];
            
            if (estaVacio(v)) return "Selecciona un tipo.";
            if (!tiposValidos.includes(v)) return "Tipo de vehículo no válido.";
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
    
    if (errorSpan && errorSpan.textContent.trim() !== "") {
        input.classList.add("is-invalid");
    } 
    else if (!estaVacio(input.value) && input.value !== "0") {
        input.classList.add("is-valid");
    }
}

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

window.registrarErrorServidor = function(campoId, mensaje) {
    const input = document.getElementById(campoId);
    if (!input) return;

    valoresInvalidosServidor[campoId] = {
        valor: input.value.trim(),
        mensaje: mensaje
    };

    const campos = obtenerCampos();
    const errorSpan = document.getElementById(`error-${campoId}`);
    
    const msg = calcularErrorCampo(campoId, campos); 
    if(errorSpan) errorSpan.textContent = msg;
    actualizarEstadoCampo(input, errorSpan);
};

document.addEventListener("DOMContentLoaded", function () {
    const campos = obtenerCampos();
    
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
        if(!el) return; 
        
        const span = document.getElementById(`error-${key}`);
        const msg = calcularErrorCampo(key, campos);
        
        if(span) span.textContent = msg;
        actualizarEstadoCampo(el, span);
    };

    Object.keys(campos).forEach((key) => {
        const el = campos[key];
        if (!el) return;
        el.addEventListener("input", () => validarCampoIndividual(key));
        el.addEventListener("blur", () => validarCampoIndividual(key));
        el.addEventListener("change", () => validarCampoIndividual(key));
    });

    Object.keys(campos).forEach((key) => {
        const el = campos[key];
        if (el && !estaVacio(el.value) && el.value !== "0") {
            validarCampoIndividual(key);
        }
    });
});