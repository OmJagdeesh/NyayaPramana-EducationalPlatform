import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function AdminDashboard({ user, onLogout, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expandedTeacher, setExpandedTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Import tab state
  const [importFile, setImportFile] = useState(null);
  const [importRows, setImportRows] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => { loadData(); }, []);

  // Load SheetJS (xlsx) dynamically for Excel parsing
  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  async function parseFile(file) {
    setImportFile(file);
    setImportResult(null);
    setImportRows([]);
    try {
      const data = await file.arrayBuffer();
      const workbook = window.XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: '' });
      setImportRows(rows);
    } catch (e) {
      showMsg('Failed to parse file: ' + e.message, 'error');
    }
  }

  async function runImport() {
    if (!importRows.length) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const result = await api.bulkImport(importRows);
      setImportResult(result);
      showMsg(result.message);
      await loadData();
    } catch (e) {
      showMsg(e.message, 'error');
    } finally {
      setImportLoading(false);
    }
  }

  function showMsg(msg, type = 'success') {
    setActionMsg({ msg, type });
    setTimeout(() => setActionMsg(null), 3500);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [statsData, usersData, teachersData] = await Promise.all([
        api.getAdminStats().catch(() => null),
        api.getAdminUsers().catch(() => []),
        api.getAdminTeachers().catch(() => []),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setTeachers(teachersData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(userId, userName) {
    try {
      await api.resetUserPassword(userId);
      showMsg(`✅ Password reset to "Test@1234" for ${userName}`);
    } catch (e) {
      showMsg(`❌ ${e.message}`, 'error');
    }
  }

  async function handleDeleteUser() {
    if (!confirmDelete) return;
    try {
      await api.deleteUser(confirmDelete.id);
      showMsg(`🗑️ ${confirmDelete.name} deleted successfully`);
      setConfirmDelete(null);
      await loadData();
    } catch (e) {
      showMsg(`❌ ${e.message}`, 'error');
      setConfirmDelete(null);
    }
  }

  async function handleRemoveClass(classId, className) {
    try {
      await api.removeClass(classId);
      showMsg(`🗑️ Class "${className}" removed`);
      await loadData();
    } catch (e) {
      showMsg(`❌ ${e.message}`, 'error');
    }
  }

  const filteredUsers = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const statCards = stats ? [
    { icon: '👥', val: stats.totalUsers, label: 'TOTAL USERS', color: 'var(--saffron)', cls: 'stat-card-1' },
    { icon: '🎓', val: stats.totalStudents, label: 'STUDENTS', color: 'var(--gold)', cls: 'stat-card-2' },
    { icon: '📚', val: stats.totalTeachers, label: 'TEACHERS', color: 'var(--sacred-teal)', cls: 'stat-card-3' },
    { icon: '🏛️', val: stats.totalClasses, label: 'CLASSES', color: 'var(--lotus-pink)', cls: 'stat-card-4' },
    { icon: '🎮', val: stats.totalGames, label: 'GAMES PLAYED', color: 'var(--saffron)', cls: 'stat-card-1' },
    { icon: '🎯', val: `${stats.avgAccuracy}%`, label: 'AVG ACCURACY', color: 'var(--gold)', cls: 'stat-card-2' },
    { icon: '🟢', val: stats.activeToday, label: 'ACTIVE TODAY', color: 'var(--sacred-teal)', cls: 'stat-card-3' },
  ] : [];

  return (
    <div className="dashboard">
      {/* Notification */}
      {actionMsg && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
          background: actionMsg.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
          border: `1px solid ${actionMsg.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
          color: actionMsg.type === 'error' ? '#fca5a5' : '#86efac',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>
          {actionMsg.msg}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="glass-strong" style={{ padding: 32, borderRadius: 20, maxWidth: 400, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>Confirm Deletion</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
              Are you sure you want to permanently delete <strong style={{ color: '#fff' }}>{confirmDelete.name}</strong>?
              This will remove all their data and cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} className="nav-btn nav-btn-inactive" style={{ padding: '10px 24px' }}>
                Cancel
              </button>
              <button onClick={handleDeleteUser} style={{
                padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'rgba(239,68,68,0.2)', color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.4)', fontWeight: 700, fontSize: 14,
              }}>
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <div className="welcome-text">⚡ Admin Control Panel</div>
          <div className="dashboard-title">{user.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-faded)', marginTop: 4 }}>
            Full platform access · admin@nyaya.edu
          </div>
        </div>
        <div className="dashboard-header-right">
          <div className="wisdom-quote-inline" style={{ marginTop: 0 }}>
            <div className="wisdom-label">🛡️ Admin Privileges</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Manage all teachers, students &amp; classes.<br/>
              Reset passwords · Delete accounts · Remove classes.
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
      {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'users', label: '👥 Users' },
          { id: 'teachers', label: '📚 Teachers' },
          { id: 'import', label: '📥 Import' },
        ].map(t => (
          <button key={t.id}
            className={`nav-btn ${activeTab === t.id ? 'nav-btn-active' : 'nav-btn-inactive'}`}
            onClick={() => setActiveTab(t.id)}
            style={{ fontSize: 13 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gold)' }}>Loading platform data...</div>
      ) : (
        <>
          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                {statCards.map(s => (
                  <div key={s.label} className={`stat-card ${s.cls} glass`}>
                    <div className="stat-icon">{s.icon}</div>
                    <div className="stat-value" style={{ color: s.color }}>{s.val}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
                {/* Quick Teacher List */}
                <div className="glass-strong" style={{ padding: 24, borderRadius: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>📚 Teachers</div>
                  {teachers.length === 0 ? (
                    <div style={{ color: 'var(--text-faded)', fontSize: 13 }}>No teachers registered yet.</div>
                  ) : teachers.slice(0, 6).map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-faded)' }}>{t.email}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: 'var(--sacred-teal)' }}>{t.total_classes} class{t.total_classes !== 1 ? 'es' : ''}</div>
                        <div style={{ fontSize: 12, color: 'var(--gold)' }}>{t.total_students} student{t.total_students !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick User Role Breakdown */}
                <div className="glass-strong" style={{ padding: 24, borderRadius: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>👥 User Breakdown</div>
                  {[
                    { label: 'Students', count: stats?.totalStudents || 0, color: 'var(--gold)' },
                    { label: 'Teachers', count: stats?.totalTeachers || 0, color: 'var(--sacred-teal)' },
                  ].map(r => (
                    <div key={r.label} style={{ marginBottom: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.count}</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: 'var(--glass-bg-strong)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${stats?.totalUsers ? (r.count / stats.totalUsers) * 100 : 0}%`, background: r.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 12, background: 'rgba(247,201,72,0.08)', border: '1px solid rgba(247,201,72,0.2)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-faded)', marginBottom: 4 }}>Default Reset Password</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1, fontFamily: 'monospace' }}>Test@1234</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === 'users' && (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search by name or email..."
                  style={{
                    flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 10, fontSize: 13,
                    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)', outline: 'none',
                  }}
                />
                {['all', 'student', 'teacher'].map(f => (
                  <button key={f} onClick={() => setRoleFilter(f)}
                    className={`nav-btn ${roleFilter === f ? 'nav-btn-active' : 'nav-btn-inactive'}`}
                    style={{ textTransform: 'capitalize', fontSize: 13 }}
                  >
                    {f === 'all' ? '👥 All' : f === 'student' ? '🎓 Students' : '📚 Teachers'}
                  </button>
                ))}
              </div>

              <div className="glass-strong" style={{ padding: 24, borderRadius: 24, overflowX: 'auto' }}>
                {filteredUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                    <div>No users match your search.</div>
                  </div>
                ) : (
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Institution</th>
                        <th>Score</th>
                        <th>Accuracy</th>
                        <th>Games</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-faded)' }}>{u.email}</div>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '2px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700,
                              background: u.role === 'teacher' ? 'rgba(10,191,188,0.15)' : 'rgba(247,201,72,0.15)',
                              color: u.role === 'teacher' ? 'var(--sacred-teal)' : 'var(--gold)',
                              border: `1px solid ${u.role === 'teacher' ? 'rgba(10,191,188,0.3)' : 'rgba(247,201,72,0.3)'}`,
                              textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>
                              {u.role === 'teacher' ? '📚' : '🎓'} {u.role}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.institution || '—'}</td>
                          <td style={{ fontWeight: 700, color: 'var(--gold)' }}>{u.total_score || 0}</td>
                          <td style={{ color: (u.overall_accuracy || 0) >= 75 ? '#86efac' : (u.overall_accuracy || 0) >= 60 ? 'var(--gold)' : '#fca5a5' }}>
                            {u.overall_accuracy || 0}%
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{u.games_played || 0}</td>
                          <td style={{ fontSize: 11, color: 'var(--text-faded)' }}>{u.created_at ? u.created_at.slice(0, 10) : '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                              <button
                                onClick={() => handleResetPassword(u.id, u.name)}
                                title="Reset password to Test@1234"
                                style={{
                                  padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(247,201,72,0.35)',
                                  background: 'rgba(247,201,72,0.1)', color: 'var(--gold)',
                                  cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                                }}>
                                🔑 Reset
                              </button>
                              <button
                                onClick={() => setConfirmDelete({ id: u.id, name: u.name })}
                                title="Delete user"
                                style={{
                                  padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.35)',
                                  background: 'rgba(239,68,68,0.1)', color: '#fca5a5',
                                  cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                }}>
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── TEACHERS TAB ── */}
          {activeTab === 'teachers' && (
            <div>
              {teachers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                  <div>No teachers registered yet.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {teachers.map(teacher => (
                    <div key={teacher.id} className="glass-strong" style={{ borderRadius: 20, overflow: 'hidden' }}>
                      {/* Teacher header row */}
                      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(10,191,188,0.15)', border: '1px solid rgba(10,191,188,0.3)', fontSize: 22,
                          }}>📚</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{teacher.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-faded)' }}>{teacher.email}</div>
                            {teacher.institution && (
                              <div style={{ fontSize: 11, color: 'var(--text-faded)', marginTop: 2 }}>{teacher.institution}</div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 10, background: 'rgba(10,191,188,0.1)', border: '1px solid rgba(10,191,188,0.2)' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--sacred-teal)' }}>{teacher.total_classes}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-faded)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Classes</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 10, background: 'rgba(247,201,72,0.1)', border: '1px solid rgba(247,201,72,0.2)' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{teacher.total_students}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-faded)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Students</div>
                          </div>

                          <button
                            onClick={() => handleResetPassword(teacher.id, teacher.name)}
                            style={{
                              padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(247,201,72,0.35)',
                              background: 'rgba(247,201,72,0.1)', color: 'var(--gold)',
                              cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            }}>
                            🔑 Reset Password
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ id: teacher.id, name: teacher.name })}
                            style={{
                              padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.35)',
                              background: 'rgba(239,68,68,0.1)', color: '#fca5a5',
                              cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            }}>
                            🗑️ Delete Teacher
                          </button>
                          <button
                            onClick={() => setExpandedTeacher(expandedTeacher === teacher.id ? null : teacher.id)}
                            className="nav-btn nav-btn-inactive"
                            style={{ fontSize: 12, padding: '8px 14px' }}>
                            {expandedTeacher === teacher.id ? '▲ Hide Classes' : '▼ Manage Classes'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded: class list */}
                      {expandedTeacher === teacher.id && (
                        <div style={{ borderTop: '1px solid var(--glass-border)', padding: '16px 24px 20px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
                            Classes by {teacher.name}
                          </div>
                          {teacher.classes.length === 0 ? (
                            <div style={{ color: 'var(--text-faded)', fontSize: 13 }}>No classes created yet.</div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                              {teacher.classes.map(cls => (
                                <div key={cls.id} className="glass" style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                      <div style={{ fontWeight: 600, fontSize: 14 }}>{cls.name}</div>
                                      <div style={{ fontSize: 11, color: 'var(--text-faded)', textTransform: 'capitalize', marginTop: 2 }}>{cls.type}</div>
                                    </div>
                                    <span style={{
                                      fontSize: 10, padding: '2px 8px', borderRadius: 50, fontWeight: 700,
                                      background: cls.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)',
                                      color: cls.status === 'active' ? '#86efac' : '#fca5a5',
                                      border: `1px solid ${cls.status === 'active' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                    }}>
                                      {cls.status}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <span style={{ fontSize: 11, color: 'var(--sacred-teal)' }}>👥 {cls.student_count} student{cls.student_count !== 1 ? 's' : ''}</span>
                                      <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'monospace', fontWeight: 700, marginLeft: 10 }}>#{cls.class_code}</span>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveClass(cls.id, cls.name)}
                                      style={{
                                        padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.35)',
                                        background: 'rgba(239,68,68,0.1)', color: '#fca5a5',
                                        cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                      }}>
                                      🗑️ Remove
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* ── IMPORT TAB ── */}
          {activeTab === 'import' && (
            <div>
              <div className="glass-strong" style={{ padding: 32, borderRadius: 24, marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--sacred-teal)', marginBottom: 6 }}>📥 Bulk Import Users</div>
                <div style={{ fontSize: 13, color: 'var(--text-faded)', marginBottom: 24, lineHeight: 1.7 }}>
                  Upload a <strong style={{ color: 'var(--gold)' }}>.csv</strong> or <strong style={{ color: 'var(--gold)' }}>.xlsx</strong> file.
                  Each row becomes one account. The PRN column is used to generate <span style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>PRN@nyaya.edu</span> as the login email.
                  Default password for all imported accounts: <span style={{ fontFamily: 'monospace', color: '#86efac', fontWeight: 700 }}>Test@1234</span>
                </div>

                {/* Column guide */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
                  {[
                    { col: 'name', req: true,  desc: 'Full name' },
                    { col: 'prn',  req: true,  desc: 'Numeric PRN (becomes email)' },
                    { col: 'role', req: false, desc: 'student / teacher (default: student)' },
                    { col: 'institution', req: false, desc: 'College / School name' },
                  ].map(c => (
                    <div key={c.col} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: c.req ? 'var(--gold)' : 'var(--sacred-teal)' }}>
                        {c.col} {c.req && <span style={{ color: '#fca5a5', fontSize: 10 }}>*required</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-faded)', marginTop: 4 }}>{c.desc}</div>
                    </div>
                  ))}
                </div>

                {/* File picker */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '18px 24px', borderRadius: 14,
                  border: '2px dashed rgba(10,191,188,0.4)', cursor: 'pointer',
                  background: 'rgba(10,191,188,0.05)', transition: 'all 0.2s', marginBottom: 20,
                }}>
                  <span style={{ fontSize: 28 }}>📂</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      {importFile ? importFile.name : 'Click to choose a .csv or .xlsx file'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-faded)', marginTop: 2 }}>
                      {importFile ? `${importRows.length} rows detected` : 'Supports Excel (.xlsx) and CSV (.csv)'}
                    </div>
                  </div>
                  <input
                    type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); }}
                  />
                </label>

                {/* Preview table */}
                {importRows.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
                      Preview — first {Math.min(5, importRows.length)} of {importRows.length} rows:
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="student-table">
                        <thead>
                          <tr>
                            {Object.keys(importRows[0]).map(k => <th key={k}>{k}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.slice(0, 5).map((row, i) => (
                            <tr key={i}>
                              {Object.values(row).map((v, j) => (
                                <td key={j} style={{ fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Import button */}
                {importRows.length > 0 && (
                  <button
                    className="btn-primary"
                    onClick={runImport}
                    disabled={importLoading}
                    style={{ padding: '14px 36px', fontSize: 15, opacity: importLoading ? 0.7 : 1 }}
                  >
                    {importLoading ? '⏳ Importing...' : `📥 Import ${importRows.length} Accounts`}
                  </button>
                )}
              </div>

              {/* Results */}
              {importResult && (
                <div className="glass-strong" style={{ padding: 24, borderRadius: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Import Results</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: importResult.errors?.length ? 20 : 0 }}>
                    {[
                      { label: '✅ Created', val: importResult.created, color: '#86efac', bg: 'rgba(34,197,94,0.12)' },
                      { label: '⏭ Skipped', val: importResult.skipped, color: 'var(--gold)', bg: 'rgba(247,201,72,0.10)' },
                      { label: '❌ Errors', val: importResult.errors?.length || 0, color: '#fca5a5', bg: 'rgba(239,68,68,0.10)' },
                    ].map(r => (
                      <div key={r.label} style={{ padding: '14px 24px', borderRadius: 14, background: r.bg, border: `1px solid ${r.color}44`, textAlign: 'center', minWidth: 120 }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: r.color }}>{r.val}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{r.label}</div>
                      </div>
                    ))}
                  </div>
                  {importResult.errors?.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5', marginBottom: 8 }}>Error Details:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {importResult.errors.map((e, i) => (
                          <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: 6 }}>
                            <strong style={{ color: '#fca5a5' }}>{e.row}</strong>: {e.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
