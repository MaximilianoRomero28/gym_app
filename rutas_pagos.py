from datetime import datetime,timedelta
import modelos
import conexion
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session

router=APIRouter()

@router.post("/v1/pagos",status_code=201)
def verificacion_pago(alumno_id:int,monto:float,gimnasio_id:int,cuotas_pagas:int,
        db: Session=Depends(conexion.get_db)):

    alumno_existente=db.query(modelos.usuarios).filter(modelos.usuarios.id==alumno_id).first()

    if not alumno_existente:
        raise HTTPException(status_code=404,detail="Alumno no encontrado")

    fecha_hoy=datetime.utcnow()

    fecha_vencimiento=fecha_hoy+timedelta(days=30 * cuotas_pagas)

    nuevo_pago=modelos.pagos(
        monto=monto,
        fecha_pago=fecha_hoy,
        fecha_vencimiento=fecha_vencimiento,
        alumno_id=alumno_id,
        gimnasio_id=gimnasio_id
    )

    db.add(nuevo_pago)
    db.commit()
    db.refresh(nuevo_pago)

    return {"status":"PAGO_REGISTRADO","recibo_id":nuevo_pago.id,"vence_el":nuevo_pago.fecha_vencimiento}