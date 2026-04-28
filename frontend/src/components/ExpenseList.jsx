import React, { useState, useEffect } from 'react';
import api from '../services/api';

export function ExpenseList({ refreshKey }) {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    sortBy: 'date_desc',
  });

  const loadExpenses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getExpenses(filters);
      setExpenses(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load expenses when component mounts or filters change
  useEffect(() => {
    loadExpenses();
  }, [filters, refreshKey]);

  const handleCategoryChange = (e) => {
    setFilters(prev => ({
      ...prev,
      category: e.target.value,
    }));
  };

  const handleSortChange = (e) => {
    setFilters(prev => ({
      ...prev,
      sortBy: e.target.value,
    }));
  };

  const handleRetry = () => {
    loadExpenses();
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>Expenses</h2>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label htmlFor="category-filter">Filter by Category</label>
            <select
              id="category-filter"
              value={filters.category}
              onChange={handleCategoryChange}
              disabled={isLoading}
            >
              <option value="">All Categories</option>
              <option value="Food">Food & Dining</option>
              <option value="Transport">Transport</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Shopping">Shopping</option>
              <option value="Utilities">Utilities</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label htmlFor="sort-filter">Sort By</label>
            <select
              id="sort-filter"
              value={filters.sortBy}
              onChange={handleSortChange}
              disabled={isLoading}
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="alert error" style={{ marginBottom: '1rem' }}>
          <div>
            <strong>Error:</strong> {error}
          </div>
          <button
            onClick={handleRetry}
            style={{
              marginTop: '0.5rem',
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading expenses...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && expenses.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No expenses yet</p>
          <p style={{ color: '#9ca3af' }}>Add your first expense to get started</p>
        </div>
      )}

      {/* Expenses Table */}
      {!isLoading && !error && expenses.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{formatDate(expense.date)}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}>
                      {expense.category}
                    </span>
                  </td>
                  <td>{expense.description}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600', color: '#1f2937' }}>
                    ${formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '2px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                Showing {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Total:</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb' }}>
                ${formatCurrency(
                  expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
                )}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
