import { FormEvent, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/common/Logo';

type LoginPageProps = { onLogin: () => void };

export function LoginPage({ onLogin }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(onLogin, 450);
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="login-brand__orb login-brand__orb--one" />
        <div className="login-brand__orb login-brand__orb--two" />
        <Logo inverse />
        <div className="login-brand__content">
          <span className="eyebrow eyebrow--light">HR, thoughtfully managed</span>
          <h1>Grow your people.<br />Elevate your impact.</h1>
          <p>A focused workspace for fair, transparent and effortless employee increment management.</p>
          <div className="brand-points">
            <div><Check size={16} /> Government gazette compliant</div>
            <div><Check size={16} /> Secure, auditable workflows</div>
            <div><Check size={16} /> Connected to your HCM</div>
          </div>
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
              <button type="button">Forgot password?</button>
            </div>
            <div className="input-wrap">
              <LockKeyhole size={19} />
              <input id="password" type={showPassword ? 'text' : 'password'} defaultValue="password" placeholder="Enter your password" minLength={6} required />
              <button className="password-toggle" type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            <label className="remember"><input type="checkbox" defaultChecked /> <span>Keep me signed in</span></label>
            <button className="login-button" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'} {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          <div className="security-note"><ShieldCheck size={17} /> Protected with enterprise-grade security</div>
          <p className="support-note">Need help? <a href="mailto:support@elevatehr.lk">Contact HR support</a></p>
        </div>
      </section>
    </main>
  );
}
