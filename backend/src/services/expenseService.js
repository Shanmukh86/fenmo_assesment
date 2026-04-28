const prisma = require('../db');
const { AppError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

class ExpenseService {
  /**
   * Create a new expense with idempotency support
   * Ensures no duplicate expenses are created for the same idempotency key
   */
  async createExpense(data) {
    const { amount, category, description, date, idempotencyKey, userId } = data;

    // Generate idempotency key if not provided
    const finalIdempotencyKey = idempotencyKey || uuidv4();

    try {
      // Try to find existing expense with same idempotency key
      const existingExpense = await prisma.expense.findUnique({
        where: { idempotencyKey: finalIdempotencyKey },
      });

      if (existingExpense) {
        return existingExpense;
      }

      // Create new expense (associate with user)
      const expense = await prisma.expense.create({
        data: {
          amount: parseFloat(amount),
          category: category.trim(),
          description: description.trim(),
          date: new Date(date),
          idempotencyKey: finalIdempotencyKey,
          userId,
        },
      });

      return expense;
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint violation on idempotency key
        const existingExpense = await prisma.expense.findUnique({
          where: { idempotencyKey: finalIdempotencyKey },
        });
        return existingExpense;
      }
      throw error;
    }
  }

  /**
   * Get all expenses with optional filtering and sorting
   */
  async getExpenses(filters = {}) {
    const { category, sortBy = 'date_desc', userId } = filters;

    let whereClause = {};
    if (userId) whereClause.userId = userId;
    let orderByClause = { date: 'desc' };

    // Apply category filter if provided
    if (category) {
      whereClause.category = category;
    }

    // Apply sorting
    if (sortBy === 'date_asc') {
      orderByClause = { date: 'asc' };
    } else if (sortBy === 'date_desc') {
      orderByClause = { date: 'desc' };
    } else if (sortBy === 'amount_asc') {
      orderByClause = { amount: 'asc' };
    } else if (sortBy === 'amount_desc') {
      orderByClause = { amount: 'desc' };
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: orderByClause,
    });

    return expenses;
  }

  /**
   * Get expenses grouped by category with totals
   */
  async getExpensesByCategory() {
    // TODO: consider accepting userId to scope per-user
    const expenses = await prisma.expense.findMany();

    const grouped = {};
    let totalAmount = 0;

    expenses.forEach(expense => {
      if (!grouped[expense.category]) {
        grouped[expense.category] = {
          category: expense.category,
          total: 0,
          count: 0,
          expenses: [],
        };
      }
      grouped[expense.category].total += parseFloat(expense.amount);
      grouped[expense.category].count += 1;
      grouped[expense.category].expenses.push(expense);
      totalAmount += parseFloat(expense.amount);
    });

    return {
      summary: grouped,
      totalAmount,
    };
  }

  /**
   * Get a single expense by ID
   */
  async getExpenseById(id) {
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    return expense;
  }
}

module.exports = new ExpenseService();
