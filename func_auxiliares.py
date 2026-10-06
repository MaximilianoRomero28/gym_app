import modelos
from fastapi import HTTPException
from sqlalchemy.orm import Session


def normalizar_email(email:str)-> str:
    return email.strip().lower()

def validar_puede_gestionar(actual:modelos.usuarios,rol_objetivo: modelos.nombreroles):

    if (actual.rol_relacion.nombre==modelos.nombreroles.recepcionista and
        rol_objetivo not in (modelos.nombreroles.profesor,modelos.nombreroles.alumno)):
        raise HTTPException(status_code=403, detail="No podés gestionar usuarios")

def buscar_usaurio_del_gimnasio(db:Session, usaurio_id:int,gimnasio_id:int) -> modelos.usuarios:

    usuario=db.query(modelos.usuarios).filter(modelos.usuarios.id==usaurio_id,
        modelos.usuarios.gimnasio_id==gimnasio_id).first()

    if not usuario:
        raise HTTPException(status_code=404,detail="Usuario no encontrado")

    return usuario