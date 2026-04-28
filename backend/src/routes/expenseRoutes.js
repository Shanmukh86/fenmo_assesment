const express = require('express');
const expenseController = require('../controllers/expenseController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Expense routes
router.post('/expenses', requireAuth, (req, res, next) => expenseController.createExpense(req, res, next));
router.get('/expenses', requireAuth, (req, res, next) => expenseController.getExpenses(req, res, next));
router.get('/expenses/by-category', requireAuth, (req, res, next) => expenseController.getExpensesByCategory(req, res, next));
router.get('/expenses/:id', requireAuth, (req, res, next) => expenseController.getExpenseById(req, res, next));

module.exports = router;
