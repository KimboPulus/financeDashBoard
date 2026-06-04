from pydantic import BaseModel


class RegisterPayload(BaseModel):
    name: str
    email: str
    password: str


class LoginPayload(BaseModel):
    email: str
    password: str


class UserPublic(BaseModel):
    id: str
    name: str
    email: str


class AuthResponse(BaseModel):
    user: UserPublic
    token: str


class ExpensePayload(BaseModel):
    amount: float
    date: str
    category: str
    description: str
    notes: str = ""
