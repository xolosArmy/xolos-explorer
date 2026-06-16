import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/explorer', label: 'Explorer' },
  { to: '/linaje', label: 'Linaje' },
  { to: '/collection/xolosnft', label: 'Colección' },
  { to: '/status', label: 'Nodo' },
];

export function AppShell({ children }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>
      <div className="app-shell__inner">
        <header className="site-header">
          <Link to="/" className="site-brand" aria-label="Xolos Explorer inicio">
            XOLOS EXPLORER
          </Link>
          <nav className="site-nav" aria-label="Principal">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `site-nav__link${isActive ? ' site-nav__link--active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main id="main-content" tabIndex={-1} className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
