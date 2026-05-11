import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import AuthShell from '../components/AuthShell';
import api from '../api/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      try {
        const { data: projects } = await api.get('/projects');
        const lastProjectId = localStorage.getItem('lastProjectId');
        const project = projects.find((item) => item.id === lastProjectId) || projects[0];
        navigate(project ? `/projects/${project.id}/dashboard` : '/projects');
      } catch (projectError) {
        console.error('Failed to load projects after login', projectError);
        navigate('/projects');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0].message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell mode="login">
      <div className="auth-form-card">
        <div className="mb-8">
          <span className="auth-eyebrow">Sign in</span>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Pick up right where your team left off.</p>
        </div>

        {error && (
          <div className="auth-alert">
            <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="auth-label" htmlFor="login-email">Email Address</label>
            <div className="auth-input-wrap">
              <div className="auth-input-icon">
                <EnvelopeIcon className="h-5 w-5" />
              </div>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="auth-label" htmlFor="login-password">Password</label>
            <div className="auth-input-wrap">
              <div className="auth-input-icon">
                <LockClosedIcon className="h-5 w-5" />
              </div>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                className="auth-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="auth-switch">
          Don't have an account?{' '}
          <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </AuthShell>
  );
};

export default Login;
