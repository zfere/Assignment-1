import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent / "flashcards.db"


def get_connection() -> sqlite3.Connection:
	connection = sqlite3.connect(DB_PATH)
	connection.row_factory = sqlite3.Row
	return connection


def init_db() -> None:
	with get_connection() as connection:
		connection.execute(
			"""
			CREATE TABLE IF NOT EXISTS flashcards (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				question TEXT NOT NULL,
				answer TEXT NOT NULL
			)
			"""
		)
		connection.commit()


init_db()
