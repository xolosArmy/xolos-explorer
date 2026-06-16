import React from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { SearchBar } from '../components/SearchBar';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

function HomeAction({ title, description, to }) {
  return (
    <Link className="task-card" to={to}>
      <span className="task-card__title">{title}</span>
      <span className="task-card__description">{description}</span>
    </Link>
  );
}

export default function HomePage({ chronikUrl, detectQueryType }) {
  useDocumentTitle('Inicio');

  return (
    <AppShell>
      <section className="home-hero" aria-labelledby="home-title">
        <p className="eyebrow">Explorador eCash de XolosArmy</p>
        <h1 id="home-title">Xolos Explorer</h1>
        <p className="home-hero__lead">
          Consulta bloques, transacciones, tokens y registros de linaje sin perder el contexto del archivo XOLOSNFT.
        </p>
      </section>

      <SearchBar detectQueryType={detectQueryType} />

      <section className="home-section" aria-labelledby="home-actions-title">
        <h2 id="home-actions-title">Acciones principales</h2>
        <div className="task-grid">
          <HomeAction
            title="Buscar bloque o transacción"
            description="Usa una altura, txid o token id para abrir el detalle técnico."
            to="/explorer"
          />
          <HomeAction
            title="Consultar linaje"
            description="Revisa fichas, vínculos familiares y registros editoriales."
            to="/linaje"
          />
          <HomeAction
            title="Ver colección XOLOSNFT"
            description="Explora el archivo curado de piezas y metadata local."
            to="/collection/xolosnft"
          />
          <HomeAction
            title="Revisar estado del nodo"
            description="Consulta altura actual, tip hash y endpoint Chronik."
            to="/status"
          />
        </div>
      </section>

      <aside className="secondary-panel" aria-labelledby="technical-panel-title">
        <h2 id="technical-panel-title">Contexto técnico</h2>
        <p>
          Endpoint Chronik activo: <span className="mono">{chronikUrl}</span>
        </p>
        <Link to="/status">Ver estado completo del nodo</Link>
      </aside>
    </AppShell>
  );
}
