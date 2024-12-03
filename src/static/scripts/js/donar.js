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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new DonacionManager();
});

