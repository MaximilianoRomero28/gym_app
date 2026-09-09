from fastapi import FastAPI, Depends
import modelos
import rutas_gimnasio
from sqlalchemy.orm import Session

@rutas_gimnasio.router.post("/v1/ejerciciosrutina",status_code=201)


def cargar_nuevo_ejercicio(ejercicio:str,numeros_series:int,rep:int,
    db: Session=Depends(rutas_gimnasio.get_db)):
    nuevo_ejercicio=modelos.ejerciciosrutina(
        ejercicios=ejercicio,
        series=numeros_series,
        repeticiones=rep
    )

    db.add()
    db.commit()
    db.refresh()

    return({"status":"OK","id_asignado":nuevo_ejercicio.id}),201
    