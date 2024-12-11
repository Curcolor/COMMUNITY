console.log('Script de nueva organización cargado');

// Verificar el estado de la sesión al cargar la página
async function verificarSesion() {
    try {
        const response = await fetch('/api/session-status');
        const data = await response.json();
        return data.logged_in;
    } catch (error) {
        console.error('Error al verificar la sesión:', error);
        return false;
    }
}

const form = document.getElementById('orgForm');
if (form) {
    console.log('Formulario de organización encontrado');
    iniciarProcesoCreacionOrganizacion();
} else {
    console.error('Formulario de organización no encontrado');
}

async function iniciarProcesoCreacionOrganizacion() {
    document.getElementById('organizacionForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        console.log('Formulario de organización enviado');

        // Verificar sesión antes de procesar el formulario
        const sesionActiva = await verificarSesion();
        if (!sesionActiva) {
            // Mostrar mensaje de alerta personalizado
            const alertaDiv = document.createElement('div');
            alertaDiv.className = 'alert alert-warning fadeIn';
            alertaDiv.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                Debes iniciar sesión para crear una nueva organización.
                <a href="/iniciarSesion" class="alert-link">Iniciar sesión</a>
            `;
            
            // Insertar la alerta al principio del contenedor principal
            const container = document.querySelector('.container');
            container.insertBefore(alertaDiv, container.firstChild);

            // Hacer scroll hacia arriba para mostrar el mensaje
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Redirigir después de un breve delay
            setTimeout(() => {
                window.location.href = '/iniciarSesion';
            }, 2000);
            
            return;
        }

        // Obtener los valores del formulario
        const nombreInput = document.querySelector("input[name='nombre']");
        const descripcionInput = document.querySelector("textarea[name='descripcion']");
        const categoriaInput = document.querySelector("select[name='categoria']");
        const imagenInput = document.querySelector("input[name='imagen_url']");

        // Crear objeto con los datos
        const data = {
            nombre: nombreInput ? nombreInput.value : '',
            descripcion: descripcionInput ? descripcionInput.value : '',
            categoria: categoriaInput ? categoriaInput.value : '',
            imagen_url: imagenInput ? imagenInput.value : null
        };

        console.log('Datos del formulario:', data);

        try {
            console.log('Enviando datos al servidor...');
            const response = await fetch('/api/nuevaOR', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            let mensajeElement = document.getElementById("mensaje-respuesta");
            if (!mensajeElement) {
                mensajeElement = document.createElement("div");
                mensajeElement.id = "mensaje-respuesta";
                form.insertAdjacentElement('afterend', mensajeElement);
            }

            if (response.ok && result.success) {
                console.log('Organización creada con éxito:', result.message);
                mensajeElement.className = 'alert alert-success fadeIn';
                mensajeElement.textContent = result.message;
                
                setTimeout(() => {
                    window.location.href = "/organizaciones";
                }, 1000);
            } else {
                console.error('Error al crear la organización:', result.error);
                mensajeElement.className = 'alert alert-danger fadeIn';
                mensajeElement.textContent = result.message;
                if (result.error) {
                    mensajeElement.textContent += ` (${result.error})`;
                }
            }
        } catch (error) {
            console.error('Error:', error);
            let mensajeElement = document.getElementById("mensaje-respuesta");
            if (mensajeElement) {
                mensajeElement.className = 'alert alert-danger fadeIn';
                mensajeElement.textContent = "Hubo un error al enviar los datos.";
            }
        }
    });
}

// Función auxiliar para convertir imagen a base64
function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
