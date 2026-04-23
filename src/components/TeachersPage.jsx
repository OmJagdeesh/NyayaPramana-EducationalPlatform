import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function TeachersPage({ user }) {
  const [activeTab, setActiveTab] = useState('all');
  const [allTeachers, setAllTeachers] = useState([]);
  const [myTeachers, setMyTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [all, mine] = await Promise.all([
        api.getAllTeachers(),
        api.getMyTeachers()
      ]);
      setAllTeachers(all);
      setMyTeachers(mine);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="dashboard"><div style={{ textAlign: 'center', padding: 60, color: 'var(--gold)' }}>Loading teachers...</div></div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <div className="welcome-text">✦ Teachers</div>
          <div className="dashboard-title">
            {activeTab === 'all' ? 'All Teachers' : 'Your Teachers'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-faded)', marginTop: 4 }}>
            {activeTab === 'all'
              ? `${allTeachers.length} teacher${allTeachers.length !== 1 ? 's' : ''} on the platform`
              : `${myTeachers.length} teacher${myTeachers.length !== 1 ? 's' : ''} you're connected with`
            }
          </div>
        </div>
        <div className="dashboard-header-right">
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`nav-btn ${activeTab === 'all' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
              onClick={() => setActiveTab('all')}>
              🌐 All Teachers
            </button>
            <button className={`nav-btn ${activeTab === 'mine' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
              onClick={() => setActiveTab('mine')}>
              ⭐ Your Teachers
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'all' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {allTeachers.length === 0 ? (
            <div className="glass-strong" style={{ padding: 48, textAlign: 'center', borderRadius: 24, gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🏫</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Teachers Found</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No teachers have registered on the platform yet.</div>
            </div>
          ) : allTeachers.map(teacher => (
            <div key={teacher.id} className="glass-strong teacher-card" style={{
              padding: 24, borderRadius: 20, transition: 'transform 0.3s'
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'linear-gradient(135deg, var(--saffron), var(--gold))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: 'white', fontWeight: 700, flexShrink: 0
                }}>
                  {teacher.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{teacher.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faded)' }}>{teacher.institution || 'Institution not specified'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: 'var(--sacred-teal)' }}>📚</span>
                  <span style={{ color: 'var(--text-muted)' }}>{teacher.active_classes} active game{teacher.active_classes !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: 'var(--gold)' }}>👥</span>
                  <span style={{ color: 'var(--text-muted)' }}>{teacher.total_students} student{teacher.total_students !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {myTeachers.some(t => t.id === teacher.id) && (
                <div style={{ marginTop: 12 }}>
                  <span className="pill pill-green" style={{ fontSize: 11 }}>✓ Your Teacher</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'mine' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {myTeachers.length === 0 ? (
            <div className="glass-strong" style={{ padding: 48, textAlign: 'center', borderRadius: 24, gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Teachers Yet</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
                Join a game using a game code to connect with a teacher.
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-faded)' }}>
                Go to "Join a Game" in the navbar to enter a game code.
              </div>
            </div>
          ) : myTeachers.map(teacher => (
            <div key={teacher.id} className="glass-strong" style={{
              padding: 24, borderRadius: 20, transition: 'transform 0.3s'
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'linear-gradient(135deg, var(--sacred-teal), #056e6b)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: 'white', fontWeight: 700, flexShrink: 0
                }}>
                  {teacher.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{teacher.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faded)' }}>{teacher.institution || 'Institution not specified'}</div>
                </div>
              </div>

              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--text-faded)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Games</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(teacher.class_names || '').split(',').filter(Boolean).map(cls => (
                    <span key={cls} className="pramana-tag" style={{
                      background: 'rgba(10,191,188,0.1)',
                      color: 'var(--sacred-teal)',
                      border: '1px solid rgba(10,191,188,0.3)'
                    }}>
                      {cls.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
