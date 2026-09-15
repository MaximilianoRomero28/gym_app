from sqlalchemy import create_engine,event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import Engine

url_base_datos="sqlite:///gimnasio.db"

engine=create_engine(url_base_datos, 
    connect_args={"check_same_thread":False
        }
    )


sesion_local=sessionmaker(autocommit=False,autoflush=False,bind=engine)

def get_db():  #funcion protectora
    db=sesion_local()#abre la puerta del archivo local
    try:
        yield db#entrega la llaba de la base de datos al endpoint
    finally:
        db.close()#al terminar la peticion, cierra la puerto

base=declarative_base()