import { FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import loginBackground from '../assets/images/loging-background.jpg';
import loginLogo from '../assets/images/boi-logo.png';
import { Logo } from '../components/common/Logo';

type LoginPageProps = { onLogin: () => void };

export function LoginPage({ onLogin }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(onLogin, 450);
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <img className="login-brand__background" src={loginBackground} alt="" aria-hidden="true" />
        <div className="login-brand__shade" />
        <Link className="login-brand__logo-link" to="/" aria-label="Go to landing page">
          <img className="login-brand__logo" src={loginLogo} alt="BOI Sri Lanka" />
        </Link>
        <div className="login-brand__content">
          <span className="eyebrow eyebrow--light">HR, thoughtfully managed</span>
          <h1>Grow your people.<br />Elevate your impact.</h1>
          <p>A focused workspace for fair, transparent and effortless employee increment management.</p>
        </div>
        <p className="login-brand__footer">Built for better people decisions.</p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-logo"><Logo /></div>
          <span className="eyebrow">Welcome back</span>
          <h2>Sign in to your workspace</h2>
          <p className="login-card__intro">Enter your work credentials to continue.</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Work email</label>
            <div className="input-wrap">
              <Mail size={19} />
              <input id="email" type="email" defaultValue="admin@elevatehr.lk" placeholder="name@organisation.lk" required />
            </div>
            <div className="password-label">
              <label htmlFor="password">Password</label>
              <button type="button" onClick={() => setRecoverySent(true)}>Forgot password?</button>
            </div>
            <div className="input-wrap">
              <LockKeyhole size={19} />
              <input id="password" type={showPassword ? 'text' : 'password'} defaultValue="password" placeholder="Enter your password" minLength={6} required />
              <button className="password-toggle" type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            {recoverySent && <p className="recovery-message" role="status">Please contact HR support to reset your account password.</p>}
            <label className="remember"><input type="checkbox" defaultChecked /> <span>Keep me signed in</span></label>
            <button className="login-button" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'} {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          <p className="support-note">Need help? <a href="mailto:support@elevatehr.lk">Contact HR support</a></p>
        </div>
      </section>
    </main>
  );
}
