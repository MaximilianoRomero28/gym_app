from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

url_base_datos="sqlite:///gimnasio.db"

engine=create_engine(url_base_datos, connect_args={"check_same_thread":False})

sesion_local=sessionmaker(autocommit=False,autoflush=False,bind=engine)

base=declarative_base()