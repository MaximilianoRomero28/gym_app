import modelos
import conexion
from fastapi import HTTPException,Depends,APIRouter,status
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
import seguridad
import modelos

router=APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/auth/login")

def obtener_usuario_actual (token: str=Depends(oauth2_scheme),db: Session=Depends(conexion.get_db)):

    credenciales_exception= HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate":"Bearer"},
    )
    try:
        resultado_decode = jwt.decode(token, seguridad.secret_key,algorithms=[seguridad.ALGORITHM])

        if isinstance(resultado_decode, tuple):
            payload = resultado_decode[0]
        else:
            payload= resultado_decode

        usuario_id=payload.get("sub")
        if usuario_id is None:
            raise credenciales_exception
    except JWTError:
        raise credenciales_exception

    usuario = db.query(modelos.usuarios).filter(modelos.usuarios.id==int(usuario_id)).first()
    if usuario is None:
        raise credenciales_exception

    return usuario
    

@router.get("/v1/rutina/alumno",status_code=200)
def obtener_rutina_completa(usuario_actual: modelos.usuarios=Depends(obtener_usuario_actual),
    db: Session=Depends(conexion.get_db)):

    alumno_id_int = int(usuario_actual.id)

    rutinas=db.query(modelos.rutina).filter(modelos.rutina.alumno_id==alumno_id_int).order_by(modelos.rutina.id.desc()).all()

    if not rutinas:
        raise HTTPException(status_code=404,detail="El alumno no tiene rutinas")


    respuesta_completa=[]

    for rut in rutinas:
        ejercicios=db.query(modelos.ejerciciosrutina).filter(modelos.ejerciciosrutina.rutina_id==rut.id).all()

        respuesta_completa.append({
            "nombre_rutina": rut.nombre_rutina,
            "ejercicios": [
                {
                "id": ej.id,
                "ejercicios": ej.ejercicios,
                "series": ej.series,
                "repeticiones": ej.repeticiones
                } for ej in ejercicios
            ]
        })
    return respuesta_completa

@router.get("/v1/admin/usuarios/{alumno_id}/rutinas-completas",status_code=200)
def obtener_rutinas_para_administracion(
    alumno_id:int,
    db: Session=Depends(conexion.get_db),
    actual: modelos.usuarios=Depends(seguridad.requiere_rol(modelos.nombreroles.dueno,modelos.nombreroles.recepcionista))
):

    alumno=db.query(modelos.usuarios).filter(
        modelos.usuarios.id==alumno_id,
        modelos.usuarios.gimnasio_id==actual.gimnasio_id
    ).first()

    if not alumno:
        raise HTTPException(status_code=404,detail="Alumno no encontrado")

    
    rutinas=db.query(modelos.rutina).filter(
        modelos.rutina.alumno_id==alumno_id).order_by(
            modelos.rutina.id.desc()
        ).all()

    if not rutinas:
        return []

    respuesta_completa= []

    for rut in rutinas:
        ejercicios=db.query(modelos.ejerciciosrutina).filter(modelos.ejerciciosrutina.rutina_id==rut.id).all()

        respuesta_completa.append({
            "id": rut.id,
            "nombre_rutina": rut.nombre_rutina,
            "ejercicios": [
                {
                    "id": ej.id,
                    "nombre_ejercicio": ej.ejercicios,
                    "series": ej.series,
                    "repeticiones": ej.repeticiones
                } for ej in ejercicios
            ]
        })

    return respuesta_completa