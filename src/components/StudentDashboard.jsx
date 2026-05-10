import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import GameHub from './GameHub.jsx';
import PrePostTest from './PrePostTest.jsx';
import { api } from '../api.js';
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function StudentDashboard({ user, progress, onStartLevel, onViewLeaderboard, onPrePostComplete }) {
  if (!progress) return null;

  const completedLevels = progress.completedLevels || [];
  const isFirstTimeStudent = completedLevels.length === 0;

  // 1. Force Pre-Test if not completed AND it's a first-time student
  if (!progress.preTestCompleted && isFirstTimeStudent) {
    return <PrePostTest user={user} type="pre" onComplete={onPrePostComplete} />;}
  const totalScore = progress.totalScore || 0;
  const accuracy = progress.accuracy || 0;
  const pramanaStats = progress.pramanaAccuracy || { pratyaksa: 0, anumana: 0, sabda: 0 };
  
  const WISDOM_QUOTES = [
    { sanskrit: "प्रत्यक्षानुमानोपमानशब्दाः प्रमाणानि", english: "Perception, inference, comparison, and testimony are the means of valid knowledge.", source: "Nyaya Sutra 1.1.3" },
    { sanskrit: "दुःखजन्मप्रवृत्तिदोषमिथ्याज्ञानानाम्", english: "From false knowledge arises activity, from activity arises attachment, and from attachment arises suffering.", source: "Nyaya Sutra 1.1.2" },
    { sanskrit: "तत्त्वज्ञानान्निःश्रेयसाधिगमः", english: "Through the knowledge of truth, one attains the highest good.", source: "Nyaya Sutra 1.1.1" },
    { sanskrit: "प्रमाणप्रमेयसंशयप्रयोजनदृष्टान्तसिद्धान्तावयवतर्कनिर्णयवादजल्पवितण्डाहेत्वाभासच्छलजातिनिग्रहस्थानानाम्", english: "The sixteen categories of Nyaya form the foundation of logical inquiry and debate.", source: "Nyaya Sutra 1.1.1" },
    { sanskrit: "समानप्रत्ययसिद्धं साम्यम्", english: "Equality is established through common cognition — similarity is a valid means of understanding.", source: "Nyaya Sutra 1.1.6" },
    { sanskrit: "यथार्थानुभवः प्रमा", english: "True experience of reality is valid knowledge — the essence of Prama.", source: "Tarkasangraha" },
  ];

  const [wisdomIndex, setWisdomIndex] = useState(0);
  const [wisdomFade, setWisdomFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setWisdomFade(false);
      setTimeout(() => {
        setWisdomIndex(prev => (prev + 1) % WISDOM_QUOTES.length);
        setWisdomFade(true);
      }, 400);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentWisdom = WISDOM_QUOTES[wisdomIndex];
  
  // Fake some cognitive skills based on pramana stats to fill 5 dimensions
  const [journals, setJournals] = useState([]);

  useEffect(() => {
    if (user?.id) {
      api.getJournal(user.id)
        .then(res => setJournals(res))
        .catch(err => console.error(err));
    }
  }, [user?.id]);

  const radarData = {
    labels: ['Observation', 'Inference', 'Reasoning', 'Memory', 'Source Evaluation'],
    datasets: [
      {
        label: 'Cognitive Skills Mastery (%)',
        data: [
          pramanaStats.pratyaksa || 10,
          pramanaStats.anumana || 10,
          Math.min(100, (pramanaStats.anumana || 10) + 10),
          Math.min(100, (pramanaStats.pratyaksa || 10) + 15),
          pramanaStats.sabda || 10
        ],
        backgroundColor: 'rgba(255, 153, 51, 0.2)',
        borderColor: '#FF9933',
        pointBackgroundColor: '#FF9933',
        borderWidth: 2,
      },
    ],
  };

  const radarOptions = {
    scales: {
      r: {
        angleLines: { color: 'rgba(255,255,255,0.1)' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        pointLabels: { color: '#FFFFF0', font: { size: 11 } },
        ticks: { backdropColor: 'transparent', color: 'rgba(255,255,255,0.5)', min: 0, max: 100, stepSize: 25, font: { size: 9 }, display: false }
      }
    },
    plugins: {
      legend: { labels: { color: '#FFFFF0', font: { size: 12 }, padding: 16 } }
    },
    maintainAspectRatio: false,
    layout: { padding: 8 }
  };

  // Check if we should prompt post test (all 10 levels done or explicit trigger)
  // We'll show Post-test button if 10 levels done and not completed.
  const allLevelsDone = completedLevels.length >= 10;
  if (allLevelsDone && !progress.postTestCompleted) {
    return <PrePostTest user={user} type="post" onComplete={onPrePostComplete} />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <div className="welcome-text">✦ Welcome Back</div>
          <div className="dashboard-title">{user.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-faded)', marginTop: 4 }}>
            {completedLevels.length === 0 ? 'Begin your Nyaya journey today' : `${completedLevels.length} level${completedLevels.length > 1 ? 's' : ''} completed • Pramana Scholar`}
          </div>
        </div>
        <div className="dashboard-header-right">
          <div className="wisdom-quote-inline" style={{ transition: 'opacity 0.4s ease', opacity: wisdomFade ? 1 : 0 }}>
            <div className="wisdom-label">📿 Nyaya Wisdom</div>
            <div className="wisdom-sanskrit">
              "{currentWisdom.sanskrit}"
            </div>
            <div className="wisdom-english">
              "{currentWisdom.english}"
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-faded)', marginTop: 4, fontStyle: 'italic' }}>— {currentWisdom.source}</div>
          </div>
          {totalScore > 0 && (
            <button className="btn-outline" onClick={onViewLeaderboard}>🏆 Leaderboard</button>
          )}
        </div>
      </div>

      {progress.postTestCompleted && progress.preTestScore !== null && progress.postTestScore !== null && (
        <div className="glass-strong" style={{ padding: 24, borderRadius: 20, marginBottom: 28, border: '1px solid var(--saffron)' }}>
          <h3 style={{ color: 'var(--saffron)', marginBottom: 12 }}>🎓 Final Assessment Complete!</h3>
          <p style={{ marginBottom: 16 }}>
            You scored {progress.preTestScore} on the Pre-Test and {progress.postTestScore} on the Post-Test.
            {progress.postTestScore > progress.preTestScore ? ' Amazing improvement!' : ' Good effort!'}
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {['pratyaksa', 'anumana', 'sabda'].map(p => {
              const pre = progress.preTestBreakdown?.[p] || 0;
              const post = progress.postTestBreakdown?.[p] || 0;
              const delta = post - pre;
              return (
                <div key={p} className="glass" style={{ padding: 12, borderRadius: 8, flex: 1, minWidth: 150 }}>
                  <div style={{ textTransform: 'capitalize', color: 'var(--text-faded)', fontSize: 13 }}>{p}</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: delta > 0 ? '#86efac' : 'var(--gold)' }}>
                    {delta > 0 ? '+' : ''}{delta} Points
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card stat-card-1 glass">
          <div className="stat-icon">🏅</div>
          <div className="stat-value" style={{ color: 'var(--saffron)' }}>{totalScore}</div>
          <div className="stat-label">TOTAL SCORE</div>
        </div>
        <div className="stat-card stat-card-2 glass">
          <div className="stat-icon">🎯</div>
          <div className="stat-value" style={{ color: 'var(--gold)' }}>{accuracy}%</div>
          <div className="stat-label">ACCURACY</div>
        </div>
        <div className="stat-card stat-card-3 glass">
          <div className="stat-icon">⚡</div>
          <div className="stat-value" style={{ color: 'var(--sacred-teal)' }}>{completedLevels.length}/10</div>
          <div className="stat-label">GAMES WON</div>
        </div>
        <div className="stat-card stat-card-4 glass">
          <div className="stat-icon">💡</div>
          <div className="stat-value" style={{ color: 'var(--lotus-pink)' }}>{progress?.hintsUsed || 0}</div>
          <div className="stat-label">HINTS USED</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 28 }}>
        {completedLevels.length > 0 && (
          <div className="glass" style={{ padding: 24, borderRadius: 20 }}>
            <div className="section-title" style={{ marginBottom: 16 }}>📊 Pramana Skill Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { key: 'pratyaksa', label: 'Pratyaksa (Observation)', color: 'var(--saffron)', val: pramanaStats.pratyaksa || 0 },
                { key: 'anumana', label: 'Anumana (Inference)', color: 'var(--gold)', val: pramanaStats.anumana || 0 },
                { key: 'sabda', label: 'Sabda (Testimony)', color: 'var(--sacred-teal)', val: pramanaStats.sabda || 0 },
              ].map(p => (
                <div key={p.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13 }}>{p.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.val}%</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: 8 }}>
                    <div className="progress-bar-fill" style={{ width: `${p.val}%`, background: p.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-faded)', background: 'rgba(255,255,255,0.03)', padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'var(--gold)', marginRight: 6 }}>💡</span>
              Practice active game modes to build up weaker Pramana proficiencies and achieve a balanced cognitive mastery!
            </div>
          </div>
        )}
        
        {completedLevels.length > 0 && (
          <div className="glass" style={{ padding: 24, borderRadius: 20, display: 'flex', flexDirection: 'column' }}>
            <div className="section-title" style={{ marginBottom: 16 }}>🧠 Cognitive Profile</div>
            <div style={{ flex: 1, minHeight: 280, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>
          </div>
        )}
      </div>

      <GameHub progress={progress} onStartGame={onStartLevel} />

      {journals.length > 0 && (
        <div className="glass" style={{ padding: 24, borderRadius: 20, marginTop: 24, gridColumn: '1 / -1' }}>
          <div className="section-title" style={{ marginBottom: 16 }}>📖 Your Reflection Journal</div>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {journals.map(j => (
              <div key={j.id} className="glass-strong" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 8, fontWeight: 'bold' }}>
                  LEVEL {j.level_id} • {new Date(j.timestamp).toLocaleDateString()}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-bright)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  "{j.journal_entry}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
