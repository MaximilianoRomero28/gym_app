from fastapi import Depends,APIRouter,HTTPException,Query,status
import conexion
import modelos
from sqlalchemy.orm import Session
from seguridad import hashear_contrasena
import seguridad
from sqlalchemy import or_
from datetime import datetime
import obtener_rutina
import seguridad
import clases
import func_auxiliares
from typing import Optional
import time


router=APIRouter()


@router.post("/v1/usuarios/alumnos",status_code=201)
def crear_nuevo_usuario(datos: clases.nuevoUsuario,db: Session=Depends(conexion.get_db),
    actual: modelos.usuarios=Depends(seguridad.DUENO_O_RECEPCION)):

    func_auxiliares.validar_puede_gestionar(actual,datos.rol)

    email=func_auxiliares.normalizar_email(datos.email)

    if db.query(modelos.usuarios).filter(modelos.usuarios.email==email).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    rol_existente=db.query(modelos.roles).filter(modelos.roles.nombre==datos.rol).first()

    if not rol_existente:
        raise HTTPException(status_code=400,detail="El rol no existe")

    email=email.strip().lower()
    
    clave_cifrada=hashear_contrasena(datos.contrasena)
    

    nuevo_usuario=modelos.usuarios(
        nombre_usuario=datos.nombre,
        email=email,
        contrasena_hasheada=clave_cifrada,
        esta_activo=True,
        gimnasio_id=actual.gimnasio_id,
        rol_id=rol_existente.id
    )


    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return({"status":"OK","id_asignado":nuevo_usuario.id})

@router.post("/v1/auth/login",status_code=200)
def login_usuario(datos: clases.loginDatos ,db:Session=Depends(conexion.get_db)):

    inicio=time.perf_counter()

    usuario=seguridad.autenticar_usuario(datos.email,datos.contrasena,db)

    if not usuario:
        raise HTTPException(status_code=401,detail="Credenciales inválidas")

    if not usuario.gimnasio.esta_activo:
        raise HTTPException(status_code=403, detail="El gimnasio se encuentra desactivado")

    rol=usuario.rol_relacion.nombre

    if datos.cliente=="web" and rol not in seguridad.ROLES_WEB:
        raise HTTPException(status_code=403, detail="No tienes acceso al panel web")


    token_generado=seguridad.crear_token_acceso(usuario)

    print(
        f"Autenticación:"
        f"{time.perf_counter() - inicio:.3f} segundos"
    )

    return {"access_token":token_generado,
        "token_type":"bearer",
        "rol": rol.value,
        "config_visual":{
            "gimnasio_id": int(usuario.gimnasio_id),
            "nombre_gimnasio": usuario.gimnasio.nombre_gimnasio,
            "direccion": usuario.gimnasio.ubicacion,
            "usuario_id": int(usuario.id)
        }}


@router.get("/v1/usuarios/buscar", status_code=200)
def buscar_alumno_predictivo(termino:Optional[str]=None,db: Session=Depends(conexion.get_db),
    actual: modelos.usuarios=Depends(seguridad.DUENO_RECEP_PROFESOR)):

    resultados=db.query(modelos.usuarios).filter(
          modelos.usuarios.nombre_usuario.contains(termino),
          modelos.usuarios.gimnasio_id==actual.gimnasio_id,
          modelos.usuarios.rol_id !=1
    ).all()

    respuesta=[]

    for usuario in resultados:
        rutinas_alumno = db.query(modelos.rutina).filter(
            modelos.rutina.alumno_id==usuario.id).order_by(
            modelos.rutina.id.desc()).all()

        ultimo_pago=db.query(modelos.pagos).filter(
            modelos.pagos.alumno_id==usuario.id).order_by(
            modelos.pagos.id.desc()
        ).first()

        if usuario.rol_id==4:
            cuota_vencida_local=True
        else:
            cuota_vencida_local=False

        if ultimo_pago:
            if ultimo_pago.fecha_vencimiento>datetime.utcnow():
                cuota_vencida_local=False
            else:
                cuota_vencida_local=True

        respuesta.append({
            "id": usuario.id,
            "nombre_usuario": usuario.nombre_usuario,
            "gimnasio_id": usuario.gimnasio_id,
            "rol_id": usuario.rol_id,
            "cuota_vencida": cuota_vencida_local,
            "esta_activo": usuario.esta_activo,
            "rutinas_activas": [
                {"id":r.id,
                "nombre": r.nombre_rutina} for r in rutinas_alumno
            ]
        })
    return respuesta


