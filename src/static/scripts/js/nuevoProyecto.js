// Función para obtener las organizaciones
async function obtenerOrganizaciones() {
    try {
        const respuesta = await fetch('/api/organizaciones', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!respuesta.ok) {
            throw new Error('Error al obtener las organizaciones');
        }

        const datos = await respuesta.json();
        if (!datos.success) {
            throw new Error(datos.message || 'Error al obtener las organizaciones');
        }

        return datos.organizaciones;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Función para mostrar las organizaciones en el select
function mostrarOrganizacionesEnSelect(organizaciones) {
    const selectOrg = document.getElementById('organizacion');
    if (!selectOrg) return;

    // Opción por defecto
    selectOrg.innerHTML = '<option value="">Seleccione una organización</option>';

    // Añadir cada organización como una opción
    organizaciones.forEach(org => {
        selectOrg.innerHTML += `
            <option value="${org.id}">
                ${org.nombre} - ${org.categoria}
            </option>
        `;
    });
}

// Cargar organizaciones cuando la página se cargue
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const organizaciones = await obtenerOrganizaciones();
        mostrarOrganizacionesEnSelect(organizaciones);

    } catch (error) {
        console.error('Error al cargar organizaciones:', error);
        const selectOrg = document.getElementById('organizacion');
        if (selectOrg) {
            selectOrg.innerHTML = '<option value="">Error al cargar organizaciones</option>';
            selectOrg.disabled = true;
        }
        const mensajeRespuesta = document.getElementById('mensaje-respuesta');
        if (mensajeRespuesta) {
            mensajeRespuesta.innerHTML = `
                <div class="alert alert-danger">
                    Error al cargar las organizaciones. Por favor, recargue la página o intente más tarde.
                </div>
            `;
        }
    }
});

// Función para previsualizar la imagen seleccionada
function previsualizarImagen(event) {
    const preview = document.getElementById('imagen-preview');
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        }
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// Función para convertir imagen a base64
function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Función para manejar el envío del formulario
async function crearNuevoProyecto(event) {
    event.preventDefault();
    
    const mensajeRespuesta = document.getElementById('mensaje-respuesta');
    const formData = new FormData(event.target);
    
    try {
        // Manejar la imagen
        const imagenFile = formData.get('imagen');
        let imagen_url = '';
        if (imagenFile && imagenFile.size > 0) {
            imagen_url = await convertirImagenABase64(imagenFile);
        }

        // Convertir FormData a un objeto JSON
        const data = {};
        formData.forEach((value, key) => {
            if (key !== 'imagen') { // Excluir el archivo de imagen original
                data[key] = value;
            }
        });
        
        // Agregar la imagen en base64
        data.imagen_url = imagen_url;

        const response = await fetch('/api/proyectos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Error al crear el proyecto');
        }

        // Mostrar mensaje de éxito
        mensajeRespuesta.innerHTML = `
            <div class="alert alert-success">
                Proyecto creado exitosamente. Redirigiendo...
            </div>
        `;

        // Redireccionar después de 2 segundos
        setTimeout(() => {
            window.location.href = '/proyectos';
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        mensajeRespuesta.innerHTML = `
            <div class="alert alert-danger">
                ${error.message || 'Error al crear el proyecto. Por favor, intente nuevamente.'}
            </div>
        `;
    }
}

// Agregar evento de envío al formulario
document.getElementById('proyectoForm').addEventListener('submit', crearNuevoProyecto);

// Agregar evento de cambio al input de imagen para previsualizar
document.getElementById('imagen').addEventListener('change', previsualizarImagen);