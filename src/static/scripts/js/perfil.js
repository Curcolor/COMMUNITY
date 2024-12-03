// Verificar si el usuario está autenticado
async function verificarAutenticacion() {
    try {
        const response = await fetch('/api/session-status');
        const data = await response.json();
        
        if (!data.logged_in) {
            window.location.href = '/iniciarSesion';
            return;
        }

        // Mostrar datos del usuario
        mostrarDatosUsuario(data.usuario);
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = '/iniciarSesion';
    }
}

// Mostrar datos del usuario en el perfil
function mostrarDatosUsuario(usuario) {
    if (usuario) {
        // Actualizar elementos del DOM con la información del usuario
        const nombreElement = document.getElementById('nombre-usuario');
        const emailElement = document.getElementById('email-usuario');
        
        if (nombreElement) nombreElement.textContent = usuario.nombre;
        if (emailElement) emailElement.textContent = usuario.email;
    }
}

// Función para cerrar sesión
async function cerrarSesion() {
    try {
        await fetch('/api/logout');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');
        window.location.href = '/iniciarSesion';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Verificar autenticación cuando se carga la página
document.addEventListener('DOMContentLoaded', verificarAutenticacion); 