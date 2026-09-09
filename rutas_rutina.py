from fastapi import Depends
from sqlalchemy.orm import Session
import modelos
import rutas_gimnasio
from sqlalchemy import DateTime

@rutas_gimnasio.router.post("/v1/rutina",status_code=201)

def cargar_nueva_rutina(nombre:str,fecha:DateTime,
    db: Session=Depends(rutas_gimnasio.get_db)):
    nueva_rutina=modelos.rutina(
        nombre_rutina=nombre,
        fecha_creacion=fecha
    )

    db.add()
    db.commit()
    db.refresh()

    return({"status":"OK","id_asignado":nueva_rutina.id}),201