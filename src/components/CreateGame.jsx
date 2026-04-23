import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function CreateGame({ user, notify }) {
  const [classes, setClasses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('quiz');
  const [questions, setQuestions] = useState([createEmptyQuestion()]);

  function createEmptyQuestion() {
    return {
      id: Date.now() + Math.random(),
      text: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
      pramana: 'anumana'
    };
  }

  useEffect(() => { loadClasses(); }, []);

  async function loadClasses() {
    try {
      setLoading(true);
      const data = await api.getMyClasses();
      setClasses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadRequests(classId) {
    try {
      const data = await api.getJoinRequests(classId);
      setRequests(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      notify('Please enter a name for your game/quiz.', 'error');
      return;
    }

    const validQuestions = questions.map(q => {
      const newOptions = [];
      let newCorrectIndex = 0;
      q.options.forEach((opt, idx) => {
        if (opt.trim()) {
          if (idx === q.correctIndex) newCorrectIndex = newOptions.length;
          newOptions.push(opt.trim());
        }
      });
      return { ...q, options: newOptions, correctIndex: newCorrectIndex };
    }).filter(q => q.text.trim() && q.options.length >= 2);

    if (type !== 'class' && validQuestions.length === 0) {
      notify('Please add at least one complete question (needs text and minimum 2 options).', 'error');
      return;
    }

    try {
      const result = await api.createClass({
        name: name.trim(),
        description: description.trim(),
        type,
        questions: validQuestions.map(q => ({
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          pramana: q.pramana
        }))
      });
      notify(`Created! Game code: ${result.classCode}`, 'success');
      setShowCreate(false);
      setName('');
      setDescription('');
      setQuestions([createEmptyQuestion()]);
      loadClasses();
    } catch (e) {
      notify(e.message || 'Failed to create', 'error');
    }
  }

  async function handleApprove(enrollmentId, action) {
    try {
      await api.approveRequest({ enrollmentId, action });
      notify(`Request ${action}!`, 'success');
      if (selectedClass) loadRequests(selectedClass.id);
      loadClasses();
    } catch (e) {
      notify(e.message || 'Failed', 'error');
    }
  }

  function updateQuestion(index, field, value) {
    const updated = [...questions];
    const qCopy = { ...updated[index] };
    if (field === 'option') {
      const newOptions = [...qCopy.options];
      newOptions[value.optIdx] = value.text;
      qCopy.options = newOptions;
    } else {
      qCopy[field] = value;
    }
    updated[index] = qCopy;
    setQuestions(updated);
  }

  function addQuestion() {
    setQuestions([...questions, createEmptyQuestion()]);
  }

  function removeQuestion(index) {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  }

  if (loading) {
    return <div className="dashboard"><div style={{ textAlign: 'center', padding: 60, color: 'var(--gold)' }}>Loading...</div></div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <div className="welcome-text">✦ Game Creator</div>
          <div className="dashboard-title">{showCreate ? 'New Game / Quiz' : 'My Games & Quizzes'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-faded)', marginTop: 4 }}>
            {showCreate ? 'Create custom questions and share via game code' : `${classes.length} game${classes.length !== 1 ? 's' : ''} created`}
          </div>
        </div>
        <div className="dashboard-header-right">
          <button className={showCreate ? 'btn-outline' : 'btn-primary'} onClick={() => { setShowCreate(!showCreate); setSelectedClass(null); }}>
            {showCreate ? '← Back to Games' : '+ Create New Game'}
          </button>
        </div>
      </div>

      {/* ── CREATE FORM ── */}
      {showCreate && (
        <div className="glass-strong" style={{ padding: 32, borderRadius: 24, marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Game / Quiz Name</label>
              <input className="form-input" placeholder="e.g. Pramana Basics Test" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['quiz', 'game', 'class'].map(t => (
                  <button key={t} className={`nav-btn ${type === t ? 'nav-btn-active' : 'nav-btn-inactive'}`}
                    onClick={() => setType(t)} style={{ textTransform: 'capitalize', flex: 1 }}>
                    {t === 'quiz' ? '📝' : t === 'game' ? '🎮' : '📚'} {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          {type !== 'class' && (
            <>
              <div className="section-title" style={{ marginTop: 24, marginBottom: 16 }}>📝 Questions ({questions.length})</div>
              {questions.map((q, qi) => (
                <div key={q.id} className="glass" style={{ padding: 20, borderRadius: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold)' }}>Question {qi + 1}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select value={q.pramana}
                        onChange={e => updateQuestion(qi, 'pramana', e.target.value)}
                        style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '4px 8px', color: 'var(--text-main)', fontSize: 12, fontFamily: 'DM Sans, sans-serif' }}>
                        <option value="pratyaksa">Pratyaksa</option>
                        <option value="anumana">Anumana</option>
                        <option value="sabda">Sabda</option>
                      </select>
                      {questions.length > 1 && (
                        <button className="nav-btn nav-btn-inactive" onClick={() => removeQuestion(qi)} style={{ fontSize: 11 }}>✕ Remove</button>
                      )}
                    </div>
                  </div>

                  <input className="form-input" placeholder="Enter question text..."
                    value={q.text} onChange={e => updateQuestion(qi, 'text', e.target.value)}
                    style={{ marginBottom: 12 }} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {q.options.map((opt, oi) => (
                      <div key={oi} style={{ position: 'relative' }}>
                        <input className="form-input"
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                          value={opt}
                          onChange={e => updateQuestion(qi, 'option', { optIdx: oi, text: e.target.value })}
                          style={{
                            paddingLeft: 36,
                            border: q.correctIndex === oi ? '1.5px solid rgba(34,197,94,0.5)' : undefined,
                            background: q.correctIndex === oi ? 'rgba(34,197,94,0.05)' : undefined
                          }} />
                        <button onClick={() => updateQuestion(qi, 'correctIndex', oi)}
                          style={{
                            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                            background: q.correctIndex === oi ? '#22c55e' : 'rgba(255,255,255,0.1)',
                            border: 'none', width: 18, height: 18, borderRadius: 4,
                            cursor: 'pointer', fontSize: 10, color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                          {q.correctIndex === oi ? '✓' : String.fromCharCode(65 + oi)}
                        </button>
                      </div>
                    ))}
                  </div>

                  <input className="form-input" placeholder="Explanation (shown after answering)..."
                    value={q.explanation} onChange={e => updateQuestion(qi, 'explanation', e.target.value)}
                    style={{ fontSize: 13 }} />
                </div>
              ))}

              <button className="btn-outline" onClick={addQuestion} style={{ marginBottom: 20 }}>
                + Add Question
              </button>
            </>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-primary" onClick={handleCreate} style={{ flex: 1 }}>
              🚀 Create & Generate Code
            </button>
            <button className="btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── EXISTING CLASSES LIST ── */}
      {!showCreate && !selectedClass && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {classes.length === 0 ? (
            <div className="glass-strong" style={{ padding: 48, textAlign: 'center', borderRadius: 24, gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Games Created Yet</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Create your first quiz or game and share it with students via a game code.</div>
              <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Create First Game</button>
            </div>
          ) : classes.map(cls => (
            <div key={cls.id} className="glass-strong" style={{ padding: 24, borderRadius: 20, cursor: 'pointer', transition: 'transform 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              onClick={() => { setSelectedClass(cls); loadRequests(cls.id); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{cls.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faded)', marginTop: 2 }}>{cls.description || 'No description'}</div>
                </div>
                <span className="pramana-tag" style={{
                  background: cls.type === 'quiz' ? 'rgba(247,201,72,0.15)' : cls.type === 'game' ? 'rgba(10,191,188,0.15)' : 'rgba(255,107,53,0.15)',
                  color: cls.type === 'quiz' ? 'var(--gold)' : cls.type === 'game' ? 'var(--sacred-teal)' : 'var(--saffron)',
                  border: `1px solid ${cls.type === 'quiz' ? 'var(--gold)' : cls.type === 'game' ? 'var(--sacred-teal)' : 'var(--saffron)'}40`,
                  textTransform: 'capitalize'
                }}>{cls.type}</span>
              </div>

              <div className="class-code-display" style={{
                background: 'rgba(247,201,72,0.08)', border: '1px solid rgba(247,201,72,0.2)',
                borderRadius: 12, padding: '10px 16px', marginBottom: 14, display: 'flex',
                justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-faded)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Game Code</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', letterSpacing: 4, fontFamily: 'monospace' }}>{cls.class_code}</div>
                </div>
                <button className="nav-btn nav-btn-inactive" style={{ fontSize: 11 }}
                  onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(cls.class_code); notify('Code copied!', 'success'); }}>
                  📋 Copy
                </button>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ color: 'var(--sacred-teal)' }}>👥 {cls.student_count} student{cls.student_count !== 1 ? 's' : ''}</span>
                {cls.pending_count > 0 && (
                  <span style={{ color: 'var(--saffron)' }}>⏳ {cls.pending_count} pending</span>
                )}
                <span style={{ color: 'var(--text-faded)' }}>📝 {(cls.questions || []).length} questions</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SELECTED CLASS DETAIL ── */}
      {!showCreate && selectedClass && (
        <div>
          <button className="btn-outline" onClick={() => setSelectedClass(null)} style={{ marginBottom: 20 }}>← Back to All Games</button>

          <div className="glass-strong" style={{ padding: 28, borderRadius: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{selectedClass.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-faded)' }}>{selectedClass.description}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--text-faded)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Game Code</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)', letterSpacing: 5, fontFamily: 'monospace' }}>{selectedClass.class_code}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-outline" style={{ fontSize: 12 }}
                onClick={() => { navigator.clipboard.writeText(selectedClass.class_code); notify('Code copied!', 'success'); }}>
                📋 Copy Code
              </button>
            </div>
          </div>

          {/* Join Requests */}
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div className="section-title">⏳ Pending Join Requests</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {requests.filter(r => r.status === 'pending').map(r => (
                  <div key={r.id} className="glass" style={{ padding: 16, borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-faded)' }}>{r.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 11 }}
                        onClick={() => handleApprove(r.id, 'approved')}>✓ Accept</button>
                      <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 11, color: '#fca5a5', borderColor: '#fca5a540' }}
                        onClick={() => handleApprove(r.id, 'rejected')}>✕ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Students */}
          <div className="section-title">👥 Enrolled Students ({requests.filter(r => r.status === 'approved').length})</div>
          {requests.filter(r => r.status === 'approved').length > 0 ? (
            <div className="glass-strong" style={{ padding: 20, borderRadius: 20, overflowX: 'auto' }}>
              <table className="student-table">
                <thead>
                  <tr><th>Student</th><th>Email</th><th>Status</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {requests.filter(r => r.status === 'approved').map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td style={{ color: 'var(--text-faded)' }}>{r.email}</td>
                      <td><span className="pill pill-green">✓ Enrolled</span></td>
                      <td style={{ color: 'var(--text-faded)', fontSize: 12 }}>{new Date(r.enrolled_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass" style={{ padding: 32, textAlign: 'center', borderRadius: 16, color: 'var(--text-muted)' }}>
              No students enrolled yet. Share the game code to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
