from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: Optional[str] = "operator"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserPublic(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserPublic

class TokenData(BaseModel):
    email: Optional[str] = None

class SensorBase(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    status: str

class WaterSourceBase(BaseModel):
    id: str
    name: str
    type: str
    lat: float
    lon: float

class TeamBase(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    availability: str

class LeakBase(BaseModel):
    id: str
    timestamp: datetime
    result: str
    confidence: float
    lat: float
    lon: float

class AlertBase(BaseModel):
    id: str
    type: str
    status: str
    time: datetime
    assigned_team_id: str
    message: str
    leak_lat: float
    leak_lon: float
