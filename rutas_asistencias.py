import modelos
from fastapi import Depends,APIRouter,HTTPException
import conexion
from sqlalchemy.orm import  Session
from datetime import datetime

router=APIRouter()

@router.post("/v1/asistencias/fichar",status_code=201)
def asistencia_alumno(email:str,gimnasio_id:int,db: Session=Depends(conexion.get_db)):

    usuario_encontrado=db.query(modelos.usuarios).filter(
        modelos.usuarios.email==email,
        modelos.usuarios.gimnasio_id==gimnasio_id).first()

    if usuario_encontrado.rol_relacion.nombre.value=="Alumno":
        ultimo_pago=db.query(modelos.pagos).filter(modelos.pagos.alumno_id==usuario_encontrado.id).order_by(
           modelos.pagos.fecha_vencimiento.desc()).first()
        if not ultimo_pago or ultimo_pago.fecha_vencimiento<datetime.utcnow():
            raise HTTPException(status_code=403,detail="Acceso denegado: Regularice su cuota en administración")

    fecha_actual=datetime.utcnow()

    nueva_asistencia=modelos.asistencias(
        fecha_asistencia=fecha_actual,
        alumno_id=usuario_encontrado.id,
        gimnasio_id=gimnasio_id
    )

    db.add(nueva_asistencia)
    db.commit()

    return ({"status":"ACCESO_PERMITIDO","nombre":usuario_encontrado.nombre_usuario})