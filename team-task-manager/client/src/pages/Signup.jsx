import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LockClosedIcon, EnvelopeIcon, UserIcon } from '@heroicons/react/24/outline';
import AuthShell from '../components/AuthShell';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup(name, email, password);
      navigate('/projects');
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0].message);
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell mode="signup">
      <div className="auth-form-card">
        <div className="mb-8">
          <span className="auth-eyebrow">Create account</span>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Set up your workspace in a few seconds.</p>
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
            <label className="auth-label" htmlFor="signup-name">Full Name</label>
            <div className="auth-input-wrap">
              <div className="auth-input-icon">
                <UserIcon className="h-5 w-5" />
              </div>
              <input
                id="signup-name"
                type="text"
                required
                autoComplete="name"
                className="auth-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="auth-label" htmlFor="signup-email">Email Address</label>
            <div className="auth-input-wrap">
              <div className="auth-input-icon">
                <EnvelopeIcon className="h-5 w-5" />
              </div>
              <input
                id="signup-email"
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
            <label className="auth-label" htmlFor="signup-password">Password</label>
            <div className="auth-input-wrap">
              <div className="auth-input-icon">
                <LockClosedIcon className="h-5 w-5" />
              </div>
              <input
                id="signup-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="auth-input"
                placeholder="At least 6 characters"
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
            ) : 'Create Account'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </AuthShell>
  );
};

export default Signup;
