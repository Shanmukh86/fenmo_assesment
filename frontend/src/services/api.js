/**
 * API service for Expense Tracker
 * Handles all communication with the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getAuthToken() {
  try {
    return localStorage.getItem('expense_token');
  } catch (e) {
    return null;
  }
}

class ApiService {
  /**
   * Make a generic API request with error handling
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      idempotencyKey = null,
    } = options;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Attach Authorization header if token is present
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (idempotencyKey) {
      headers['idempotency-key'] = idempotencyKey;
    }

    const config = {
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Create a new expense
   */
  async createExpense(expenseData, idempotencyKey) {
    return this.request('/expenses', {
      method: 'POST',
      body: expenseData,
      idempotencyKey,
    });
  }

  /**
   * Get all expenses with optional filtering and sorting
   */
  async getExpenses(filters = {}) {
    const queryParams = new URLSearchParams();

    if (filters.category) {
      queryParams.append('category', filters.category);
    }
    if (filters.sortBy) {
      queryParams.append('sortBy', filters.sortBy);
    }

    const query = queryParams.toString();
    const endpoint = `/expenses${query ? '?' + query : ''}`;

    return this.request(endpoint);
  }

  /**
   * Get expenses grouped by category
   */
  async getExpensesByCategory() {
    return this.request('/expenses/by-category');
  }

  /**
   * Get a single expense by ID
   */
  async getExpenseById(id) {
    return this.request(`/expenses/${id}`);
  }

  async login({ email, password }) {
    const res = await this.request('/auth/login', { method: 'POST', body: { email, password } });
    if (res && res.data && res.data.token) {
      try { localStorage.setItem('expense_token', res.data.token); } catch (e) {}
    }
    return res;
  }

  async signup({ email, password, name }) {
    const res = await this.request('/auth/signup', { method: 'POST', body: { email, password, name } });
    if (res && res.data && res.data.token) {
      try { localStorage.setItem('expense_token', res.data.token); } catch (e) {}
    }
    return res;
  }
}

export default new ApiService();
