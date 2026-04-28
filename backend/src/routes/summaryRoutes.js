const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/summaryController');
const { requireAuth } = require('../middleware/auth');

router.get('/summary', requireAuth, (req, res, next) => getSummary(req, res, next));

module.exports = router;
