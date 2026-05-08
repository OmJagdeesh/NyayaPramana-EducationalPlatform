import { useState, useEffect } from 'react';
import { useSession } from './hooks/useSession.js';
import { api } from './api.js';
import './styles/game.css';

// Components
import CosmicBackground from './components/CosmicBackground.jsx';
import Navbar from './components/Navbar.jsx';
import Notification from './components/Notification.jsx';
import LoginPage from './components/LoginPage.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import TeacherDashboard from './components/TeacherDashboard.jsx';
<<<<<<< HEAD
=======
import AdminDashboard from './components/AdminDashboard.jsx';
>>>>>>> a170f25 (added the admin login and its functionaly)
import LeaderboardPage from './components/LeaderboardPage.jsx';
import LevelComplete from './components/LevelComplete.jsx';
import SessionWarningModal from './components/SessionWarningModal.jsx';

// New Components
import CreateGame from './components/CreateGame.jsx';
import ClassData from './components/ClassData.jsx';
import TeacherToolkit from './components/TeacherToolkit.jsx';
import TeachersPage from './components/TeachersPage.jsx';
import JoinGame from './components/JoinGame.jsx';
import FrameworkPage from './components/FrameworkPage.jsx';
import DocsPage from './components/DocsPage.jsx';

// Games
import GameEngine from './games/GameEngine.jsx';
import ClassifierGame from './games/ClassifierGame.jsx';
import SequenceGame from './games/SequenceGame.jsx';

