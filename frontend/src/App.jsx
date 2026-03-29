import './App.css'
import { useEffect, useMemo, useState } from 'react'

function App() {
  const [cards, setCards] = useState([])
  const [studyDeck, setStudyDeck] = useState([])
  const [activeView, setActiveView] = useState('study')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')

  const [revealedId, setRevealedId] = useState(null)

  const cardsRemaining = useMemo(() => studyDeck.length, [studyDeck])
  const currentCard = useMemo(() => studyDeck[0] ?? null, [studyDeck])

  const loadCards = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/flashcards')

      if (!response.ok) {
        throw new Error('Could not load flashcards.')
      }

      const data = await response.json()
      setCards(data)
      setStudyDeck(data)
    } catch {
      setError('Could not connect to the API. Check that backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCards()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()

    const trimmedQuestion = question.trim()
    const trimmedAnswer = answer.trim()

    if (!trimmedQuestion || !trimmedAnswer) {
      setError('Question and answer are required.')
      return
    }

    setError('')

    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuestion, answer: trimmedAnswer }),
      })

      if (!response.ok) {
        throw new Error('Failed to create flashcard.')
      }

      const newCard = await response.json()
      setCards((prev) => [newCard, ...prev])
      setStudyDeck((prev) => [newCard, ...prev])
      setQuestion('')
      setAnswer('')
    } catch {
      setError('Could not create flashcard. Please try again.')
    }
  }

  const handleDelete = async (cardId) => {
    setError('')

    try {
      const response = await fetch(`/api/flashcards/${cardId}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete flashcard.')
      }

      setCards((prev) => prev.filter((card) => card.id !== cardId))
      setStudyDeck((prev) => prev.filter((card) => card.id !== cardId))
      if (revealedId === cardId) {
        setRevealedId(null)
      }
      if (editingId === cardId) {
        setEditingId(null)
      }
    } catch {
      setError('Could not delete flashcard. Please try again.')
    }
  }

  const beginEdit = (card) => {
    setEditingId(card.id)
    setEditQuestion(card.question)
    setEditAnswer(card.answer)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditQuestion('')
    setEditAnswer('')
  }

  const handleUpdate = async (cardId) => {
    const trimmedQuestion = editQuestion.trim()
    const trimmedAnswer = editAnswer.trim()

    if (!trimmedQuestion || !trimmedAnswer) {
      setError('Question and answer are required.')
      return
    }

    setError('')

    try {
      const response = await fetch(`/api/flashcards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuestion, answer: trimmedAnswer }),
      })

      if (!response.ok) {
        throw new Error('Failed to update flashcard.')
      }

      const updatedCard = await response.json()

      setCards((prev) => prev.map((card) => (card.id === cardId ? updatedCard : card)))
      setStudyDeck((prev) => prev.map((card) => (card.id === cardId ? updatedCard : card)))
      cancelEdit()
    } catch {
      setError('Could not update flashcard. Please try again.')
    }
  }

  const revealCurrentCard = () => {
    if (!currentCard) {
      return
    }

    setRevealedId(currentCard.id)
  }

  const goToNextCard = () => {
    if (!currentCard) {
      return
    }

    setStudyDeck((prev) => prev.slice(1))
    setRevealedId(null)
  }

  const resetStudyDeck = () => {
    setStudyDeck(cards)
    setRevealedId(null)
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1>Flashcard Learning App</h1>
          <p>Study, manage, and update your flashcards in one page.</p>
        </div>

        <div className="mode-switch" role="tablist" aria-label="View switch">
          <button
            type="button"
            className={activeView === 'study' ? 'active' : ''}
            onClick={() => setActiveView('study')}
          >
            Study
          </button>
          <button
            type="button"
            className={activeView === 'manage' ? 'active' : ''}
            onClick={() => setActiveView('manage')}
          >
            Manage
          </button>
        </div>
      </header>

      {activeView === 'manage' ? (
        <section className="panel create-panel">
          <h2>Add Flashcard</h2>
          <form onSubmit={handleCreate} className="create-form">
            <label>
              Question
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Type the question"
              />
            </label>

            <label>
              Answer
              <input
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Type the answer"
              />
            </label>

            <button type="submit">Create</button>
          </form>
        </section>
      ) : null}

      {error ? <p className="status error">{error}</p> : null}
      {loading ? <p className="status">Loading flashcards...</p> : null}

      {activeView === 'study' ? (
        <section className="panel">
          <div className="section-header">
            <h2>Study Mode</h2>
            <div className="counter">Cards remaining: {cardsRemaining}</div>
          </div>

          {studyDeck.length === 0 ? (
            <div className="empty-box">
              <p>No cards left in this session.</p>
              <button type="button" onClick={resetStudyDeck}>
                Restart session
              </button>
            </div>
          ) : (
            <div className="study-stage">
              <button
                key={currentCard.id}
                type="button"
                className={`study-card ${revealedId === currentCard.id ? 'revealed' : ''}`}
                onClick={revealCurrentCard}
              >
                <span className="card-label">
                  {revealedId === currentCard.id ? 'Answer' : 'Question'}
                </span>
                <span className="card-text">
                  {revealedId === currentCard.id ? currentCard.answer : currentCard.question}
                </span>
                <span className="hint-text">
                  {revealedId === currentCard.id
                    ? 'Answer revealed. Click Next Card.'
                    : 'Click to reveal answer'}
                </span>
              </button>

              <div className="study-actions">
                {revealedId === currentCard.id ? (
                  <button type="button" onClick={goToNextCard}>
                    Next Card
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="panel">
          <div className="section-header">
            <h2>Manage Mode</h2>
            <button type="button" onClick={loadCards}>
              Refresh
            </button>
          </div>

          {cards.length === 0 ? (
            <p className="status">No flashcards yet. Add one above.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Answer</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr key={card.id}>
                      <td>
                        {editingId === card.id ? (
                          <input
                            value={editQuestion}
                            onChange={(event) => setEditQuestion(event.target.value)}
                          />
                        ) : (
                          card.question
                        )}
                      </td>
                      <td>
                        {editingId === card.id ? (
                          <input
                            value={editAnswer}
                            onChange={(event) => setEditAnswer(event.target.value)}
                          />
                        ) : (
                          card.answer
                        )}
                      </td>
                      <td className="actions-cell">
                        {editingId === card.id ? (
                          <>
                            <button type="button" onClick={() => handleUpdate(card.id)}>
                              Save
                            </button>
                            <button type="button" onClick={cancelEdit}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => beginEdit(card)}>
                              Edit
                            </button>
                            <button type="button" onClick={() => handleDelete(card.id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  )
}

export default App
