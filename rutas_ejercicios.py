from fastapi import APIRouter, Depends
import modelos
import conexion
from sqlalchemy.orm import Session

router=APIRouter()

@router.post("/v1/ejerciciosrutina",status_code=201)

def cargar_nuevo_ejercicio(ejercicio:str,numeros_series:int,rep:int,
    db: Session=Depends(conexion.get_db)):
    nuevo_ejercicio=modelos.ejerciciosrutina(
        ejercicios=ejercicio,
        series=numeros_series,
        repeticiones=rep
    )

    db.add(nuevo_ejercicio)
    db.commit()
    db.refresh(nuevo_ejercicio)

    return({"status":"OK","id_asignado":nuevo_ejercicio.id}),201
    