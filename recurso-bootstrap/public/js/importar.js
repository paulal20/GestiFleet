$(document).ready(function() {
    let datosAnalizados = null;

    // Estado inicial del botón: Deshabilitado
    $('#btnAnalizarJSON').prop('disabled', true);

    // Evento: Habilitar botón solo si hay archivo
    $('#inputArchivoJSON').on('change', function() {
        if (this.files.length > 0) {
            $('#btnAnalizarJSON').prop('disabled', false);
        } else {
            $('#btnAnalizarJSON').prop('disabled', true);
        }
    });

    // --- 1. BOTÓN ANALIZAR ---
    $('#btnAnalizarJSON').on('click', function() {
        const fileInput = $('#inputArchivoJSON')[0];
        
        // Limpieza visual previa
        $('#contenedorTablas').empty();
        $('#zonaResultadosAnalisis').hide();
        $('#textoResumenAnalisis').empty(); 

        if (fileInput.files.length === 0) {
            mostrarErrorEnModal('Por favor, selecciona un archivo JSON primero.');
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        // UI: Mostrar Loading
        $('#loadingAnalisis').show();
        $('#btnAnalizarJSON').prop('disabled', true);
        $('#btnConfirmarImportacion').prop('disabled', true);

        reader.onload = function(e) {
            try {
                const jsonContent = JSON.parse(e.target.result);
                
                // Enviar al backend para análisis (AJAX CLÁSICO según PDF)
                $.ajax({
                    type: "POST",
                    url: "/api/importacion/analizar",
                    data: JSON.stringify({ datos: jsonContent }),
                    contentType: "application/json",
                    success: function(resp) {
                        $('#loadingAnalisis').hide();
                        $('#btnAnalizarJSON').prop('disabled', false);

                        if (resp.ok) {
                            datosAnalizados = resp.reporte;
                            renderizarResultados(datosAnalizados);
                        } else {
                            mostrarErrorEnModal(resp.error || 'Error desconocido al analizar.');
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        $('#loadingAnalisis').hide();
                        $('#btnAnalizarJSON').prop('disabled', false);
                        mostrarErrorEnModal('No se pudo contactar con el servidor: ' + textStatus);
                    }
                });

            } catch (error) {
                $('#loadingAnalisis').hide();
                $('#btnAnalizarJSON').prop('disabled', false);
                mostrarErrorEnModal('El archivo seleccionado no tiene un formato JSON válido.');
            }
        };

        reader.readAsText(file);
    });

    // Función auxiliar para mostrar errores DENTRO del modal
    function mostrarErrorEnModal(mensaje) {
        const htmlError = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <img src="/bootstrap-icons-1.13.1/exclamation-triangle-fill.svg" class="bi-svg" alt=""> ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $('#textoResumenAnalisis').html(htmlError);
        $('#zonaResultadosAnalisis').show();
    }

    // --- 2. RENDERIZADO DE TABLAS ---
    function renderizarResultados(reporte) {
        const $contenedor = $('#contenedorTablas');
        $contenedor.empty();
        $('#textoResumenAnalisis').empty();
        
        let hayDatos = false;

        // Función para formatear dato (Vehículos muestra más info)
        const formatearDato = (entidad, item, campo) => {
            if (entidad === 'vehiculos') {
                // Protección contra undefined si el backend no ha devuelto la marca
                const marcaStr = item.marca ? item.marca + ' ' : '';
                const modeloStr = item.modelo || '';
                return `<strong>${item.matricula}</strong> <small class="text-muted">(${marcaStr}${modeloStr})</small>`;
            }
            return item[campo];
        };

        // Iconos para el título
        const iconos = {
            'concesionarios': 'building.svg',
            'vehiculos': 'car-front-fill.svg',
            'usuarios': 'people-fill.svg'
        };

        const crearSeccion = (titulo, entidadKey, datosEntidad, idField, displayField) => {
            if (!datosEntidad.presente) return;
            hayDatos = true;

            // 1. CABECERA
            let html = `
                <div class="d-flex justify-content-between align-items-end mb-2">
                    <h5 class="fw-bold m-0">
                        <img src="/bootstrap-icons-1.13.1/${iconos[entidadKey]}" class="bi-svg me-2" alt="">${titulo}
                    </h5>
                    <h6 class="fw-bold m-0 rounded-pill">
                        Conflictivos: ${datosEntidad.conflictos.length} | Nuevos: ${datosEntidad.nuevos.length}
                    </h6>
                </div>
            `;

            // 2. TABLA (Solo si hay conflictos)
            if (datosEntidad.conflictos.length > 0) {
                html += `
                    <div class="table-responsive border rounded" style="max-height: 300px;">
                        <table class="table table-hover table-striped mb-0 align-middle">
                            <thead class="table-dark sticky-top">
                                <tr>
                                    <th style="width: 35%;">Dato Actual (BD)</th>
                                    <th style="width: 35%;">Dato Nuevo (JSON)</th>
                                    <th style="width: 20%;">Conflicto</th>
                                    <th style="width: 10%;" class="text-center">Actualizar</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                datosEntidad.conflictos.forEach((conflicto) => {
                    const jsonNuevo = encodeURIComponent(JSON.stringify(conflicto.nuevo));
                    const idReal = conflicto.actual[idField]; 
                    
                    const visualActual = formatearDato(entidadKey, conflicto.actual, displayField);
                    const visualNuevo = formatearDato(entidadKey, conflicto.nuevo, displayField);

                    html += `
                        <tr>
                            <td class="text-danger px-3">${visualActual}</td>
                            <td class="text-success fw-bold px-3">${visualNuevo}</td>
                            <td><span class="badge bg-warning text-dark">${conflicto.razon}</span></td>
                            <td class="text-center">
                                <input class="form-check-input check-item-${entidadKey}" type="checkbox" 
                                    data-id-bd="${idReal}" 
                                    data-json-nuevo="${jsonNuevo}">
                            </td>
                        </tr>
                    `;
                });

                html += `</tbody></table></div>`;
                
                // 3. PIE DE SECCIÓN
                html += `
                    <div class="d-flex justify-content-end align-items-center mt-2">
                        <div class="form-check">
                            <input class="form-check-input check-todos" type="checkbox" id="checkTodos_${entidadKey}" data-entidad="${entidadKey}">
                            <label class="form-check-label fw-bold" for="checkTodos_${entidadKey}" style="cursor:pointer;">
                                Seleccionar todos los ${titulo.toLowerCase()}
                            </label>
                        </div>
                    </div>
                `;

            } else {
                // Mensaje si no hay conflictos
                html += `
                    <div class="alert alert-secondary d-flex align-items-center" role="alert">
                        <img src="/bootstrap-icons-1.13.1/info-circle-fill.svg" class="bi-svg me-2" alt="">
                        <div>No hay conflictos. Se añadirán <strong>${datosEntidad.nuevos.length}</strong> registros nuevos automáticamente.</div>
                    </div>
                `;
            }
            
            // 4. SEPARADOR FINAL
            html += `<hr class="my-4 border-2">`;
            
            $contenedor.append(html);
        };

        // Generar secciones
        crearSeccion('Concesionarios', 'concesionarios', reporte.concesionarios, 'id_concesionario', 'nombre');
        crearSeccion('Vehículos', 'vehiculos', reporte.vehiculos, 'id_vehiculo', 'matricula');
        crearSeccion('Usuarios', 'usuarios', reporte.usuarios, 'id_usuario', 'correo');

        // Resumen final
        if (!hayDatos) {
            mostrarErrorEnModal('El archivo JSON no contiene entidades válidas (concesionarios, vehiculos, usuarios).');
            $('#btnConfirmarImportacion').prop('disabled', true);
        } else {
            $('#zonaResultadosAnalisis').fadeIn();
            $('#btnConfirmarImportacion').prop('disabled', false);
        }

        // Lógica Checkbox "Seleccionar Todos"
        $('.check-todos').on('change', function() {
            const entidad = $(this).data('entidad');
            const isChecked = $(this).is(':checked');
            $(`.check-item-${entidad}`).prop('checked', isChecked);
        });
    }

    // --- 3. CONFIRMAR E IMPORTAR (SIN AWAIT - COLA DE PETICIONES) ---
    $('#btnConfirmarImportacion').on('click', function() {
        if (!datosAnalizados) return;

        const $btn = $(this);
        $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Procesando...');
        $('#progresoImportacion').show();

        // Variables de estado
        let successCount = 0;
        let errorCount = 0;
        let erroresDetallados = [];
        
        // Cola de objetos { url, type, data, isFormData, desc }
        let colaPeticiones = [];

        // --- A. LLENAR LA COLA ---
        
        // 1. CONCESIONARIOS
        if (datosAnalizados.concesionarios.presente) {
            // Nuevos
            datosAnalizados.concesionarios.nuevos.forEach(function(item) {
                colaPeticiones.push({
                    url: '/api/concesionarios/nuevo',
                    type: 'POST',
                    data: JSON.stringify(item),
                    contentType: 'application/json',
                    isFormData: false,
                    desc: 'Conc. Nuevo (' + item.nombre + ')'
                });
            });
            // Editar
            $('.check-item-concesionarios:checked').each(function() {
                var id = $(this).data('id-bd');
                var dataObj = JSON.parse(decodeURIComponent($(this).data('json-nuevo')));
                colaPeticiones.push({
                    url: '/api/concesionarios/' + id + '/editar',
                    type: 'PUT',
                    data: JSON.stringify(dataObj),
                    contentType: 'application/json',
                    isFormData: false,
                    desc: 'Conc. Editar (' + dataObj.nombre + ')'
                });
            });
        }

        // 2. VEHÍCULOS (Atención al FormData)
        if (datosAnalizados.vehiculos.presente) {
            var crearFD = function(json) {
                var fd = new FormData();
                for (var k in json) { fd.append(k, json[k]); }
                return fd;
            };

            // Nuevos
            datosAnalizados.vehiculos.nuevos.forEach(function(item) {
                colaPeticiones.push({
                    url: '/api/vehiculos/',
                    type: 'POST',
                    data: crearFD(item),
                    isFormData: true,
                    desc: 'Veh. Nuevo (' + item.matricula + ')'
                });
            });
            // Editar
            $('.check-item-vehiculos:checked').each(function() {
                var id = $(this).data('id-bd');
                var dataObj = JSON.parse(decodeURIComponent($(this).data('json-nuevo')));
                colaPeticiones.push({
                    url: '/api/vehiculos/' + id,
                    type: 'PUT',
                    data: crearFD(dataObj),
                    isFormData: true,
                    desc: 'Veh. Editar (' + dataObj.matricula + ')'
                });
            });
        }

        // 3. USUARIOS
        if (datosAnalizados.usuarios.presente) {
            // Nuevos
            datosAnalizados.usuarios.nuevos.forEach(function(item) {
                if (!item.confemail) item.confemail = item.email || item.correo;
                if (!item.email) item.email = item.correo;

                colaPeticiones.push({
                    url: '/api/usuarios/nuevo',
                    type: 'POST',
                    data: JSON.stringify(item),
                    contentType: 'application/json',
                    isFormData: false,
                    desc: 'User Nuevo (' + item.correo + ')'
                });
            });
            // Editar
            $('.check-item-usuarios:checked').each(function() {
                var id = $(this).data('id-bd');
                var dataObj = JSON.parse(decodeURIComponent($(this).data('json-nuevo')));
                if (!dataObj.email) dataObj.email = dataObj.correo;

                colaPeticiones.push({
                    url: '/api/usuarios/' + id,
                    type: 'PUT',
                    data: JSON.stringify(dataObj),
                    contentType: 'application/json',
                    isFormData: false,
                    desc: 'User Editar (' + dataObj.correo + ')'
                });
            });
        }

        // FUNCIÓN RECURSIVA 
        function procesarSiguiente() {
            // Caso base: Cola vacía -> Terminar
            if (colaPeticiones.length === 0) {
                finalizarProceso();
                return;
            }

            // Sacar el primer elemento
            var tarea = colaPeticiones.shift();

            // Configurar opciones AJAX
            var opcionesAjax = {
                type: tarea.type,
                url: tarea.url,
                data: tarea.data,
                success: function(data, textStatus, jqXHR) {
                    // Éxito: Incrementamos contador y seguimos
                    successCount++;
                    procesarSiguiente();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    // Error: Incrementamos contador error, guardamos mensaje y seguimos
                    errorCount++;
                    var msg = 'Error desconocido';
                    
                    // 1. Error genérico (.error)
                    if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                        msg = jqXHR.responseJSON.error;
                    } 
                    // 2. Errores de validación de campos (.fieldErrors) -> ESTO FALTABA
                    else if (jqXHR.responseJSON && jqXHR.responseJSON.fieldErrors) {
                        // Convertimos el objeto de errores {nombre: '...', telefono: '...'} en texto
                        var errores = [];
                        for (var key in jqXHR.responseJSON.fieldErrors) {
                            errores.push(jqXHR.responseJSON.fieldErrors[key]);
                        }
                        msg = errores.join(', ');
                    }
                    // 3. Errores múltiples (.errors)
                    else if (jqXHR.responseJSON && jqXHR.responseJSON.errors) {
                        // A veces es un objeto, a veces array
                        if (typeof jqXHR.responseJSON.errors === 'object') {
                             var errs = [];
                             for (var k in jqXHR.responseJSON.errors) errs.push(jqXHR.responseJSON.errors[k]);
                             msg = errs.join(', ');
                        } else {
                             msg = JSON.stringify(jqXHR.responseJSON.errors);
                        }
                    } 
                    // 4. Fallback al texto HTTP (Bad Request)
                    else if (errorThrown) {
                        msg = errorThrown;
                    }
                    
                    erroresDetallados.push(tarea.desc + ': ' + msg);
                    procesarSiguiente();
                }
            };

            // Ajustes específicos si es FormData o JSON
            if (tarea.isFormData) {
                opcionesAjax.contentType = false;
                opcionesAjax.processData = false;
            } else {
                opcionesAjax.contentType = tarea.contentType;
            }

            // Ejecutar la petición
            $.ajax(opcionesAjax);
        }

        // --- C. FINALIZACIÓN ---
        function finalizarProceso() {
            $btn.prop('disabled', false).html('<img src="/bootstrap-icons-1.13.1/save.svg" class="bi-svg" alt=""> Confirmar e Importar');
            $('#progresoImportacion').hide();

            const modalImport = bootstrap.Modal.getInstance(document.getElementById('modalImportacion'));
            modalImport.hide();

            $('#resumenCountOk').text(successCount);
            $('#resumenCountError').text(errorCount);
            const modalResumen = new bootstrap.Modal(document.getElementById('modalResumenFinal'));
            modalResumen.show();

            if (erroresDetallados.length > 0) {
                var htmlList = '<ul class="mb-0 text-start">';
                erroresDetallados.forEach(function(e) { htmlList += '<li>' + e + '</li>'; });
                htmlList += '</ul>';
                mostrarAlertaPagina('warning', 'Proceso finalizado con ' + errorCount + ' errores', htmlList);
            } else if (successCount > 0) {
                mostrarAlertaPagina('success', 'Importación Exitosa', 'Todos los datos se han procesado y reactivado correctamente.');
            }
        }

        // Arrancar la recursión
        procesarSiguiente();
    });

    // --- HELPER ALERTAS PÁGINA ---
    function mostrarAlertaPagina(tipo, titulo, detalle) {
        const id = 'alert-' + Date.now();
        const html = `
            <div id="${id}" class="alert alert-${tipo} alert-dismissible fade show shadow-sm" role="alert">
                <strong>${titulo}</strong><br>
                ${detalle}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $('#alertContainerMain').append(html);
        setTimeout(function() { $('#' + id).alert('close'); }, 20000);
        $('html, body').animate({ scrollTop: 0 }, 'fast');
    }
});