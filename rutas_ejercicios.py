from fastapi import APIRouter, Depends,HTTPException
import modelos
import conexion
from sqlalchemy.orm import Session
import clases
import seguridad

router=APIRouter()

@router.post("/v1/ejerciciosrutina/{rutina_id}",status_code=201)
def cargar_nuevo_ejercicio(datos: clases.nuevoEjercicio,
    rutina_id:int,
    db: Session=Depends(conexion.get_db),
    actual: modelos.usuarios=Depends(seguridad.requiere_rol(modelos.nombreroles.profesor,modelos.nombreroles.dueno))):

    rutina_existe=db.query(modelos.rutina).filter(modelos.rutina.id==rutina_id,
        modelos.rutina.gimnasio_id==actual.gimnasio_id).first()

    if not rutina_existe:
        raise HTTPException(status_code=404,detail="Rutina inexistente")

    nuevo_ejercicio=modelos.ejerciciosrutina(
        ejercicios=datos.ejercicio,
        series=datos.numeros_series,
        repeticiones=datos.rep,
        rutina_id=rutina_id
    )

    db.add(nuevo_ejercicio)
    db.commit()
    db.refresh(nuevo_ejercicio)

    return {"status":"OK","id_asignado":nuevo_ejercicio.id}


@router.get("/v1/rutina/{rutina_id}/ejercicios",status_code=200)
def obtener_ejercicios_de_rutina(rutina_id:int,db:Session=Depends(conexion.get_db),
    actual:modelos.usuarios=Depends(seguridad.requiere_rol(modelos.nombreroles.dueno,modelos.nombreroles.profesor,
        modelos.nombreroles.alumno))):

    rutina_existente=db.query(modelos.rutina).filter(modelos.rutina.id==rutina_id,
        modelos.rutina.gimnasio_id==actual.gimnasio_id).first()

    if not rutina_existente:
        raise HTTPException(status_code=404, detail="Rutina inexistente")

    ejercicios=db.query(modelos.ejerciciosrutina).filter(modelos.ejerciciosrutina.rutina_id==rutina_id).all()

    return[
        {
            "id": ej.id,
            "nombre_del_ejercicio": ej.ejercicios,
            "series": ej.series,
            "repeticiones": ej.repeticiones
        } for ej in ejercicios
    ]

@router.delete("/v1/ejerciciosrutina/{ejercicio_id}", status_code=200)
def eliminar_ejercicio_individual(ejercicio_id: int, db: Session=Depends(conexion.get_db),
    actual:modelos.usuarios=Depends(seguridad.requiere_rol(modelos.nombreroles.dueno,modelos.nombreroles.profesor))):

    ejercicio=db.query(modelos.ejerciciosrutina).join(modelos.rutina).filter(
        modelos.ejerciciosrutina.id==ejercicio_id,
        modelos.rutina.gimnasio_id==actual.gimnasio_id
    ).first()

    if not ejercicio:
        raise HTTPException(status_code=404, detail="El ejercicio no existe.")

    db.delete(ejercicio)
    db.commit()

    return {"status": "OK", "detalle": "Ejercicio eliminado correctamente"}