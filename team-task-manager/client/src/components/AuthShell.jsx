import heroImage from '../assets/hero.png';

const AuthShell = ({ children, mode }) => {
  const isSignup = mode === 'signup';

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <aside className="auth-visual" aria-hidden="true">
          <div className="auth-brand">
            <span className="auth-kicker">Team Task Manager</span>
            <h2>{isSignup ? 'Start organized.' : 'Welcome back.'}</h2>
          </div>

          <div className="auth-art">
            <img src={heroImage} alt="" />
          </div>

          <div className="auth-status-panel">
            <div className="auth-status-row">
              <span className="auth-status-dot auth-status-dot-blue"></span>
              <span>Planning</span>
              <strong>04</strong>
            </div>
            <div className="auth-status-row">
              <span className="auth-status-dot auth-status-dot-green"></span>
              <span>In progress</span>
              <strong>12</strong>
            </div>
            <div className="auth-status-row">
              <span className="auth-status-dot auth-status-dot-amber"></span>
              <span>Review</span>
              <strong>03</strong>
            </div>
          </div>
        </aside>

        <main className="auth-form-panel">{children}</main>
      </div>
    </section>
  );
};

export default AuthShell;
