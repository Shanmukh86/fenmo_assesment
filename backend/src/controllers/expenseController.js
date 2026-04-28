const expenseService = require('../services/expenseService');
const { validateExpenseInput, validateGetExpensesParams } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');

class ExpenseController {
  /**
   * POST /api/expenses
   * Create a new expense with idempotency support
   */
  async createExpense(req, res, next) {
    try {
      validateExpenseInput(req.body);

      const idempotencyKey = req.body.idempotencyKey || req.headers['idempotency-key'];

      const expense = await expenseService.createExpense({
        amount: req.body.amount,
        category: req.body.category,
        description: req.body.description,
        date: req.body.date,
        idempotencyKey,
      });

      res.status(201).json({
        success: true,
        data: expense,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/expenses
   * Get all expenses with optional filtering and sorting
   * Query params: category, sortBy (date_asc, date_desc, amount_asc, amount_desc)
   */
  async getExpenses(req, res, next) {
    try {
      validateGetExpensesParams(req.query);

      const expenses = await expenseService.getExpenses({
        category: req.query.category,
        sortBy: req.query.sortBy || 'date_desc',
      });

      const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

      res.status(200).json({
        success: true,
        data: expenses,
        summary: {
          count: expenses.length,
          total: parseFloat(total.toFixed(2)),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/expenses/by-category
   * Get expenses grouped by category with summary
   */
  async getExpensesByCategory(req, res, next) {
    try {
      const result = await expenseService.getExpensesByCategory();

      res.status(200).json({
        success: true,
        data: result.summary,
        summary: {
          totalAmount: parseFloat(result.totalAmount.toFixed(2)),
          categories: Object.keys(result.summary).length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/expenses/:id
   * Get a single expense by ID
   */
  async getExpenseById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || id.trim().length === 0) {
        throw new AppError('Expense ID is required', 400);
      }

      const expense = await expenseService.getExpenseById(id);

      res.status(200).json({
        success: true,
        data: expense,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExpenseController();
