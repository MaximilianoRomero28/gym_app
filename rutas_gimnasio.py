from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import conexion
import  modelos

router=APIRouter()

def get_db():  #funcion protectora
    db=conexion.sesion_local()#abre la puerta del archivo local
    try:
        yield db#entrega la llaba de la base de datos al endpoint
    finally:
        db.close()#al terminar la peticion, cierra la puerto


@router.post("/v1/gimnasios",status_code=201)
def crear_nuevo_gimnasio(nombre:str,direccion:str,db: Session=Depends(get_db)):
    nuevo_gym=modelos.gimnasios(
        nombre_gimnasio=nombre,
        ubicacion=direccion,
        esta_activo=True
        )

    db.add(nuevo_gym)

    db.commit()

    db.refresh(nuevo_gym)

    return ({"status":"OK","id_asignado":nuevo_gym.id}), 201