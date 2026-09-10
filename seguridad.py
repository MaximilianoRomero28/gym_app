from passlib.context import CryptContext
from sqlalchemy.orm import Session
import modelos

contexto_cripto=CryptContext(schemes=["bcrypt"],deprecated="auto")

def hashear_contrasena(contrasena:str)->str:
    return contexto_cripto.hash(contrasena)

def verificar_contraseña(contrasena_plana:str,contrasena_hasheada:str)->bool:
    return contexto_cripto.verify(contrasena_plana,contrasena_hasheada)

def buscar_email(email_ingresado,contrasena_plana_ingresada,db: Session):
    usuario_encontrado=db.query(modelos.usuarios).filter(modelos.usuarios.email==email_ingresado).first()

    if not usuario_encontrado:
        return None

    if not verificar_contraseña(contrasena_plana_ingresada,usuario_encontrado.contrasena_hasheada):
        return None

    return usuario_encontrado