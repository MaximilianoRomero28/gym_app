from fastapi import Depends,APIRouter,HTTPException
import conexion
import modelos
from sqlalchemy.orm import Session
from seguridad import hashear_contrasena
import seguridad


router=APIRouter()


@router.post("/v1/usuarios/alumnos",status_code=201)
def crear_nuevo_usuario(nombre:str,email:str,contrasena:str,
    gimnasio_id:int,rol_id:int,db: Session=Depends(conexion.get_db)):

    gimnasio_existente=db.query(modelos.gimnasios).filter(modelos.gimnasios.id==gimnasio_id).first()

    rol_existente=db.query(modelos.roles).filter(modelos.roles.id==rol_id).first()
    
    if not gimnasio_existente:
        raise HTTPException(status_code=400, detail="El gimnasio especificado no existe")

    if not rol_existente:
        raise HTTPException(status_code=400,detail="El rol no existe")

    clave_cifrada=hashear_contrasena(contrasena)
    

    nuevo_usuario=modelos.usuarios(
        nombre_usuario=nombre,
        email=email,
        contrasena_hasheada=clave_cifrada,
        esta_activo=True,
        gimnasio_id=gimnasio_id,
        rol_id=rol_id
    )


    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return({"status":"OK","id_asignado":nuevo_usuario.id}),201

@router.post("/v1/auth/login",status_code=201)
def login_usuario(email:str,contrasena_plana:str,db:Session=Depends(conexion.get_db)):

    usuario=seguridad.autenticar_usuario(email,contrasena_plana,db)

    if not usuario:
        raise HTTPException(status_code=401,detail="Credenciales inválidas")

    token_generado=seguridad.crear_token_acceso(usuario)

    return {"access_token":token_generado,"token_type":"bearer"}


@router.get("/v1/usuarios/buscar", status_code=200)
def buscar_alumno_predictivo(termino:str,gimnasio_id:int,db: Session=Depends(conexion.get_db)):
    resultados=db.query(modelos.usuarios).filter(
          modelos.usuarios.nombre_usuario.contains(termino),
          modelos.usuarios.gimnasio_id==gimnasio_id
    ).all()

    return resultados