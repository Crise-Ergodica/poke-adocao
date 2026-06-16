import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.models import Base, User, Adoption
from backend.app.schemas import UserCreate
from backend.app.auth_service import get_password_hash

engine = create_engine('sqlite:///:memory:')
Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine)
session = Session()

user1 = User(email="test@test.com", user_id="user1", hashed_password="pwd")
session.add(user1)
session.commit()

adoption = Adoption(receiver_user_id="user1")
session.add(adoption)
session.commit()

user1.user_id = "user1_new"
session.commit()

a = session.query(Adoption).first()
print("Adoption receiver:", a.receiver_user_id)
