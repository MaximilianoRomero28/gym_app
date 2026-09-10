import conexion
from fastapi import FastAPI
import modelos
from rutas_usuarios import router as router_usuario
from rutas_gimnasio import router as router_gimnasio

app=FastAPI()

app.include_router(router_usuario)

app.include_router(router_gimnasio)

modelos.conexion.base.metadata.create_all(bind=conexion.engine)



