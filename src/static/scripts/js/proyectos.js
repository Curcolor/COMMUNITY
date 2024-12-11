async function verificarSesion() {
    try {
        const response = await fetch('/api/session-status');
        const data = await response.json();
        return data.logged_in;
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        return false;
    }
}

async function obtenerProyectos() {
    try {
        const respuesta = await fetch('/api/proyectos', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!respuesta.ok) {
            throw new Error('Error al obtener los proyectos');
        }

        const datos = await respuesta.json();
        if (!datos.success) {
            throw new Error(datos.message || 'Error al obtener los proyectos');
        }

        return datos.proyectos;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Función para cargar los proyectos
async function cargarProyectos() {
    try {
        const projectList = document.getElementById('projectList');
        if (!projectList) return;
        
        projectList.innerHTML = '';
        
        const proyectos = await obtenerProyectos();
        
        proyectos.forEach(proyecto => {
            const projectCard = crearTarjetaProyecto(proyecto);
            projectList.appendChild(projectCard);
        });

    } catch (error) {
        console.error('Error al cargar los proyectos:', error);
        const projectList = document.getElementById('projectList');
        if (projectList) {
            projectList.innerHTML = '<p class="error">Error al cargar los proyectos. Por favor, intente más tarde.</p>';
        }
    }
}

// Función para crear una tarjeta de proyecto individual
function crearTarjetaProyecto(proyecto) {
    const card = document.createElement('div');
    card.className = 'project-card';

    // Calcular el porcentaje de progreso
    const progreso = (proyecto.monto_recaudado / proyecto.meta_financiera) * 100;

    // Mensaje para el progreso
    const mensajeProgreso = progreso >= 100 
        ? `Se completó el 100% de la meta y un ${progreso - 100}% extra` 
        : `${progreso.toFixed(1)}% completado`;

    card.innerHTML = `
        <img src="${proyecto.imagen_url || '/src/static/images/helpp.jpg'}" alt="Proyecto ${proyecto.titulo}">
        <div class="project-content">
            <h3 class="project-title">${proyecto.titulo}</h3>
            <p class="organization-name">
                <i class="fas fa-building"></i> ${proyecto.organizacion_nombre}
            </p>
            <p class="project-description">${proyecto.descripcion}</p>
            <div class="project-meta">
                <div class="meta-item">
                    <span>Meta: $${proyecto.meta_financiera.toLocaleString()}</span>
                    <span>Recaudado: $${proyecto.monto_recaudado.toLocaleString()}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${progreso}%"></div>
                </div>
                <p class="progress-text">${mensajeProgreso}</p>
            </div>
            <div class="project-actions">
                <button class="btn-donar" onclick="donarProyecto('${proyecto.id}')">
                    <i class="fas fa-hand-holding-heart"></i> Donar
                </button>
            </div>
        </div>
    `;

    return card;
}

// Función para manejar la donación
function donarProyecto(proyectoId) {
    window.location.href = `/donar?proyecto_id=${proyectoId}`;
}

// Cargar los proyectos cuando la página se cargue
document.addEventListener('DOMContentLoaded', () => {
    const btnCrear = document.querySelector('.btn-crear');
    if (btnCrear) {
        btnCrear.addEventListener('click', async (e) => {
            e.preventDefault();
            const estaLogueado = await verificarSesion();
            
            if (!estaLogueado) {
                Swal.fire({
                    title: '¡Acceso Restringido!',
                    text: 'Debes iniciar sesión para crear un proyecto',
                    icon: 'info',
                    confirmButtonText: 'Iniciar Sesión',
                    showCancelButton: true,
                    cancelButtonText: 'Cancelar',
                    background: '#fff',
                    customClass: {
                        confirmButton: 'swal-confirm-button',
                        cancelButton: 'swal-cancel-button'
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = '/iniciarSesion';
                    }
                });
            } else {
                window.location.href = '/nuevoProyecto';
            }
        });
    }
    
    // Mantener el resto del código de DOMContentLoaded
    cargarProyectos();
});

// Función para mostrar proyectos en formato tabla (si es necesario)
function mostrarProyectosTabla(proyectos) {
    const tbody = document.querySelector('#proyectosTable tbody');
    if (!tbody) return;

    tbody.innerHTML = proyectos.map(proyecto => `
        <tr class="proyecto-row">
            <td class="proyecto-imagen">
                <img src="${proyecto.imagen_url || '/src/static/images/helpp.jpg'}" alt="${proyecto.titulo}">
            </td>
            <td class="proyecto-titulo">${proyecto.titulo}</td>
            <td class="proyecto-descripcion">${proyecto.descripcion}</td>
            <td class="proyecto-meta">$${proyecto.meta_financiera.toLocaleString()}</td>
            <td class="proyecto-recaudado">$${proyecto.monto_recaudado.toLocaleString()}</td>
            <td class="proyecto-estado">${proyecto.estado}</td>
            <td class="proyecto-organizacion">${proyecto.organizacion_nombre}</td>
            <td class="proyecto-acciones">
                <button onclick="donarProyecto('${proyecto.id}')" class="btn-donar">
                    <i class="fas fa-hand-holding-heart"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Actualizar proyectos cada cierto tiempo (opcional)
const INTERVALO_ACTUALIZACION = 300000; // 5 minutos
setInterval(cargarProyectos, INTERVALO_ACTUALIZACION);


