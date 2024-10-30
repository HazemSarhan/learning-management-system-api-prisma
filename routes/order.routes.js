const express = require('express');
const {
  authenticatedUser,
  authorizePermissions,
} = require('../middleware/authentication');
const {
  purchaseCourse,
  getAllOrders,
} = require('../controllers/order.controller');
const router = express.Router();

router
  .route('/')
  .get(
    [authenticatedUser, authorizePermissions('ADMIN', 'INSTRUCTOR')],
    getAllOrders
  );
router.route('/create').post([authenticatedUser], purchaseCourse);

module.exports = router;
