from fastapi import APIRouter,HTTPException,Depends
from datetime import timezone
from sqlalchemy.orm import Session
import conexion
import modelos
import clases
import seguridad

router=APIRouter()

@router.post("/v1/soporte/consulta",status_code=201)
def enviar_consulta_soporte(datos: clases.nuevaConsultaSchema,
    db: Session=Depends(conexion.get_db),
    actual: modelos.usuarios=Depends(seguridad.SOLO_DUENO)):

    nueva_consulta= modelos.consultasSoporte(
        gimnasio_id=actual.gimnasio_id,
        asunto= datos.asunto,
        mensaje=datos.mensaje
    )

    db.add(nueva_consulta)
    db.commit()

    return {
        "status": "OK",
        "detail": "Consulta enviada a Soporte"
    }

@router.get("/v1/plataforma/soporte/consultas",status_code=200)
def listar_consultas_pendiente(db: Session=Depends(conexion.get_db),
    admin_actual=Depends(seguridad.obtener_superadmin_actual)):

    filas= (db.query(modelos.consultasSoporte, modelos.gimnasios.nombre_gimnasio)
        .join(modelos.gimnasios,modelos.consultasSoporte.gimnasio_id==modelos.gimnasios.id)
        .order_by(modelos.consultasSoporte.fecha_envio.desc()).all())

    return [{
        "id": t.id,
        "gimnasio_id": t.gimnasio_id,
        "nombre_gimnasio": nombre_gimnasio,
        "asunto": t.asunto,
        "mensaje": t.mensaje,
        "fecha_envio": t.fecha_envio.isoformat()+"Z",
        "esta_resuelto": t.esta_resuelto,
    } 
    for t, nombre_gimnasio in filas
    ]

@router.get("/v1/web/soporte/consultas",status_code=200)
def listar_consultas_pendiente_web(db: Session=Depends(conexion.get_db),
    actual:modelos.usuarios=Depends(seguridad.SOLO_DUENO)):

    filas= db.query(modelos.consultasSoporte).filter(
        modelos.consultasSoporte.gimnasio_id==actual.gimnasio_id
    ).all()

    return [{
        "id": t.id,
        "gimnasio_id": t.gimnasio_id,
        "asunto": t.asunto,
        "mensaje": t.mensaje,
        "fecha_envio": t.fecha_envio.isoformat()+"Z",
        "esta_resuelto": t.esta_resuelto,
    } 
    for t in filas
    ]