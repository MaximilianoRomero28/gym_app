from sqlalchemy.orm import relationship
from sqlalchemy import Column,String,Integer,ForeignKey,Boolean
from sqlalchemy import DateTime

import conexion


class gimnasios(conexion.base):
    __tablename__="gimnasios"

    id=Column(Integer,primary_key=True)
    nombre_gimnasio=Column(String)
    ubicacion=Column(String)
    esta_activo=Column(Boolean)
    usuarios=relationship("usuarios",back_populates="gimnasio")

class usuarios(conexion.base):
    __tablename__="usuarios"

    id=Column(Integer,primary_key=True)
    nombre_usuario=Column(String)
    email=Column(String)
    contrasena_hasheada=Column(String)
    esta_activo=Column(Boolean)
    gimnasio_id=Column(Integer,ForeignKey("gimnasios.id"))
    gimnasio=relationship("gimnasios",back_populates="usuarios") 


class rutina(conexion.base):
    __tablename__="rutinas"

    id=Column(Integer,primary_key=True)
    nombre_rutina=Column(String)
    fecha_creacion=Column(DateTime)
    alumno_id=Column(Integer, ForeignKey("usuarios.id"))
    profesor_id=Column(Integer,ForeignKey("usuarios.id"))
    gimnasio_id=Column(Integer,ForeignKey("gimnasios.id"))

class ejerciciosrutina(conexion.base):
    __tablename__="Ejercicios"

    id=Column(Integer,primary_key=True)
    ejercicios=Column(String)
    series=Column(Integer)
    repeticiones=Column(Integer)
    rutina_id=Column(Integer,ForeignKey("rutinas.id"))
    