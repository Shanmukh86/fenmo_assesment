const prisma = require('../../prismaClient');

async function getSummary(req, res, next) {
  try {
    const userId = req.user && req.user.id;

    // Fetch user's expenses (limit to last 12 months for trend)
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: start,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Aggregate by category
    const byCategoryMap = {};
    expenses.forEach(e => {
      const cat = e.category || 'Uncategorized';
      const amt = parseFloat(String(e.amount));
      byCategoryMap[cat] = (byCategoryMap[cat] || 0) + amt;
    });

    const byCategory = Object.keys(byCategoryMap).map(cat => ({
      category: cat,
      total: parseFloat(byCategoryMap[cat].toFixed(2)),
    }));

    // Build monthly buckets for last 12 months
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }

    const monthlyMap = Object.fromEntries(months.map(m => [m, 0]));
    expenses.forEach(e => {
      const m = new Date(e.date).toISOString().slice(0, 7);
      if (monthlyMap[m] !== undefined) monthlyMap[m] += parseFloat(String(e.amount));
    });

    const monthly = months.map(m => ({ month: m, total: parseFloat(monthlyMap[m].toFixed(2)) }));

    res.json({ success: true, data: { byCategory, monthly }, timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
