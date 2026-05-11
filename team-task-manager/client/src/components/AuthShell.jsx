import heroImage from '../assets/hero.png';

const AuthShell = ({ children, mode }) => {
  const isSignup = mode === 'signup';

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <aside className="auth-visual" aria-hidden="true">
          <div className="auth-brand">
            <span className="auth-kicker">TaskPilot</span>
            <h2>{isSignup ? 'Start organized.' : 'Welcome back.'}</h2>
          </div>

          <div className="auth-art">
            <img src={heroImage} alt="" />
          </div>
        </aside>

        <main className="auth-form-panel">{children}</main>
      </div>
    </section>
  );
};

export default AuthShell;
