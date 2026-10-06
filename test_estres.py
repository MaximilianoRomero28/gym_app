from locust import HttpUser,task,between
import random


class AlumnoVirtual(HttpUser):
    wait_time=between(1,2)
    token_bearer=""

    def  on_start(self):
        paylod_login={
            "email": "Dai@email.com",
            "contrasena": "kodalef39x",
            "cliente": "mobile"
        }

        with self.client.post("/v1/auth/login", json=paylod_login, catch_response=True) as respuesta:
            if respuesta.status_code==200:
                datos=respuesta.json()

                self.token_bearer=datos.get("access_token")
            else:
                respuesta.failure(f"El bot no pudo loguearse. Código: {respuesta.status_code}")

    @task
    def consultas_mis_ejercicios(self):

        if not self.token_bearer:
            return
        
        rutina_id=random.randint(1,10)
        cabeceras={"Authorization": f"Bearer {self.token_bearer}"}

        self.client.get(
            f"/v1/rutina/{rutina_id}/ejercicios",
            headers=cabeceras,
            name="/v1/rutina/[id]/ejercicios"
        )

    @task(2)
    def ver_mi_perfil(self):
        if not self.token_bearer:
            return

        cabeceras={"Authorization": f"Bearer {self.token_bearer}"}
        self.client.get("/v1/usuarios/alumnos", name="/v1/usuarios/alumnos")