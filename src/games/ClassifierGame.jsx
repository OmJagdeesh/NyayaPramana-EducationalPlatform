import React, { useState, useEffect, useRef } from 'react';
import { shuffle } from '../utils/shuffle.js';
import GuruHintModal from '../components/GuruHintModal.jsx';
import { api } from '../api.js';

const SCENARIOS = [
  { text: "You look out the window and see raindrops falling.", type: "pratyaksa" },
  { text: "You see wet ground and conclude it must have rained.", type: "anumana" },
  { text: "A news reporter announces that it will rain tomorrow.", type: "sabda" },
  { text: "Tasting a lemon and experiencing its sourness.", type: "pratyaksa" },
  { text: "Seeing smoke and concluding there's fire.", type: "anumana" },
  { text: "Learning the distance to the moon from an astronomy textbook.", type: "sabda" },
  { text: "Hearing a loud bang and turning to see a car crash.", type: "pratyaksa" },
  { text: "Noticing an empty cookie jar and crumbs on a child's face, concluding they ate the cookies.", type: "anumana" },
  { text: "A doctor reading a medical journal about a new treatment.", type: "sabda" },
  { text: "Feeling the sharp prick of a needle.", type: "pratyaksa" },
  { text: "You see footprints in muddy ground and conclude someone walked there.", type: "anumana" },
  { text: "A trusted friend tells you it's raining heavily in their city.", type: "sabda" },
  { text: "You hear thunder and assume lightning struck recently.", type: "anumana" },
  { text: "You see the vibrant red color of a sunset.", type: "pratyaksa" },
  { text: "You read in a textbook that water boils at 100 degrees Celsius.", type: "sabda" },
  { text: "Noticing smoke on the hill, you realize there is a fire.", type: "anumana" },
  { text: "Tasting the sweetness of a ripe mango.", type: "pratyaksa" },
  { text: "Inferring that an area is flooded because the roads are submerged.", type: "anumana" },
  { text: "Following the instructions of an experienced guide to find a hidden trail.", type: "sabda" },
  { text: "Smelling the fragrance of a rose directly.", type: "pratyaksa" }
];

