from fastapi import Depends,APIRouter,HTTPException
from sqlalchemy.orm import Session
import modelos
import conexion
from sqlalchemy import DateTime

router=APIRouter()

@router.post("/v1/rutina",status_code=201)
def cargar_nueva_rutina(nombre_rutina:str, profesor_id:int,
    gimnasio_id:int,alumno_id:int,db: Session=Depends(conexion.get_db)):

    alumno_existe=db.query(modelos.usuarios).filter(modelos.usuarios.id==alumno_id).first()

    if not alumno_existe:
        raise HTTPException(status_code=404,detail="Alumno inexistente")

    profesor_existe=db.query(modelos.usuarios).filter(modelos.usuarios.id==profesor_id).first()

    if not profesor_existe:
        raise HTTPException(status_code=404,detail="Profesor inexistente")

    gimnasio_existe=db.query(modelos.gimnasios).filter(modelos.gimnasios.id==gimnasio_id).first()

    if not gimnasio_existe:
        raise HTTPException(status_code=404,detail="Gimnasio inexistente")

    fecha_actual=DateTime.utcnow()
    
    nueva_rutina=modelos.rutina(
        nombre=nombre_rutina,
        fecha_creacion=fecha_actual,
        alumno_id=alumno_id,
        profesor_id=profesor_id,
        gimnasio_id=gimnasio_id
    )

    db.add(nueva_rutina)
    db.commit()
    db.refresh(nueva_rutina)

    return({"status":"OK","id_asignado":nueva_rutina.id}),201