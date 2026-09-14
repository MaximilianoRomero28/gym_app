from fastapi.testclient import TestClient
from main import app

cliente=TestClient(app)

def test_buscador_predictivo_exitoso():
    respuesta=cliente.get("/v1/usuarios/buscar?termino=dai&gimnasio_id=1")

    assert respuesta.status_code==200

def test_login_credenciales_invalidas():
    respuesta=cliente.post("v1/auth/login?email=maxi15r@gmail.com&contrasena_plana=kodakf3")

    assert respuesta.status_code==401