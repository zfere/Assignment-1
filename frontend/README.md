# Flashcard Learning App

A distraction-free, single-page application designed for students and scholars to create, manage, and study custom flashcards. By pairing a minimalist interface with active repetition, this app optimizes rote memorization and helps users maintain deep focus.

---

## Technical Stack

| Layer      | Technology                                                    |
|------------|---------------------------------------------------------------|
| Frontend   | React for functional components and hooks                       |
| Styling    | CSS for Flexbox, Grid, 3D transforms, animations               |
| Routing    | React state-based view switching (no additional library used)  |
| Data       | SQLite via Python `sqlite3`; FastAPI REST backend on port 8000 |
| Deployment | Local dev via Vite (`npm run dev`); production via `npm run build` |

---

## Features

- **Single-page application** — all view transitions happen in React state; the page never reloads
- **Interactive 3D card flip** — CSS `rotateY` transform reveals the answer on the back face
- **Manual study progression** — Next arrow button and Right Arrow key advance to the next card
- **Enforced reading pace** — 800ms delay after reveal before the Next button becomes available
- **Live progress tracking** — cards-remaining counter and percentage progress bar update in real time
- **Full keyboard navigation** — Space/Enter to flip, Right Arrow to advance; no mouse required
- **Create flashcards** — inline form in Manage Mode adds new Q&A pairs instantly
- **Inline editing** — card fields become inputs in place; Save/Cancel confirms or discards
- **Delete flashcards** — removes card from database and active study session immediately
- **High-contrast accessibility** — pure white (#FFFFFF) arrow on purple button with strokeWidth 2.5
- **Cohesive two-tone design** — strict purple/white palette with glass-effect navigation

---

## Folder Structure

```
Assignment 1/
├── backend/
│   ├── main.py            ← FastAPI app and all CRUD route handlers
│   ├── database.py        ← SQLite connection and table initialisation
│   ├── models.py          ← Pydantic request/response models
│   └── requirements.txt   ← Python dependencies (fastapi, uvicorn, pydantic)
└── frontend/
    ├── index.html         ← Single HTML entry point (Vite bundles everything here)
    ├── vite.config.js     ← Dev proxy: /api → http://localhost:8000
    ├── package.json
    └── src/
        ├── main.jsx       ← React DOM mount
        ├── App.jsx        ← All application logic (state, handlers, JSX views)
        ├── App.css        ← Component styles (carousel, flip animation, buttons)
        └── index.css      ← Global resets and base typography
```

---

## Challenges Overcome

1) Getting the 3D card flip to look like a real physical object was harder than expected, but it looked decently cool as a result, as the card's back face was showing through the front, and both faces had visible borders that made the card look like two stacked HTML divs rather than one solid item. This was fixed by carefully applying `backface-visibility: hidden` (including the `-webkit-` prefix), removing all borders from the faces, and adding a `translateZ(1px)` offset on the back face to eliminate UI conflicts.

2) Synchronising user input with the animation: the Next button and the Right Arrow key could both fire before the 800ms flip animation finished, making it possible to skip cards without actually reading the answer. This was solved by introducing an `isAdvanceReady` state flag that gets reset on each reveal and only set to `true` after an 800ms timeout so now both the button and the keyboard handler check this flag before allowing progression. A related bug was that the keyboard handler was reading a stale closure value of `isAdvanceReady` because `useEffect`'s dependency array was missing it; adding it to the dependency array ensured the handler always ran with the current state.

3) Integrating CSS spacing into React required care because React components do not inherit padding from parent HTML elements the way traditional HTML pages did when the carousel card was losing its intended spacing when nested inside flex containers. The fix was to explicitly control padding and `flex-shrink: 0` on each element rather than relying on inherited or cascaded spacing.

4) Achieving high contrast on the navigation button is difficult in React because SVG `stroke` set directly on a JSX element (e.g. `stroke="currentColor"`) was silently overridden by the stylesheet's `.carousel-next-btn svg path` rule. The arrow appeared purple instead of white because the CSS rule took precedence over the inline JSX attribute. The fix required updating the CSS rule itself to `stroke: #FFFFFF`, ensuring the pure-white colour was applied at the correct specificity level regardless of what the JSX attribute specified. Now when hovering over the next arrow, it is just a pure white circle. 


---

## Running the App

### 1. Restore the database (first time only)

A SQL export of the database is included at `backend/flashcards_export.sql`. To load it:

```bash
cd backend
python -c "import sqlite3; con = sqlite3.connect('flashcards.db'); con.executescript(open('flashcards_export.sql').read()); con.close(); print('Database restored.')"
```

This creates `backend/flashcards.db` with the schema and sample data pre-loaded. If you skip this step, the backend will create an empty database automatically on first run.

### 2. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000  (API docs at /docs)
```

### 3. Start the frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```
