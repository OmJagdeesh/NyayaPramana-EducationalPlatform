import React, { useState, useEffect, useRef } from 'react';
import { shuffle } from '../utils/shuffle.js';
import GuruHintModal from '../components/GuruHintModal.jsx';
import { api } from '../api.js';

<<<<<<< HEAD
const SYLLOGISMS = [
  {
    id: 1,
    steps: [
      { type: "Pratijna", text: "The hill has fire." },
      { type: "Hetu", text: "Because it has smoke." },
      { type: "Udaharana", text: "Whatever has smoke has fire, for example, an oven." },
      { type: "Upanaya", text: "This hill has smoke which is invariably associated with fire." },
      { type: "Nigamana", text: "Therefore, this hill has fire." }
    ]
  },
  {
    id: 2,
    steps: [
      { type: "Pratijna", text: "Sound is non-eternal." },
      { type: "Hetu", text: "Because it is produced." },
      { type: "Udaharana", text: "Whatever is produced is non-eternal, for example, a pot." },
      { type: "Upanaya", text: "Sound is such a produced thing." },
      { type: "Nigamana", text: "Therefore, sound is non-eternal." }
    ]
  },
  {
    id: 3,
    steps: [
      { type: "Pratijna", text: "This man is sick." },
      { type: "Hetu", text: "Because he has a high fever." },
      { type: "Udaharana", text: "Whoever has a high fever is sick, for example, the patient in bed 3." },
      { type: "Upanaya", text: "This man has a fever invariably associated with sickness." },
      { type: "Nigamana", text: "Therefore, this man is sick." }
    ]
  }
];



export default function SequenceGame({ gameType, level, user, onComplete, onExit }) {
  const [questions] = useState(() => shuffle(SYLLOGISMS).slice(0, 3));
  const [qIndex, setQIndex] = useState(0);
  const [scrambled, setScrambled] = useState([]);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null);
  
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeStart] = useState(Date.now());
  const seqResultsRef = useRef([]);

  useEffect(() => {
    if (questions[qIndex]) {
      setupRound(questions[qIndex]);
    }
  }, [qIndex, questions]);
=======
// ─── SYLLOGISM DATA ────────────────────────────────────────────────────────────
const SYLLOGISMS = [
  {
    id: 1,
    topic: "Fire on the Hill",
    steps: [
      { type: "Pratijna",    text: "The hill has fire." },
      { type: "Hetu",        text: "Because it has smoke." },
      { type: "Udaharana",   text: "Whatever has smoke has fire, for example, an oven." },
      { type: "Upanaya",     text: "This hill has smoke which is invariably associated with fire." },
      { type: "Nigamana",    text: "Therefore, this hill has fire." },
    ],
  },
  {
    id: 2,
    topic: "Sound is Non-Eternal",
    steps: [
      { type: "Pratijna",    text: "Sound is non-eternal." },
      { type: "Hetu",        text: "Because it is produced." },
      { type: "Udaharana",   text: "Whatever is produced is non-eternal, for example, a pot." },
      { type: "Upanaya",     text: "Sound is such a produced thing." },
      { type: "Nigamana",    text: "Therefore, sound is non-eternal." },
    ],
  },
  {
    id: 3,
    topic: "The Sick Man",
    steps: [
      { type: "Pratijna",    text: "This man is sick." },
      { type: "Hetu",        text: "Because he has a high fever." },
      { type: "Udaharana",   text: "Whoever has a high fever is sick, for example, the patient in bed 3." },
      { type: "Upanaya",     text: "This man has a fever invariably associated with sickness." },
      { type: "Nigamana",    text: "Therefore, this man is sick." },
    ],
  },
  {
    id: 4,
    topic: "The Moving Cloud",
    steps: [
      { type: "Pratijna",    text: "The cloud will bring rain." },
      { type: "Hetu",        text: "Because it is dark and low in the sky." },
      { type: "Udaharana",   text: "Whenever clouds are dark and low they bring rain, as we observed last monsoon." },
      { type: "Upanaya",     text: "This cloud is dark and low in the same way." },
      { type: "Nigamana",    text: "Therefore, this cloud will bring rain." },
    ],
  },
  {
    id: 5,
    topic: "The Learned Scholar",
    steps: [
      { type: "Pratijna",    text: "Devadatta is learned." },
      { type: "Hetu",        text: "Because he studied under a great teacher." },
      { type: "Udaharana",   text: "Whoever studied under a great teacher becomes learned, like Yajnavalkya." },
      { type: "Upanaya",     text: "Devadatta studied under such a great teacher." },
      { type: "Nigamana",    text: "Therefore, Devadatta is learned." },
    ],
  },
];

