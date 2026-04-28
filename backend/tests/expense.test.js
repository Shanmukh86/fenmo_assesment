const request = require('supertest');
const app = require('../src/index');
const prisma = require('../src/db');

describe('Expense API', () => {
  // Cleanup after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/expenses', () => {
    it('should create a new expense', async () => {
      const expenseData = {
        amount: 50.00,
        category: 'Food',
        description: 'Lunch at restaurant',
        date: '2026-04-28',
      };

      const response = await request(app)
        .post('/api/expenses')
        .send(expenseData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe('50.00');
      expect(response.body.data.category).toBe('Food');
    });

    it('should reject expense with negative amount', async () => {
      const expenseData = {
        amount: -50,
        category: 'Food',
        description: 'Lunch at restaurant',
        date: '2026-04-28',
      };

      const response = await request(app)
        .post('/api/expenses')
        .send(expenseData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('positive');
    });

    it('should support idempotency', async () => {
      const expenseData = {
        amount: 75.50,
        category: 'Transport',
        description: 'Taxi to airport',
        date: '2026-04-28',
        idempotencyKey: 'unique-key-123',
      };

      const response1 = await request(app)
        .post('/api/expenses')
        .send(expenseData);

      const response2 = await request(app)
        .post('/api/expenses')
        .send(expenseData);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.data.id).toBe(response2.body.data.id);
    });
  });

  describe('GET /api/expenses', () => {
    it('should retrieve all expenses', async () => {
      const response = await request(app)
        .get('/api/expenses');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/expenses?category=Food');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should sort by date descending', async () => {
      const response = await request(app)
        .get('/api/expenses?sortBy=date_desc');

      expect(response.status).toBe(200);
      if (response.body.data.length > 1) {
        const firstDate = new Date(response.body.data[0].date);
        const secondDate = new Date(response.body.data[1].date);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
      }
    });
  });

  describe('GET /api/expenses/by-category', () => {
    it('should return expenses grouped by category', async () => {
      const response = await request(app)
        .get('/api/expenses/by-category');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Health check', () => {
    it('should return 200 on health endpoint', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
    });
  });
});
