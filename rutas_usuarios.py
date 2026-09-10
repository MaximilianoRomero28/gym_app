from fastapi import Depends,APIRouter
import conexion
import modelos
from sqlalchemy.orm import Session
from seguridad import hashear_contrasena


router=APIRouter()


@router.post("/v1/usuarios/alumnos",status_code=201)
def crear_nuevo_usuario(nombre:str,email:str,contrasena:str,
    gimnasio_id=int,db: Session=Depends(conexion.get_db)):

    gimnasio_existente=db.query(modelos.gimnasios).filter(modelos.gimnasios.id==gimnasio_id).first()
    
    if not gimnasio_existente:
        return ("El gimnasio especificado no existe en el sistema"),404

    clave_cifrada=hashear_contrasena(contrasena)
    

    nuevo_usuario=modelos.usuarios(
        nombre_usuario=nombre,
        email=email,
        contrasena_hasheada=clave_cifrada,
        esta_activo=True,
        gimnasio_id=gimnasio_id,
        rol="Alumno"
    )

    

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return({"status":"OK","id_asignado":nuevo_usuario.id}),201