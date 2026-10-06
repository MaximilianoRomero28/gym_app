import conexion 
import modelos


db=conexion.sesion_local()

try:

    for nombre_rol in modelos.nombreroles:
        existe=db.query(modelos.roles).filter(
            modelos.roles.nombre==nombre_rol
        ).first()
        if not existe:
            db.add(modelos.roles(nombre=nombre_rol))
            print(f"Rol creado: {nombre_rol.value}")
    

    db.commit()

    print("Base de datos sembrada")
finally:
    db.close()