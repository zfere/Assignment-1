from fastapi import FastAPI, HTTPException
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from models import Flashcard
from database import get_connection

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

def serialize_flashcard(row) -> Flashcard:
    return Flashcard(id=row["id"], question=row["question"], answer=row["answer"])


@app.get("/")
async def root():
    """Basic health/info endpoint for quick backend checks."""
    return {
        "status": "ok",
    }


# Read flashcards
@app.get("/api/flashcards", response_model=List[Flashcard])
async def get_all_flashcards():
    """Fetch the entire flashcard list from database."""
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, question, answer FROM flashcards ORDER BY id DESC"
        ).fetchall()

    return [serialize_flashcard(row) for row in rows]


# Create flashcard
@app.post("/api/flashcards", response_model=Flashcard)
async def create_flashcard(flashcard: Flashcard):
    """Create a flashcard in database."""
    with get_connection() as connection:
        cursor = connection.execute(
            "INSERT INTO flashcards (question, answer) VALUES (?, ?)",
            (flashcard.question, flashcard.answer),
        )
        connection.commit()
        new_id = cursor.lastrowid

        row = connection.execute(
            "SELECT id, question, answer FROM flashcards WHERE id = ?", (new_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=500, detail="Flashcard was not created.")

    return serialize_flashcard(row)


# Update flashcard
@app.put("/api/flashcards/{card_id}", response_model=Flashcard)
async def update_flashcard(card_id: int, updated_flashcard: Flashcard):
    """Update an existing flashcard by its ID."""
    with get_connection() as connection:
        cursor = connection.execute(
            "UPDATE flashcards SET question = ?, answer = ? WHERE id = ?",
            (updated_flashcard.question, updated_flashcard.answer, card_id),
        )
        connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Flashcard not found.")

        row = connection.execute(
            "SELECT id, question, answer FROM flashcards WHERE id = ?", (card_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Flashcard not found.")

    return serialize_flashcard(row)


# Delete flashcard
@app.delete("/api/flashcards/{card_id}")
async def delete_flashcard(card_id: int):
    """Delete a flashcard by its ID."""
    with get_connection() as connection:
        cursor = connection.execute("DELETE FROM flashcards WHERE id = ?", (card_id,))
        connection.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Flashcard not found.")

    return {"message": "Flashcard deleted successfully."}
