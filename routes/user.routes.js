const express = require('express');
const { authenticatedUser } = require('../middleware/authentication');
const {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserPassword,
  changeUserRole,
} = require('../controllers/user.controller');
const router = express.Router();

router.route('/').get(getAllUsers);

router.patch('/updateUserPassword/', [authenticatedUser], updateUserPassword);
router.patch('/updateUser', [authenticatedUser], updateUser);

router.patch('/:id/role', [authenticatedUser], changeUserRole);
router.route('/:id').get(getUserById);

module.exports = router;
