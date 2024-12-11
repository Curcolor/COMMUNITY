document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.formulario-ayuda');

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevenir el comportamiento predeterminado del formulario

        // Crear un objeto FormData para manejar los datos del formulario
        const formData = new FormData(form);

        // Construir el objeto de datos para enviar al servidor
        const solicitudAyuda = {
            titulo: formData.get('titulo'),
            descripcion: formData.get('descripcion'),
            meta_financiera: formData.get('meta') ? parseFloat(formData.get('meta')) : null,
            imagen_url: null, // Esto se procesará si hay una imagen cargada
            informacion_contacto: formData.get('contacto'),
        };

        // Si hay una imagen, procesarla y agregarla al objeto
        const imagenInput = formData.get('imagen');
        if (imagenInput && imagenInput.size > 0) {
            try {
                const reader = new FileReader();
                reader.onload = function (event) {
                    solicitudAyuda.imagen_url = event.target.result;
                };
                reader.readAsDataURL(imagenInput);
            } catch (error) {
                console.error('Error procesando la imagen:', error);
            }
        }

        try {
            const response = await fetch('/api/solicitudes_ayuda', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(solicitudAyuda),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Solicitud enviada exitosamente: ' + result.message);
                form.reset(); // Limpiar el formulario después de enviar
            } else {
                alert('Error al enviar la solicitud: ' + result.message);
            }
        } catch (error) {
            console.error('Error en la conexión con el servidor:', error);
            alert('Error en la conexión con el servidor. Intenta nuevamente más tarde.');
        }
    });

    cargarSolicitudesAyuda(); // Llamar a la función para cargar las solicitudes al cargar la página
});

async function cargarSolicitudesAyuda() {
    try {
        const response = await fetch('/api/mis_solicitudes_ayuda', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener las solicitudes de ayuda');
        }

        const { solicitudes } = await response.json();
        mostrarSolicitudesAyuda(solicitudes);
    } catch (error) {
        console.error('Error al cargar las solicitudes de ayuda:', error);
        const solicitudesList = document.getElementById('solicitudesList');
        if (solicitudesList) {
            solicitudesList.innerHTML = '<p class="error">Error al cargar las solicitudes. Por favor, intente más tarde.</p>';
        }
    }
}

function mostrarSolicitudesAyuda(solicitudes) {
    const solicitudesList = document.getElementById('solicitudesList');
    if (!solicitudesList) return;

    solicitudesList.innerHTML = '';

    solicitudes.forEach(solicitud => {
        const solicitudCard = document.createElement('div');
        solicitudCard.className = 'solicitud-card';

        // Crear contenido de la tarjeta de solicitud
        solicitudCard.innerHTML = `
            <img src="${solicitud.imagen_url || '/src/static/images/helpp.jpg'}" alt="Solicitud ${solicitud.titulo}">
            <div class="solicitud-content">
                <h3 class="solicitud-title">${solicitud.titulo}</h3>
                <p class="solicitud-description">${solicitud.descripcion}</p>
                <p class="solicitud-meta">Meta financiera: $${solicitud.meta_financiera?.toLocaleString() || 'N/A'}</p>
                <p class="solicitud-contacto">Contacto: ${solicitud.informacion_contacto}</p>
                <div class="solicitud-actions">
                    <button class="btn-donar" onclick="donarSolicitud('${solicitud.id}')">
                        <i class="fas fa-hand-holding-heart"></i> Donar
                    </button>
                </div>
            </div>
        `;

        solicitudesList.appendChild(solicitudCard);
    });
}

// Función para manejar la donación de solicitudes
function donarSolicitud(solicitudId) {
    window.location.href = `/donarSolicitud?solicitud_id=${solicitudId}`;
}
