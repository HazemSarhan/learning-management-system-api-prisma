const express = require('express');
const { authenticatedUser } = require('../middleware/authentication');
const {
  createReview,
  deleteReview,
  updateReview,
} = require('../controllers/review.controller');
const router = express.Router();

router.route('/').post([authenticatedUser], createReview);
router
  .route('/:id')
  .patch([authenticatedUser], updateReview)
  .delete([authenticatedUser], deleteReview);

module.exports = router;
