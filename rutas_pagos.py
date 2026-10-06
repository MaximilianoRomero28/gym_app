from datetime import datetime,timedelta, date
import modelos
import conexion
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
import obtener_rutina
from sqlalchemy import func
import clases
import seguridad
import func_auxiliares

router=APIRouter()

@router.post("/v1/pagos",status_code=201)
def cargar_pago(datos: clases.nuevoPago,
        db: Session=Depends(conexion.get_db),
        actual: modelos.usuarios=Depends(seguridad.DUENO_O_RECEPCION)):

    alumno_existente=func_auxiliares.buscar_usaurio_del_gimnasio(db,datos.alumno_id,actual.gimnasio_id)

    if alumno_existente.rol_relacion.nombre != modelos.nombreroles.alumno:
        raise HTTPException(status_code=400,detail="El usuario no es un alumno")

    plan_seleccionado=db.query(modelos.Planes).filter(
        modelos.Planes.id==datos.plan_id, modelos.Planes.gimnasio_id==actual.gimnasio_id).first()

    if not plan_seleccionado:
        raise HTTPException(status_code=404,detail="Plan inexistente")
    

    fecha_hoy=datetime.utcnow()

    fecha_vencimiento=fecha_hoy+timedelta(days=plan_seleccionado.dias_duracion)

    nuevo_pago=modelos.pagos(
        monto=plan_seleccionado.precio,
        fecha_pago=fecha_hoy,
        fecha_vencimiento=fecha_vencimiento,
        alumno_id=datos.alumno_id,
        gimnasio_id=actual.gimnasio_id,
        metodo_pago=datos.metodo_pago
    )

    db.add(nuevo_pago)
    db.commit()
    db.refresh(nuevo_pago)

    return {"status":"PAGO_REGISTRADO","recibo_id":nuevo_pago.id,"vence_el":nuevo_pago.fecha_vencimiento, "metodo_pago_registrado": nuevo_pago.metodo_pago}

@router.get("/v1/pagos/alumno", status_code=200)
def obtener_historial_pagos_alumno(
    db: Session = Depends(conexion.get_db), 
    usuario_actual: modelos.usuarios = Depends(obtener_rutina.obtener_usuario_actual)
    ): 

    alumno_id_int = int(usuario_actual.id)

    
    historial = db.query(modelos.pagos).filter(
        modelos.pagos.alumno_id == alumno_id_int
    ).order_by(modelos.pagos.id.desc()).all()

   
    return [
        {
            "id": pago.id,
            "monto": pago.monto,
            "fecha_pago": pago.fecha_pago.strftime("%Y-%m-%d"),
            "fecha_vencimiento": pago.fecha_vencimiento.strftime("%Y-%m-%d")
        } for pago in historial
    ]


@router.get("/v1/admin/pagos/recaudacion",status_code=200)
def Obtener_recaudacion_caja_mensual(
    actual: modelos.usuarios=Depends(seguridad.SOLO_DUENO), db: Session=Depends(conexion.get_db)
):

    fecha_hoy=datetime.utcnow()

    primer_dia_mes=datetime(fecha_hoy.year,fecha_hoy.month, 1)

    pagos_del_mes=db.query(modelos.pagos).filter(modelos.pagos.gimnasio_id==actual.gimnasio_id,
        modelos.pagos.fecha_pago >= primer_dia_mes).all()

    total_recaudado=sum([p.monto for p in pagos_del_mes])

    return {
        "status": "CAJA_CALCULADA",
        "mes_evaluado": fecha_hoy.strftime("&B %Y"),
        "cantidad_transacciones": len(pagos_del_mes),
        "total_efectivo_ingresado": total_recaudado
    }

