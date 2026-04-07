from pydantic import BaseModel, Field
from typing import Optional


class Flashcard(BaseModel):
    id: Optional[int] = None
    question: str = Field(..., min_length=1, max_length=1000)
    answer: str = Field(..., min_length=1, max_length=1000)

