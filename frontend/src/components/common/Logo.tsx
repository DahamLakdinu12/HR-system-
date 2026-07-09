import boiLogo from '../../assets/images/boi-logo.png';

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`logo ${inverse ? 'logo--inverse' : ''}`}>
      <img className="logo__image" src={boiLogo} alt="BOI Sri Lanka" />
      <span className="logo__text">
        <strong>Board of</strong>
        <strong>Investment</strong>
        <strong>of Sri Lanka</strong>
      </span>
    </div>
  );
}
