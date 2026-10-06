from fastapi import APIRouter,Depends,HTTPException
import modelos
import conexion
from datetime import datetime
from sqlalchemy.orm import Session
import clases
import seguridad

router=APIRouter()

@router.post("/v1/admin/planes", status_code=201)
def crear_nuevo_plan(datos: clases.nuevoPlan,db: Session=Depends(conexion.get_db),
    actual: modelos.usuarios=Depends(seguridad.SOLO_DUENO)):

    if datos.dias_duracion<=0:
        raise HTTPException(status_code=400, detail="La duración debe ser mayor a 0 días")

    if datos.precio <= 0:
        raise HTTPException(status_code=400, detail="El precio debe ser mayor que 0")

    nuevo_plan= modelos.Planes(
        nombre_plan=datos.nombre_plan,
        precio=datos.precio,
        dias_duracion=datos.dias_duracion,
        gimnasio_id=actual.gimnasio_id
    )

    db.add(nuevo_plan)
    db.commit()
    db.refresh(nuevo_plan)

    return {
        "status": "PLAN_CREADO", "id_asignado": nuevo_plan.id,
        "nombre": nuevo_plan.nombre_plan
    }

@router.get("/v1/admin/planes/obtener",status_code=200)
def lista_planes_gimnasio(actual:modelos.usuarios=Depends(seguridad.SOLO_DUENO), db:Session=Depends(conexion.get_db)):

    lista_planes=db.query(modelos.Planes).filter(
        modelos.Planes.gimnasio_id==actual.gimnasio_id).order_by(
            modelos.Planes.id.asc()).all()

    return [
        {
            "id": p.id,
            "nombre_plan": p.nombre_plan,
            "precio": p.precio,
            "duracion_dias": p.dias_duracion
        } for p in lista_planes
    ]

@router.put("/v1/admin/gimnasios/capacidad",status_code=200)
def modificar_capacidad_gimnasios( nueva_capacidad:int, db:Session=Depends(conexion.get_db),
    actual:modelos.usuarios=Depends(seguridad.SOLO_DUENO)):

    if nueva_capacidad <=0:
        raise HTTPException(status_code=400,detail="La capacidad debe ser mayor a 0")

    gimnasio=db.query(modelos.gimnasios).filter(modelos.gimnasios.id==actual.gimnasio_id).first()

    if not gimnasio:
        raise HTTPException(status_code=404, detail="Gimnasio no encontrado")

    gimnasio.capacidad_maxima=nueva_capacidad

    db.commit()

    return {
        "status": "CAPACIDAD_ACTUALIZADA",
        "gimnasio": gimnasio.nombre_gimnasio,
        "nueva_capacidad_maxima": gimnasio.capacidad_maxima
    }

@router.put("/v1/admin/planes/{plan_id}/precio",status_code=200)
def modificar_precio_plan(plan_id: int, nuevo_precio:int, db:Session=Depends(conexion.get_db),
    actual: modelos.usuarios=Depends(seguridad.SOLO_DUENO)):

    if nuevo_precio<=0:
        raise HTTPException(status_code=400,detail="El precio debe ser mayor a 0")

    plan_encontrado=db.query(modelos.Planes).filter(
        modelos.Planes.id==plan_id,
        modelos.Planes.gimnasio_id==actual.gimnasio_id
    ).first()

    if not plan_encontrado:
        raise HTTPException(status_code=404, detail="El plan comercial no existe")

    plan_encontrado.precio=nuevo_precio

    db.commit()
    db.refresh(plan_encontrado)

    return {"status": "PRECIO_ACTUALIZADO", "nuevo_precio": plan_encontrado.precio}

@router.delete("/v1/planes/{plan_id}",status_code=200)
def eliminar_plan_comercial(
    plan_id: int,
    db:Session=Depends(conexion.get_db),
    usuario_actual: modelos.usuarios=Depends(seguridad.DUENO_O_RECEPCION)
):

    plan=db.query(modelos.Planes).filter(modelos.Planes.id==plan_id,
        modelos.Planes.gimnasio_id==usuario_actual.gimnasio_id).first()

    if not plan:
        raise HTTPException(status_code=404, detail="El plan comercial seleccionado no existe")

    try:
        db.delete(plan)
        db.commit()

        return{
            "status": "OK", "detail": f"Plan '{plan.nombre_plan}' eliminado con éxito"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"No se puede eliminar el plan")