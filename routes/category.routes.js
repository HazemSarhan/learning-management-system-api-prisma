const express = require('express');
const { authenticatedUser } = require('../middleware/authentication');
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const router = express.Router();

router
  .route('/')
  .post([authenticatedUser], createCategory)
  .get(getAllCategories);

router
  .route('/:id')
  .get(getCategoryById)
  .patch([authenticatedUser], updateCategory)
  .delete([authenticatedUser], deleteCategory);

module.exports = router;
