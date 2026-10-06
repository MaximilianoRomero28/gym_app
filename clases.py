from pydantic import BaseModel, Field
from typing import Literal
import modelos
from typing import Optional

class loginDatos(BaseModel):
    email:str
    contrasena: str
    cliente:Literal["web","mobile"] ="mobile"

class nuevoUsuario(BaseModel):
    nombre: str
    email:str
    contrasena:str=Field(min_length=8)
    rol: modelos.nombreroles

class nuevoPlan(BaseModel):
    nombre_plan:str
    precio:float=Field(gt=0)
    dias_duracion: int=Field(default=30,gt=0)

class nuevoPago(BaseModel):
    alumno_id:int
    plan_id:int
    metodo_pago:str

class nuevoGimnasio(BaseModel):
    nombre_gimnasio: str
    ubicacion: str
    nombre_dueno:str
    email:str
    contrasena: str=Field(min_length=8)

class nuevoEjercicio(BaseModel):
    ejercicio: str
    numeros_series: int
    rep: int


class marcasPersonales(BaseModel):
    ejercicio: str
    peso: float
    reps: int

class nuevaRutina(BaseModel):
    nombre_rutina: str
    alumno_id: int
    profesor_id: Optional[int] = None

class cambioContraseña(BaseModel):
    contrasena_actual:str
    contrasena_nueva:str=Field(min_length=8)