// ─── INFERENCE CHAIN DATA ─────────────────────────────────────────────────────
const CHAINS = [
  {
    id: 1,
    topic: "Doctor Diagnosing Fever",
    steps: [
      { type: "Observation",     text: "The patient's forehead feels hot to the touch." },
      { type: "Hypothesis",      text: "He probably has a fever." },
      { type: "Verification",    text: "The thermometer reads 103°F, confirming high fever." },
      { type: "Causal Reasoning", text: "High fever may indicate infection — a doctor confirms bacterial infection." },
      { type: "Conclusion",      text: "The patient has a bacterial infection causing fever and must take antibiotics." },
    ],
  },
  {
    id: 2,
    topic: "Smoke Seen from a Distance",
    steps: [
      { type: "Observation",     text: "I see a column of smoke rising from behind the mountain." },
      { type: "Recollection",    text: "I recall that wherever there is smoke, there is fire (Vyapti)." },
      { type: "Application",     text: "That mountain region has smoke, so it must have fire too (Upanaya)." },
      { type: "Certainty",       text: "The universal rule (Vyapti) is certain and applicable here." },
      { type: "Conclusion",      text: "Therefore, there is fire behind the mountain (Nigamana)." },
    ],
  },
  {
    id: 3,
    topic: "Detecting a Liar",
    steps: [
      { type: "Observation",     text: "The witness avoids eye contact and contradicts himself." },
      { type: "Inference",       text: "These signs are typically associated with deception." },
      { type: "Corroboration",   text: "Physical evidence also contradicts the witness's account." },
      { type: "Evaluation",      text: "No reliable testimony supports his version of events." },
      { type: "Conclusion",      text: "The witness is likely lying; his testimony is unreliable (Aptha-abhava)." },
    ],
  },
  {
    id: 4,
    topic: "Predicting the Harvest",
    steps: [
      { type: "Observation",     text: "The monsoon arrived late and rainfall was below average." },
      { type: "Recollection",    text: "Past seasons with low rainfall led to poor crop yields." },
      { type: "Application",     text: "This season's low rainfall matches those past conditions." },
      { type: "Evaluation",      text: "No other factors (irrigation, fertilizer) compensate sufficiently." },
      { type: "Conclusion",      text: "Therefore, this year's harvest will be poor." },
    ],
  },
];

// ─── HINT CONTENT ─────────────────────────────────────────────────────────────
const HINTS = {
  syllogism: {
    hint: "The Nyaya order is: Hypothesis → Reason → Example → Application → Conclusion.",
    guruHint: "Begin with your claim (Pratijna), state the reason (Hetu), offer a universal example (Udaharana), apply it to this case (Upanaya), and conclude (Nigamana).",
  },
  chain: {
    hint: "An inference chain flows: Observation → Reasoning → Verification/Application → Evaluation → Conclusion.",
    guruHint: "Start with what you perceive directly, then reason from memory and universal rules, apply them to the case, evaluate alternatives, and only then draw your final conclusion.",
  },
};

