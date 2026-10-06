from fastapi import APIRouter, Depends,HTTPException
from sqlalchemy.orm import Session
import conexion
import  modelos
import clases
import func_auxiliares
import seguridad

router=APIRouter()


@router.post("/v1/gimnasios",status_code=201,dependencies=[Depends(seguridad.exigir_clave_admin)])
def crear_nuevo_gimnasio(datos: clases.nuevoGimnasio,db: Session=Depends(conexion.get_db)):

    email=func_auxiliares.normalizar_email(datos.email)

    if db.query(modelos.usuarios).filter(
        modelos.usuarios.email==email
    ).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    rol_dueno=db.query(modelos.roles).filter(modelos.roles.nombre==modelos.nombreroles.dueno).first()

    nuevo_gym=modelos.gimnasios(
        nombre_gimnasio=datos.nombre_gimnasio,
        ubicacion=datos.ubicacion,
        esta_activo=True
        )

    db.add(nuevo_gym)

    db.flush()

    dueno=modelos.usuarios(
        nombre_usuario= datos.nombre_dueno,
        email=email,
        contrasena_hasheada=seguridad.hashear_contrasena(datos.contrasena),
        esta_activo=True,
        gimnasio_id=nuevo_gym.id,
        rol_id=rol_dueno.id
    )

    db.add(dueno)
    db.commit()

    return ({"status":"OK","gimnasio_id":nuevo_gym.id,"dueno_id":dueno.id})