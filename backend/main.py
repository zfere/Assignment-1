from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Simple To-Do API")


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



class TodoItem(BaseModel):
    id: int 
    text: str
    completed: bool = False



todo_db: List[TodoItem] = []




@app.get("/todos", response_model=List[TodoItem])
async def get_all_todos():
    """Fetch the entire to-do list."""
    return todo_db


@app.post("/todos", response_model=TodoItem)
async def create_todo(item: TodoItem):
    """Add a new task to the list."""
    existing_item = next((todo for todo in todo_db if todo.id == item.id), None)
    if existing_item is not None:
        raise HTTPException(status_code=400, detail="A to-do item with this ID already exists.")

    todo_db.append(item)
    return item


@app.put("/todos/{todo_id}", response_model=TodoItem)
async def update_todo(todo_id: int, updated_item: TodoItem):
    """Update an existing task by its ID."""
    for index, todo in enumerate(todo_db):
        if todo.id == todo_id:
            updated_todo = updated_item.model_copy(update={"id": todo_id})
            todo_db[index] = updated_todo
            return updated_todo

    raise HTTPException(status_code=404, detail="To-do item not found.")


@app.delete("/todos/{todo_id}")
async def delete_todo(todo_id: int):
    """Remove a task from the list."""
    for index, todo in enumerate(todo_db):
        if todo.id == todo_id:
            del todo_db[index]
            return {"message": "To-do item deleted successfully."}

    raise HTTPException(status_code=404, detail="To-do item not found.")

