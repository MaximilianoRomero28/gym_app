from passlib.context import CryptContext
from sqlalchemy.orm import Session
import modelos
from datetime import datetime,timedelta,timezone
import jwt


contexto_cripto=CryptContext(schemes=["bcrypt"],deprecated="auto")

def hashear_contrasena(contrasena:str)->str:
    return contexto_cripto.hash(contrasena)

def verificar_contraseña(contrasena_plana:str,contrasena_hasheada:str)->bool:
    return contexto_cripto.verify(contrasena_plana,contrasena_hasheada)

def autenticar_usuario(email_ingresado,contrasena_plana_ingresada,db: Session):
    usuario_encontrado=db.query(modelos.usuarios).filter(modelos.usuarios.email==email_ingresado).first()

    if not usuario_encontrado:
        return None

    if not verificar_contraseña(contrasena_plana_ingresada,usuario_encontrado.contrasena_hasheada):
        return None

    return usuario_encontrado

secret_key="mi_super_clave_secreta_del_gimnasio_multitenant_2026_pro"
ALGORITHM="HS256"

def crear_token_acceso(usuario):
    tiempo_expiracion=datetime.now(timezone.utc)+timedelta(minutes=15)

    payload={
        "sub": str(usuario.id),
        "gimnasio_id": usuario.gimnasio.id,
        "rol": usuario.rol_relacion.nombre.value,
        "exp": tiempo_expiracion
    }

    token_firmado=jwt.encode(payload,secret_key,algorithm=ALGORITHM)
    return token_firmado