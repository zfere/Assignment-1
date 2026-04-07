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
  const canAdvance = currentCard !== null && revealedId === currentCard.id
  const studiedCount = useMemo(() => Math.max(cards.length - studyDeck.length, 0), [cards, studyDeck])
  const progressPercent = useMemo(() => {
    if (cards.length === 0) {
      return 0
    }

    return Math.round((studiedCount / cards.length) * 100)
  }, [cards.length, studiedCount])

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

  useEffect(() => {
    if (activeView !== 'study' || currentCard === null) {
      return undefined
    }

    const handleKeyDown = (event) => {
      const isFlipKey = event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar'

      if (isFlipKey && revealedId !== currentCard.id) {
        event.preventDefault()
        setRevealedId(currentCard.id)
        return
      }

      if (event.key !== 'ArrowRight' || revealedId !== currentCard.id) {
        return
      }

      event.preventDefault()
      setStudyDeck((prev) => prev.filter((card) => card.id !== revealedId))
      setRevealedId(null)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeView, currentCard, revealedId])

  const handleNextCard = () => {
    if (revealedId === null) {
      return
    }

    setStudyDeck((prev) => prev.filter((card) => card.id !== revealedId))
    setRevealedId(null)
  }

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
    if (!currentCard || revealedId === currentCard.id) {
      return
    }

    setRevealedId(currentCard.id)
  }

  const resetStudyDeck = () => {
    setStudyDeck(cards)
    setRevealedId(null)
  }

  const exitStudyMode = () => {
    setActiveView('manage')
    setStudyDeck(cards)
    setRevealedId(null)
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1>Flashcard Learning App</h1>
          <p>Master your flashcards with interactive study sessions.</p>
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
            <div>
              <h2>Study Mode</h2>
            </div>
            <div className="counter-block">
              <div className="counter">
                {cardsRemaining} {cardsRemaining === 1 ? 'card' : 'cards'} remaining
              </div>
              <div className="counter-detail">{studiedCount} studied · {progressPercent}% complete</div>
            </div>
          </div>

          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>

          {studyDeck.length === 0 ? (
            <div className="empty-box">
              <p>Session complete! All cards studied.</p>
              <button type="button" onClick={resetStudyDeck}>
                Restart session
              </button>
              <button type="button" onClick={exitStudyMode} className="secondary-btn">
                Exit Study Mode
              </button>
            </div>
          ) : (
            <div className="study-carousel">
              <div className="carousel-spacer" aria-hidden="true" />

              <button
                key={currentCard.id}
                type="button"
                className={`study-card ${revealedId === currentCard.id ? 'revealed' : ''}`}
                onClick={revealCurrentCard}
                aria-label="Flip flashcard"
              >
                <div className="study-card-inner">
                  <div className="study-card-face study-card-front">
                    <div className="card-label">QUESTION</div>
                    <div className="card-text">{currentCard.question}</div>
                    <div className="hint-text" />
                  </div>

                  <div className="study-card-face study-card-back">
                    <div className="card-label">ANSWER</div>
                    <div className="card-text">{currentCard.answer}</div>
                    <div className="hint-text" />
                  </div>
                </div>
              </button>

              <div className="carousel-nav" aria-hidden="false">
                <button
                  type="button"
                  onClick={handleNextCard}
                  disabled={!canAdvance}
                  aria-label="Next Card"
                  title="Next Card (Right Arrow)"
                  className={`carousel-next-btn ${canAdvance ? 'is-visible' : ''}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
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
            <div className="card-grid">
              {cards.map((card) => (
                <div key={card.id} className="grid-card">
                  {editingId === card.id ? (
                    <div className="card-edit-form">
                      <input
                        value={editQuestion}
                        onChange={(event) => setEditQuestion(event.target.value)}
                        placeholder="Question"
                      />
                      <input
                        value={editAnswer}
                        onChange={(event) => setEditAnswer(event.target.value)}
                        placeholder="Answer"
                      />
                      <div className="card-edit-actions">
                        <button type="button" onClick={() => handleUpdate(card.id)}>
                          Save
                        </button>
                        <button type="button" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="card-content">
                        <p className="card-question">{card.question}</p>
                        <p className="card-answer">{card.answer}</p>
                      </div>
                      <div className="card-actions">
                        <button type="button" onClick={() => beginEdit(card)} title="Edit" className="edit-btn">
                          ✏️
                        </button>
                        <button type="button" onClick={() => handleDelete(card.id)} title="Delete" className="delete-btn">
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  )
}

export default App