@router.get("/v1/usuario/admin/listar",status_code=200)
def listar_buscar_alumnos_web(termino_busqueda:str=Query(None,description="Nombre o email a filtrar"),
    db: Session=Depends(conexion.get_db),
    actual:modelos.usuarios=Depends(seguridad.DUENO_O_RECEPCION)
):
    query=db.query(modelos.usuarios).filter(
        modelos.usuarios.gimnasio_id==actual.gimnasio_id,
        modelos.usuarios.rol_id==4
    )

    if termino_busqueda and termino_busqueda.strip() != "":
        criterio= f"%{termino_busqueda.strip()}%"
        query=query.filter(
            or_(
                modelos.usuarios.nombre_usuario.ilike(criterio),
                modelos.usuarios.email.ilike(criterio)
            )
        )

    alumnos= query.order_by(modelos.usuarios.nombre_usuario.asc()).all()

    return [
        {
            "id": a.id,
            "nombre_usuario": a.nombre_usuario,
            "email": a.email,
            "esta_activo": a.esta_activo
        } for a in alumnos
    ]

def _cambiar_estado(usuario_id:int, activo:bool,db:Session,actual:modelos.usuarios):

    usuario=func_auxiliares.buscar_usaurio_del_gimnasio(db,usuario_id,actual.gimnasio_id)

    func_auxiliares.validar_puede_gestionar(actual,usuario.rol_relacion.nombre)

    if usuario.id==actual.id:
        raise HTTPException(status_code=400, detail="No puedes modificar tu propio estado")

    usuario.esta_activo=activo
    db.commit()

    return {"status": "OK","id": usuario.id,"activo":usuario.esta_activo}

@router.patch("/v1/admin/usuarios/{usuario_id}/desactivar",status_code=200)
def desactivar_usuario(usuario_id:int,db:Session=Depends(conexion.get_db),
    actual:modelos.usuarios=Depends(seguridad.DUENO_O_RECEPCION)):

    return _cambiar_estado(usuario_id,False,db,actual)

@router.patch("/v1/admin/usuarios/{usuario_id}/activar", status_code=200)
def activar_usuario(usuario_id:int,db: Session=Depends(conexion.get_db),
    actual:modelos.usuarios=Depends(seguridad.DUENO_O_RECEPCION)):

    return _cambiar_estado(usuario_id,True,db,actual)


@router.delete("/v1/usuarios/{usuario_id}", status_code=200)
def eliminar_usuario_maestro(usuario_id:int, db:Session=Depends(conexion.get_db)):

    usuario=db.query(modelos.usuarios).filter(
        modelos.usuarios.id==usuario_id
    ).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="El miembro no existe en la lista")

    db.query(modelos.pagos).filter(modelos.pagos.alumno_id==usuario_id).delete()

    rutina_usuario=db.query(modelos.rutina).filter(modelos.rutina.alumno_id==usuario_id).all()

    for rut in rutina_usuario:
        db.query(modelos.ejerciciosrutina).filter(
            modelos.ejerciciosrutina.rutina_id==rut.id).delete()

    db.query(modelos.rutina).filter(modelos.rutina.alumno_id==usuario_id).delete()

    db.delete(usuario)
    db.commit()

    return {"status": "OK", "detalle": "Miembro y todo su historial purgados del sistema"}

@router.patch("/v1/usuarios/cambiar-password", status_code=200)
def cambiar_password_usuario(datos:clases.cambioContraseña, db:Session=Depends(conexion.get_db),
    usuario_actual:modelos.usuarios=Depends(obtener_rutina.obtener_usuario_actual)):

    usuario=db.query(modelos.usuarios).filter(
        modelos.usuarios.id==usuario_actual.id
    ).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario inexistente")

    if not seguridad.verificar_contrasena(datos.contrasena_actual,usuario.contrasena_hasheada):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La contraseña actual es incorrecta")

    if len(datos.contrasena_nueva.strip())<6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres")

    if datos.contrasena_actual==datos.contrasena_nueva:
        raise HTTPException(status_code=400, detail="La nueva contraseña no puede ser igual a la actua")

    usuario.contrasena_hasheada=seguridad.hashear_contrasena(datos.contrasena_nueva)

    db.commit()

    return {
        "status": "PASSWORD_ACTUALIZADA",
        "detalle": "Contraseña modificada y encriptada de forma universal."
    }