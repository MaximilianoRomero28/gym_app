from sqlalchemy import create_engine,event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import Engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL=os.getenv("DATABASE_URL", "sqlite:///./gimnasio.db")

if DATABASE_URL.startswith("sqlite"):
    engine=create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine=create_engine(DATABASE_URL)


sesion_local=sessionmaker(autocommit=False,autoflush=False,bind=engine)

base=declarative_base()

def get_db():  #funcion protectora
    db=sesion_local()#abre la puerta del archivo local
    try:
        yield db#entrega la llaba de la base de datos al endpoint
    finally:
        db.close()#al terminar la peticion, cierra la puerto

