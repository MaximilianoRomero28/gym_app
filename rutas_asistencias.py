import modelos
from fastapi import Depends,APIRouter,HTTPException
import conexion
from sqlalchemy.orm import  Session
from datetime import datetime,timedelta
import obtener_rutina

router=APIRouter()

@router.post("/v1/asistencias/fichar",status_code=201)
def asistencia_alumno(email:str,gimnasio_id:int,
    db: Session=Depends(conexion.get_db)
    ):

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

@router.get("/v1/gimnasios/{gimnasio_id}/aforo", status_code=200)
def obtener_aforo_tiempo_real(gimnasio_id:int,db: Session=Depends(conexion.get_db)):

    hace_dos_horas=datetime.utcnow()-timedelta(hours=2)

    personas_activas=db.query(modelos.asistencias).filter(
        modelos.VisitasSalon.gimnasio_id==gimnasio_id, 
        modelos.VisitasSalon.fecha_ingreso>=hace_dos_horas).count()

    capacidad_maxima=50

    porcentaje=min(int((personas_activas/capacidad_maxima)*100),100)

    if porcentaje < 40:
        estado ="Tranquilo"
    elif porcentaje<75:
        estado="Normal"
    else:
        estado= "Muy lleno"

    return {
        "personas_adentro": personas_activas,
        "capacidad_maxima": capacidad_maxima,
        "porcentaje_ocupacion":porcentaje,
        "estado_texto": estado,
    }

@router.post("/v1/aforo/asistencia/fichar", status_code=201)
def fichar_ingreso_gimnasio(db:Session=Depends(conexion.get_db),
    usuario_actual: modelos.usuarios=Depends(obtener_rutina.obtener_usuario_actual)):

    fecha_hoy=datetime.utcnow()

    nueva_visita= modelos.VisitasSalon(
        fecha_ingreso=fecha_hoy,
        alumno_id=int(usuario_actual.id),
        gimnasio__id=int(usuario_actual.gimnasio_id)
    )

    db.add(nueva_visita)
    db.commit()
    db.refresh(nueva_visita)

    return {
        "status": "INGRESO_FISICO_OK",
        "visita_id": nueva_visita.id,
        "hora": nueva_visita.fecha_ingreso.strftime("%H: %M:%S")
    }

@router.get("/v1/asistencia/metas_mensuales",status_code=200)
def obtener_metas_asistencia_mes(db: Session=Depends(conexion.get_db),
    usuario_actual: modelos.usuarios=Depends(obtener_rutina.obtener_usuario_actual)):

    alumno_id_int= int(usuario_actual.id)

    fecha_hoy=datetime.utcnow()
    primer_dia_mes=datetime(fecha_hoy.year, fecha_hoy.month, 1)

    visitas_del_mes= db.query(modelos.VisitasSalon).filter(
        modelos.VisitasSalon.alumno_id==alumno_id_int,
        modelos.VisitasSalon.fecha_ingreso >= primer_dia_mes).order_by(
            modelos.VisitasSalon.fecha_ingreso.asc()).all()

    dias_asistidos= sorted(list(set([v.fecha_ingreso.strftime("%Y-&m-&d")  for v in visitas_del_mes])))

    return {
        "tota_dias_mes": len(dias_asistidos),
        "fechas_asistidas": dias_asistidos
    }
