from .Models.modelo_db import BaseDatos 
import sqlite3

db = BaseDatos()

# Función para obtener la conexión a la base de datos
def get_db():
    conn = sqlite3.connect(db.ruta_db)
    conn.row_factory = sqlite3.Row  # Permite acceder a las columnas por nombre
    return conn

def check_database_connection():
    """Función para verificar la conexión y estructura de la base de datos"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Obtener todas las tablas de la base de datos
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tablas = cursor.fetchall()
        
        # Obtener información detallada de cada tabla
        info_tablas = {}
        for tabla in tablas:
            nombre_tabla = tabla[0]
            cursor.execute(f"PRAGMA table_info({nombre_tabla})")
            columnas = cursor.fetchall()
            info_tablas[nombre_tabla] = [
                {
                    "nombre": col[1],
                    "tipo": col[2],
                    "nullable": not col[3],
                    "pk": col[5]
                } for col in columnas
            ]
        
        # Preparar el mensaje de respuesta
        mensaje = {
            "status": "Conexión exitosa",
            "database_path": conn.path if hasattr(conn, 'path') else "SQLite database",
            "tablas_encontradas": len(tablas),
            "detalle_tablas": info_tablas
        }
        
        # Imprimir en consola para debug
        print("\n=== INFORMACIÓN DE LA BASE DE DATOS ===")
        print(f"Estado: {mensaje['status']}")
        print(f"Base de datos: {mensaje['database_path']}")
        print(f"Número de tablas: {mensaje['tablas_encontradas']}")
        print("\nTablas encontradas:")
        for nombre_tabla, columnas in info_tablas.items():
            print(f"\n{nombre_tabla}:")
            for columna in columnas:
                print(f"  - {columna['nombre']} ({columna['tipo']})")
                print(f"    Nullable: {columna['nullable']}, Primary Key: {columna['pk']}")
        
        return mensaje
        
    except Exception as e:
        error_mensaje = {
            "status": "Error de conexión",
            "error": str(e)
        }
        print("\n=== ERROR EN LA BASE DE DATOS ===")
        print(f"Error: {str(e)}")
        return error_mensaje
    
    finally:
        if 'conn' in locals():
            conn.close()