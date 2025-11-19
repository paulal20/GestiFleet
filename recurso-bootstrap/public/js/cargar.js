$(document).ready(function() {
    let datosCargados = null;

    const modalElement = document.getElementById('modalImportacion');
    if (modalElement) {
        modalElement.addEventListener('show.bs.modal', event => {
            $('#inputArchivoJSON').val('');
            $('#btnAnalizar').prop('disabled', true).text('Analizar Fichero');
            $('#btnConfirmarCarga').prop('disabled', true);
            $('#zonaConflictos').hide();
            $('#zonaSinConflictos').hide();
            datosCargados = null;
        });
    }

    $('#inputArchivoJSON').on('change', function(e) {
        const archivo = e.target.files[0];
        if (archivo) {
            $('#btnAnalizar').prop('disabled', false);
            $('#zonaConflictos').hide();
            $('#zonaSinConflictos').hide();
            $('#btnConfirmarCarga').prop('disabled', true);
        } else {
            $('#btnAnalizar').prop('disabled', true);
        }
    });

    $('#btnAnalizar').on('click', function() {
        const archivo = $('#inputArchivoJSON')[0].files[0];
        if (!archivo) return;

        const btn = $(this);
        btn.prop('disabled', true).text('Leyendo...');

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                datosCargados = JSON.parse(e.target.result);
                
                if(!datosCargados.concesionarios || !datosCargados.vehiculos) {
                    alert("Error: El JSON debe tener 'concesionarios' y 'vehiculos'.");
                    btn.prop('disabled', false).text('Analizar Fichero');
                    return;
                }

                btn.text('Analizando en servidor...');
                $.ajax({
                    url: '/carga-inicial/previsualizar',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ datosJSON: datosCargados }),
                    success: function(res) {
                        btn.prop('disabled', false).text('Analizar Fichero'); 
                        procesarResultadoAnalisis(res.data);
                    },
                    error: function(xhr) {
                        alert('Error del servidor: ' + (xhr.responseJSON?.mensaje || 'Desconocido'));
                        btn.prop('disabled', false).text('Analizar Fichero');
                    }
                });

            } catch (error) {
                alert("El archivo no es un JSON válido.");
                btn.prop('disabled', false).text('Analizar Fichero');
            }
        };
        reader.readAsText(archivo);
    });

    function procesarResultadoAnalisis(data) {
        const { conflictos, nuevos } = data;
        
        $('#btnConfirmarCarga').prop('disabled', false);

        if (conflictos.length > 0) {
            $('#zonaSinConflictos').hide();
            $('#zonaConflictos').fadeIn();
            
            $('#textoResumenConflictos').text(`Se han detectado ${conflictos.length} vehículos duplicados.`);
            
            const tbody = $('#cuerpoTablaConflictos');
            tbody.empty();

            conflictos.forEach(c => {
                tbody.append(`
                    <tr>
                        <td><strong>${c.nuevo.matricula}</strong></td>
                        <td class="text-danger">${c.viejo.modelo}</td>
                        <td class="text-success">${c.nuevo.modelo}</td>
                        <td class="text-center">
                            <input type="checkbox" class="check-actualizar form-check-input" value="${c.nuevo.matricula}">
                        </td>
                    </tr>
                `);
            });

            $('#checkTodos').prop('checked', false).off('change').on('change', function() {
                $('.check-actualizar').prop('checked', $(this).is(':checked'));
            });

        } else {
            $('#zonaConflictos').hide();
            $('#zonaSinConflictos').fadeIn();
        }
    }

    $('#btnConfirmarCarga').on('click', function() {
        const matriculas = [];
        
        if ($('#zonaConflictos').is(':visible')) {
            $('.check-actualizar:checked').each(function() {
                matriculas.push($(this).val());
            });
        }
        $.ajax({
            url: '/carga-inicial/ejecutar',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                datosCompletos: datosCargados,
                matriculasAActualizar: matriculas
            }),
            success: function(res) {
                alert(res.mensaje);
                window.location.reload();
            },
            error: function(xhr) {
                alert('Error al guardar: ' + xhr.responseJSON?.mensaje);
            }
        });
    });
});