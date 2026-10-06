import getpass
import conexion
import modelos
import seguridad

def main():
    db=next(conexion.get_db())

    try:
        nombre=input("Nombre: ").strip()
        email=input("Email: ").strip()
        contrasena=getpass.getpass("Contraseña (mínimo 10 caracteres): ")
        repetir= getpass.getpass("Repetir contraseña: ")

        if not nombre or not email:
            print("El nombre y el email son obligatorios")
            return

        if len(contrasena)<10:
            print("La contraseña debe tener al menos 10 caracteres")
            return

        if contrasena != repetir:
            print("Las contraseñas deben coincidir")
            return

        ya_existe=db.query(modelos.administradores).filter(
            modelos.administradores.email==email
        ).first()

        if ya_existe:
            print("Ya existe un administrador con este mail")
            return

        admin=modelos.administradores(
            nombre=nombre,
            email=email,
            contrasena_hasheada=seguridad.hashear_contrasena(contrasena),
            esta_activo=True,
        )
        db.add(admin)
        db.commit()
        print(f"Administrador creado: {email}")
    finally:
        db.close()

if __name__=="__main__":
    main()