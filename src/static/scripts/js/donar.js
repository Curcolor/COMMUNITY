// Configuración y constantes
const CONFIG = {
    API_ENDPOINTS: {
        ORGANIZACIONES: '/api/organizaciones',
        DONACIONES: '/api/donaciones',
        SESSION: '/api/session-status'
    },
    REDIRECT_URLS: {
        LOGIN: '/iniciarSesion',
        PROYECTOS: '/proyectos'
    },
    DELAY: 2000
};

// Clase principal para manejar donaciones
class DonacionManager {
    constructor() {
        this.proyectoSeleccionado = null;
        this.formElements = {
            form: null,
            montoInput: null,
            organizacionSelect: null
        };
        this.init();
    }

    async init() {
        try {
            if (!this.obtenerElementosFormulario()) {
                console.error('Error: No se encontraron todos los elementos del formulario');
                return;
            }
            this.obtenerProyectoDeURL();
            await this.cargarOrganizaciones();
            this.configurarEventListeners();
        } catch (error) {
            console.error('Error en la inicialización:', error);
        }
    }

    obtenerProyectoDeURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.proyectoSeleccionado = urlParams.get('proyecto');
    }

    async cargarOrganizaciones() {
        try {
            const organizaciones = await this.fetchOrganizaciones();
            this.mostrarOrganizaciones(organizaciones);
        } catch (error) {
            console.error('Error al cargar organizaciones:', error);
        }
    }

    async fetchOrganizaciones() {
        const respuesta = await fetch(CONFIG.API_ENDPOINTS.ORGANIZACIONES, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!respuesta.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const datos = await respuesta.json();
        if (!datos.success) {
            throw new Error(datos.message || 'Error al obtener organizaciones');
        }

        return datos.organizaciones;
    }

    mostrarOrganizaciones(organizaciones) {
        if (!this.formElements.organizacionSelect) {
            console.error('Error: No se encontró el select de organizaciones');
            return;
        }

        this.formElements.organizacionSelect.innerHTML = '<option value="">Seleccione una organización</option>';
        organizaciones.forEach(org => {
            this.formElements.organizacionSelect.innerHTML += `
                <option value="${org.id}">${org.nombre} - ${org.categoria}</option>
            `;
        });
    }

    configurarEventListeners() {
        if (this.formElements.form) {
            this.formElements.form.addEventListener('submit', (e) => this.procesarDonacion(e));
        } else {
            console.error('Error: No se encontró el formulario');
        }
    }

    validarDonacion(monto, organizacionId) {
        if (!monto || isNaN(monto) || parseFloat(monto) <= 0) {
            this.mostrarMensaje('Por favor ingrese un monto válido', 'error');
            return false;
        }
        if (!organizacionId) {
            this.mostrarMensaje('Por favor seleccione una organización', 'error');
            return false;
        }
        return true;
    }

    async verificarSesion() {
        const response = await fetch(CONFIG.API_ENDPOINTS.SESSION);
        const sessionData = await response.json();

        if (!sessionData.logged_in) {
            console.error('Error: Usuario no autenticado');
            setTimeout(() => {
                window.location.href = CONFIG.REDIRECT_URLS.LOGIN;
            }, CONFIG.DELAY);
            return null;
        }

        return sessionData;
    }

    async procesarDonacion(event) {
        event.preventDefault();

        try {
            if (!this.formElements.montoInput || !this.formElements.organizacionSelect) {
                throw new Error('No se encontraron los elementos del formulario');
            }

            const monto = this.formElements.montoInput.value;
            const organizacionId = this.formElements.organizacionSelect.value;

            if (!this.validarDonacion(monto, organizacionId)) {
                return;
            }

            const sessionData = await this.verificarSesion();
            if (!sessionData) return;

            await this.enviarDonacion({
                monto: parseFloat(monto),
                usuarios_id_usuario: sessionData.usuario.id,
                proyectos_id_proyecto: this.proyectoSeleccionado || 1, // Valor por defecto si no hay proyecto
                organizaciones_id_organizacion: parseInt(organizacionId)
            });

        } catch (error) {
            console.error('Error al procesar la donación:', error);
            this.mostrarMensaje(error.message, 'error');
        }
    }

    async enviarDonacion(donacionData) {
        try {
            const response = await fetch(CONFIG.API_ENDPOINTS.DONACIONES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(donacionData)
            });

            // Verificar si la respuesta es JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error(`Error del servidor: Respuesta no válida (${response.status})`);
            }

            const data = await response.json();

            if (data.success) {
                console.log('¡Donación realizada con éxito!');
                // Mostrar mensaje de éxito usando las clases CSS existentes
                this.mostrarMensaje('¡Donación realizada con éxito!', 'success');
                setTimeout(() => {
                    window.location.href = CONFIG.REDIRECT_URLS.PROYECTOS;
                }, CONFIG.DELAY);
            } else {
                throw new Error(data.message || 'Error al procesar la donación');
            }
        } catch (error) {
            console.error('Error al procesar la donación:', error);
            this.mostrarMensaje(error.message, 'error');
        }
    }

    mostrarMensaje(mensaje, tipo) {
        const container = document.querySelector('.donation-container');
        if (!container) return;

        const mensajeExistente = container.querySelector('.mensaje');
        if (mensajeExistente) {
            mensajeExistente.remove();
        }

        const mensajeElement = document.createElement('div');
        mensajeElement.className = `mensaje mensaje-${tipo}`;
        mensajeElement.innerHTML = mensaje;

        container.insertBefore(mensajeElement, container.firstChild);

        setTimeout(() => {
            mensajeElement.remove();
        }, CONFIG.DELAY);
    }

    obtenerElementosFormulario() {
        this.formElements = {
            form: document.getElementById('form_donacion'),
            montoInput: document.getElementById('monto_personalizado'),
            organizacionSelect: document.getElementById('organizacion')
        };

        const elementosFaltantes = Object.entries(this.formElements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);

        if (elementosFaltantes.length > 0) {
            console.error('Elementos no encontrados:', elementosFaltantes);
            return false;
        }

        return true;
    }
}

