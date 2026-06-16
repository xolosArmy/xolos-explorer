import React from 'react';

export function PageSkeleton({ text = 'Cargando...' }) {
  return (
    <div className="page-skeleton" role="status" aria-live="polite">
      <span className="page-skeleton__bar" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
