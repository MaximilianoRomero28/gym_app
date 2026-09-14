from fastapi import APIRouter, Depends,HTTPException
import modelos
import conexion
from sqlalchemy.orm import Session

router=APIRouter()

@router.post("/v1/ejerciciosrutina",status_code=201)
def cargar_nuevo_ejercicio(ejercicio:str,numeros_series:int,rep:int,rutina_id:int,
    db: Session=Depends(conexion.get_db)):

    rutina_existe=db.query(modelos.rutina).filter(modelos.rutina.id==rutina_id).first()

    if not rutina_existe:
        raise HTTPException(status_code=404,detail="Rutina inexistente")

    nuevo_ejercicio=modelos.ejerciciosrutina(
        ejercicios=ejercicio,
        series=numeros_series,
        repeticiones=rep,
        rutina_id=rutina_id
    )

    db.add(nuevo_ejercicio)
    db.commit()
    db.refresh(nuevo_ejercicio)

    return {"status":"OK","id_asignado":nuevo_ejercicio.id}
    