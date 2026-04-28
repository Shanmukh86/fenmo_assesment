import React, { useState } from 'react';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import './styles/index.css';

function App() {
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [error, setError] = useState(null);

  const handleExpenseAdded = () => {
    // Trigger re-fetch of expenses
    setListRefreshKey(prev => prev + 1);
    setError(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', paddingTop: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Header */}
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>
            💰 Expense Tracker
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1.0625rem' }}>
            Track your spending and manage your budget
          </p>
        </header>

        {/* Global Error Alert */}
        {error && (
          <div className="alert error" style={{ marginBottom: '1.5rem' }}>
            <span>⚠️</span>
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem',
        }}>
          {/* Form Column */}
          <div>
            <ExpenseForm 
              onExpenseAdded={handleExpenseAdded}
              onError={handleError}
            />
          </div>

          {/* List Column */}
          <div style={{ gridColumn: 'span 2', maxWidth: '100%' }}>
            <ExpenseList refreshKey={listRefreshKey} />
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '0.875rem',
          paddingTop: '2rem',
          borderTop: '1px solid #e5e7eb',
        }}>
          <p>© 2026 Expense Tracker | Built with React + Vite</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
