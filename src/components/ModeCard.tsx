import { Icon } from './Icon.tsx';

interface ModeCardProps {
  icon: string;
  tone: string;
  title: string;
  label: string;
  text: string;
  action: string;
  onClick: () => void;
}

export function ModeCard({ icon, tone, title, label, text, action, onClick }: ModeCardProps) {
  return (
    <article className="mode-card panel">
      <div className="mode-top">
        <span className={`mode-icon ${tone}`}>
          <Icon name={icon} size={23} />
        </span>
        <span>{label}</span>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="text-button" onClick={onClick}>
        {action}
        <Icon name="arrow" size={17} />
      </button>
    </article>
  );
}
