import React from 'react';

export function PageStatus({ type = 'info', title, children }) {
  const isError = type === 'error';
  const role = isError ? 'alert' : 'status';

  return (
    <div className={`page-status page-status--${type}`} role={role} aria-live={isError ? undefined : 'polite'}>
      {title ? <strong className="page-status__title">{title}</strong> : null}
      <div>{children}</div>
    </div>
  );
}