export default function ClassifierGame({ gameType, level, user, onComplete, onExit }) {
  const isBlitz = gameType === 'blitz';
  const MAX_TIME = isBlitz ? 60 : 45;
  
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showGuruModal, setShowGuruModal] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const timerRef = useRef(null);
  const classResultsRef = useRef([]); // track pramana results for server

  useEffect(() => {
    // Generate endless questions for blitz by shuffling multiple time, or a fixed set for normal classifier
    let pool = [];
    if (isBlitz) {
      for(let i=0; i<5; i++) pool = pool.concat(shuffle(SCENARIOS));
    } else {
      pool = shuffle(SCENARIOS).slice(0, 15);
    }
    setQuestions(pool);
  }, [isBlitz]);

  useEffect(() => {
    if (gameOver || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameOver, questions]);

  // Keep latest values in refs so the gameOver effect always reads fresh data
  const scoreRef = useRef(score);
  const correctRef = useRef(correct);
  const qIndexRef = useRef(qIndex);
  const timeLeftValRef = useRef(timeLeft);
  scoreRef.current = score;
  correctRef.current = correct;
  qIndexRef.current = qIndex;
  timeLeftValRef.current = timeLeft;

  useEffect(() => {
    if (gameOver) {
      setTimeout(() => {
         onComplete({
            score: scoreRef.current,
            accuracy: qIndexRef.current > 0 ? Math.round((correctRef.current / qIndexRef.current) * 100) : 0,
            correct: correctRef.current,
            total: qIndexRef.current,
            hintsUsed: 0,
            time: MAX_TIME - timeLeftValRef.current,
            pramanaResults: classResultsRef.current
         });
      }, 1500); // short delay to show final score
    }
  }, [gameOver]);

  const handleHint = async () => {
    setHintsUsed(h => h + 1);
    setShowGuruModal(true);
    setScore(s => Math.max(0, s - 5)); // penalty
    try {
      await api.logHint({
        gameMode: gameType,
        questionId: qIndex.toString(),
        hintNumber: 1
      });
    } catch (e) {}
  };

  const handleClassify = (selectedType) => {
    if (gameOver) return;

    const currentQ = questions[qIndex];
    if (currentQ.type === selectedType) {
      // Correct
      const comboMultiplier = Math.min(3, 1 + (combo * 0.1));
      setScore(s => Math.floor(s + (10 * comboMultiplier)));
      setCorrect(c => c + 1);
      setCombo(c => c + 1);
      classResultsRef.current.push({ pramana: currentQ.type, correct: true });
      setFeedback({ status: 'correct', pramana: currentQ.type });
    } else {
      // Wrong
      setCombo(0);
      classResultsRef.current.push({ pramana: currentQ.type, correct: false });
      setFeedback({ status: 'wrong', pramana: selectedType });
    }

    if (!isBlitz && qIndex + 1 >= 15) {
      setGameOver(true);
      clearInterval(timerRef.current);
    } else {
      setQIndex(i => i + 1);
    }

    setTimeout(() => setFeedback(null), 400); // brief flash
  };

  if (questions.length === 0) return null;

  const currentQ = questions[qIndex];

  return (
    <div className="game-page">
      <div className="game-header">
         <div className="game-progress-info">
             <div className="game-level-badge" style={{ background: 'rgba(10,191,188,0.15)', color: 'var(--sacred-teal)', border: '1px solid rgba(10,191,188,0.35)' }}>
               {isBlitz ? 'BLITZ MODE' : 'CLASSIFIER'}
             </div>
             <div className="question-counter">
                {isBlitz ? `Combo x${combo}` : `Question ${qIndex + 1} / 15`}
             </div>
             {combo >= 3 && (
               <div className="streak-indicator" style={{ 
                 color: 'var(--saffron)', 
                 fontWeight: 'bold', 
                 marginLeft: '12px',
                 animation: 'pulse 1.5s infinite' 
               }}>
                 🔥 {combo}x Streak!
               </div>
             )}
         </div>
         <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className={`timer-display ${timeLeft <= 10 ? 'timer-warning' : 'timer-normal'}`}>
               ⏱ {timeLeft}s
            </div>
            <div className="score-display">
               ✦ {score}
            </div>
            <button className="btn-outline" style={{ padding: '8px 16px', fontSize: 12 }} onClick={() => { if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) onExit(); }}>✕ Exit</button>
         </div>
      </div>

      <div className="glass-strong" style={{ width: '100%', maxWidth: '780px', padding: 40, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'all 0.3s' }}>
        {gameOver ? (
           <div>
              <h2>Time's Up!</h2>
              <div style={{ color: 'var(--gold)', fontSize: 32, margin: '20px 0' }}>{score} Points</div>
           </div>
        ) : (
           <>
              <div style={{ fontSize: 24, lineHeight: 1.6, marginBottom: 40, color: 'rgba(255,255,255,0.9)' }}>
                 "{currentQ?.text}"
              </div>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <button 
                  className={`btn-primary ${feedback && feedback.status === 'wrong' && feedback.pramana === 'pratyaksa' ? 'wrong' : ''}`} 
                  style={{ background: 'var(--saffron)', flex: 1, padding: 20, fontSize: 18 }}
                  onClick={() => handleClassify('pratyaksa')}
                >
                  👁️ Pratyaksa
                </button>
                <button 
                  className={`btn-primary ${feedback && feedback.status === 'wrong' && feedback.pramana === 'anumana' ? 'wrong' : ''}`} 
                  style={{ background: 'var(--gold)', color: '#000', flex: 1, padding: 20, fontSize: 18 }}
                  onClick={() => handleClassify('anumana')}
                >
                  🤔 Anumana
                </button>
                <button 
                  className={`btn-primary ${feedback && feedback.status === 'wrong' && feedback.pramana === 'sabda' ? 'wrong' : ''}`} 
                  style={{ background: 'var(--sacred-teal)', flex: 1, padding: 20, fontSize: 18 }}
                  onClick={() => handleClassify('sabda')}
                >
                  📜 Sabda
                </button>
              </div>
              {feedback?.status && (
                <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', fontWeight: 'bold' }}>
                   {feedback.status === 'correct' ? <span style={{ color: '#86efac', fontSize: 24 }}>+{(10 * Math.min(3, 1 + ((combo-1) * 0.1))).toFixed(0)}</span> : <span style={{ color: '#fca5a5', fontSize: 24 }}>Combo Break!</span>}
                </div>
              )}
              
              <div style={{ marginTop: 24 }}>
                <button className="btn-outline" onClick={handleHint} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--gold)', padding: '6px 12px' }}>
                  <span style={{ fontSize: 16 }}>🧘🏽‍♂️</span> Consult the Guru (−5 pts)
                </button>
              </div>
           </>
        )}
      </div>

      {showGuruModal && (
        <GuruHintModal 
          hint="Are you directly sensing it (Pratyaksa), deducing it from evidence (Anumana), or learning it from someone else's testimony (Sabda)?"
          guruHint="Consider, dear student... Are you directly sensing it (Pratyaksa), deducing it from evidence (Anumana), or learning it from someone else's testimony (Sabda)?"
          onClose={() => setShowGuruModal(false)}
        />
      )}
    </div>
  );
}
