$(document).ready(function() {
    let datosCargados = null;

    const modalElement = document.getElementById('modalImportacion');
    if (modalElement) {
        modalElement.addEventListener('show.bs.modal', event => {
            resetearModal();
        });
    }

    function resetearModal() {
        $('#inputArchivoJSON').val('');
        $('#btnProcesarJSON').prop('disabled', true).html('<i class="bi bi-cloud-upload"></i> Cargar');
        $('#btnConfirmarCarga').prop('disabled', true);
        $('#zonaConflictos').hide();
        $('#zonaSinConflictos').hide();
        datosCargados = null;
    }

    $('#inputArchivoJSON').on('change', function(e) {
        if (e.target.files[0]) {
            $('#btnProcesarJSON').prop('disabled', false);
            $('#zonaConflictos').hide();
            $('#zonaSinConflictos').hide();
            $('#btnConfirmarCarga').prop('disabled', true);
        } else {
            $('#btnProcesarJSON').prop('disabled', true);
        }
    });

    $('#btnProcesarJSON').on('click', function() {
        const archivo = $('#inputArchivoJSON')[0].files[0];
        if (!archivo) return;

        const btn = $(this);
        const textoOriginal = btn.html();
        btn.prop('disabled', true).text('Leyendo...');

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                datosCargados = JSON.parse(e.target.result);
                
                if(!datosCargados.concesionarios || !datosCargados.vehiculos) {
                    alert("Error: El JSON debe tener 'concesionarios' y 'vehiculos'.");
                    btn.prop('disabled', false).html(textoOriginal);
                    return;
                }

                btn.text('Analizando...');
                
                $.ajax({
                    url: '/carga-inicial/previsualizar',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ datosJSON: datosCargados }),
                    success: function(res) {
                        btn.prop('disabled', false).html(textoOriginal);
                        procesarResultadoAnalisis(res.data);
                    },
                    error: function(xhr) {
                        alert('Error del servidor: ' + (xhr.responseJSON?.mensaje || 'Desconocido'));
                        btn.prop('disabled', false).html(textoOriginal);
                    }
                });

            } catch (error) {
                alert("El archivo no es un JSON válido.");
                btn.prop('disabled', false).html(textoOriginal);
            }
        };
        reader.readAsText(archivo);
    });

    function procesarResultadoAnalisis(data) {
        const { nuevosVehiculos, conflictosVehiculos, nuevosConcesionarios, conflictosConcesionarios } = data;
        
        let mensajeResumen = "Resumen del análisis:\n";
        mensajeResumen += `• Concesionarios Nuevos: ${nuevosConcesionarios.length}\n`;
        mensajeResumen += `• Concesionarios Conflictivos: ${conflictosConcesionarios.length}\n`;
        mensajeResumen += `• Vehículos Nuevos: ${nuevosVehiculos.length}\n`;
        mensajeResumen += `• Vehículos Conflictivos: ${conflictosVehiculos.length}`;

        if ($('.setup-content').length > 0 && conflictosVehiculos.length === 0 && conflictosConcesionarios.length === 0) {
            if(confirm(`${mensajeResumen}\n\nTodo parece correcto. ¿Proceder con la carga?`)) {
                enviarDatosDefinitivos([], []);
            }
            return;
        }

        const tbodyConc = $('#cuerpoTablaConcesionarios');
        tbodyConc.empty();
        if (conflictosConcesionarios.length > 0) {
            $('#zonaConcesionarios').show();
            conflictosConcesionarios.forEach(c => {
                tbodyConc.append(`
                    <tr>
                        <td><strong>${c.nuevo.id_concesionario}</strong></td>
                        <td class="text-danger">${c.viejo.nombre}</td>
                        <td class="text-success">${c.nuevo.nombre}</td>
                        <td class="text-center">
                            <input type="checkbox" class="check-conc form-check-input" value="${c.nuevo.id_concesionario}">
                        </td>
                    </tr>
                `);
            });
        } else {
            $('#zonaConcesionarios').hide();
        }

        const tbodyVeh = $('#cuerpoTablaVehiculos');
        tbodyVeh.empty();
        if (conflictosVehiculos.length > 0) {
            $('#zonaVehiculos').show();
            conflictosVehiculos.forEach(v => {
                tbodyVeh.append(`
                    <tr>
                        <td><strong>${v.nuevo.matricula}</strong></td>
                        <td class="text-danger">${v.viejo.marca} ${v.viejo.modelo}</td>
                        <td class="text-success">${v.nuevo.marca} ${v.nuevo.modelo}</td>
                        <td class="text-center">
                            <input type="checkbox" class="check-veh form-check-input" value="${v.nuevo.matricula}">
                        </td>
                    </tr>
                `);
            });
        } else {
            $('#zonaVehiculos').hide();
        }

        if (conflictosVehiculos.length > 0 || conflictosConcesionarios.length > 0) {
            $('#zonaSinConflictos').hide();
            $('#zonaConflictos').fadeIn();
            $('#textoResumenConflictos').text(mensajeResumen);
            
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

        if (!$('#modalImportacion').hasClass('show')) {
            const modal = new bootstrap.Modal(document.getElementById('modalImportacion'));
            modal.show();
        }
    }

    $('#btnConfirmarCarga').on('click', function() {
        const matriculas = [];
        const idsConcesionarios = [];
        
        if ($('#zonaConflictos').is(':visible')) {
            $('.check-veh:checked').each(function() { matriculas.push($(this).val()); });
            $('.check-conc:checked').each(function() { idsConcesionarios.push($(this).val()); });
        }

        enviarDatosDefinitivos(matriculas, idsConcesionarios);
    });

    function enviarDatosDefinitivos(matriculas, idsConcesionarios) {
        $.ajax({
            url: '/carga-inicial/ejecutar',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                datosCompletos: datosCargados,
                matriculasAActualizar: matriculas,
                idsConcesionariosAActualizar: idsConcesionarios
            }),
            success: function(res) {
                alert(res.mensaje);
                if (window.location.pathname.includes('setup')) {
                    window.location.href = '/login';
                } else {
                    window.location.reload();
                }
            },
            error: function(xhr) {
                alert('Error al guardar: ' + (xhr.responseJSON?.mensaje || 'Desconocido'));
            }
        });
    }
});