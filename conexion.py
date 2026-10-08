from sqlalchemy import create_engine,event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import Engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL=os.getenv("DATABASE_URL")

if DATABASE_URL.startswith("sqlite"):
    argumentos ={"check_same_thread": False}
else:
    argumentos={"connect_timeout": 10}

engine = create_engine(
    DATABASE_URL,
    connect_args=argumentos,
    pool_pre_ping=True,   
    pool_recycle=300,
)

sesion_local=sessionmaker(autoflush=False,bind=engine)

base=declarative_base()

def get_db():  #funcion protectora
    db=sesion_local()#abre la puerta del archivo local
    try:
        yield db#entrega la llaba de la base de datos al endpoint
    finally:
        db.close()#al terminar la peticion, cierra la puerto

