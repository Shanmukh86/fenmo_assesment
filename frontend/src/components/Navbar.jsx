import React from 'react';

export function Navbar({ onLogout, onNavigate, currentView }) {
  return (
    <div className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>💰 Expense Tracker</h2>
        <nav>
          <button className={`nav-button ${currentView === 'expenses' ? 'active' : ''}`} onClick={() => onNavigate('expenses')}>Expenses</button>
          <button className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => onNavigate('dashboard')}>Dashboard</button>
        </nav>
      </div>
      <div>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
