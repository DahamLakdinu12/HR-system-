import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import boiLogo from '../assets/images/boi-logo.png';
import landingBackground from '../assets/images/landing-background.jpg';
import { useAuth } from '../context/AuthContext';

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="landing-page">
      <img
        className="landing-background-image"
        src={landingBackground}
        alt=""
        aria-hidden="true"
      />
      <div className="landing-page__overlay" />
      <div className="landing-page__glow" />
      <header className="landing-header">
        <img className="landing-logo-image" src={boiLogo} alt="BOI Sri Lanka" />
        <span>Human Resource Department</span>
      </header>

      <section className="landing-hero">
        <span className="landing-kicker"><ShieldCheck size={15} /> Internal HR workspace</span>
        <h1>Human Resource<br className="landing-title-break" /> Department</h1>
        <p>Track, assess, and grow with our HR increment and performance evaluation system.</p>
        <Link className="landing-cta" to={isAuthenticated ? '/dashboard' : '/login'}>
          {isAuthenticated ? 'Open dashboard' : 'Get started'} <ArrowRight size={20} />
        </Link>
      </section>

      <footer className="landing-footer">
        <span>HR Increment Management System</span>
        <span>Secure internal access</span>
      </footer>
    </main>
  );
}
