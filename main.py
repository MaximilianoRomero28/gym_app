import conexion
from fastapi import FastAPI
import modelos
from rutas_usuarios import router as router_usuario
from rutas_gimnasio import router as router_gimnasio
from rutas_rutina import router as router_rutina
from rutas_ejercicios import router as router_ejercicios
from rutas_asistencias import router as router_asistencia
from rutas_pagos import router as router_pagos

app=FastAPI()

app.include_router(router_usuario)

app.include_router(router_gimnasio)

app.include_router(router_rutina)

app.include_router(router_ejercicios)

app.include_router(router_asistencia)

app.include_router(router_pagos)

modelos.conexion.base.metadata.create_all(bind=conexion.engine)



