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

async function obtenerUsuarioActual() {
    try {
        const response = await fetch('/api/session-status');
        const data = await response.json();
        return data.usuario;
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        return null;
    }
}

function mostrarOrganizaciones(organizaciones) {
    const tbody = document.querySelector('#organizacionesTable tbody');
    if (!tbody) return;

    tbody.innerHTML = organizaciones.map(org => `
        <tr class="organizacion-row">
            <td class="org-imagen">
                <img src="${org.imagen_url || '/static/img/default-org.png'}" alt="${org.nombre}">
            </td>
            <td class="org-nombre">${org.nombre}</td>
            <td class="org-descripcion">${org.descripcion}</td>
            <td class="org-categoria">${org.categoria}</td>
            <td class="org-creador">${org.creador}</td>
            <td class="org-fecha">${new Date(org.fecha_registro).toLocaleDateString()}</td>
            <td class="org-acciones">
                <button onclick="borrarOrganizacion(${org.id}, '${org.creador}')" class="btn-eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Cargar organizaciones cuando la página se cargue
document.addEventListener('DOMContentLoaded', () => {
    const btnCrear = document.querySelector('.btn-crear');
    if (btnCrear) {
        btnCrear.addEventListener('click', async (e) => {
            e.preventDefault();
            const estaLogueado = await verificarSesion();
            
            if (!estaLogueado) {
                Swal.fire({
                    title: '¡Acceso Restringido!',
                    text: 'Debes iniciar sesión para crear una organización',
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
                window.location.href = '/nuevaOrganizacion';
            }
        });
    }
    
    obtenerOrganizaciones()
        .then(organizaciones => {
            mostrarOrganizaciones(organizaciones);
        })
        .catch(error => {
            console.error('Error al cargar organizaciones:', error);
            const contenedor = document.getElementById('organizaciones-container');
            if (contenedor) {
                contenedor.innerHTML = '<p class="error">Error al cargar las organizaciones. Por favor, intente más tarde.</p>';
            }
        });
});

// Borrar una organización específica
async function borrarOrganizacion(id, creador) {
    const usuario = await obtenerUsuarioActual();
    
    if (!usuario) {
        Swal.fire({
            title: '¡Acceso Denegado!',
            text: 'Debes iniciar sesión para realizar esta acción',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    if (usuario.nombre !== creador) {
        Swal.fire({
            title: '¡Operación no permitida!',
            text: 'Solo puedes eliminar las organizaciones que hayas creado',
            icon: 'warning',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        customClass: {
            confirmButton: 'swal-confirm-button',
            cancelButton: 'swal-cancel-button'
        }
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`/api/organizaciones/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    title: '¡Eliminada!',
                    text: 'La organización ha sido eliminada correctamente',
                    icon: 'success',
                    confirmButtonText: 'Ok'
                });
                // Recargar la lista de organizaciones
                obtenerOrganizaciones().then(organizaciones => {
                    mostrarOrganizaciones(organizaciones);
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            Swal.fire({
                title: '¡Error!',
                text: 'No se pudo eliminar la organización',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        }
    }
}

// Borrar todas las organizaciones
async function borrarTodasOrganizaciones() {
    const usuario = await obtenerUsuarioActual();
    
    if (!usuario) {
        Swal.fire({
            title: '¡Acceso Denegado!',
            text: 'Debes iniciar sesión para realizar esta acción',
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
        return;
    }

    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Se eliminarán todas las organizaciones que hayas creado. Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar todas',
        cancelButtonText: 'Cancelar',
        customClass: {
            confirmButton: 'swal-confirm-button',
            cancelButton: 'swal-cancel-button'
        }
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch('/api/organizaciones/borrar-todo', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ usuario_id: usuario.id })
            });
            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    title: '¡Eliminadas!',
                    text: 'Todas tus organizaciones han sido eliminadas correctamente',
                    icon: 'success',
                    confirmButtonText: 'Ok'
                });
                // Recargar la lista de organizaciones
                obtenerOrganizaciones().then(organizaciones => {
                    mostrarOrganizaciones(organizaciones);
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            Swal.fire({
                title: '¡Error!',
                text: 'No se pudieron eliminar las organizaciones',
                icon: 'error',
                confirmButtonText: 'Ok'
            });
        }
    }
}