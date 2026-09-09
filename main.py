import conexion
from fastapi import FastAPI
import modelos

app=FastAPI()

modelos.conexion.base.metadata.create_all(bind=conexion.engine)



