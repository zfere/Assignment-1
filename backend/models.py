from pydantic import BaseModel

class Flashcard(BaseModel):
	id: int
	question: str
	answer: str