export default function App() {
  const session = useSession();
  const { user, progress, loading, login, register, logout, reloadProgress, showWarning, timeRemaining, extendSession } = session;
  const [page, setPage] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [gameLevel, setGameLevel] = useState(null);
  const [gameNum, setGameNum] = useState(null);
  const [levelResult, setLevelResult] = useState(null);
  const [notification, setNotification] = useState(null);
  const [classGameData, setClassGameData] = useState(null); // For playing teacher-created games

  function notify(msg, type = 'success') {
    setNotification({ msg, type });
  }

  async function handleAuth(userData) {
    if (userData.isRegister) {
      await register(userData);
      notify("Account created successfully! Please log in.");
    } else {
      await login({ email: userData.email, password: userData.password });
      setPage('dashboard');
      notify(`Welcome back! 🕉️`, 'info');
    }
  }

  function handleStartLevel(level, num) {
    setGameLevel(level);
    setGameNum(num || 1);
    setClassGameData(null);
    setPage('game');
  }

  function handlePlayClassGame(enrollment) {
    // Play a teacher-created game using GameEngine with custom questions
    setClassGameData(enrollment);
    setGameLevel('quiz');
    setGameNum(1);
    setPage('game');
  }

  async function handleGameComplete(result) {
    setLevelResult(result);
    setPage('levelComplete');

    try {
      await api.saveResult({
        gameType: gameLevel || result.level || 'quiz',
        level: gameNum || 1,
        score: result.score || 0,
        accuracy: result.accuracy || 0,
        correct: result.correct || 0,
        total: result.total || 0,
        hintsUsed: result.hintsUsed || 0,
        timeSeconds: result.time || 0,
        pramanaData: result.pramanaResults || []
      });

      // If this was a class game, also submit to class results
      if (classGameData?.class_id) {
        await api.submitClassResult({
          classId: classGameData.class_id,
          score: result.score || 0,
          accuracy: result.accuracy || 0,
          correct: result.correct || 0,
          total: result.total || 0,
          timeSeconds: result.time || 0,
          pramanaData: result.pramanaResults || []
        });
      }

      await reloadProgress();
    } catch (e) {
      notify("Failed to save progress offline.", "error");
    }

    if (result.accuracy >= 80) notify('Outstanding! 🏆 Pramana Mastery achieved!');
    else if (result.accuracy >= 60) notify('Great work! 🌟 Level complete!');
    else notify('Level complete! 💪 Practice makes perfect!', 'info');
  }

  async function handleLogout() {
    await logout();
    setPage('dashboard');
    setClassGameData(null);
  }

  if (loading) {
    return (
      <>
        <CosmicBackground />
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--gold)', fontSize: 24, zIndex: 10 }}>Loading...</div>
      </>
    );
  }

  return (
    <>
      <CosmicBackground />
      <div className="app-container">
        {showWarning && <SessionWarningModal timeRemainingMs={timeRemaining} onExtend={extendSession} onLogout={handleLogout} />}
        {notification && (
          <Notification msg={notification.msg} type={notification.type} onClose={() => setNotification(null)} />
        )}

        {!user ? (
          <LoginPage onLogin={handleAuth} />
        ) : (
          <>
            {/* Navbar shown for both roles when not in game or level complete */}
            {page !== 'game' && page !== 'levelComplete' && (
              <Navbar user={user} page={page} setPage={p => {
<<<<<<< HEAD
                if (user.role === 'student' && p === 'leaderboard' && !(progress.completedLevels || []).length) {
=======
                if (user.role === 'student' && p === 'leaderboard' && !((progress?.completedLevels) || []).length) {
>>>>>>> a170f25 (added the admin login and its functionaly)
                  notify('Complete Level 1 to unlock the Leaderboard! 🔐', 'info');
                  return;
                }
                setPage(p);
              }} onLogout={handleLogout} />
            )}
            
            {page === 'framework' && <FrameworkPage />}
            {page === 'docs' && <DocsPage setPage={setPage} />}

<<<<<<< HEAD
=======
            {/* ─── ADMIN PAGES ─── */}
            {user.role === 'admin' && (
              <>
                {page === 'dashboard' && (
                  <AdminDashboard key="dashboard" user={user} onLogout={handleLogout} />
                )}
                {(page === 'users' || page === 'teachers') && (
                  <AdminDashboard key={page} user={user} onLogout={handleLogout} initialTab={page} />
                )}
              </>
            )}

>>>>>>> a170f25 (added the admin login and its functionaly)
            {/* ─── TEACHER PAGES ─── */}
            {user.role === 'teacher' && (
              <>
                {page === 'dashboard' && (
                  <TeacherDashboard user={user} onLogout={handleLogout} />
                )}
                {page === 'createGame' && (
                  <CreateGame user={user} notify={notify} />
                )}
                {page === 'classData' && (
                  <ClassData user={user} notify={notify} />
                )}
                {page === 'toolkit' && (
                  <TeacherToolkit user={user} />
                )}
              </>
            )}

            {/* ─── STUDENT PAGES ─── */}
            {user.role === 'student' && (
              <>
                {page === 'dashboard' && (
                  <StudentDashboard
                    user={user}
                    progress={progress}
                    onStartLevel={handleStartLevel}
                    onViewLeaderboard={() => setPage('leaderboard')}
                    onPrePostComplete={reloadProgress}
                  />
                )}
                {page === 'leaderboard' && (
                  <LeaderboardPage user={user} progress={progress} onBack={() => setPage('dashboard')} />
                )}
                {page === 'teachers' && (
                  <TeachersPage user={user} />
                )}
                {page === 'joinGame' && (
                  <JoinGame user={user} notify={notify} onPlayGame={handlePlayClassGame} />
                )}
                {page === 'game' && gameNum && (
                  <>
                    {(gameLevel === 'quiz' || gameLevel === 'detective' || gameLevel === 'vyapti' || gameLevel === 'authority' || gameLevel === 'perception' || gameLevel === 'debate') && (
                      <GameEngine
                        level={gameNum}
                        user={user}
                        onComplete={handleGameComplete}
                        onExit={() => { setPage('dashboard'); setClassGameData(null); }}
                        customQuestions={classGameData?.questions}
                      />
                    )}
                    {(gameLevel === 'classifier' || gameLevel === 'blitz') && (
                      <ClassifierGame 
                        gameType={gameLevel}
                        level={gameNum}
                        user={user}
                        onComplete={handleGameComplete}
                        onExit={() => { setPage('dashboard'); setClassGameData(null); }}
                      />
                    )}
                    {(gameLevel === 'syllogism' || gameLevel === 'chain') && (
                      <SequenceGame 
                        gameType={gameLevel}
                        level={gameNum}
                        user={user}
                        onComplete={handleGameComplete}
                        onExit={() => { setPage('dashboard'); setClassGameData(null); }}
                      />
                    )}
                  </>
                )}
                {page === 'levelComplete' && levelResult && (
                  <LevelComplete
                    result={levelResult}
                    onContinue={() => {
                      setLevelResult(null);
                      setClassGameData(null);
                      setPage('dashboard');
                    }}
                    onRetry={() => {
                      setLevelResult(null);
                      handleStartLevel(gameLevel, gameNum);
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
