from fastapi import Depends,APIRouter
from sqlalchemy.orm import Session
import modelos
import conexion
from sqlalchemy import DateTime

router=APIRouter()

@router.post("/v1/rutina",status_code=201)

def cargar_nueva_rutina(nombre:str,fecha:DateTime,
    db: Session=Depends(conexion.get_db)):
    nueva_rutina=modelos.rutina(
        nombre_rutina=nombre,
        fecha_creacion=fecha
    )

    db.add(nueva_rutina)
    db.commit()
    db.refresh(nueva_rutina)

    return({"status":"OK","id_asignado":nueva_rutina.id}),201