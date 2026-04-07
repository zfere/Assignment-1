BEGIN TRANSACTION;
CREATE TABLE flashcards (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				question TEXT NOT NULL,
				answer TEXT NOT NULL
			);
INSERT INTO "flashcards" VALUES(8,'What is the only U.S. state that can be typed using only one row of a QWERTY keyboard?','Alaska');
INSERT INTO "flashcards" VALUES(9,'How many cards are in a standard deck of playing cards?','52');
INSERT INTO "flashcards" VALUES(10,'What is the capital of Australia?','Canberra');
INSERT INTO "flashcards" VALUES(11,'Which organ pumps blood throughout the body?','Heart');
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('flashcards',11);
COMMIT;
