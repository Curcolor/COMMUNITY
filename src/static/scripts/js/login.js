async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (data.success) {
            // Guardar estado en localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userData', JSON.stringify(data.usuario));
            
            // Redirigir al perfil
            window.location.href = '/perfil';
        } else {
            mostrarError(data.mensaje || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al intentar conectar con el servidor');
    }
}

// Función para verificar el estado de la sesión
async function verificarSesion() {
    try {
        const response = await fetch('/api/session-status');
        const data = await response.json();
        
        if (data.logged_in) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userData', JSON.stringify(data.usuario));
        } else {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userData');
        }
        
        return data.logged_in;
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        return false;
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

function mostrarError(mensaje) {
    let errorDiv = document.getElementById('error-mensaje');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error-mensaje';
        errorDiv.style.color = 'red';
        errorDiv.style.marginTop = '10px';
        errorDiv.style.textAlign = 'center';
        document.getElementById('loginForm').appendChild(errorDiv);
    }
    errorDiv.textContent = mensaje;
}

// Verificar sesión al cargar la página
document.addEventListener('DOMContentLoaded', verificarSesion); 