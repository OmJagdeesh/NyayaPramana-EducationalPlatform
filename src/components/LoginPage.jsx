import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institution, setInstitution] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if ((isRegister && !name.trim()) || !email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (isRegister && role === "teacher" && !institution.trim()) {
      setError("Please enter your institution.");
      return;
    }
    setError("");
    try {
      await onLogin({ email, password, isRegister, name: name.trim(), role, institution });
      if (isRegister) {
        setIsRegister(false);
        setPassword("");
      }
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-hero">
          <span className="login-emblem">🕉️</span>
          <div className="login-title display-font">Nyaya Pramana</div>
          <div style={{ fontSize: 20, fontFamily: "'Yatra One', cursive", color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>न्याय प्रमाण</div>
          <div className="login-subtitle">IKS-Based Serious Game for Cognitive Learning</div>
        </div>

        <div className="glass-strong" style={{ padding: '32px' }}>
          <div className="role-tabs">
            <button className={`role-tab ${role === 'student' ? 'role-tab-active' : 'role-tab-inactive'}`} onClick={() => { setRole('student'); setIsRegister(false); }}>
              🎓 Student
            </button>
            <button className={`role-tab ${role === 'teacher' ? 'role-tab-active' : 'role-tab-inactive'}`} onClick={() => { setRole('teacher'); setIsRegister(false); }}>
              📚 Teacher
            </button>
            <button
              className={`role-tab ${role === 'admin' ? 'role-tab-active' : 'role-tab-inactive'}`}
              onClick={() => { setRole('admin'); setIsRegister(false); }}
              style={role === 'admin' ? { borderColor: 'rgba(239,68,68,0.6)', color: '#fca5a5', background: 'rgba(239,68,68,0.12)' } : { opacity: 0.7 }}
            >
              ⚡ Admin
            </button>
          </div>

          {role === 'admin' && (
            <div style={{ textAlign: 'center', fontSize: 12, color: '#fca5a5', marginBottom: 12, padding: '8px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>
              🛡️ Restricted access · Admin credentials required
            </div>
          )}

          {isRegister && role !== 'admin' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} onFocus={e => e.target.select()} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} onFocus={e => e.target.select()} />
          </div>
          {isRegister && role === 'teacher' && (
            <div className="form-group">
              <label className="form-label">Institution</label>
              <input className="form-input" placeholder="School / College name" value={institution} onChange={e => setInstitution(e.target.value)} onFocus={e => e.target.select()} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onFocus={e => e.target.select()} onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={{ paddingRight: 48 }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-faded)', padding: 4 }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)' }}>{error}</div>}

          <button className="btn-primary" style={{ width: '100%', padding: '16px', marginBottom: role === 'admin' ? 0 : 16 }} onClick={handleSubmit}>
            {role === 'admin' ? '⚡ Access Admin Panel' : isRegister ? 'Register Account' : role === 'teacher' ? '🏫 Enter Teacher Dashboard' : '🎮 Begin Learning Journey'}
          </button>

          {role !== 'admin' && (
            <>
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                {isRegister ? "Already have an account? " : "Don't have an account? "}
                <span style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsRegister(!isRegister)}>
                  {isRegister ? "Log In" : "Register Here"}
                </span>
              </div>
              {role === 'student' && !isRegister && (
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faded)' }}>
                  Explore Pratyaksa • Anumana • Sabda
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', justifyContent: 'center', gap: 20 }}>
          {['NEP 2020 Aligned', 'IKS Framework', 'Nyaya Darshan'].map(t => (
            <div key={t} style={{ fontSize: 11, color: 'var(--text-faded)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--gold)' }}>✦</span> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
