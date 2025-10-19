document.addEventListener("DOMContentLoaded", function(){
    const form = document.getElementById("revistaForm");

    const campos = {
        nombre: document.getElementById("nombre"),
        apellido1: document.getElementById("apellido1"),
        apellido2: document.getElementById("apellido2"),
        email: document.getElementById("email"),
        vehiculo: document.getElementById("vehiculo"),
        fechaInicio: document.getElementById("fechaInicio"),
        duracion: document.getElementById("duracion")
    };

    const errores = {
        nombre: document.getElementById("error-nombre"),
        apellido1: document.getElementById("error-apellido1"),
        apellido2: document.getElementById("error-apellido2"),
        email: document.getElementById("error-email"),
        vehiculo: document.getElementById("error-vehiculo"),
        fechaInicio: document.getElementById("error-fecha-inicio"),
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

        // let errores = [];
        let valido = true;

        if(campos.nombre.value.trim().length < 3){
            errores.nombre.textContent = "El nombre debe tener al menos 3 caracteres.";
            valido = false;
        }

        if(campos.apellido1.value.trim().length < 3){
            errores.apellido1.textContent = "El apellido debe tener al menos 3 caracteres.";
            valido = false;
        }

        const emailForm = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if(!emailForm.test(campos.email.value.trim())){
            errores.email.textContent = "El correo no tiene un formato válido.";
            valido = false;
        }

        if (valido) {
            alert("Formulario enviado correctamente.");
            form.submit();
          }
    });

});