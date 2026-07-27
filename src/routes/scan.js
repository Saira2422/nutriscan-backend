const express = require('express');
const router = express.Router();
const multer = require('multer');
const scanController = require('../controllers/scanController');
const { protect } = require('../middleware/auth');

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, `scan-${Date.now()}-${Math.round(Math.random() * 1e9)}${require('path').extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(protect);
router.post('/analyze', upload.single('image'), scanController.analyze);
router.get('/history', scanController.getHistory);
router.get('/:scanId', scanController.getScan);
router.delete('/:scanId', scanController.deleteScan);

module.exports = router;
