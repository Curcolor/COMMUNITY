document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Verificar que las contraseñas coincidan
    const contraseña = document.getElementById('contraseña').value;
    const confirmarContraseña = document.getElementById('confirmar_contraseña').value;
    
    if (contraseña !== confirmarContraseña) {
        document.getElementById('resultado').innerHTML = 
            `<p class="error">Las contraseñas no coinciden</p>`;
        return;
    }

    // Obtener los intereses seleccionados
    const interesesSeleccionados = Array.from(document.querySelectorAll('input[name="intereses"]:checked'))
        .map(checkbox => checkbox.value);
    
    // Recoger todos los datos del formulario
    const userData = {
        nombre_completo: document.getElementById('nombre_completo').value,
        dni: document.getElementById('dni').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
        contraseña: contraseña,
        intereses: interesesSeleccionados
    };

    // Para debugging
    console.log('Datos a enviar:', userData);

    try {
        const response = await fetch('/api/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('resultado').innerHTML = 
                `<p class="success">Usuario registrado exitosamente!</p>`;
            document.getElementById('registroForm').reset();
            // Redirigir al login después de un registro exitoso
            setTimeout(() => {
                window.location.href = '/iniciarSesion';
            }, 2000);
        } else {
            document.getElementById('resultado').innerHTML = 
                `<p class="error">Error: ${data.error || 'Error en el registro'}</p>`;
        }
    } catch (error) {
        console.error('Error completo:', error);
        document.getElementById('resultado').innerHTML = 
            `<p class="error">Error de conexión: ${error.message}</p>`;
    }
});

// Función para validar el formulario
function validarFormulario() {
    const contraseña = document.getElementById('contraseña').value;
    const confirmarContraseña = document.getElementById('confirmar_contraseña').value;
    
    if (contraseña !== confirmarContraseña) {
        document.getElementById('resultado').innerHTML = 
            `<p class="error">Las contraseñas no coinciden</p>`;
        return false;
    }
    
    // Verificar que al menos un interés esté seleccionado
    const interesesSeleccionados = document.querySelectorAll('input[name="intereses"]:checked');
    if (interesesSeleccionados.length === 0) {
        document.getElementById('resultado').innerHTML = 
            `<p class="error">Por favor selecciona al menos un área de interés</p>`;
        return false;
    }
    
    return true;
}