const express = require('express');
const router = express.Router();
const motivationController = require('../controllers/motivationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/daily', motivationController.getDailyMotivation);

module.exports = router;
