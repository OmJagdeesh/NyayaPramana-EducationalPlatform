import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function ClassData({ user, notify }) {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classDetail, setClassDetail] = useState(null);
  const [gameStats, setGameStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [journalModalData, setJournalModalData] = useState(null);
  const [journals, setJournals] = useState([]);
  const [journalLoading, setJournalLoading] = useState(false);

  // Direct Enroll state
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollQuery, setEnrollQuery] = useState('');
  const [enrollResults, setEnrollResults] = useState([]);
  const [enrolling, setEnrolling] = useState(null);
  const [enrollMsg, setEnrollMsg] = useState(null);

  useEffect(() => { loadClasses(); }, []);

  async function loadClasses() {
    try {
      setLoading(true);
      const data = await api.getMyClasses();
      setClasses(data);
      if (data.length > 0) {
        await selectClass(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function selectClass(classId) {
    setSelectedClassId(classId);
    setShowStats(false);
    try {
      setDetailLoading(true);
      const data = await api.getClassStudents(classId);
      setClassDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }

  async function viewGameStats(classId) {
    try {
      setDetailLoading(true);
      const data = await api.getGameStats(classId);
      setGameStats(data);
      setShowStats(true);
    } catch (e) {
      console.error(e);
      notify('Failed to load game stats.', 'error');
    } finally {
      setDetailLoading(false);
    }
  }

  async function searchForEnroll(q) {
    setEnrollQuery(q);
    if (q.length < 2) { setEnrollResults([]); return; }
    try {
      const data = await api.searchStudents(q);
      setEnrollResults(data);
    } catch (e) { setEnrollResults([]); }
  }

  async function doEnroll(student) {
    if (!selectedClassId) return;
    setEnrolling(student.id);
    try {
      const res = await api.directEnrollStudent({ classId: selectedClassId, studentId: student.id });
      setEnrollMsg({ text: `✅ ${res.message}`, ok: true });
      await selectClass(selectedClassId); // refresh
      setEnrollResults(prev => prev.filter(s => s.id !== student.id));
    } catch (e) {
      setEnrollMsg({ text: `❌ ${e.message}`, ok: false });
    } finally {
      setEnrolling(null);
      setTimeout(() => setEnrollMsg(null), 3500);
    }
  }

  function getStatusPill(accuracy) {
    if (accuracy >= 80) return { cls: 'pill-green', text: '✓ Excellent' };
    if (accuracy >= 60) return { cls: 'pill-yellow', text: '◎ Good' };
    return { cls: 'pill-red', text: '⚠ Needs Help' };
  }

  async function openJournalModal(student) {
    setJournalModalData(student);
    setJournalLoading(true);
    setJournals([]);
    try {
      const data = await api.getJournal(student.id);
      setJournals(data);
    } catch (e) {
      notify('Failed to load journals.', 'error');
    } finally {
      setJournalLoading(false);
    }
  }

  function downloadPDF() {
    if (!gameStats && !classDetail) return;

    const data = showStats ? gameStats : null;
    const students = classDetail?.students || [];
    const classInfo = showStats ? data?.classInfo : classDetail?.classInfo;
    const results = showStats ? data?.results : [];
    const summary = showStats ? data?.summary : null;

    // Build HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${classInfo?.name || 'Class'} - Student Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a2e; background: #fff; }
    .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #FF6B35; }
    .header h1 { font-size: 28px; color: #FF6B35; margin-bottom: 4px; }
    .header h2 { font-size: 18px; color: #333; margin-bottom: 8px; }
    .header .meta { font-size: 12px; color: #777; }
    .summary { display: flex; gap: 20px; margin-bottom: 28px; }
    .summary-card { flex: 1; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; text-align: center; }
    .summary-card .val { font-size: 24px; font-weight: 700; color: #FF6B35; }
    .summary-card .label { font-size: 11px; color: #777; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #f7f7f7; color: #555; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; padding: 10px 12px; text-align: left; border-bottom: 2px solid #e0e0e0; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
    tr:nth-child(even) td { background: #fafafa; }
    .status-excellent { color: #16a34a; font-weight: 600; }
    .status-good { color: #d97706; font-weight: 600; }
    .status-needs-help { color: #dc2626; font-weight: 600; }
    .section-title { font-size: 16px; font-weight: 700; margin: 24px 0 12px; color: #333; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🕉️ Nyaya Pramana</h1>
    <h2>${classInfo?.name || 'Student Report'}</h2>
    <div class="meta">
      Type: ${classInfo?.type || 'N/A'} | Code: ${classInfo?.code || classInfo?.class_code || 'N/A'} | Generated: ${new Date().toLocaleDateString()}
    </div>
  </div>

  ${summary ? `
  <div class="summary">
    <div class="summary-card"><div class="val">${summary.totalStudents}</div><div class="label">Total Students</div></div>
    <div class="summary-card"><div class="val">${summary.avgScore}</div><div class="label">Avg Score</div></div>
    <div class="summary-card"><div class="val">${summary.avgAccuracy}%</div><div class="label">Avg Accuracy</div></div>
    <div class="summary-card"><div class="val">${Math.floor(summary.avgTime / 60)}m ${summary.avgTime % 60}s</div><div class="label">Avg Time</div></div>
  </div>
  ` : ''}

  ${showStats && results.length > 0 ? `
  <div class="section-title">Game Results</div>
  <table>
    <thead>
      <tr><th>Student</th><th>Score</th><th>Accuracy</th><th>Correct/Total</th><th>Time</th><th>Status</th><th>Date</th></tr>
    </thead>
    <tbody>
      ${results.map(r => {
        const status = r.accuracy >= 80 ? 'excellent' : r.accuracy >= 60 ? 'good' : 'needs-help';
        return `<tr>
          <td><strong>${r.name}</strong></td>
          <td>${r.score}</td>
          <td>${r.accuracy}%</td>
          <td>${r.correct}/${r.total}</td>
          <td>${Math.floor(r.time_seconds / 60)}m ${r.time_seconds % 60}s</td>
          <td class="status-${status}">${status === 'excellent' ? '✓ Excellent' : status === 'good' ? '◎ Good' : '⚠ Needs Help'}</td>
          <td>${new Date(r.completed_at).toLocaleDateString()}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  ` : ''}

  ${!showStats && students.length > 0 ? `
  <div class="section-title">Enrolled Students</div>
  <table>
    <thead>
      <tr><th>Student</th><th>Email</th><th>Score</th><th>Accuracy</th><th>Levels</th><th>Hints</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${students.map(s => {
        const status = (s.overall_accuracy || 0) >= 80 ? 'excellent' : (s.overall_accuracy || 0) >= 60 ? 'good' : 'needs-help';
        return `<tr>
          <td><strong>${s.name}</strong></td>
          <td>${s.email}</td>
          <td>${s.total_score || 0}</td>
          <td>${s.overall_accuracy || 0}%</td>
          <td>${(s.completed_levels || []).length}/10</td>
          <td>${s.hints_used || 0}</td>
          <td class="status-${status}">${status === 'excellent' ? '✓ Excellent' : status === 'good' ? '◎ Good' : '⚠ Needs Help'}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  ` : ''}

  <div class="footer">
    Nyaya Pramana — IKS-Based Serious Game for Cognitive Learning | Report generated on ${new Date().toLocaleString()}
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  }

  async function downloadEffectivenessReport() {
    if (!selectedClassId) return;
    try {
      const data = await api.getEffectiveness(selectedClassId);
      const rowsHTML = data.map(r => {
        const delta = r.post_test_score - r.pre_test_score;
        const deltaDisplay = delta > 0 ? "+" + delta : delta;
        const deltaClass = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
        return "<tr>" +
          "<td><strong>" + r.student_name + "</strong></td>" +
          "<td>" + r.pre_test_score + "%</td>" +
          "<td>" + (r.post_test_score !== null ? r.post_test_score + "%" : "<em>Pending</em>") + "</td>" +
          "<td class='" + (r.post_test_score !== null ? deltaClass : "neutral") + "'>" +
            (r.post_test_score !== null ? deltaDisplay + "%" : "N/A") +
          "</td>" +
        "</tr>";
      }).join('');

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Class Effectiveness Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a2e; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #10b981; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #10b981; }
    .header .meta { margin-top: 8px; font-size: 13px; color: #777; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { background: #f0fdf4; color: #166534; padding: 12px; text-align: left; border-bottom: 2px solid #bbf7d0; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .positive { color: #16a34a; font-weight: bold; }
    .negative { color: #dc2626; font-weight: bold; }
    .neutral { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Class Effectiveness Report</h1>
    <div class="meta">Nyaya Pramana Platform | Generated: ${new Date().toLocaleString()}</div>
  </div>
  <p style="margin-bottom: 16px; font-size: 15px; color: #475569;">
    This report compares students' pre-test base scores before playing any games to their post-test scores after completing at least 10 levels.
  </p>
  <table>
    <thead>
      <tr><th>Student</th><th>Pre-Test Score</th><th>Post-Test Score</th><th>Improvement</th></tr>
    </thead>
    <tbody>
      ${rowsHTML}
    </tbody>
  </table>
  <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px;">
    End of Report
  </div>
</body>
</html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
    } catch (e) {
      console.error(e);
      notify('Failed to load effectiveness data', 'error');
    }
  }

  if (loading) {
    return <div className="dashboard"><div style={{ textAlign: 'center', padding: 60, color: 'var(--gold)' }}>Loading class data...</div></div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <div className="welcome-text">✦ Class Data</div>
          <div className="dashboard-title">Student Performance</div>
          <div style={{ fontSize: 13, color: 'var(--text-faded)', marginTop: 4 }}>
            Data segregated by class, game, and quiz
          </div>
        </div>
        <div className="dashboard-header-right" style={{ display: 'flex', gap: 12 }}>
          {(classDetail || gameStats) && (
            <>
              <button className="btn-outline" onClick={downloadEffectivenessReport} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, color: 'var(--sacred-teal)' }}>
                📈 Effectiveness Report
              </button>
              <button className="btn-primary" onClick={downloadPDF} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                📄 Download PDF Report
              </button>
            </>
          )}
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="glass-strong" style={{ padding: 48, textAlign: 'center', borderRadius: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Classes Yet</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Create a game or quiz first to see student data here.</div>
        </div>
      ) : (
        <>
          {/* Class Selector Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {classes.map(cls => (
              <button key={cls.id}
                className={`nav-btn ${selectedClassId === cls.id ? 'nav-btn-active' : 'nav-btn-inactive'}`}
                onClick={() => selectClass(cls.id)}
                style={{ fontSize: 13 }}>
                {cls.type === 'quiz' ? '📝' : cls.type === 'game' ? '🎮' : '📚'} {cls.name}
                <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>({cls.student_count})</span>
              </button>
            ))}
          </div>

          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--gold)' }}>Loading...</div>
          ) : classDetail && !showStats ? (
            <>
              {/* Class Summary Stats */}
              <div className="stats-grid" style={{ marginBottom: 28 }}>
                {[
                  { icon: '👥', val: classDetail.students.length, label: 'ENROLLED', color: 'var(--saffron)', cls: 'stat-card-1' },
                  { icon: '📊', val: classDetail.students.length > 0 ? Math.round(classDetail.students.reduce((s, st) => s + (st.overall_accuracy || 0), 0) / classDetail.students.length) + '%' : '0%', label: 'AVG ACCURACY', color: 'var(--gold)', cls: 'stat-card-2' },
                  { icon: '🏅', val: classDetail.students.length > 0 ? Math.round(classDetail.students.reduce((s, st) => s + (st.total_score || 0), 0) / classDetail.students.length) : 0, label: 'AVG SCORE', color: 'var(--sacred-teal)', cls: 'stat-card-3' },
                  { icon: '📝', val: classDetail.classResults?.length || 0, label: 'SUBMISSIONS', color: 'var(--lotus-pink)', cls: 'stat-card-4' }
                ].map(s => (
                  <div key={s.label} className={`stat-card ${s.cls} glass`}>
                    <div className="stat-icon">{s.icon}</div>
                    <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Action Bar: Game Stats + Enroll */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn-outline" onClick={() => viewGameStats(selectedClassId)} style={{ fontSize: 13 }}>
                  📈 View Game Results & Stats
                </button>
                <button
                  className={showEnroll ? 'btn-primary' : 'btn-outline'}
                  onClick={() => { setShowEnroll(s => !s); setEnrollQuery(''); setEnrollResults([]); setEnrollMsg(null); }}
                  style={{ fontSize: 13 }}
                >
                  {showEnroll ? '✕ Close Enroll Panel' : '➕ Enroll Students Directly'}
                </button>
              </div>

              {/* ─── DIRECT ENROLL PANEL ─── */}
              {showEnroll && (
                <div className="glass-strong" style={{ padding: 24, borderRadius: 20, marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--sacred-teal)', marginBottom: 4 }}>➕ Direct Enrollment</div>
                  <div style={{ fontSize: 13, color: 'var(--text-faded)', marginBottom: 16 }}>
                    Search a student by name or PRN (e.g. <span style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>1032232531</span>) and enroll them immediately — no join request needed.
                  </div>

                  {enrollMsg && (
                    <div style={{
                      padding: '10px 16px', borderRadius: 10, marginBottom: 14, fontWeight: 600, fontSize: 13,
                      background: enrollMsg.ok ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      border: `1px solid ${enrollMsg.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                      color: enrollMsg.ok ? '#86efac' : '#fca5a5',
                    }}>{enrollMsg.text}</div>
                  )}

                  <div style={{ position: 'relative', marginBottom: 16 }}>
                    <input
                      value={enrollQuery}
                      onChange={e => searchForEnroll(e.target.value)}
                      placeholder="🔍 Search by name or PRN..."
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14,
                        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {enrollResults.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {enrollResults.map(s => (
                        <div key={s.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                          padding: '12px 16px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                        }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-faded)' }}>{s.email}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 11, color: 'var(--gold)' }}>Score: {s.total_score}</span>
                            <button
                              onClick={() => doEnroll(s)}
                              disabled={enrolling === s.id}
                              style={{
                                padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(10,191,188,0.4)',
                                background: 'rgba(10,191,188,0.12)', color: 'var(--sacred-teal)',
                                cursor: enrolling === s.id ? 'not-allowed' : 'pointer',
                                fontWeight: 700, fontSize: 12, opacity: enrolling === s.id ? 0.6 : 1,
                              }}
                            >
                              {enrolling === s.id ? '⏳ Enrolling...' : '✓ Enroll'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {enrollQuery.length >= 2 && enrollResults.length === 0 && (
                    <div style={{ color: 'var(--text-faded)', fontSize: 13, textAlign: 'center', padding: 16 }}>
                      No students found for "{enrollQuery}"
                    </div>
                  )}
                </div>
              )}

              {/* Student Table */}
              {classDetail.students.length > 0 ? (
                <div className="glass-strong" style={{ padding: 24, borderRadius: 24, overflowX: 'auto' }}>
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>Student</th><th>Score</th><th>Accuracy</th><th>Levels</th>
                        <th>Hints</th><th>Avg Time</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classDetail.students.map(s => {
                        const pill = getStatusPill(s.overall_accuracy || 0);
                        return (
                          <tr key={s.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{s.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-faded)' }}>{s.email}</div>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--gold)' }}>{s.total_score || 0}</td>
                            <td style={{ color: (s.overall_accuracy || 0) >= 75 ? '#86efac' : (s.overall_accuracy || 0) >= 60 ? 'var(--gold)' : '#fca5a5' }}>
                              {s.overall_accuracy || 0}%
                            </td>
                            <td>
                              <div style={{
                                display: 'inline-flex', width: 28, height: 28, borderRadius: 8,
                                alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12,
                                background: 'rgba(247,201,72,0.2)', color: 'var(--gold)'
                              }}>{(s.completed_levels || []).length}</div>
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>{s.hints_used || 0}</td>
                            <td style={{ color: 'var(--text-faded)' }}>{Math.round(s.avg_time / 60)}m</td>
                            <td><span className={`pill ${pill.cls}`}>{pill.text}</span></td>
                            <td>
                              <button className="btn-outline" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => openJournalModal(s)}>
                                📔 Journals
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="glass" style={{ padding: 32, textAlign: 'center', borderRadius: 16, color: 'var(--text-muted)' }}>
                  No students enrolled in this class yet.
                </div>
              )}
            </>
          ) : showStats && gameStats ? (
            <>
              <button className="btn-outline" onClick={() => setShowStats(false)} style={{ marginBottom: 16, fontSize: 13 }}>
                ← Back to Class Details
              </button>

              {/* Game Stats Summary */}
              <div className="stats-grid" style={{ marginBottom: 28 }}>
                {[
                  { icon: '👥', val: gameStats.summary.totalStudents, label: 'PARTICIPANTS', color: 'var(--saffron)', cls: 'stat-card-1' },
                  { icon: '🏅', val: gameStats.summary.avgScore, label: 'AVG SCORE', color: 'var(--gold)', cls: 'stat-card-2' },
                  { icon: '🎯', val: gameStats.summary.avgAccuracy + '%', label: 'AVG ACCURACY', color: 'var(--sacred-teal)', cls: 'stat-card-3' },
                  { icon: '⏱️', val: Math.floor(gameStats.summary.avgTime / 60) + 'm', label: 'AVG TIME', color: 'var(--lotus-pink)', cls: 'stat-card-4' }
                ].map(s => (
                  <div key={s.label} className={`stat-card ${s.cls} glass`}>
                    <div className="stat-icon">{s.icon}</div>
                    <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Results Table */}
              {gameStats.results.length > 0 ? (
                <div className="glass-strong" style={{ padding: 24, borderRadius: 24, overflowX: 'auto' }}>
                  <table className="student-table">
                    <thead>
                      <tr><th>Student</th><th>Score</th><th>Accuracy</th><th>Correct/Total</th><th>Time</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {gameStats.results.map((r, i) => {
                        const pill = getStatusPill(r.accuracy);
                        return (
                          <tr key={i}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{r.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-faded)' }}>{r.email}</div>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--gold)' }}>{r.score}</td>
                            <td style={{ color: r.accuracy >= 75 ? '#86efac' : r.accuracy >= 60 ? 'var(--gold)' : '#fca5a5' }}>{r.accuracy}%</td>
                            <td>{r.correct}/{r.total}</td>
                            <td style={{ color: 'var(--text-faded)' }}>{Math.floor(r.time_seconds / 60)}m {r.time_seconds % 60}s</td>
                            <td><span className={`pill ${pill.cls}`}>{pill.text}</span></td>
                            <td style={{ color: 'var(--text-faded)', fontSize: 12 }}>{new Date(r.completed_at).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="glass" style={{ padding: 32, textAlign: 'center', borderRadius: 16, color: 'var(--text-muted)' }}>
                  No game results yet. Students haven't submitted any results for this game.
                </div>
              )}
            </>
          ) : null}
        </>
      )}

      {journalModalData && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="glass-strong" style={{ padding: 32, borderRadius: 20, maxWidth: 600, width: '90%', position: 'relative', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ color: 'var(--gold)', marginBottom: 8 }}>{journalModalData.name}'s Journals</h2>
            <p style={{ color: 'var(--text-faded)', fontSize: 13, marginBottom: 20 }}>Reviewing student's meta-reflections</p>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {journalLoading ? (
                <div style={{ color: 'var(--gold)', textAlign: 'center', padding: 20 }}>Loading...</div>
              ) : journals.length > 0 ? (
                journals.map(j => (
                  <div key={j.id} className="glass" style={{ padding: 16, borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 8, fontWeight: 'bold' }}>
                      LEVEL {j.level_id} • {new Date(j.timestamp).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-bright)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      "{j.journal_entry}"
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No journals found.</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn-primary" onClick={() => setJournalModalData(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