// Función para actualizar las organizaciones según el tipo de ayuda seleccionado
function actualizarOrganizaciones() {
    const tipoAyudaSelect = document.getElementById('tipo_ayuda');
    const organizacionSelect = document.getElementById('organizacion');
    const tipoAyuda = tipoAyudaSelect.value;
    
    // Limpiar opciones actuales
    organizacionSelect.innerHTML = '<option value="">Seleccione una organización</option>';
    
    // Si hay un tipo de ayuda seleccionado, mostrar las organizaciones correspondientes
    if (tipoAyuda && organizacionesPorTipo[tipoAyuda]) {
        organizacionesPorTipo[tipoAyuda].forEach(org => {
            const option = document.createElement('option');
            option.value = org.id;
            option.textContent = org.nombre;
            organizacionSelect.appendChild(option);
        });
    }
}

// Agregar event listener cuando se carga el documento
document.addEventListener('DOMContentLoaded', async () => {
    // Obtener el ID del proyecto de la URL si existe
    const urlParams = new URLSearchParams(window.location.search);
    const proyectoId = urlParams.get('proyecto_id');

    if (proyectoId) {
        console.log('Proyecto ID encontrado:', proyectoId);
        // Si hay un proyecto específico, mostrar ese formulario y ocultar el general
        document.getElementById('proyecto-especifico').style.display = 'block';
        document.getElementById('donacion-general').style.display = 'none';
        
        try {
            // Obtener información del proyecto
            const response = await fetch(`/api/proyectos/${proyectoId}`);
            const data = await response.json();
            
            console.log('Datos del proyecto cargados:', data);

            if (data.success) {
                const proyecto = data.proyecto;
                console.log('Proyecto:', proyecto);
                document.getElementById('proyecto_id').value = proyecto.id;
                document.getElementById('proyecto-titulo').textContent = proyecto.titulo;
                document.getElementById('proyecto-organizacion').textContent = proyecto.organizacion_nombre;
                document.getElementById('proyecto-meta').textContent = proyecto.meta_financiera.toLocaleString();
                document.getElementById('proyecto-recaudado').textContent = proyecto.monto_recaudado.toLocaleString();
            } else {
                console.error('Error al cargar la información del proyecto:', data.message);
                throw new Error('No se pudo cargar la información del proyecto');
            }
        } catch (error) {
            console.error('Error:', error);
            // Mostrar mensaje de error
            document.getElementById('proyecto-especifico').innerHTML = 
                '<p class="error">Error al cargar la información del proyecto</p>';
        }
    } else {
        console.log('No se encontró un proyecto específico, mostrando formulario general.');
        // Si no hay proyecto específico, mostrar el formulario general
        document.getElementById('proyecto-especifico').style.display = 'none';
        document.getElementById('donacion-general').style.display = 'block';
    }

    // Manejar el envío del formulario de donación específica
    const formDonacionProyecto = document.getElementById('form_donacion_proyecto');
    if (formDonacionProyecto) {
        formDonacionProyecto.addEventListener('submit', async (e) => {
            e.preventDefault();
            const monto = document.getElementById('monto_donacion').value;
            const proyecto_id = document.getElementById('proyecto_id').value;

            try {
                const response = await fetch('/api/donaciones', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        proyecto_id,
                        monto: parseFloat(monto)
                    })
                });

                const data = await response.json();
                if (data.success) {
                    alert('¡Donación realizada con éxito!');
                    window.location.href = '/proyectos';
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al procesar la donación');
            }
        });
    }

    // ... resto del código existente para el formulario general ...
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new DonacionManager();
});

