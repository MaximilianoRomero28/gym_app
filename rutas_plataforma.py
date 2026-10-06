from datetime import datetime, timedelta, timezone
from typing import Optional
 
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session
 
import conexion
import modelos
import seguridad
import modelos

router_login = APIRouter(prefix="/v1/plataforma", tags=["plataforma"])

router = APIRouter(
    prefix="/v1/plataforma",
    tags=["plataforma"],
    dependencies=[Depends(seguridad.obtener_superadmin_actual)],
)

PagoGim = modelos.pagosGimnasios 

class LoginPlataforma(BaseModel):
    email: str
    contrasena: str
 
 
class NuevoGimnasio(BaseModel):
    nombre_gimnasio: str
    ubicacion: str
    nombre_dueno: str
    email_dueno: str
    contrasena_dueno: str = Field(min_length=8)
 
 
class NuevoDueno(BaseModel):
    nombre: str
    email: str
    contrasena: str = Field(min_length=8)
 
 
class NuevoPagoGimnasio(BaseModel):
    gimnasio_id: int
    monto: float = Field(gt=0)
    dias_cubiertos: int = Field(default=30, gt=0)
    metodo_pago: Optional[str] = None
    nota: Optional[str] = None

def ahora_utc() -> datetime:
    """Fecha y hora actual en UTC, sin zona horaria (para poder compararla con la base)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
 
 
def normalizar_email(email: str) -> str:
    return email.strip().lower()
 
 
def obtener_gimnasio_o_404(db: Session, gimnasio_id: int):
    gimnasio = db.query(modelos.gimnasios).filter(modelos.gimnasios.id == gimnasio_id).first()
    if not gimnasio:
        raise HTTPException(status_code=404, detail="Gimnasio no encontrado")
    return gimnasio
 
 
def obtener_rol_dueno(db: Session):
    rol = db.query(modelos.roles).filter(
        modelos.roles.nombre == modelos.nombreroles.dueno).first()
    if not rol:
        raise HTTPException(status_code=500, detail="Falta el rol Dueño en la tabla roles")
    return rol
 
 
def email_ocupado(db: Session, email: str) -> bool:
    return db.query(modelos.usuarios).filter(modelos.usuarios.email == email).first() is not None

@router_login.post("/login",status_code=200)
def login_plataforma(datos: LoginPlataforma, db: Session = Depends(conexion.get_db)):
    admin = seguridad.autenticar_administrador(datos.email, datos.contrasena, db)
    if not admin:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return {
        "access_token": seguridad.crear_token_plataforma(admin),
        "token_type": "bearer",
        "nombre": admin.nombre,
    }

@router.get("/gimnasios",status_code=200)
def listar_gimnasios(db: Session = Depends(conexion.get_db)):
    gimnasios = db.query(modelos.gimnasios).order_by(modelos.gimnasios.id).all()
 
    
    usuarios_activos = dict(
        db.query(modelos.usuarios.gimnasio_id, func.count(modelos.usuarios.id))
        .filter(modelos.usuarios.esta_activo.is_(True))
        .group_by(modelos.usuarios.gimnasio_id)
        .all()
    )
    pagos = {
        gimnasio_id: (total, vencimiento)
        for gimnasio_id, total, vencimiento in db.query(
            PagoGim.gimnasio_id, func.sum(PagoGim.monto), func.max(PagoGim.fecha_vencimiento)
        ).group_by(PagoGim.gimnasio_id).all()
    }
 
    ahora = ahora_utc()
    resultado = []
    for g in gimnasios:
        total, vencimiento = pagos.get(g.id, (0, None))
        resultado.append({
            "id": g.id,
            "nombre": g.nombre_gimnasio,
            "ubicacion": g.ubicacion,
            "activo": bool(g.esta_activo),
            "usuarios_activos": usuarios_activos.get(g.id, 0),
            "total_pagado": total or 0,
            "vence": vencimiento,
            "al_dia": vencimiento is not None and vencimiento >= ahora,
        })
    return resultado
 
 
@router.post("/gimnasios", status_code=201)
def crear_gimnasio(datos: NuevoGimnasio, db: Session = Depends(conexion.get_db)):
   
    email = normalizar_email(datos.email_dueno)
    if email_ocupado(db, email):
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
 
    rol_dueno = obtener_rol_dueno(db)
 
    gimnasio = modelos.gimnasios(
        nombre_gimnasio=datos.nombre_gimnasio,
        ubicacion=datos.ubicacion,
        esta_activo=True,
    )
    db.add(gimnasio)
    db.flush()

    dueno = modelos.usuarios(
        nombre_usuario=datos.nombre_dueno,
        email=email,
        contrasena_hasheada=seguridad.hashear_contrasena(datos.contrasena_dueno),
        esta_activo=True,
        gimnasio_id=gimnasio.id,
        rol_id=rol_dueno.id,
    )
    db.add(dueno)
    db.commit()  
    return {"status": "OK", "gimnasio_id": gimnasio.id, "dueno_id": dueno.id}
 
 
def _cambiar_estado_gimnasio(gimnasio_id: int, activo: bool, db: Session):
    gimnasio = obtener_gimnasio_o_404(db, gimnasio_id)
    gimnasio.esta_activo = activo
    db.commit()
    return {"status": "OK", "id": gimnasio.id, "activo": gimnasio.esta_activo}
 
 
@router.patch("/gimnasios/{gimnasio_id}/desactivar", status_code=200)
def desactivar_gimnasio(gimnasio_id: int, db: Session = Depends(conexion.get_db)):
    
    return _cambiar_estado_gimnasio(gimnasio_id, False, db)
 
 
@router.patch("/gimnasios/{gimnasio_id}/activar",status_code=200)
def activar_gimnasio(gimnasio_id: int, db: Session = Depends(conexion.get_db)):
    return _cambiar_estado_gimnasio(gimnasio_id, True, db)

@router.get("/gimnasios/{gimnasio_id}/duenos")
def listar_duenos(gimnasio_id: int, db: Session = Depends(conexion.get_db)):
    obtener_gimnasio_o_404(db, gimnasio_id)
    duenos = (
        db.query(modelos.usuarios)
        .join(modelos.roles, modelos.usuarios.rol_id == modelos.roles.id)
        .filter(modelos.usuarios.gimnasio_id == gimnasio_id,
                modelos.roles.nombre == modelos.nombreroles.dueno)
        .all()
    )
    return [{"id": d.id, "nombre": d.nombre_usuario, "email": d.email,
             "activo": d.esta_activo} for d in duenos]
 
 
@router.post("/gimnasios/{gimnasio_id}/duenos", status_code=201)
def agregar_dueno(gimnasio_id: int, datos: NuevoDueno, db: Session = Depends(conexion.get_db)):
    obtener_gimnasio_o_404(db, gimnasio_id)
    email = normalizar_email(datos.email)
    if email_ocupado(db, email):
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
 
    dueno = modelos.usuarios(
        nombre_usuario=datos.nombre,
        email=email,
        contrasena_hasheada=seguridad.hashear_contrasena(datos.contrasena),
        esta_activo=True,
        gimnasio_id=gimnasio_id,
        rol_id=obtener_rol_dueno(db).id,
    )
    db.add(dueno)
    db.commit()
    db.refresh(dueno)
    return {"status": "OK", "id": dueno.id}
 
 
def _cambiar_estado_dueno(usuario_id: int, activo: bool, db: Session):
    usuario = db.query(modelos.usuarios).filter(modelos.usuarios.id == usuario_id).first()
   
    if not usuario or usuario.rol_relacion.nombre != modelos.nombreroles.dueno:
        raise HTTPException(status_code=404, detail="Dueño no encontrado")
    usuario.esta_activo = activo
    db.commit()
    return {"status": "OK", "id": usuario.id, "activo": usuario.esta_activo}
 
 
@router.patch("/duenos/{usuario_id}/desactivar")
def desactivar_dueno(usuario_id: int, db: Session = Depends(conexion.get_db)):
    return _cambiar_estado_dueno(usuario_id, False, db)
 
 
@router.patch("/duenos/{usuario_id}/activar")
def activar_dueno(usuario_id: int, db: Session = Depends(conexion.get_db)):
    return _cambiar_estado_dueno(usuario_id, True, db)


@router.post("/pagos", status_code=201)
def registrar_pago_gimnasio(datos: NuevoPagoGimnasio, db: Session = Depends(conexion.get_db)):
    gimnasio = obtener_gimnasio_o_404(db, datos.gimnasio_id)
    ahora = ahora_utc()
 
    
    ultimo_vencimiento = db.query(func.max(PagoGim.fecha_vencimiento)).filter(
        PagoGim.gimnasio_id == gimnasio.id).scalar()
    desde = max(ahora, ultimo_vencimiento) if ultimo_vencimiento else ahora
 
    pago = PagoGim(
        gimnasio_id=gimnasio.id,
        monto=datos.monto,
        fecha_pago=ahora,
        fecha_vencimiento=desde + timedelta(days=datos.dias_cubiertos),
        metodo_pago=datos.metodo_pago,
        nota=datos.nota,
    )
    db.add(pago)
    db.commit()
    db.refresh(pago)
    return {"status": "OK", "id": pago.id, "vence": pago.fecha_vencimiento}
 
 
@router.get("/gimnasios/{gimnasio_id}/pagos", status_code=200)
def historial_pagos_gimnasio(gimnasio_id: int, db: Session = Depends(conexion.get_db)):
    obtener_gimnasio_o_404(db, gimnasio_id)
    pagos = db.query(PagoGim).filter(PagoGim.gimnasio_id == gimnasio_id) \
        .order_by(PagoGim.fecha_pago.desc()).all()
    return [{"id": p.id, "monto": p.monto, "fecha_pago": p.fecha_pago,
             "vence": p.fecha_vencimiento, "metodo_pago": p.metodo_pago,
             "nota": p.nota} for p in pagos]

@router.get("/finanzas/resumen",status_code=200)
def resumen_finanzas(db: Session = Depends(conexion.get_db)):
    ahora = ahora_utc()
    inicio_mes = ahora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
 
    total_historico = db.query(func.coalesce(func.sum(PagoGim.monto), 0)).scalar()
    total_del_mes = db.query(func.coalesce(func.sum(PagoGim.monto), 0)).filter(
        PagoGim.fecha_pago >= inicio_mes).scalar()
 
    total_gimnasios = db.query(func.count(modelos.gimnasios.id)).scalar()
    ids_activos = [fila.id for fila in db.query(modelos.gimnasios.id)
                   .filter(modelos.gimnasios.esta_activo.is_(True)).all()]
 
   
    vencimientos = dict(db.query(PagoGim.gimnasio_id, func.max(PagoGim.fecha_vencimiento))
                        .group_by(PagoGim.gimnasio_id).all())
    con_pago_vencido = [
        gid for gid in ids_activos
        if vencimientos.get(gid) is None or vencimientos[gid] < ahora
    ]

    pagos_historicos=db.query(PagoGim).order_by(PagoGim.fecha_pago.desc()).all()
 
    return {
        "total_recaudado": total_historico,
        "recaudado_este_mes": total_del_mes,
        "gimnasios_activos": len(ids_activos),
        "gimnasios_inactivos": total_gimnasios - len(ids_activos),
        "gimnasios_activos_con_pago_vencido": len(con_pago_vencido),

        "movimientos": [
            {
                "id_recibo": p.id,
                "fecha": p.fecha_pago.strftime("%Y-%m-%d %H:%M:%S") if p.fecha_pago else "",
                "alumno": db.query(modelos.gimnasios.nombre_gimnasio).filter(
                    modelos.gimnasios.id==p.gimnasio_id).scalar() or "Sucursal Desconocida",
                "metodo": p.metodo_pago,
                "monto": p.monto
            } for p in pagos_historicos
        ]
    }