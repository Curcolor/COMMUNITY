from flask import render_template, request, jsonify, session, redirect, url_for
from src.Models.modelo_db import BaseDatos

def routes(app):
    
    
    # PAGES ROUTES
    @app.route('/')
    @app.route('/inicio')
    def home():
        return render_template('pages/proyectos.html')

    @app.route('/registrarse')
    def registro():
        return render_template('pages/registro.html')
    
    @app.route('/iniciarSesion')
    def login():
        return render_template('pages/login.html')

    @app.route('/donar')
    def donar():
        return render_template('pages/donar.html')

    @app.route('/perfil')
    def perfil():
        if not session.get('logged_in'):
            return redirect(url_for('login'))
        
        # Obtener datos del usuario de la sesión
        usuario = {
            'id': session.get('usuario_id'),
            'nombre': session.get('usuario_nombre'),
            'email': session.get('usuario_email')
        }
        
        # Inicializar la base de datos
        db = BaseDatos()
        organizaciones = []
        total_donado = 0
        
        return render_template('pages/perfil.html', 
                             usuario=usuario['nombre'],  
                             total_donado=total_donado,
                             organizaciones=organizaciones)

    @app.route('/proyectos')
    def proyectos():
        return render_template('pages/proyectos.html')

    @app.route('/recibir')
    def recibir():
        return render_template('pages/recibir.html')
    
    @app.route('/nuevoProyecto')
    def nuevoProyecto():
        if not session.get('logged_in'):
            return redirect(url_for('login', next=request.url))
        return render_template('pages/nuevoProyecto.html')

    @app.route('/organizaciones')
    def organizaciones():
        return render_template('pages/organizaciones.html')
    
    @app.route('/nuevaOrganizacion')
    def nuevaOrganizacion():
        if not session.get('logged_in'):
            return redirect(url_for('login', next=request.url))
        return render_template('pages/nuevaOR.html')
    
    @app.route('/enlaces')
    def enlaces():
        return render_template ('pages/enlaces.html')


    
    # API ROUTES
    @app.route('/api/registro', methods=['POST'])
    def registro_usuario():
        try:
            datos = request.get_json()
            
            # Verificar que todos los campos necesarios estén presentes
            campos_requeridos = ['nombre_completo', 'dni', 'email', 'telefono', 'fecha_nacimiento', 'contraseña']
            for campo in campos_requeridos:
                if campo not in datos:
                    return jsonify({'error': f'Falta el campo {campo}'}), 400

            # Crear instancia de la base de datos
            db = BaseDatos()
                
            # Llamar al método crear_usuario con todos los parámetros requeridos
            usuario_id = db.crear_usuario(
                nombre_completo=datos['nombre_completo'],
                dni=datos['dni'],
                email=datos['email'],
                telefono=datos['telefono'],
                fecha_nacimiento=datos['fecha_nacimiento'],
                contraseña=datos['contraseña']
            )

            if usuario_id:
                return jsonify({
                    'success': True,
                    'mensaje': 'Usuario registrado exitosamente',
                    'usuario_id': usuario_id
                })
            else:
                # Obtener el mensaje de error desde la base de datos
                return jsonify({
                    'success': False,
                    'error': db.ultimo_error if hasattr(db, 'ultimo_error') else 'Error al crear el usuario'
                }), 400

        except Exception as e:
            print(f"Error en el registro: {str(e)}")  # Para debugging
            return jsonify({'error': str(e)}), 500

    @app.route('/api/nuevaOR', methods=['GET', 'POST'])
    def nuevaOR():
        if request.method == 'POST':
            try:
                data = request.get_json()
                print("Datos recibidos:", data)  # Log para verificar los datos recibidos
                
                if not data:
                    return jsonify({
                        "success": False, 
                        "message": "No se recibieron datos en formato JSON"
                    })
                
                # Validar campos requeridos
                if not data.get("nombre"):
                    return jsonify({
                        "success": False, 
                        "message": "El nombre es obligatorio"
                    })

                connection = app.get_db()
                if not connection:
                    return jsonify({
                        "success": False,
                        "message": "No se pudo conectar a la base de datos"
                    })

                try:
                    cursor = connection.cursor()
                    
                    # Verificar si la tabla existe y su estructura
                    cursor.execute("SELECT * FROM sqlite_master WHERE type='table' AND name='organizaciones'")
                    table_info = cursor.fetchone()
                    print("Información de la tabla:", table_info)  # Log para verificar la tabla
                    
                    query = """
                    INSERT INTO organizaciones (
                        nombre,
                        descripcion,
                        categoria,
                        imagen_url,
                        usuarios_id_usuario
                    )
                    VALUES (?, ?, ?, ?, ?)
                    """
                    
                    valores = (
                        data.get('nombre'),
                        data.get('descripcion'),
                        data.get('categoria'),
                        data.get('imagen_url'),
                        session.get('usuario_id')  # ID del usuario
                    )
                    print("Valores a insertar:", valores)  # Log para verificar valores
                    
                    cursor.execute(query, valores)
                    id_organizacion = cursor.lastrowid  # Cambiamos para obtener el ID insertado
                    print("ID generado:", id_organizacion)  # Log para verificar ID
                    
                    # Importante: Hacer commit antes de la consulta SELECT
                    connection.commit()
                    
                    # Verificar si se insertó correctamente
                    cursor.execute("SELECT * FROM organizaciones WHERE id_organizacion = ?", (id_organizacion,))
                    verificacion = cursor.fetchone()
                    print("Verificación de inserción:", verificacion)  # Log para verificar inserción
                    
                    if verificacion:
                        query_select = """
                        SELECT 
                            o.id_organizacion,
                            o.nombre,
                            o.descripcion,
                            o.categoria,
                            o.imagen_url,
                            o.fecha_registro,
                            u.nombre_completo as creador
                        FROM organizaciones o
                        JOIN usuarios u ON o.usuarios_id_usuario = u.id_usuario
                        WHERE o.id_organizacion = ?
                        """
                        
                        cursor.execute(query_select, (id_organizacion,))
                        organizacion = cursor.fetchone()
                        
                        if organizacion:
                            return jsonify({
                                "success": True,
                                "message": "Organización registrada correctamente",
                                "organizacion": {
                                    "id": organizacion[0],
                                    "nombre": organizacion[1],
                                    "descripcion": organizacion[2],
                                    "categoria": organizacion[3],
                                    "imagen_url": organizacion[4],
                                    "fecha_registro": organizacion[5],
                                    "creador": organizacion[6]
                                }
                            })
                        else:
                            return jsonify({
                                "success": False,
                                "message": "La organización se creó pero no se pudo recuperar la información"
                            })
                    else:
                        return jsonify({
                            "success": False,
                            "message": "No se pudo verificar la inserción de la organización"
                        })

                except Exception as e:
                    print("Error en la base de datos:", str(e))  # Log del error
                    return jsonify({
                        "success": False,
                        "message": "Error al guardar en la base de datos",
                        "error": str(e)
                    })
                finally:
                    cursor.close()
                    connection.close()

            except Exception as e:
                print("Error inesperado:", str(e))  # Log del error
                return jsonify({
                    "success": False,
                    "message": "Error inesperado en el servidor",
                    "error": str(e)
                })
        
        return render_template('pages/nuevaOR.html')

    @app.route('/api/organizaciones', methods=['GET'])
    def obtener_organizaciones():
        try:
            connection = app.get_db()
            cursor = connection.cursor()
            
            query = """
            SELECT 
                o.id_organizacion,
                o.nombre,
                o.descripcion,
                o.categoria,
                o.imagen_url,
                o.fecha_registro,
                u.nombre_completo as creador
            FROM organizaciones o
            JOIN usuarios u ON o.usuarios_id_usuario = u.id_usuario
            """
            
            cursor.execute(query)
            organizaciones = cursor.fetchall()
            
            # Convertir los resultados a una lista de diccionarios
            lista_organizaciones = [{
                "id": org[0],
                "nombre": org[1],
                "descripcion": org[2],
                "categoria": org[3],
                "imagen_url": org[4],
                "fecha_registro": org[5],
                "creador": org[6]
            } for org in organizaciones]
            
            return jsonify({
                "success": True,
                "organizaciones": lista_organizaciones
            })
            
        except Exception as e:
            return jsonify({
                "success": False,
                "message": "Error al obtener las organizaciones",
                "error": str(e)
            })
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    @app.route('/api/organizaciones/<int:id_organizacion>', methods=['DELETE'])
    def borrar_organizacion(id_organizacion):
        try:
            connection = app.get_db()
            cursor = connection.cursor()
            
            # Verificar si la organización existe
            cursor.execute("SELECT * FROM organizaciones WHERE id_organizacion = ?", (id_organizacion,))
            organizacion = cursor.fetchone()
            
            if not organizacion:
                return jsonify({
                    "success": False,
                    "message": "La organización no existe"
                }), 404
            
            # Borrar la organización
            cursor.execute("DELETE FROM organizaciones WHERE id_organizacion = ?", (id_organizacion,))
            connection.commit()
            
            return jsonify({
                "success": True,
                "message": f"Organización {id_organizacion} eliminada correctamente"
            })
            
        except Exception as e:
            return jsonify({
                "success": False,
                "message": "Error al eliminar la organización",
                "error": str(e)
            }), 500
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    @app.route('/api/organizaciones/borrar-todo', methods=['DELETE'])
    def borrar_todas_organizaciones():
        try:
            if not session.get('logged_in'):
                return jsonify({
                    "success": False,
                    "message": "Usuario no autenticado"
                }), 401

            usuario_id = session.get('usuario_id')
            
            connection = app.get_db()
            cursor = connection.cursor()
            
            # Borrar solo las organizaciones del usuario actual
            cursor.execute("DELETE FROM organizaciones WHERE usuarios_id_usuario = ?", (usuario_id,))
            connection.commit()
            
            return jsonify({
                "success": True,
                "message": "Todas tus organizaciones han sido eliminadas"
            })
            
        except Exception as e:
            return jsonify({
                "success": False,
                "message": "Error al eliminar las organizaciones",
                "error": str(e)
            }), 500
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    @app.route('/api/login', methods=['POST'])
    def login_usuario():
        try:
            print("Iniciando el proceso de inicio de sesión.")  # Mensaje de inicio
            datos = request.get_json()
            
            if not datos or 'email' not in datos or 'password' not in datos:
                print("Faltan datos de inicio de sesión.")  # Mensaje de error
                return jsonify({
                    'success': False,
                    'mensaje': 'Faltan datos de inicio de sesión'
                }), 400

            db = BaseDatos()
            print(f"Buscando usuario con email: {datos['email']}")  # Mensaje de búsqueda
            usuario = db.buscar_usuario_por_email(datos['email'])
            
            if usuario and usuario[6] == datos['password']:
                print("Inicio de sesión exitoso.")  # Mensaje de éxito
                # Guardar datos en la sesión
                session['logged_in'] = True
                session['usuario_id'] = usuario[0]
                session['usuario_nombre'] = usuario[1]
                session['usuario_email'] = usuario[3]
                
                return jsonify({
                    'success': True,
                    'mensaje': 'Inicio de sesión exitoso',
                    'usuario': {
                        'id': usuario[0],
                        'nombre': usuario[1],
                        'email': usuario[3]
                    }
                })
            else:
                print("Correo electrónico o contraseña incorrectos.")  # Mensaje de error
                return jsonify({
                    'success': False,
                    'mensaje': 'Correo electrónico o contraseña incorrectos'
                }), 401

        except Exception as e:
            print(f"Error en el login: {str(e)}")  # Mensaje de error
            return jsonify({
                'success': False,
                'mensaje': 'Error al intentar iniciar sesión'
            }), 500

    @app.route('/api/session-status')
    def session_status():
        return jsonify({
            'logged_in': session.get('logged_in', False),
            'usuario': {
                'id': session.get('usuario_id'),
                'nombre': session.get('usuario_nombre'),
                'email': session.get('usuario_email')
            } if session.get('logged_in') else None
        })

    @app.route('/api/logout')
    def logout():
        session.clear()
        return jsonify({'success': True})
    
    @app.route('/api/proyectos', methods=['GET', 'POST'])
    def crear_proyecto():
        if request.method == 'POST':
            try:
                data = request.get_json()
                print("Datos recibidos:", data)  # Log para verificar los datos recibidos
                
                if not data:
                    return jsonify({
                        "success": False, 
                        "message": "No se recibieron datos en formato JSON"
                    })
                
                # Validar campos requeridos
                campos_requeridos = ['titulo', 'meta_financiera', 'organizaciones_id_organizacion']
                for campo in campos_requeridos:
                    if not data.get(campo):
                        return jsonify({
                            "success": False, 
                            "message": f"El campo {campo} es obligatorio"
                        })

                connection = app.get_db()
                if not connection:
                    return jsonify({
                        "success": False,
                        "message": "No se pudo conectar a la base de datos"
                    })

                try:
                    cursor = connection.cursor()
                    
                    query = """
                    INSERT INTO proyectos (
                        titulo,
                        descripcion,
                        meta_financiera,
                        monto_recaudado,
                        categoria,
                        imagen_url,
                        fecha_inicio,
                        fecha_fin,
                        estado,
                        organizaciones_id_organizacion
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """
                    
                    valores = (
                        data.get('titulo'),
                        data.get('descripcion'),
                        float(data.get('meta_financiera')),
                        0.0,  # monto_recaudado inicial en 0
                        data.get('categoria'),
                        data.get('imagen_url'),
                        data.get('fecha_inicio'),
                        data.get('fecha_fin'),
                        data.get('estado'),
                        int(data.get('organizaciones_id_organizacion'))
                    )
                    print("Valores a insertar:", valores)  # Log para verificar valores
                    
                    cursor.execute(query, valores)
                    id_proyecto = cursor.lastrowid
                    print("ID generado:", id_proyecto)  # Log para verificar ID
                    
                    connection.commit()
                    
                    # Verificar si se insertó correctamente
                    cursor.execute("""
                        SELECT 
                            p.id_proyecto,
                            p.titulo,
                            p.descripcion,
                            p.meta_financiera,
                            p.monto_recaudado,
                            p.categoria,
                            p.imagen_url,
                            p.fecha_inicio,
                            p.fecha_fin,
                            p.estado,
                            o.nombre as organizacion_nombre
                        FROM proyectos p
                        JOIN organizaciones o ON p.organizaciones_id_organizacion = o.id_organizacion
                        WHERE p.id_proyecto = ?
                    """, (id_proyecto,))
                    
                    proyecto = cursor.fetchone()
                    
                    if proyecto:
                        return jsonify({
                            "success": True,
                            "message": "Proyecto creado correctamente",
                            "proyecto": {
                                "id": proyecto[0],
                                "titulo": proyecto[1],
                                "descripcion": proyecto[2],
                                "meta_financiera": float(proyecto[3]),
                                "monto_recaudado": float(proyecto[4]),
                                "categoria": proyecto[5],
                                "imagen_url": proyecto[6],
                                "fecha_inicio": proyecto[7],
                                "fecha_fin": proyecto[8],
                                "estado": proyecto[9],
                                "organizacion_nombre": proyecto[10]
                            }
                        })
                    else:
                        return jsonify({
                            "success": False,
                            "message": "El proyecto se creó pero no se pudo recuperar la información"
                        })

                except Exception as e:
                    print("Error en la base de datos:", str(e))  # Log del error
                    return jsonify({
                        "success": False,
                        "message": "Error al guardar en la base de datos",
                        "error": str(e)
                    })
                finally:
                    cursor.close()
                    connection.close()

            except Exception as e:
                print("Error inesperado:", str(e))  # Log del error
                return jsonify({
                    "success": False,
                    "message": "Error inesperado en el servidor",
                    "error": str(e)
                })
        
        # Si es GET, obtener todos los proyectos
        elif request.method == 'GET':
            try:
                connection = app.get_db()
                cursor = connection.cursor()
                
                cursor.execute("""
                    SELECT 
                        p.id_proyecto,
                        p.titulo,
                        p.descripcion,
                        p.meta_financiera,
                        p.monto_recaudado,
                        p.categoria,
                        p.imagen_url,
                        p.fecha_inicio,
                        p.fecha_fin,
                        p.estado,
                        o.nombre as organizacion_nombre
                    FROM proyectos p
                    JOIN organizaciones o ON p.organizaciones_id_organizacion = o.id_organizacion
                """)
                
                proyectos = cursor.fetchall()
                
                return jsonify({
                    "success": True,
                    "proyectos": [{
                        "id": p[0],
                        "titulo": p[1],
                        "descripcion": p[2],
                        "meta_financiera": float(p[3]),
                        "monto_recaudado": float(p[4]),
                        "categoria": p[5],
                        "imagen_url": p[6],
                        "fecha_inicio": p[7],
                        "fecha_fin": p[8],
                        "estado": p[9],
                        "organizacion_nombre": p[10]
                    } for p in proyectos]
                })
                
            except Exception as e:
                print("Error al obtener proyectos:", str(e))
                return jsonify({
                    "success": False,
                    "message": "Error al obtener los proyectos",
                    "error": str(e)
                }), 500
            finally:
                if cursor:
                    cursor.close()
                if connection:
                    connection.close()

        return render_template('pages/nuevoProyecto.html')

    @app.route('/api/proyectos/<int:proyecto_id>')
    def obtener_proyecto(proyecto_id):
        try:
            print(f"Obteniendo proyecto con ID: {proyecto_id}")  # Mensaje de inicio
            connection = app.get_db()
            cursor = connection.cursor()
            
            cursor.execute("""
                SELECT 
                    p.id_proyecto,
                    p.titulo,
                    p.descripcion,
                    p.meta_financiera,
                    p.monto_recaudado,
                    o.nombre as organizacion_nombre
                FROM proyectos p
                JOIN organizaciones o ON p.organizaciones_id_organizacion = o.id_organizacion
                WHERE p.id_proyecto = ?
            """, (proyecto_id,))
            
            proyecto = cursor.fetchone()
            print(f"Proyecto encontrado: {proyecto}")  # Mensaje de verificación
            
            if proyecto:
                return jsonify({
                    "success": True,
                    "proyecto": {
                        "id": proyecto[0],
                        "titulo": proyecto[1],
                        "descripcion": proyecto[2],
                        "meta_financiera": float(proyecto[3]),
                        "monto_recaudado": float(proyecto[4]),
                        "organizacion_nombre": proyecto[5]
                    }
                })
            else:
                print("Proyecto no encontrado.")  # Mensaje de error
                return jsonify({
                    "success": False,
                    "message": "Proyecto no encontrado"
                }), 404
                
        except Exception as e:
            print(f"Error al obtener el proyecto: {str(e)}")  # Mensaje de error
            return jsonify({
                "success": False,
                "message": str(e)
            }), 500
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    @app.route('/api/donaciones', methods=['POST'])
    def procesar_donacion():
        try:
            data = request.get_json()
            print("Datos recibidos en /api/donaciones:", data)
            
            # Validar campos requeridos según la estructura de la tabla
            campos_requeridos = ['monto', 'proyecto_id']  # Eliminamos 'usuarios_id_usuario'
            for campo in campos_requeridos:
                if campo not in data:
                    print(f"Error: Campo faltante: {campo}")
                    return jsonify({
                        "success": False,
                        "message": f"El campo {campo} es requerido"
                    }), 400

            # Obtener el ID del usuario de la sesión
            usuario_id = session.get('usuario_id')
            if not usuario_id:
                return jsonify({
                    "success": False,
                    "message": "Usuario no autenticado"
                }), 401

            # Validar tipos de datos
            try:
                monto = float(data['monto'])
                proyecto_id = int(data['proyecto_id'])
                
                print("Valores convertidos:")
                print(f"- Monto: {monto} (tipo: {type(monto)})")
                print(f"- Usuario ID: {usuario_id} (tipo: {type(usuario_id)})")
                print(f"- Proyecto ID: {proyecto_id} (tipo: {type(proyecto_id)})")
                
                if monto <= 0:
                    print("Error: Monto inválido (debe ser mayor a 0)")
                    return jsonify({
                        "success": False,
                        "message": "El monto debe ser mayor a 0"
                    }), 400
                
            except ValueError as e:
                print(f"Error de conversión de tipos: {str(e)}")
                return jsonify({
                    "success": False,
                    "message": "Error en el formato de los datos"
                }), 400

            connection = app.get_db()
            cursor = connection.cursor()

            try:
                valores = (monto, usuario_id, proyecto_id, data.get('tipo_ayuda'))
                print("Valores a insertar en la base de datos:", valores)
                
                # Insertar la donación con la estructura correcta de la tabla
                query = """
                INSERT INTO donaciones (
                    monto,
                    usuarios_id_usuario,
                    proyectos_id_proyecto,
                    tipo_ayuda
                ) VALUES (?, ?, ?, ?)
                """
                
                cursor.execute(query, valores)
                
                # Actualizar el monto recaudado del proyecto
                cursor.execute("""
                    UPDATE proyectos 
                    SET monto_recaudado = monto_recaudado + ?
                    WHERE id_proyecto = ?
                """, (monto, proyecto_id))
                
                connection.commit()
                
                return jsonify({
                    "success": True,
                    "message": "Donación procesada exitosamente"
                })

            except Exception as e:
                connection.rollback()
                return jsonify({
                    "success": False,
                    "message": f"Error al procesar la donación: {str(e)}"
                }), 500
            finally:
                cursor.close()
                connection.close()

        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Error en el servidor: {str(e)}"
            }), 500
        

    @app.route('/api/solicitudes_ayuda', methods=['POST'])
    def crear_solicitud_ayuda():
        try:
            data = request.get_json()
            print("Datos recibidos en /api/solicitudes_ayuda:", data)

            # Validar campos requeridos según la estructura de la tabla
            campos_requeridos = ['titulo', 'descripcion']
            for campo in campos_requeridos:
                if campo not in data:
                    print(f"Error: Campo faltante: {campo}")
                    return jsonify({
                        "success": False,
                        "message": f"El campo {campo} es requerido"
                    }), 400

            # Obtener el ID del usuario de la sesión
            usuarios_id_usuario = session.get('usuario_id')
            if not usuarios_id_usuario:
                return jsonify({
                    "success": False,
                    "message": "Usuario no autenticado"
                }), 401

            # Obtener datos y validar tipos
            try:
                titulo = str(data['titulo'])
                descripcion = str(data.get('descripcion', None))
                meta_financiera = float(data['meta_financiera']) if 'meta_financiera' in data else None
                imagen_url = str(data.get('imagen_url', None))
                informacion_contacto = str(data.get('informacion_contacto', None))
                estado = str(data.get('estado', "pendiente"))

                print("Valores procesados:")
                print(f"- Título: {titulo}")
                print(f"- Descripción: {descripcion}")
                print(f"- Meta financiera: {meta_financiera}")
                print(f"- URL de imagen: {imagen_url}")
                print(f"- Información de contacto: {informacion_contacto}")
                print(f"- Estado: {estado}")
                print(f"- Usuario ID: {usuarios_id_usuario}")

            except ValueError as e:
                print(f"Error de conversión de tipos: {str(e)}")
                return jsonify({
                    "success": False,
                    "message": "Error en el formato de los datos"
                }), 400

            connection = app.get_db()
            cursor = connection.cursor()

            try:
                # Crear la solicitud de ayuda
                valores = (titulo, descripcion, meta_financiera, imagen_url, informacion_contacto, estado, usuarios_id_usuario)
                print("Valores a insertar en la base de datos:", valores)

                query = """
                INSERT INTO solicitudes_ayuda (
                    titulo,
                    descripcion,
                    meta_financiera,
                    imagen_url,
                    informacion_contacto,
                    estado,
                    usuarios_id_usuario
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """

                cursor.execute(query, valores)
                connection.commit()

                return jsonify({
                    "success": True,
                    "message": "Solicitud de ayuda creada exitosamente"
                })

            except Exception as e:
                connection.rollback()
                print(f"Error al crear la solicitud de ayuda: {str(e)}")
                return jsonify({
                    "success": False,
                    "message": f"Error al crear la solicitud de ayuda: {str(e)}"
                }), 500

            finally:
                cursor.close()
                connection.close()

        except Exception as e:
            print(f"Error en el servidor: {str(e)}")
            return jsonify({
                "success": False,
                "message": f"Error en el servidor: {str(e)}"
            }), 500


    @app.route('/api/mis_solicitudes_ayuda', methods=['GET'])
    def obtener_solicitudes_ayuda():
        try:
            usuario_id = request.args.get('usuario_id')  # Obtener solicitudes de un usuario específico
            estado = request.args.get('estado')  # Filtrar por estado

            # Conexión a la base de datos
            connection = app.get_db()
            cursor = connection.cursor()

            # Consulta base
            query = "SELECT id_solicitud, titulo, descripcion, meta_financiera, imagen_url, informacion_contacto, estado, fecha_solicitud, usuarios_id_usuario FROM solicitudes_ayuda"
            condiciones = []
            parametros = []

            if usuario_id:
                condiciones.append("usuarios_id_usuario = ?")
                parametros.append(usuario_id)

            if estado:
                condiciones.append("estado = ?")
                parametros.append(estado)

            if condiciones:
                query += " WHERE " + " AND ".join(condiciones)

            cursor.execute(query, parametros)
            filas = cursor.fetchall()

            # Mapeo de resultados
            solicitudes = [
                {
                    "id": fila[0],
                    "titulo": fila[1],
                    "descripcion": fila[2],
                    "meta_financiera": fila[3],
                    "imagen_url": fila[4],
                    "informacion_contacto": fila[5],
                    "estado": fila[6],
                    "fecha_solicitud": fila[7],
                    "usuario_id": fila[8]
                } for fila in filas
            ]

            return jsonify({
                "success": True,
                "solicitudes": solicitudes
            }), 200

        except Exception as e:
            return jsonify({
                "success": False,
                "message": str(e)
            }), 500
        
        finally:
                cursor.close()
                connection.close()
