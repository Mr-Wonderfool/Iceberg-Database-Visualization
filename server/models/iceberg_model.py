from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from ..utils.types import UserType, MaskType
from sqlalchemy import (
    Column,
    String,
    Integer,
    Enum,
    Float,
    ForeignKey,
    DateTime,
    Boolean,
    Text,
)

bcrypt = Bcrypt()
db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(30), unique=True, nullable=False)
    email = Column(String(25), unique=True, nullable=False)
    role = Column(Enum(UserType), default=UserType.COMMON_USER)
    pwd_hash = Column(String(20), nullable=False)

    @property
    def password():
        raise ValueError("password cannot be directly accessed")

    @password.setter
    def password(self, pwd):
        self.pwd_hash = bcrypt.generate_password_hash(pwd).decode("utf-8")

    def check_pwd(self, pwd):
        return bcrypt.check_password_hash(self.pwd_hash, pwd)


class Iceberg(db.Model):
    __tablename__ = "iceberg"
    id = Column(String(10), primary_key=True)
    mask = Column(Enum(MaskType), nullable=True)
    area = Column(Float, nullable=False)


class IcebergInfo(db.Model):
    __tablename__ = "iceberg_info"
    record_id = Column(Integer, primary_key=True, autoincrement=True)
    iceberg_id = Column(String(10), ForeignKey("iceberg.id"), nullable=False)
    dms_longitude = Column(String(10), nullable=False)
    dms_latitude = Column(String(10), nullable=False)
    rotational_velocity = Column(Float, nullable=True)
    record_time = Column(DateTime, nullable=False)
    is_prediction = Column(Boolean, nullable=False)


class IcebergEvent(db.Model):
    __tablename__ = "iceberg_event"
    event_id = Column(Integer, primary_key=True, autoincrement=True)
    iceberg_id = Column(String(10), ForeignKey("iceberg.id"), nullable=False)
    event_type = Column(String(30), nullable=False)
    description = Column(Text, nullable=False)
    user_name = Column(String(20), ForeignKey("user.username"), nullable=False)
    record_time = Column(DateTime, nullable=False)


class VesselSuggestion(db.Model):
    __tablename__ = "vessel_suggestion"
    suggestion_id = Column(Integer, primary_key=True, autoincrement=True)
    iceberg_id = Column(String(10), ForeignKey("iceberg.id"), nullable=False)
    suggestion = Column(Text, nullable=False)
    user_name = Column(String(20), ForeignKey("user.username"), nullable=False)
    suggestion_time = Column(DateTime, nullable=False)