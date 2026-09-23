from fastapi import HTTPException,Depends,APIRouter
import conexion
import modelos
from sqlalchemy.orm import Session
import obtener_rutina
from datetime import datetime

router=APIRouter()

@router.post("/v1/marcas-personales",status_code=201)
def registrar_marcas_personales(ejercicio:str,peso:float,reps:int,
    db: Session=Depends(conexion.get_db),
    usuario_actual: modelos.usuarios= Depends(obtener_rutina.obtener_usuario_actual)):

    fecha_hoy= datetime.utcnow()

    nueva_marca=modelos.MarcasPersonales(
        ejercicio_nombre=ejercicio,
        peso_kg=peso,
        repeticiones=reps,
        fecha_registro=fecha_hoy,
        usuario_id=int(usuario_actual.id),
        gimnasio_id=int(usuario_actual.gimnasio_id)
    )

    db.add(nueva_marca)
    db.commit()
    db.refresh(nueva_marca)

    return {"status":"RECORD_GUARDADO", "id_asignado": nueva_marca.id, "ejercicio": nueva_marca.ejercicio_nombre}


@router.get("/v1/marcas-personales/historial",status_code=200)
def obtener_historial_marcas(db: Session=Depends(conexion.get_db),
    usuario_actual: modelos.usuarios=Depends(obtener_rutina.obtener_usuario_actual)):

    alumno_id_int=int(usuario_actual.id)

    historial=db.query(modelos.MarcasPersonales).filter(
        modelos.MarcasPersonales.usuario_id==alumno_id_int
    ).order_by(modelos.MarcasPersonales.fecha_registro).all()

    if historial is None:
        raise HTTPException(status_code=404,detail="No hay marcas en tu historial.")

    return [
        {
            "id": marca.id,
            "ejercicio": marca.ejercicio_nombre,
            "peso": marca.peso_kg,
            "repeticiones": marca.repeticiones,
            "fecha": marca.fecha_registro.strftime("%Y-%m-%d")
        } for marca in historial
    ]