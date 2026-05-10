import { useState, useEffect, useRef } from 'react';
import { shuffle } from '../utils/shuffle.js';
import { ALL_QUESTIONS } from '../data/questions.js';
import GuruHintModal from '../components/GuruHintModal.jsx';

export default function GameEngine({ level, user, onComplete, onExit, customQuestions }) {
  const [questions] = useState(() => {
    // If custom questions are provided (from teacher-created game), use them
    if (customQuestions && customQuestions.length > 0) {
      return shuffle(customQuestions.map(q => ({
        question: q.text,
        options: q.options,
        answer: q.correctIndex,
        explanation: q.explanation || 'No explanation provided.',
        hint: q.explanation ? q.explanation.substring(0, 60) + '...' : 'Think carefully about this one!',
        pramana: q.pramana || 'anumana'
      })));
    }
    const pool = ALL_QUESTIONS[level] || [];
    if (pool.length === 0) return [];
    return shuffle(pool).slice(0, Math.min(15, pool.length));
  });
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [results, setResults] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [showGuruModal, setShowGuruModal] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  // Scale timer: more time for smaller pools since each question matters more
  const maxTime = questions.length <= 5 ? 35 : level === 1 ? 30 : level === 2 ? 25 : 20;
  const [timeLeft, setTimeLeft] = useState(maxTime);
  const [timeTaken, setTimeTaken] = useState(0);
  const [timeStart] = useState(Date.now());
  const timerRef = useRef(null);
  const answeredRef = useRef(false);
  const timeLeftRef = useRef(maxTime);

  // Keep refs in sync with state
  answeredRef.current = answered;
  timeLeftRef.current = timeLeft;

  const currentQ = questions[qIndex];
  const progress = ((qIndex) / questions.length) * 100;

  useEffect(() => {
    setTimeLeft(maxTime);
    timeLeftRef.current = maxTime;
    setShowHint(false);
  }, [qIndex, maxTime]);

  useEffect(() => {
    if (answered) return;
    timerRef.current = setInterval(() => {
      if (answeredRef.current) {
        clearInterval(timerRef.current);
        return;
      }
      const newTime = timeLeftRef.current - 1;
      if (newTime <= 0) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
        timeLeftRef.current = 0;
        // Time ran out — mark as answered with no selection
        if (!answeredRef.current) {
          answeredRef.current = true;
          setSelected(-1);
          setAnswered(true);
          setResults(prev => [...prev, false]);
        }
      } else {
        setTimeLeft(newTime);
        timeLeftRef.current = newTime;
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qIndex, answered]);

  // Keyboard shortcuts: 1-4 for options, Enter/Space for next
  useEffect(() => {
    function handleKeyPress(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key;
      if (!answeredRef.current && key >= '1' && key <= '4') {
        const idx = parseInt(key) - 1;
        if (idx < currentQ?.options?.length) handleAnswer(idx);
      }
      if (answeredRef.current && (key === 'Enter' || key === ' ')) {
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  });

  function handleAnswer(idx) {
    if (answeredRef.current) return;
    answeredRef.current = true;
    clearInterval(timerRef.current);
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === currentQ.answer;
    setResults(prev => [...prev, isCorrect]);
    if (isCorrect) {
      const timeBonus = Math.max(0, timeLeftRef.current * 2);
      const hintPenalty = showHint ? 10 : 0;
      const pts = 10 + timeBonus - hintPenalty;
      setScore(s => s + pts);
      setCorrect(c => c + 1);
    }
  }

  function handleNext() {
    if (qIndex + 1 >= questions.length) {
      const totalTime = Math.round((Date.now() - timeStart) / 1000);
      onComplete({
        level,
        score,
        correct,
        total: questions.length,
        hintsUsed,
        time: totalTime,
        accuracy: Math.round((correct / questions.length) * 100),
        pramanaResults: questions.map((q, i) => ({ pramana: q.pramana, correct: results[i] }))
      });
    } else {
      answeredRef.current = false;
      setQIndex(i => i + 1);
      setSelected(null);
      setAnswered(false);
      setShowHint(false);
    }
  }

  function handleHint() {
    if (!showHint) {
      setShowHint(true);
      setHintsUsed(h => h + 1);
    }
    setShowGuruModal(true);
  }

  const pramanaColors = { pratyaksa: 'var(--saffron)', anumana: 'var(--gold)', sabda: 'var(--sacred-teal)' };
  const pramanaNames = { pratyaksa: 'Pratyaksa · प्रत्यक्ष', anumana: 'Anumana · अनुमान', sabda: 'Sabda · शब्द' };

  // Guard: empty question pool
  if (questions.length === 0) {
    return (
      <div className="game-page" style={{ justifyContent: 'center' }}>
        <div className="glass-strong" style={{ padding: 40, textAlign: 'center', maxWidth: 500 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <h2 style={{ marginBottom: 12 }}>No Questions Available</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>This game mode's question bank is still being prepared.</p>
          <button className="btn-primary" onClick={onExit}>← Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      {/* Header */}
      <div className="game-header">
        <div className="game-progress-info">
          <div className="game-level-badge" style={{
            background: level === 1 ? 'rgba(255,107,53,0.15)' : level === 2 ? 'rgba(247,201,72,0.15)' : 'rgba(10,191,188,0.15)',
            color: level === 1 ? 'var(--saffron)' : level === 2 ? 'var(--gold)' : 'var(--sacred-teal)',
            border: `1px solid ${level === 1 ? 'rgba(255,107,53,0.35)' : level === 2 ? 'rgba(247,201,72,0.35)' : 'rgba(10,191,188,0.35)'}`,
          }}>
            LEVEL {level}
          </div>
          <div className="question-counter">
            Question {qIndex + 1} <span style={{ color: 'var(--text-faded)' }}>/ {questions.length}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className={`timer-display ${timeLeft <= 8 ? 'timer-warning' : 'timer-normal'}`}>
            ⏱ {timeLeft}s
          </div>
          <div className="score-display">
            ✦ {score}
          </div>
          <button className="btn-outline" style={{ padding: '8px 16px', fontSize: 12 }} onClick={() => { if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) onExit(); }}>✕ Exit</button>
        </div>
      </div>

      {/* Progress strip */}
      <div className="progress-strip">
        <div className="progress-strip-bg">
          <div className="progress-strip-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {questions.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < qIndex ? 'var(--gold)' : i === qIndex ? 'var(--saffron)' : 'rgba(255,255,255,0.1)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      </div>

      {/* Question card */}
      <div key={qIndex} className="question-card glass-strong">
        <div className="pramana-indicator">
          <div className={`pramana-dot dot-${currentQ.pramana}`} />
          <span className="pramana-label" style={{ color: pramanaColors[currentQ.pramana], fontSize: 11 }}>
            {pramanaNames[currentQ.pramana]}
          </span>
        </div>

        <div className="question-text">{currentQ.question}</div>

        <div className="options-grid">
          {currentQ.options.map((opt, idx) => {
            let cls = 'option-btn';
            if (answered) {
              if (idx === currentQ.answer) cls += ' correct';
              else if (idx === selected && idx !== currentQ.answer) cls += ' wrong';
              else cls += ' neutral-reveal';
            }
            return (
              <button key={idx} className={cls} onClick={() => handleAnswer(idx)} onKeyDown={e => e.key === 'Enter' && handleAnswer(idx)} disabled={answered} aria-label={`Option ${['A', 'B', 'C', 'D'][idx]}: ${opt}`}>
                <span className="option-letter">{['A', 'B', 'C', 'D'][idx]}</span>
                <span>{opt}</span>
                {answered && idx === currentQ.answer && <span style={{ marginLeft: 'auto', fontSize: 18 }}>✓</span>}
                {answered && idx === selected && idx !== currentQ.answer && <span style={{ marginLeft: 'auto', fontSize: 18 }}>✗</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint section */}
      {!answered && (
        <div className="hint-section" style={{ textAlign: 'center' }}>
          <button className="btn-outline" onClick={handleHint} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--saffron)' }}>
            <span style={{ fontSize: 18 }}>🧘🏽‍♂️</span> Consult the Guru {showHint ? '' : <span style={{ opacity: 0.5, fontSize: 11 }}>(−10 pts)</span>}
          </button>
        </div>
      )}

      {/* Feedback */}
      {answered && (
        <div className={`feedback-overlay ${selected === currentQ.answer ? 'feedback-correct' : 'feedback-wrong'}`}>
          <div className="feedback-header">
            <span className="feedback-result-icon">{selected === currentQ.answer ? '🎯' : '❌'}</span>
            <span style={{ color: selected === currentQ.answer ? '#86efac' : '#fca5a5' }}>
              {selected === currentQ.answer
                ? `Correct! +${10 + Math.max(0, timeLeft * 2) - (showHint ? 10 : 0)} points`
                : selected === -1 ? "Time's up!" : 'Not quite right'}
            </span>
          </div>
          <div className="feedback-explanation">{currentQ.explanation}</div>
          <button className="btn-primary" style={{ marginTop: 16, padding: '12px 28px' }} onClick={handleNext}>
            {qIndex + 1 >= questions.length ? '🏁 See Results' : 'Next Question →'}
          </button>
        </div>
      )}

      {showGuruModal && (
        <GuruHintModal 
          hint={currentQ.hint} 
          guruHint={currentQ.guru_hint} 
          onClose={() => setShowGuruModal(false)} 
        />
      )}
    </div>
  );
}
