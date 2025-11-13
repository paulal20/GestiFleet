document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("vehiculoForm");

  if (form) {
    // Campos del formulario
    const campos = {
      matricula: document.getElementById("matricula"),
      marca: document.getElementById("marca"),
      modelo: document.getElementById("modelo"),
      anyo_matriculacion: document.getElementById("anyo_matriculacion"),
      precio: document.getElementById("precio"),
      id_concesionario: document.getElementById("id_concesionario"), // select
      numero_plazas: document.getElementById("numero_plazas"),
      autonomia_km: document.getElementById("autonomia_km"),
      color: document.getElementById("color"),
      descripcion: document.getElementById("descripcion"),
      imagen: document.getElementById("imagen"),
    };

    // Crear elementos <span> de error si no existen
    Object.keys(campos).forEach((key) => {
      if (campos[key] && !document.getElementById(`error-${key}`)) {
        const span = document.createElement("span");
        span.id = `error-${key}`;
        span.classList.add("error");
        span.setAttribute("aria-live", "polite");
        campos[key].insertAdjacentElement("afterend", span);
      }
    });

    // Mapear errores
    const errores = {};
    Object.keys(campos).forEach((key) => {
      errores[key] = document.getElementById(`error-${key}`);
    });

    function estaVacio(val) {
      return val == null || String(val).trim() === "";
    }

    function limpiarErrores() {
      Object.values(errores).forEach((span) => (span.textContent = ""));
    }

    function calcularErrorCampo(key) {
      const input = campos[key];
      if (!input) return "";
      const v = String(input.value || "").trim();

      switch (key) {
        case "matricula":
        if (estaVacio(v)) return "La matrícula es obligatoria.";
        if (!/^\d{4}[A-Z]{3}$/i.test(v))
            return "La matrícula debe tener 4 números seguidos de 3 letras (ej: 1234ABC).";
        break;

        case "marca":
        case "modelo":
          if (estaVacio(v)) return "Este campo es obligatorio.";
          if (v.length < 2) return "Debe tener al menos 2 caracteres.";
          break;

        case "anyo_matriculacion":
          if (estaVacio(v)) return "El año es obligatorio.";
          const year = parseInt(v, 10);
          const actual = new Date().getFullYear();
          if (isNaN(year) || year < 1900 || year > actual)
            return `Debe ser un año entre 1900 y ${actual}.`;
          break;

        case "precio":
          if (estaVacio(v)) return "El precio es obligatorio.";
          const precioNum = parseFloat(v);
          if (isNaN(precioNum) || precioNum <= 0)
            return "Debe ser un número positivo.";
          break;

        case "id_concesionario":
          if (estaVacio(v) || v === "0") return "Debe seleccionar un concesionario válido.";
          break;

        case "numero_plazas":
          if (!estaVacio(v)) {
            const plazas = parseInt(v, 10);
            if (plazas < 1 || plazas > 9)
              return "El número de plazas debe estar entre 1 y 9.";
          }
          break;

        case "autonomia_km":
          if (!estaVacio(v)) {
            const km = parseInt(v, 10);
            if (isNaN(km) || km < 0)
              return "La autonomía debe ser un número positivo.";
          }
          break;

        case "color":
          if (!estaVacio(v) && !/^[A-Za-z\s]+$/.test(v))
            return "El color solo puede contener letras y espacios.";
          break;

        case "descripcion":
          if (!estaVacio(v) && v.length < 10)
            return "La descripción debe tener al menos 10 caracteres si se proporciona.";
          if (!estaVacio(v) && v.length > 200)
            return "La descripción no puede exceder los 500 caracteres.";
          break;

        // Si deseas validar la imagen (opcional)
        // case "imagen":
        //   if (!estaVacio(v) && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v))
        //     return "Debe ser una URL válida de imagen (jpg, png, gif, webp).";
        //   break;
      }

      return "";
    }

    function actualizarEstadoCampo(input, errorSpan) {
      if (!input) return;
      input.classList.remove("is-valid", "is-invalid");
      if (errorSpan && errorSpan.textContent.trim() !== "") {
        input.classList.add("is-invalid");
      } else if (!estaVacio(input.value)) {
        input.classList.add("is-valid");
      }
    }

    function validarCampoEnTiempoReal(key) {
      const input = campos[key];
      const span = errores[key];
      if (!input) return;

      const msg = calcularErrorCampo(key);
      span.textContent = msg;
      actualizarEstadoCampo(input, span);
    }

    function validarCamposIniciales() {
      Object.keys(campos).forEach(key => {
        const input = campos[key];
        
        if (input && !estaVacio(input.value) && input.value !== '0') {
          validarCampoEnTiempoReal(key);
        }
        
      });
    }

    // Listeners en tiempo real
    Object.keys(campos).forEach((key) => {
      const el = campos[key];
      if (!el) return;
      el.addEventListener("input", () => validarCampoEnTiempoReal(key));
      el.addEventListener("change", () => validarCampoEnTiempoReal(key));
      el.addEventListener("blur", () => validarCampoEnTiempoReal(key));
    });

    // Validación al enviar
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      limpiarErrores();
      let valido = true;

      Object.keys(campos).forEach((key) => {
        const msg = calcularErrorCampo(key);
        if (msg) {
          errores[key].textContent = msg;
          valido = false;
        }
        actualizarEstadoCampo(campos[key], errores[key]);
      });

      if (valido) {
        console.log("✅ Formulario de vehículo válido. Enviando...");
        form.submit();
      } else {
        const primeraInvalida = Object.keys(campos).find(
          (k) => errores[k] && errores[k].textContent
        );
        if (primeraInvalida && campos[primeraInvalida]) {
          campos[primeraInvalida].focus();
        }
      }
    });

    // Resetear estados visuales
    form.addEventListener("reset", function () {
      setTimeout(() => {
        Object.values(campos).forEach((input) =>
          input.classList.remove("is-valid", "is-invalid")
        );
        limpiarErrores();
      }, 0);
    });

    // Validar campos ya rellenos al cargar
    validarCamposIniciales();

  }
});
