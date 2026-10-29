interface MeterProps {
  value: number;
  total: number;
}

export function Meter({ value, total }: MeterProps) {
  return (
    <div
      className="meter"
      role="progressbar"
      aria-label="Questions studied"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
    >
      <span style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
    </div>
  );
}
