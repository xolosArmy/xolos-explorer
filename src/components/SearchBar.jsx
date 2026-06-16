import React, { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SearchBar({ detectQueryType }) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const inputId = useId();
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const statusId = `${inputId}-status`;
  const queryType = useMemo(() => detectQueryType(query), [detectQueryType, query]);
  const hasError = Boolean(error);

  function handleSubmit(event) {
    event.preventDefault();
    const q = query.trim();
    setError('');

    if (!q) {
      setError('Escribe una altura, dirección ecash: o hash de 64 caracteres.');
      return;
    }

    if (queryType === 'block-height') {
      navigate(`/block/${q}`);
      return;
    }

    if (queryType === 'address') {
      navigate(`/address/${encodeURIComponent(q)}`);
      return;
    }

    if (queryType === 'hash') {
      navigate(`/search/${q}`);
      return;
    }

    setError('Entrada no reconocida. Usa una altura, dirección ecash: o hash de 64 caracteres.');
  }

  function handleClear() {
    setQuery('');
    setError('');
  }

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit} noValidate>
      <label className="search-bar__label" htmlFor={inputId}>Buscar bloque, transacción, token o dirección</label>
      <div className="search-bar__controls">
        <input
          id={inputId}
          name="q"
          className="search-bar__input"
          placeholder="Altura, txid, token id o dirección ecash..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (error) setError('');
          }}
          aria-describedby={`${helpId} ${statusId}${hasError ? ` ${errorId}` : ''}`}
          aria-invalid={hasError}
        />
        <button className="button button--primary" type="submit">Buscar</button>
        <button className="button button--secondary" type="button" onClick={handleClear} disabled={!query && !error}>
          Limpiar
        </button>
      </div>
      <p id={helpId} className="search-bar__help">
        Puedes buscar por altura de bloque, dirección ecash: o hash de 64 caracteres.
      </p>
      {hasError ? (
        <p id={errorId} className="search-bar__error" role="alert">{error}</p>
      ) : (
        <p id={statusId} className="search-bar__status" role="status" aria-live="polite">
          Tipo detectado: <strong>{queryType}</strong>
        </p>
      )}
    </form>
  );
}
