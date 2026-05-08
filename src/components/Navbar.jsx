export default function Navbar({ user, page, setPage, onLogout }) {
  if (!user) return null;

  const studentTabs = [
    { id: 'dashboard', label: '🏠 Home' },
    { id: 'leaderboard', label: '🏆 Ranks' },
    { id: 'teachers', label: '👨‍🏫 Teachers' },
    { id: 'joinGame', label: '🎮 Join Game' },
    { id: 'framework', label: '🧠 Framework' },
    { id: 'docs', label: '📖 Docs' },
  ];

  const teacherTabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'createGame', label: '🎮 Create Game' },
    { id: 'classData', label: '👥 Class Data' },
    { id: 'toolkit', label: '🧰 Toolkit' },
    { id: 'framework', label: '🧠 Framework' },
    { id: 'docs', label: '📖 Docs' },
  ];

<<<<<<< HEAD
  const tabs = user.role === 'teacher' ? teacherTabs : studentTabs;
=======
  const adminTabs = [
    { id: 'dashboard', label: '⚡ Dashboard' },
    { id: 'users', label: '👥 Users' },
    { id: 'teachers', label: '📚 Teachers' },
    { id: 'framework', label: '🧠 Framework' },
    { id: 'docs', label: '📖 Docs' },
  ];

  const tabs = user.role === 'admin' ? adminTabs : user.role === 'teacher' ? teacherTabs : studentTabs;
>>>>>>> a170f25 (added the admin login and its functionaly)

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <div className="nav-logo-icon">🕉️</div>
        <div>
          <div className="nav-title">Nyaya Pramana</div>
          <div style={{ fontSize: 10, color: 'var(--text-faded)', letterSpacing: 0.5 }}>न्याय प्रमाण · IKS Game</div>
        </div>
      </div>
      <div className="nav-links">
        {tabs.map(t => (
          <button key={t.id} className={`nav-btn ${page === t.id ? 'nav-btn-active' : 'nav-btn-inactive'}`} onClick={() => setPage(t.id)}>
            {t.label}
          </button>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, whiteSpace: 'nowrap' }}>
          <div className="nav-role-pill" style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 50,
<<<<<<< HEAD
            background: user.role === 'teacher' ? 'rgba(10,191,188,0.15)' : 'rgba(247,201,72,0.15)',
            color: user.role === 'teacher' ? 'var(--sacred-teal)' : 'var(--gold)',
            border: `1px solid ${user.role === 'teacher' ? 'rgba(10,191,188,0.3)' : 'rgba(247,201,72,0.3)'}`,
            fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase'
          }}>
            {user.role === 'teacher' ? '📚 Teacher' : '🎓 Student'}
=======
            background: user.role === 'admin' ? 'rgba(239,68,68,0.15)' : user.role === 'teacher' ? 'rgba(10,191,188,0.15)' : 'rgba(247,201,72,0.15)',
            color: user.role === 'admin' ? '#fca5a5' : user.role === 'teacher' ? 'var(--sacred-teal)' : 'var(--gold)',
            border: `1px solid ${user.role === 'admin' ? 'rgba(239,68,68,0.3)' : user.role === 'teacher' ? 'rgba(10,191,188,0.3)' : 'rgba(247,201,72,0.3)'}`,
            fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase'
          }}>
            {user.role === 'admin' ? '⚡ Admin' : user.role === 'teacher' ? '📚 Teacher' : '🎓 Student'}
>>>>>>> a170f25 (added the admin login and its functionaly)
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user.name}</div>
          <button className="nav-btn nav-btn-inactive" onClick={onLogout} style={{ fontSize: 12 }}>← Logout</button>
        </div>
      </div>
    </nav>
  );
}
