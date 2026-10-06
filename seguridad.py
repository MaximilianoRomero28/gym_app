from passlib.context import CryptContext
from sqlalchemy.orm import Session
import modelos
from datetime import datetime,timedelta,timezone
import jwt
from dotenv import load_dotenv
import os
from fastapi import Depends,HTTPException,Header
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
import conexion
import modelos
import secrets


load_dotenv()

contexto_cripto=CryptContext(schemes=["bcrypt"],deprecated="auto")

bearer=HTTPBearer()

secret_key=os.getenv("SECRET_KEY")
ALGORITHM="HS256"



def hashear_contrasena(contrasena:str)->str:
    return contexto_cripto.hash(contrasena)

def verificar_contrasena(contrasena_plana:str,contrasena_hasheada:str)->bool:
    return contexto_cripto.verify(contrasena_plana,contrasena_hasheada)

HASH_FALSO=contexto_cripto.hash("contrasena-falsa-para-igualar-tiempos")

def autenticar_usuario(email_ingresado,contrasena_plana_ingresada,db: Session):

    email=email_ingresado.strip().lower()

    usuario_encontrado=db.query(modelos.usuarios).filter(modelos.usuarios.email==email).first()

    hash_a_verificar=usuario_encontrado.contrasena_hasheada if usuario_encontrado else HASH_FALSO
    contrasena_ok=verificar_contrasena(contrasena_plana_ingresada,hash_a_verificar)

    if not usuario_encontrado or not contrasena_ok or not usuario_encontrado.esta_activo:
        return None

    return usuario_encontrado



def crear_token_acceso(usuario: modelos.usuarios)->str:
    tiempo_expiracion=datetime.now(timezone.utc)+timedelta(minutes=60)

    payload={
        "sub": str(usuario.id),
        "tipo": "gimnasio",
        "gimnasio_id": usuario.gimnasio_id,
        "rol": usuario.rol_relacion.nombre.value,
        "exp": tiempo_expiracion
    }

    token_firmado=jwt.encode(payload,secret_key,algorithm=ALGORITHM)
    return token_firmado

def obtener_usuario_actual(
        creds: HTTPAuthorizationCredentials=Depends(bearer),
        db: Session=Depends(conexion.get_db),
)-> modelos.usuarios:
    try:
        payload =jwt.decode(creds.credentials,secret_key,algorithms=[ALGORITHM])
        usuario_id=int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status_code=401,detail="Token inválido o expirado")

    if payload.get("tipo") != "gimnasio":
        raise HTTPException(status_code=401, detail="Token inválido")

    usuario=db.query(modelos.usuarios).filter(
        modelos.usuarios.id==usuario_id
    ).first()

    if not usuario or not usuario.esta_activo:
        raise HTTPException(status_code=201,detail="Usuario inexistente o inactivo")

    if not usuario.gimnasio or not usuario.gimnasio.esta_activo:
            raise HTTPException(status_code=403, detail="El gimnasio se encunetra dado de baja")
    return usuario

def requiere_rol(*roles_permitidos: modelos.nombreroles):
    def verificador(usuario= Depends(obtener_usuario_actual))->modelos.usuarios:
        if usuario.rol_relacion.nombre not in roles_permitidos:
            raise HTTPException(status_code=403, detail="No tenés permisos para esta acción")
        return usuario
    return verificador

def exigir_clave_admin(x_clave_admin: str= Header(default="")):
    clave=os.environ.get("CLAVE_ADMIN")
    if not clave or not secrets.compare.digest(x_clave_admin.encode(), clave.encode()):
        raise HTTPException(status_code=403, detail="No autorizado")


ROLES_WEB={modelos.nombreroles.dueno,modelos.nombreroles.recepcionista}
SOLO_DUENO=requiere_rol(modelos.nombreroles.dueno)
DUENO_O_RECEPCION=requiere_rol(modelos.nombreroles.dueno,modelos.nombreroles.recepcionista)

SOLO_PROFESOR=requiere_rol(modelos.nombreroles.profesor)

DUENO_RECEP_PROFESOR=requiere_rol(modelos.nombreroles.dueno,modelos.nombreroles.recepcionista,modelos.nombreroles.profesor)

def autenticar_administrador(email:str,contrasena:str,db:Session):
    email=email.strip().lower()
    admin=db.query(modelos.administradores).filter(
        modelos.administradores.email==email
    ).first()

    hash_a_verificar= admin.contrasena_hasheada if admin else HASH_FALSO

    contrasena_ok=verificar_contrasena(contrasena,hash_a_verificar)

    if not admin or not contrasena_ok or not admin.esta_activo:
        return None

    return admin

def crear_token_plataforma(admin):
    payload={
        "sub": str(admin.id),
        "tipo": "plataforma",
        "exp": datetime.now(timezone.utc)+timedelta(minutes=30),
    }

    return jwt.encode(payload,secret_key,algorithm=ALGORITHM)

def obtener_superadmin_actual (
    creds: HTTPAuthorizationCredentials=Depends(bearer),
    db:Session=Depends(conexion.get_db)
):

    try:
        payload=jwt.decode(creds.credentials,secret_key,algorithms=[ALGORITHM])
        admin_id=int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    if payload.get("tipo") != "plataforma":
        raise HTTPException(status_code=403, detail="Acceso solo para administradores")

    admin=db.query(modelos.administradores).filter(
        modelos.administradores.id==admin_id
    ).first()

    if not admin or not admin.esta_activo:
        raise HTTPException(status_code=401, detail="Administrador inexistente o inactivo")

    return admin