@router.get("/v1/admin/pagos/alumno/{alumno_id}",status_code=200)
def obtener_historial_pagos_alumno(
    alumno_id:int,actual:modelos.usuarios=Depends(seguridad.DUENO_O_RECEPCION), db:Session=Depends(conexion.get_db)
):

    alumno=db.query(modelos.usuarios).filter(
        modelos.usuarios.id==alumno_id,
        modelos.usuarios.gimnasio_id==actual.gimnasio_id
    ).first()

    if not alumno:
        raise HTTPException(status_code=404,detail="Alumno no encontrado en este gimnasio.")

    historial=db.query(modelos.pagos).filter(modelos.pagos.alumno_id==alumno_id,
        modelos.pagos.gimnasio_id==actual.gimnasio_id).order_by(
            modelos.pagos.fecha_pago.desc()
        ).all()

    return [
        {
            "id_recibo": p.id,
            "monto": p.monto,
            "fecha_pago": p.fecha_pago.strftime("%Y-%m-%d %H:%M:%S"),
            "fecha_vencimiento": p.fecha_vencimiento.strftime("%Y-%m-%d"),
            "metodo_pago": p.metodo_pago
        } for p in historial
    ]

@router.get("/v1/admin/finanzas/resumen", status_code=200)
def obtener_resumen_finanzas_gimnasio(
    fecha_desde: date,
    fecha_hasta: date,
    db: Session = Depends(conexion.get_db),
    actual: modelos.usuarios = Depends(seguridad.SOLO_DUENO)
):

    inicio = datetime.combine(fecha_desde, datetime.min.time())
    fin = datetime.combine(
        fecha_hasta + timedelta(days=1),
        datetime.min.time()
    )

    pagos_periodo = db.query(modelos.pagos).filter(
        modelos.pagos.gimnasio_id == actual.gimnasio_id,
        modelos.pagos.fecha_pago >= inicio,
        modelos.pagos.fecha_pago < fin
    ).all()

    total_efectivo = sum(
        p.monto for p in pagos_periodo
        if p.metodo_pago == "Efectivo"
    )

    total_transferencia = sum(
        p.monto for p in pagos_periodo
        if p.metodo_pago == "Transferencia"
    )

    total_debito = sum(
        p.monto for p in pagos_periodo
        if p.metodo_pago == "Débito"
    )

    total_credito = sum(
        p.monto for p in pagos_periodo
        if p.metodo_pago == "Crédito"
    )

    total_general = (
        total_efectivo
        + total_transferencia
        + total_debito
        + total_credito
    )

    alumnos = db.query(modelos.usuarios).filter(
        modelos.usuarios.gimnasio_id == actual.gimnasio_id,
        modelos.usuarios.rol_id == 4
    ).all()

    contador_moroso = 0
    contador_activos_al_dia = 0

    for alu in alumnos:

        ultimo_pago = db.query(modelos.pagos).filter(
            modelos.pagos.alumno_id == alu.id
        ).order_by(
            modelos.pagos.id.desc()
        ).first()

        if ultimo_pago and ultimo_pago.fecha_vencimiento > datetime.utcnow():
            contador_activos_al_dia += 1
        else:
            contador_moroso += 1

    recibos_periodo = db.query(modelos.pagos).join(
        modelos.usuarios,
        modelos.pagos.alumno_id == modelos.usuarios.id
    ).filter(
        modelos.pagos.gimnasio_id == actual.gimnasio_id,
        modelos.pagos.fecha_pago >= inicio,
        modelos.pagos.fecha_pago < fin
    ).order_by(
        modelos.pagos.id.desc()
    ).all()

    lista_movimientos = []

    for r in recibos_periodo:
        lista_movimientos.append({
            "id_recibo": r.id,
            "alumno": r.usuario.nombre_usuario if hasattr(r, "usuario") else "cliente General",
            "monto": r.monto,
            "metodo": r.metodo_pago or "Efectivo",
            "fecha": r.fecha_pago.strftime("%Y-%m-%d %H:%M")
        })

    return {
        "totales": {
            "total_general": total_general,
            "efectivo": total_efectivo,
            "transferencia": total_transferencia,
            "tarjetas": total_debito + total_credito
        },
        "auditoria": {
            "alumnos_al_dia": contador_activos_al_dia,
            "alumnos_morosos": contador_moroso,
            "total_alumnos": len(alumnos)
        },
        "ultimos_movimientos": lista_movimientos
    }