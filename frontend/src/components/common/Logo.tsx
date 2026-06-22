import { TrendingUp } from 'lucide-react';

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`logo ${inverse ? 'logo--inverse' : ''}`}>
      <span className="logo__mark"><TrendingUp size={22} strokeWidth={2.5} /></span>
      <span className="logo__text">elevate<span>HR</span></span>
    </div>
  );
}
