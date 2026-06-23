import { ArrowLeft, Construction, Search } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type ModulePageProps = {
  title: string;
  description: string;
};

export function ModulePage({ title, description }: ModulePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchTerm = useMemo(() => new URLSearchParams(location.search).get('search'), [location.search]);

  return (
    <main className="dashboard module-page">
      <button className="back-button" onClick={() => navigate('/dashboard')}><ArrowLeft size={16} /> Overview</button>
      <section className="module-hero">
        <span className="eyebrow">HR workspace</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      <section className="panel empty-state">
        <span className="empty-state__icon">{searchTerm ? <Search size={26} /> : <Construction size={26} />}</span>
        <h2>{searchTerm ? `Search results for “${searchTerm}”` : `${title} module`}</h2>
        <p>{searchTerm ? 'Connect the HCM database to return live employee results.' : 'The navigation is working. This business module is ready for its forms, tables and API integration.'}</p>
        <button className="primary-button" onClick={() => navigate('/dashboard')}>Return to overview</button>
      </section>
    </main>
  );
}
