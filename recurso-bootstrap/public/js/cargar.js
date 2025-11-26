/* public/js/cargar.js - Adapted to jQuery $.ajax as per PDF instructions */

$(document).ready(function() {
    let datosCargados = null;

    // MODAL RESET
    // Use jQuery event listener for Bootstrap modal
    $('#modalImportacion').on('show.bs.modal', function (event) {
        resetearModal();
    });

    function resetearModal() {
        $('#inputArchivoJSON').val('');
        // .prop() and .html() are standard jQuery methods for DOM manipulation
        $('#btnProcesarJSON').prop('disabled', true).html('<i class="bi bi-cloud-upload"></i> Analizar');
        $('#btnConfirmarCarga').prop('disabled', true);
        $('#zonaConflictos').hide();
        $('#zonaSinConflictos').hide();
        datosCargados = null;
    }

    // FILE INPUT CHANGE
    $('#inputArchivoJSON').on('change', function(e) {
        if (e.target.files.length > 0) {
            $('#btnProcesarJSON').prop('disabled', false);
            $('#zonaConflictos').hide();
            $('#zonaSinConflictos').hide();
            $('#btnConfirmarCarga').prop('disabled', true);
        } else {
            $('#btnProcesarJSON').prop('disabled', true);
        }
    });

    // PROCESS JSON BUTTON CLICK
    $('#btnProcesarJSON').on('click', function() {
        const fileInput = $('#inputArchivoJSON')[0];
        const archivo = fileInput.files[0];

        if (!archivo) return;

        const $btn = $(this);
        const textoOriginal = $btn.html();
        $btn.prop('disabled', true).text('Leyendo...');

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                datosCargados = JSON.parse(e.target.result);
                
                if(!datosCargados.concesionarios || !datosCargados.vehiculos) {
                    alert("Error: El JSON debe tener 'concesionarios' y 'vehiculos'.");
                    $btn.prop('disabled', false).html(textoOriginal);
                    return;
                }

                $btn.text('Analizando...');
                
                // AJAX REQUEST: Previsualizar (POST)
                $.ajax({
                    type: "POST", // [cite: 74, 95]
                    url: '/carga-inicial/previsualizar', // [cite: 74]
                    contentType: 'application/json', // 
                    data: JSON.stringify({ datosJSON: datosCargados }), // 
                    success: function(res) { // [cite: 76]
                        $btn.prop('disabled', false).html(textoOriginal);
                        // The server returns { exito: true, data: ... }
                        if(res.exito) {
                            procesarResultadoAnalisis(res.data);
                        } else {
                            alert('Error: ' + (res.mensaje || 'Error desconocido'));
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown) { // 
                        let msg = "Error del servidor";
                        if(jqXHR.responseJSON && jqXHR.responseJSON.mensaje) {
                            msg += ": " + jqXHR.responseJSON.mensaje;
                        } else {
                            msg += ": " + errorThrown;
                        }
                        alert(msg);
                        $btn.prop('disabled', false).html(textoOriginal);
                    }
                });

            } catch (error) {
                console.error(error);
                alert("El archivo no es un JSON válido.");
                $btn.prop('disabled', false).html(textoOriginal);
            }
        };
        reader.readAsText(archivo);
    });

    // FUNCTION TO PROCESS ANALYSIS RESULT (DOM Manipulation with jQuery)
    function procesarResultadoAnalisis(data) {
        const nuevosVehiculos = data.nuevosVehiculos;
        const conflictosVehiculos = data.conflictosVehiculos;
        const nuevosConcesionarios = data.nuevosConcesionarios;
        const conflictosConcesionarios = data.conflictosConcesionarios;
        
        let mensajeResumen = "Resumen del análisis:\n";
        mensajeResumen += "• Concesionarios Nuevos: " + nuevosConcesionarios.length + "\n";
        mensajeResumen += "• Concesionarios Conflictivos: " + conflictosConcesionarios.length + "\n";
        mensajeResumen += "• Vehículos Nuevos: " + nuevosVehiculos.length + "\n";
        mensajeResumen += "• Vehículos Conflictivos: " + conflictosVehiculos.length;

        // Immediate logic for setup page if no conflicts
        if ($('.setup-content').length > 0 && conflictosVehiculos.length === 0 && conflictosConcesionarios.length === 0) {
            if(confirm(mensajeResumen + "\n\nTodo parece correcto. ¿Proceder con la carga?")) {
                enviarDatosDefinitivos([], []);
            }
            return;
        }

        // Render Concesionarios Conflicts
        const $tbodyConc = $('#cuerpoTablaConcesionarios');
        $tbodyConc.empty(); //  jQuery empty()
        
        if (conflictosConcesionarios.length > 0) {
            $('#zonaConcesionarios').show();
            // Iterate using native forEach or $.each
            $.each(conflictosConcesionarios, function(index, c) {
                let row = 
                    '<tr>' +
                        '<td><strong>' + c.nuevo.id_concesionario + '</strong></td>' +
                        '<td class="text-danger">' + c.viejo.nombre + '</td>' +
                        '<td class="text-success">' + c.nuevo.nombre + '</td>' +
                        '<td class="text-center">' +
                            '<input type="checkbox" class="check-conc form-check-input" value="' + c.nuevo.id_concesionario + '">' +
                        '</td>' +
                    '</tr>';
                $tbodyConc.append(row); //  jQuery append
            });
        } else {
            $('#zonaConcesionarios').hide();
        }

        // Render Vehiculos Conflicts
        const $tbodyVeh = $('#cuerpoTablaVehiculos');
        $tbodyVeh.empty();

        if (conflictosVehiculos.length > 0) {
            $('#zonaVehiculos').show();
            $.each(conflictosVehiculos, function(index, v) {
                let row = 
                    '<tr>' +
                        '<td><strong>' + v.nuevo.matricula + '</strong></td>' +
                        '<td class="text-danger">' + v.viejo.marca + ' ' + v.viejo.modelo + '</td>' +
                        '<td class="text-success">' + v.nuevo.marca + ' ' + v.nuevo.modelo + '</td>' +
                        '<td class="text-center">' +
                            '<input type="checkbox" class="check-veh form-check-input" value="' + v.nuevo.matricula + '">' +
                        '</td>' +
                    '</tr>';
                $tbodyVeh.append(row);
            });
        } else {
            $('#zonaVehiculos').hide();
        }

        // Toggle Zones visibility
        if (conflictosVehiculos.length > 0 || conflictosConcesionarios.length > 0) {
            $('#zonaSinConflictos').hide();
            $('#zonaConflictos').fadeIn();
            $('#textoResumenConflictos').text(mensajeResumen);
            
            // Handle "Check All" checkboxes
            $('#checkTodosConc').prop('checked', false).off('change').on('change', function() {
                $('.check-conc').prop('checked', $(this).is(':checked'));
            });
            $('#checkTodosVeh').prop('checked', false).off('change').on('change', function() {
                $('.check-veh').prop('checked', $(this).is(':checked'));
            });

        } else {
            $('#zonaConflictos').hide();
            $('#zonaSinConflictos').fadeIn();
            $('#textoExitoResumen').text(mensajeResumen);
        }

        $('#btnConfirmarCarga').prop('disabled', false);

        // Show modal if not already shown
        if (!$('#modalImportacion').hasClass('show')) {
            // Using Bootstrap 5 native API for showing modal is safer, but trigger via jQuery
            $('#modalImportacion').modal('show'); 
        }
    }

    // CONFIRM LOAD BUTTON CLICK
    $('#btnConfirmarCarga').on('click', function() {
        const matriculas = [];
        const idsConcesionarios = [];
        
        if ($('#zonaConflictos').is(':visible')) {
            $('.check-veh:checked').each(function() { 
                matriculas.push($(this).val()); 
            });
            $('.check-conc:checked').each(function() { 
                idsConcesionarios.push($(this).val()); 
            });
        }

        enviarDatosDefinitivos(matriculas, idsConcesionarios);
    });

    // AJAX REQUEST: Execute Load (POST)
    function enviarDatosDefinitivos(matriculas, idsConcesionarios) {
        $.ajax({
            type: "POST", // [cite: 74, 95]
            url: '/carga-inicial/ejecutar', // [cite: 74]
            contentType: 'application/json', // 
            data: JSON.stringify({ // 
                datosCompletos: datosCargados,
                matriculasAActualizar: matriculas,
                idsConcesionariosAActualizar: idsConcesionarios
            }),
            success: function(res) { // [cite: 76]
                alert(res.mensaje);
                if (window.location.pathname.includes('setup')) {
                    window.location.href = '/login';
                } else {
                    window.location.reload();
                }
            },
            error: function(jqXHR, textStatus, errorThrown) { // 
                let msg = 'Error al guardar';
                if(jqXHR.responseJSON && jqXHR.responseJSON.mensaje) {
                    msg += ": " + jqXHR.responseJSON.mensaje;
                } else {
                    msg += ": " + errorThrown;
                }
                alert(msg);
            }
        });
    }
});