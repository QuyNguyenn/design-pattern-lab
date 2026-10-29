import type { ReactNode } from 'react';

interface SectionHeadingProps {
  title: string;
  description: string;
  eyebrow?: string;
  aside?: ReactNode;
}

export function SectionHeading({ title, description, eyebrow, aside }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {aside}
    </div>
  );
}
