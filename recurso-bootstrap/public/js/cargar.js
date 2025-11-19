$(document).ready(function() {
    let datosCargados = null;

    const modalElement = document.getElementById('modalImportacion');
    if (modalElement) {
        modalElement.addEventListener('show.bs.modal', event => {
            $('#inputArchivoJSON').val('');
            $('#btnProcesarJSON').prop('disabled', true).html('<i class="bi bi-cloud-upload"></i> Cargar');
            $('#btnConfirmarCarga').prop('disabled', true);
            $('#zonaConflictos').hide();
            $('#zonaSinConflictos').hide();
            datosCargados = null;
        });
    }

    $('#inputArchivoJSON').on('change', function(e) {
        const archivo = e.target.files[0];
        if (archivo) {
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

                btn.text('Analizando en servidor...');
                
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
        const { conflictos, nuevos } = data;
        
        if (conflictos.length === 0) {
            if ($('.setup-content').length > 0) {
                if(confirm(`Todo correcto. Se cargarán ${nuevos.length} vehículos y los datos base. ¿Proceder?`)) {
                    enviarDatosDefinitivos([]);
                }
            } else {
                $('#zonaConflictos').hide();
                $('#zonaSinConflictos').fadeIn();
                $('#btnConfirmarCarga').prop('disabled', false);
            }
        } else {
            
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

            if ($('#modalImportacion').hasClass('show')) {
                 $('#zonaSinConflictos').hide();
                 $('#zonaConflictos').fadeIn();
                 $('#btnConfirmarCarga').prop('disabled', false);
            } else {
                const modalConflictos = new bootstrap.Modal(document.getElementById('modalConflictos'));
                modalConflictos.show();
            }
        }
    }

    $('#btnConfirmarCarga').on('click', function() {
        const matriculas = [];
        
        $('.check-actualizar:checked').each(function() {
            matriculas.push($(this).val());
        });

        enviarDatosDefinitivos(matriculas);
    });

    function enviarDatosDefinitivos(matriculasAActualizar) {
        $.ajax({
            url: '/carga-inicial/ejecutar',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                datosCompletos: datosCargados,
                matriculasAActualizar: matriculasAActualizar
            }),
            success: function(res) {
                alert(res.mensaje);
                window.location.href = '/'; 
            },
            error: function(xhr) {
                alert('Error al guardar: ' + xhr.responseJSON?.mensaje);
            }
        });
    }
});