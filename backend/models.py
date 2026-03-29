from pydantic import BaseModel
from typing import Optional


class Flashcard(BaseModel):
    id: Optional[int] = None
    question: str
    answer: str