export default function SequenceGame({ gameType, level, user, onComplete, onExit }) {
  const sourceData  = gameType === 'chain' ? CHAINS : SYLLOGISMS;
  const [questions] = useState(() => shuffle(sourceData).slice(0, 3));

  const [qIndex,       setQIndex]       = useState(0);
  const [scrambled,    setScrambled]    = useState([]);
  const [selected,     setSelected]     = useState([]);
  const [feedback,     setFeedback]     = useState(null); // null | 'correct' | 'wrong'

  const [score,        setScore]        = useState(0);
  const [correct,      setCorrect]      = useState(0);
  const [hintsUsed,    setHintsUsed]    = useState(0);
  const [showGuruModal, setShowGuruModal] = useState(false);

  const [timeStart]   = useState(Date.now());
  const seqResultsRef  = useRef([]);

  useEffect(() => {
    if (questions[qIndex]) setupRound(questions[qIndex]);
  }, [qIndex]);
>>>>>>> a170f25 (added the admin login and its functionaly)

  function setupRound(q) {
    const mixed = shuffle(q.steps.map((step, idx) => ({ ...step, originalIndex: idx })));
    setScrambled(mixed);
    setSelected([]);
    setFeedback(null);
  }

<<<<<<< HEAD
  const handleSelect = (item) => {
    setScrambled(prev => prev.filter(x => x !== item));
    setSelected(prev => [...prev, item]);
  };

  const handleDeselect = (item) => {
    setSelected(prev => prev.filter(x => x !== item));
    setScrambled(prev => [...prev, item]);
  };

  const verifySequence = () => {
    let isCorrect = true;
    for (let i = 0; i < selected.length; i++) {
       if (selected[i].originalIndex !== i) {
          isCorrect = false;
          break;
       }
    }

    if (isCorrect) {
       setScore(s => s + 100);
       setCorrect(c => c + 1);
       seqResultsRef.current.push({ pramana: 'anumana', correct: true });
       setFeedback('correct');
    } else {
       seqResultsRef.current.push({ pramana: 'anumana', correct: false });
       setFeedback('wrong');
    }
  };

  const nextQuestion = () => {
    if (qIndex + 1 >= questions.length) {
       const totalTime = Math.round((Date.now() - timeStart) / 1000);
       onComplete({
         score,
         accuracy: Math.round((correct / questions.length) * 100),
         correct,
         total: questions.length,
         hintsUsed: 0,
         time: totalTime,
         pramanaResults: seqResultsRef.current
       });
    } else {
       setQIndex(i => i + 1);
    }
  };

  const handleHint = async () => {
    setHintsUsed(h => h + 1);
    setShowGuruModal(true);
    setScore(s => Math.max(0, s - 10)); // penalty
=======
  function handleSelect(item) {
    setScrambled(prev => prev.filter(x => x !== item));
    setSelected(prev => [...prev, item]);
  }

  function handleDeselect(item) {
    if (feedback) return;
    setSelected(prev => prev.filter(x => x !== item));
    setScrambled(prev => [...prev, item]);
  }

  function verifySequence() {
    const isCorrect = selected.every((item, i) => item.originalIndex === i);
    if (isCorrect) {
      setScore(s => s + 100);
      setCorrect(c => c + 1);
      seqResultsRef.current.push({ pramana: 'anumana', correct: true });
    } else {
      seqResultsRef.current.push({ pramana: 'anumana', correct: false });
    }
    setFeedback(isCorrect ? 'correct' : 'wrong');
  }

  function nextQuestion() {
    if (qIndex + 1 >= questions.length) {
      const totalTime = Math.round((Date.now() - timeStart) / 1000);
      onComplete({
        score,
        accuracy: Math.round((correct / questions.length) * 100),
        correct,
        total: questions.length,
        hintsUsed,
        time: totalTime,
        pramanaResults: seqResultsRef.current,
      });
    } else {
      setQIndex(i => i + 1);
    }
  }

  async function handleHint() {
    setHintsUsed(h => h + 1);
    setScore(s => Math.max(0, s - 10));
    setShowGuruModal(true);
>>>>>>> a170f25 (added the admin login and its functionaly)
    try {
      await api.logHint({
        gameMode: gameType,
        questionId: questions[qIndex].id.toString(),
<<<<<<< HEAD
        hintNumber: 1
      });
    } catch (e) {}
  };

  if (!questions || questions.length === 0) return null;

  return (
    <div className="game-page">
      <div className="game-header">
         <div className="game-progress-info">
             <div className="game-level-badge" style={{ background: 'rgba(247,201,72,0.15)', color: 'var(--gold)', border: '1px solid rgba(247,201,72,0.35)' }}>
               {gameType === 'chain' ? 'INFERENCE CHAIN' : 'SYLLOGISM BUILDER'}
             </div>
             <div className="question-counter">
                Sequence {qIndex + 1} / {questions.length}
             </div>
         </div>
         <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="score-display">
               ✦ {score}
            </div>
            <button className="btn-outline" style={{ padding: '8px 16px', fontSize: 12 }} onClick={onExit}>✕ Exit</button>
         </div>
      </div>

      <div style={{ width: '100%', maxWidth: '780px' }}>
         <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 20, textAlign: 'center', fontSize: 16 }}>
           Construct the correct 5-membered Nyaya syllogism by selecting the statements in order.
           <br/>
           <button className="btn-outline" onClick={handleHint} style={{ marginTop: 12, padding: '4px 12px', fontSize: 14 }}>
             🧘🏽‍♂️ Consult the Guru (−10 pts)
           </button>
         </div>

         {/* Sequence Area */}
         <div className="glass-strong" style={{ padding: 20, minHeight: 400, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
           <h3 style={{ marginBottom: 10, color: 'var(--gold)' }}>Your Syllogism Sequence</h3>
           {selected.map((item, idx) => (
             <div 
               key={idx} 
               onClick={() => !feedback && handleDeselect(item)}
               style={{
                 padding: 16,
                 background: feedback === 'correct' ? 'rgba(34,197,94,0.15)' : feedback === 'wrong' ? (item.originalIndex === idx ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.15)') : 'rgba(255,255,255,0.05)',
                 border: feedback === 'correct' ? '1px solid rgba(34,197,94,0.5)' : feedback === 'wrong' ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
                 borderRadius: 8,
                 cursor: feedback ? 'default' : 'pointer',
                 display: 'flex', alignItems: 'center', gap: 16
               }}
             >
               <div style={{ width: 24, height: 24, background: 'var(--gold)', color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                 {idx + 1}
               </div>
               <div style={{ flex: 1 }}>{item.text}</div>
               {!feedback && <div style={{ opacity: 0.5 }}>✕</div>}
             </div>
           ))}
           {selected.length === 0 && (
             <div style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', padding: 20, textAlign: 'center' }}>
               Click items from the pool below to place them here.
             </div>
           )}
         </div>

         {/* Pool Area */}
         {!feedback && (
           <div className="glass" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
             <h3 style={{ marginBottom: 10, color: 'var(--text-main)' }}>Available Statements</h3>
             {scrambled.map((item, idx) => (
               <div 
                 key={idx} 
                 onClick={() => handleSelect(item)}
                 style={{
                   padding: 16,
                   background: 'rgba(10,191,188,0.1)',
                   border: '1px solid rgba(10,191,188,0.3)',
                   borderRadius: 8,
                   cursor: 'pointer',
                   display: 'flex', alignItems: 'center', gap: 16,
                   transition: 'transform 0.2s'
                 }}
                 onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
               >
                 <div>{item.text}</div>
               </div>
             ))}
           </div>
         )}
      </div>

      <div style={{ marginTop: 24 }}>
        {selected.length === 5 && !feedback && (
           <button className="btn-primary" onClick={verifySequence} style={{ padding: '14px 40px', fontSize: 16 }}>Verify Sequence</button>
        )}
        {feedback && (
           <button className="btn-primary" onClick={nextQuestion} style={{ padding: '14px 40px', fontSize: 16 }}>
             {qIndex + 1 >= questions.length ? 'Finish Game' : 'Next Sequence →'}
           </button>
        )}
      </div>

      {showGuruModal && (
        <GuruHintModal 
          hint="The Nyaya order is: Hypothesis (Pratijna) -> Reason (Hetu) -> Example (Udaharana) -> Application (Upanaya) -> Conclusion (Nigamana)."
          guruHint="Consider, dear student... Establish the hypothesis first, state the reason, provide a universal example, tie it to the present case, and finalize your conclusion."
=======
        hintNumber: hintsUsed + 1,
      });
    } catch (e) {}
  }

  if (!questions || questions.length === 0) return null;

  const currentQ  = questions[qIndex];
  const stepCount = currentQ?.steps?.length || 5;
  const hintData  = HINTS[gameType] || HINTS.syllogism;

  const isChain  = gameType === 'chain';
  const accentColor = isChain ? 'var(--lotus-pink)' : 'var(--gold)';
  const labelText   = isChain ? 'INFERENCE CHAIN' : 'SYLLOGISM BUILDER';
  const instructions = isChain
    ? 'Arrange the steps of the inference chain in the correct logical order.'
    : 'Construct the correct 5-membered Nyaya syllogism by selecting the statements in order.';

  return (
    <div className="game-page">
      {/* Header */}
      <div className="game-header">
        <div className="game-progress-info">
          <div className="game-level-badge" style={{ background: `rgba(247,201,72,0.15)`, color: accentColor, border: `1px solid ${accentColor}55` }}>
            {labelText}
          </div>
          <div className="question-counter">
            Sequence {qIndex + 1} / {questions.length}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="score-display">✦ {score}</div>
          <button className="btn-outline" style={{ padding: '8px 16px', fontSize: 12 }} onClick={onExit}>✕ Exit</button>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '780px' }}>
        {/* Topic + instructions */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: accentColor, marginBottom: 6 }}>
            {currentQ.topic}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 12 }}>
            {instructions}
          </div>
          <button className="btn-outline" onClick={handleHint} style={{ padding: '6px 16px', fontSize: 13 }}>
            🧘🏽‍♂️ Consult the Guru (−10 pts)
          </button>
        </div>

        {/* Sequence area */}
        <div className="glass-strong" style={{ padding: 20, minHeight: 280, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ marginBottom: 10, color: accentColor, fontSize: 15 }}>
            {isChain ? 'Your Inference Chain' : 'Your Syllogism Sequence'}
          </h3>

          {selected.map((item, idx) => {
            const isItemCorrect = item.originalIndex === idx;
            let bg, border;
            if (!feedback) {
              bg = 'rgba(255,255,255,0.05)';
              border = '1px solid rgba(255,255,255,0.1)';
            } else if (feedback === 'correct') {
              bg = 'rgba(34,197,94,0.15)';
              border = '1px solid rgba(34,197,94,0.5)';
            } else {
              bg = isItemCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.15)';
              border = isItemCorrect ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.5)';
            }

            return (
              <div
                key={idx}
                onClick={() => handleDeselect(item)}
                style={{ padding: 14, background: bg, border, borderRadius: 8, cursor: feedback ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s' }}
              >
                <div style={{ minWidth: 28, height: 28, background: accentColor, color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13, flexShrink: 0 }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: accentColor, marginRight: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {item.type}:
                  </span>
                  {item.text}
                </div>
                {!feedback && <div style={{ opacity: 0.4, fontSize: 18 }}>✕</div>}
                {feedback && (
                  <div style={{ fontSize: 18 }}>{isItemCorrect ? '✅' : '❌'}</div>
                )}
              </div>
            );
          })}

          {selected.length === 0 && (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', padding: 24, textAlign: 'center' }}>
              Click statements from the pool below to place them here in order.
            </div>
          )}
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div style={{
            textAlign: 'center', padding: '14px 20px', borderRadius: 12, marginBottom: 16, fontWeight: 700, fontSize: 15,
            background: feedback === 'correct' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${feedback === 'correct' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: feedback === 'correct' ? '#86efac' : '#fca5a5',
          }}>
            {feedback === 'correct'
              ? '✅ Excellent! The sequence is perfectly ordered.'
              : '❌ Not quite — review the correct order highlighted above.'}
          </div>
        )}

        {/* Pool area */}
        {!feedback && (
          <div className="glass" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ marginBottom: 10, color: 'var(--text-main)', fontSize: 15 }}>Available Statements</h3>
            {scrambled.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', textAlign: 'center', padding: 12 }}>
                All statements placed — hit "Verify" to check!
              </div>
            )}
            {scrambled.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(item)}
                style={{ padding: 14, background: 'rgba(10,191,188,0.08)', border: '1px solid rgba(10,191,188,0.3)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'transform 0.15s, background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sacred-teal)', marginRight: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {item.type}:
                  </span>
                  {item.text}
                </div>
                <div style={{ opacity: 0.5, fontSize: 18 }}>＋</div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
          {selected.length === stepCount && !feedback && (
            <button className="btn-primary" onClick={verifySequence} style={{ padding: '14px 40px', fontSize: 16 }}>
              Verify Sequence ✓
            </button>
          )}
          {feedback && (
            <button className="btn-primary" onClick={nextQuestion} style={{ padding: '14px 40px', fontSize: 16 }}>
              {qIndex + 1 >= questions.length ? '🏁 Finish Game' : 'Next Sequence →'}
            </button>
          )}
        </div>
      </div>

      {showGuruModal && (
        <GuruHintModal
          hint={hintData.hint}
          guruHint={hintData.guruHint}
>>>>>>> a170f25 (added the admin login and its functionaly)
          onClose={() => setShowGuruModal(false)}
        />
      )}
    </div>
  );
}
