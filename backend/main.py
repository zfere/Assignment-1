from fastapi import FastAPI, HTTPException
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from models import Flashcard

app = FastAPI(title="Simple Flashcard API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

card_db: List[Flashcard] = []


# Read flashcards
@app.get("/api/flashcards", response_model=List[Flashcard])
async def get_all_flashcards():
    """Fetch the entire flashcard list."""
    return card_db


# Create flashcard
@app.post("/api/flashcards", response_model=Flashcard)
async def create_flashcard(flashcard: Flashcard):
    """Add a new flashcard to the list."""
    existing_item = next((card for card in card_db if card.id == flashcard.id), None)
    if existing_item is not None:
        raise HTTPException(status_code=400, detail="A flashcard with this ID already exists.")

    card_db.append(flashcard)
    return flashcard


# Update flashcard
@app.put("/api/flashcards/{card_id}", response_model=Flashcard)
async def update_flashcard(card_id: int, updated_flashcard: Flashcard):
    """Update an existing flashcard by its ID."""
    for index, card in enumerate(card_db):
        if card.id == card_id:
            updated_card = updated_flashcard.model_copy(update={"id": card_id})
            card_db[index] = updated_card
            return updated_card

    raise HTTPException(status_code=404, detail="Flashcard not found.")


# Delete flashcard
@app.delete("/api/flashcards/{card_id}")
async def delete_flashcard(card_id: int):
    """Remove a flashcard from the list."""
    for index, card in enumerate(card_db):
        if card.id == card_id:
            del card_db[index]
            return {"message": "Flashcard deleted successfully."}

    raise HTTPException(status_code=404, detail="Flashcard not found.")
