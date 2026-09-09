from fastapi import FastAPI,Depends
import conexion
import modelos
from sqlalchemy.orm import Session
import rutas_gimnasio

def get_db():
    db=conexion.sesion_local()
    try:
        yield db
    finally:
        db.close()

@rutas_gimnasio.router.post("/v1/usuarios",status_code=201)
def crear_nuevo_usuario(nombre:str,email:str,contrasena:str,
    db: Session=Depends(get_db)):
    nuevo_usuario=modelos.usuarios(
        nombre_usuario=nombre,
        email=email,
        contrasena_hasheada=contrasena,
        esta_activo=True
    )

    db.add()
    db.commit()
    db.refresh()

    return({"status":"OK","id_asignado":nuevo_usuario.id}),201