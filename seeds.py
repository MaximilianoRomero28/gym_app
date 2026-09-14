from conexion import sesion_local
import modelos

db=sesion_local()

try:
    rol_1=modelos.roles(nombre=modelos.nombreroles.dueno)
    rol_2=modelos.roles(nombre=modelos.nombreroles.recepcionista)
    rol_3=modelos.roles(nombre=modelos.nombreroles.profesor)
    rol_4=modelos.roles(nombre=modelos.nombreroles.alumno)

    db.add(rol_1)
    db.add(rol_2)
    db.add(rol_3)
    db.add(rol_4)

    db.commit()

    print("Base de datos sembrada")
finally:
    db.close()