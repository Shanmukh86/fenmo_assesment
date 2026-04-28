import React, { useState } from 'react';
import { useIdempotencyKey } from '../hooks/useAsync';
import api from '../services/api';

export function ExpenseForm({ onExpenseAdded, onError }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { getKey, clearKey } = useIdempotencyKey('expense-form');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    setIsLoading(true);
    setSuccessMessage('');

    try {
      const idempotencyKey = getKey();

      const response = await api.createExpense(
        {
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          idempotencyKey,
        },
        idempotencyKey
      );

      // Success
      setSuccessMessage(`Expense added: $${response.data.amount} for ${response.data.category}`);
      
      // Reset form
      setFormData({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });

      // Clear stored idempotency key for next submission
      clearKey();

      // Notify parent to refresh list
      if (onExpenseAdded) {
        onExpenseAdded(response.data);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const errorMessage = error.message || 'Failed to add expense';
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Add New Expense</h2>

      {successMessage && (
        <div className="alert success" style={{ marginBottom: '1rem' }}>
          ✓ {successMessage}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Amount Field */}
        <div>
          <label htmlFor="amount">Amount ($) *</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
            disabled={isLoading}
          />
        </div>

        {/* Category Field */}
        <div>
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            disabled={isLoading}
          >
            <option value="">Select a category</option>
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

        {/* Description Field */}
        <div>
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What did you spend on?"
            rows="3"
            required
            disabled={isLoading}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Date Field */}
        <div>
          <label htmlFor="date">Date *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? '#9ca3af' : '#2563eb',
            color: 'white',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <>
              <span className="spinner" style={{ marginRight: '0.5rem' }} />
              Adding...
            </>
          ) : (
            '+ Add Expense'
          )}
        </button>
      </div>
    </form>
  );
}
