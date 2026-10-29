import { Icon } from './Icon.tsx';

interface StatCardProps {
  label: string;
  value: string;
  suffix?: string;
  icon: string;
  note: string;
  onClick?: () => void;
}

export function StatCard({ label, value, suffix, icon, note, onClick }: StatCardProps) {
  const content = (
    <>
      <div className="stat-top">
        <span>{label}</span>
        <Icon name={icon} size={18} />
      </div>
      <div className="stat-value">
        {value}
        <small>{suffix}</small>
      </div>
      <p>{note}</p>
    </>
  );

  return onClick ? (
    <button className="stat-card clickable" onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className="stat-card">{content}</div>
  );
}
