import modelos
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

def normalizar_email(email:str)-> str:
    return email.strip().lower()

def validar_puede_gestionar(actual:modelos.usuarios,rol_objetivo: modelos.nombreroles):

    if (actual.rol_relacion.nombre==modelos.nombreroles.recepcionista and
        rol_objetivo not in (modelos.nombreroles.profesor,modelos.nombreroles.alumno)):
        raise HTTPException(status_code=403, detail="No podés gestionar usuarios")

def buscar_usaurio_del_gimnasio(db:Session, usaurio_id:int,gimnasio_id:int) -> modelos.usuarios:

    usuario=db.query(modelos.usuarios).filter(modelos.usuarios.id==usaurio_id,
        modelos.usuarios.gimnasio_id==gimnasio_id).first()

    if not usuario:
        raise HTTPException(status_code=404,detail="Usuario no encontrado")

    return usuario


ZONA_LOCAL= ZoneInfo("America/Argentina/Buenos_Aires")
DIA_VENCIMIENTO=10

def calcular_vencimiento_dia_10(base_utc: datetime, meses: int = 1) -> datetime:
   
    
    base_local = base_utc.replace(tzinfo=timezone.utc).astimezone(ZONA_LOCAL)
 
    indice = base_local.year * 12 + (base_local.month - 1) + meses
    anio, mes_cero = divmod(indice, 12)
 
    
    vence_local = datetime(anio, mes_cero + 1, DIA_VENCIMIENTO, 23, 59, 59,
        tzinfo=ZONA_LOCAL)
    return vence_local.astimezone(timezone.utc).replace(tzinfo=None)
 
 
def meses_del_plan(dias_duracion: int) -> int:
   
    return max(1, round(dias_duracion / 30))