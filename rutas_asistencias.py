import modelos
from fastapi import Depends,APIRouter,HTTPException
import conexion
from sqlalchemy.orm import  Session
from datetime import datetime,timedelta
import obtener_rutina
import seguridad
import func_auxiliares
from sqlalchemy import func

router=APIRouter()

def registrar_asistencia(db: Session, alumno: modelos.usuarios):
    if not alumno.esta_activo:
        raise HTTPException(status_code=423,
            detail="Tu cuenta ha sido desactivada. Por favor comunícate con la administración")

    ahora = datetime.utcnow()
    ultimo_pago = db.query(modelos.pagos).filter(
        modelos.pagos.alumno_id == alumno.id,
        modelos.pagos.gimnasio_id == alumno.gimnasio_id,
    ).order_by(modelos.pagos.fecha_vencimiento.desc()).first()

    if not ultimo_pago or ultimo_pago.fecha_vencimiento < ahora:
        raise HTTPException(status_code=403,
            detail="Acceso denegado: Regularice su cuota en administración")

    db.add(modelos.asistencias(
        fecha_asistencia=ahora,
        alumno_id=alumno.id,
        gimnasio_id=alumno.gimnasio_id,
    ))
    db.commit()
    return {"status": "ACCESO_PERMITIDO", "nombre": alumno.nombre_usuario}

@router.post("/v1/asistencias/fichar",status_code=201)
def fichar_alumno(
    db: Session = Depends(conexion.get_db),
    actual: modelos.usuarios = Depends(seguridad.requiere_rol(modelos.nombreroles.alumno)),
):
    return registrar_asistencia(db, actual)

@router.post("/v1/asistencias/fichar-por-email", status_code=201)
def fichar_por_email(
    email: str,
    db: Session = Depends(conexion.get_db),
    actual: modelos.usuarios = Depends(seguridad.DUENO_O_RECEPCION),
):
    alumno = db.query(modelos.usuarios).filter(
        modelos.usuarios.email == email.strip().lower(),
        modelos.usuarios.gimnasio_id == actual.gimnasio_id,
    ).first()
    if not alumno or alumno.rol_relacion.nombre != modelos.nombreroles.alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    return registrar_asistencia(db, alumno)

@router.get("/v1/gimnasios/aforo", status_code=200)
def obtener_aforo_tiempo_real(actual:modelos.usuarios=Depends(seguridad.obtener_usuario_actual),db: Session=Depends(conexion.get_db)):

    hace_dos_horas=datetime.utcnow()-timedelta(hours=2)

    personas_activas = db.query(
        func.count(func.distinct(modelos.VisitasSalon.alumno_id))
    ).filter(
        modelos.VisitasSalon.gimnasio_id == actual.gimnasio_id,
        modelos.VisitasSalon.fecha_ingreso >= hace_dos_horas,
    ).scalar()

    gimnasio = db.query(modelos.gimnasios).filter(
        modelos.gimnasios.id == actual.gimnasio_id).first()
    capacidad_maxima = gimnasio.capacidad_maxima if gimnasio and gimnasio.capacidad_maxima else 50

    porcentaje = min(int((personas_activas / capacidad_maxima) * 100), 100)

    if porcentaje < 40:
        estado = "Tranquilo"
    elif porcentaje < 75:
        estado = "Normal"
    else:
        estado = "Muy lleno"

    return {
        "personas_adentro": personas_activas,
        "capacidad_maxima": capacidad_maxima,
        "porcentaje_ocupacion": porcentaje,
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
