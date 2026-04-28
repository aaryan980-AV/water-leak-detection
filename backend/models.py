from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="operator")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    status = Column(String, default="online")
    last_update = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class WaterSource(Base):
    __tablename__ = "water_sources"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)

class Team(Base):
    __tablename__ = "teams"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    availability = Column(String, default="available")

class Leak(Base):
    __tablename__ = "leaks"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    result = Column(String)
    confidence = Column(Float)
    lat = Column(Float)
    lon = Column(Float)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    type = Column(String)
    status = Column(String)
    time = Column(DateTime(timezone=True), server_default=func.now())
    assigned_team_id = Column(String, ForeignKey("teams.id"))
    message = Column(Text)
    leak_lat = Column(Float)
    leak_lon = Column(Float)
