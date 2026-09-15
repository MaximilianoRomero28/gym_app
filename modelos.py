from sqlalchemy.orm import relationship
from sqlalchemy import Column,String,Integer,ForeignKey,Boolean
from sqlalchemy import DateTime,Enum,func,Float
import enum


import conexion


class gimnasios(conexion.base):
    __tablename__="gimnasios"

    id=Column(Integer,primary_key=True)
    nombre_gimnasio=Column(String)
    ubicacion=Column(String)
    esta_activo=Column(Boolean)
    logo_url=Column(String,default="https://tuapi.com")
    color_hex=Column(String,default="#FF0000")
    usuarios=relationship("usuarios",back_populates="gimnasio")

class nombreroles(enum.Enum):
    dueno="Dueño"
    recepcionista="Recepcionista"
    profesor="Profesor"
    alumno="Alumno"

class roles(conexion.base):
    __tablename__="roles"

    id=Column(Integer,primary_key=True)
    nombre=Column(Enum(nombreroles), nullable=False)
    usuarios=relationship("usuarios",back_populates="rol_relacion")

class usuarios(conexion.base):
    __tablename__="usuarios"

    id=Column(Integer,primary_key=True)
    nombre_usuario=Column(String)
    email=Column(String,nullable=False)
    contrasena_hasheada=Column(String,nullable=False)
    esta_activo=Column(Boolean)
    gimnasio_id=Column(Integer,ForeignKey("gimnasios.id"))
    rol_id=Column(Integer,ForeignKey("roles.id"))
    gimnasio=relationship("gimnasios",back_populates="usuarios") 
    rol_relacion=relationship("roles",back_populates="usuarios")
    cuota_al_dia=Column(Boolean,default=True,nullable=False)


class rutina(conexion.base):
    __tablename__="rutinas"

    id=Column(Integer,primary_key=True)
    nombre_rutina=Column(String)
    fecha_creacion=Column(DateTime, default=func.now())
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

class pagos(conexion.base):
    __tablename__="Pagos"

    id=Column(Integer,primary_key=True)
    monto=Column(Float,nullable=False)
    fecha_pago=Column(DateTime,nullable=False)
    fecha_vencimiento=Column(DateTime,nullable=False)
    alumno_id=Column(Integer,ForeignKey("usuarios.id"),nullable=False)
    gimnasio_id=Column(Integer,ForeignKey("gimnasios.id"),nullable=False)

class asistencias(conexion.base):
    __tablename__="Asistencias"

    id=Column(Integer,primary_key=True)
    fecha_asistencia=Column(DateTime,nullable=False)
    alumno_id=Column(Integer,ForeignKey("usuarios.id"),nullable=False)
    gimnasio_id=Column(Integer,ForeignKey("gimnasios.id"),nullable=False)





    