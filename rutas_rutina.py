from fastapi import Depends,APIRouter,HTTPException
from sqlalchemy.orm import Session
import modelos
import conexion
from datetime import datetime
import clases
import seguridad

router=APIRouter()

@router.post("/v1/rutina",status_code=201)
def cargar_nueva_rutina(datos: clases.nuevaRutina,db: Session=Depends(conexion.get_db),
    actual: modelos.usuarios=Depends(seguridad.requiere_rol(modelos.nombreroles.dueno,modelos.nombreroles.profesor))):

    alumno_existe=db.query(modelos.usuarios).filter(modelos.usuarios.id==datos.alumno_id,
        modelos.usuarios.gimnasio_id==actual.gimnasio_id).first()

    if not alumno_existe:
        raise HTTPException(status_code=404,detail="Alumno inexistente")

    profesor_existe=db.query(modelos.usuarios).filter(modelos.usuarios.id==datos.profesor_id).first()

    if not profesor_existe:
        raise HTTPException(status_code=404,detail="Profesor inexistente")

    gimnasio_existe=db.query(modelos.gimnasios).filter(modelos.gimnasios.id==actual.gimnasio_id).first()

    if not gimnasio_existe:
        raise HTTPException(status_code=404,detail="Gimnasio inexistente")

    fecha_actual=datetime.utcnow()
    
    nueva_rutina=modelos.rutina(
        nombre_rutina=datos.nombre_rutina,
        fecha_creacion=fecha_actual,
        alumno_id=datos.alumno_id,
        profesor_id=datos.profesor_id,
        gimnasio_id=actual.gimnasio_id
    )

    db.add(nueva_rutina)
    db.commit()
    db.refresh(nueva_rutina)

    return({"status":"OK","id_asignado":nueva_rutina.id})

@router.delete("/v1/rutina/{rutina_id}", status_code=200)
def eliminar_rutina_completa(rutina_id: int, db:Session=Depends(conexion.get_db),
    actual: modelos.usuarios=Depends(seguridad.requiere_rol(modelos.nombreroles.dueno,modelos.nombreroles.profesor))):

    rutina= db.query(modelos.rutina).filter(
        modelos.rutina.id==rutina_id,
        modelos.rutina.gimnasio_id==actual.gimnasio_id).first()

    if not rutina:
        raise HTTPException(status_code=404, detail="La rutina no existe")

    db.query(modelos.ejerciciosrutina).filter(modelos.ejerciciosrutina.rutina_id==rutina.id).delete()

    db.delete(rutina)
    db.commit()

    return {"status": "OK", "detalle": "Rutina y sus sub-ejercicios eliminados con éxito"}