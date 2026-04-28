const { AppError } = require('../middleware/errorHandler');

/**
 * Validate expense creation input
 */
function validateExpenseInput(body) {
  const errors = [];

  // Validate amount
  if (body.amount === undefined || body.amount === null || body.amount === '') {
    errors.push('amount is required');
  } else {
    const amount = parseFloat(body.amount);
    if (isNaN(amount)) {
      errors.push('amount must be a valid number');
    } else if (amount <= 0) {
      errors.push('amount must be positive');
    }
  }

  // Validate category
  if (!body.category || typeof body.category !== 'string') {
    errors.push('category is required and must be a string');
  } else if (body.category.trim().length === 0) {
    errors.push('category cannot be empty');
  } else if (body.category.trim().length > 100) {
    errors.push('category cannot exceed 100 characters');
  }

  // Validate description
  if (!body.description || typeof body.description !== 'string') {
    errors.push('description is required and must be a string');
  } else if (body.description.trim().length === 0) {
    errors.push('description cannot be empty');
  }

  // Validate date
  if (!body.date) {
    errors.push('date is required');
  } else {
    const dateObj = new Date(body.date);
    if (isNaN(dateObj.getTime())) {
      errors.push('date must be a valid ISO 8601 date');
    }
  }

  if (errors.length > 0) {
    throw new AppError(`Validation failed: ${errors.join(', ')}`, 400);
  }

  return true;
}

/**
 * Validate query parameters for getExpenses
 */
function validateGetExpensesParams(query) {
  if (query.sortBy && !['date_asc', 'date_desc', 'amount_asc', 'amount_desc'].includes(query.sortBy)) {
    throw new AppError('Invalid sortBy value. Use: date_asc, date_desc, amount_asc, or amount_desc', 400);
  }
  return true;
}

module.exports = {
  validateExpenseInput,
  validateGetExpensesParams,
};
