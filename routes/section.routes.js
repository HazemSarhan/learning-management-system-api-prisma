const express = require('express');
const {
  authenticatedUser,
  authorizePermissions,
} = require('../middleware/authentication');
const {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
} = require('../controllers/section.controller');
const router = express.Router();

router
  .route('/')
  .post(
    [authenticatedUser, authorizePermissions('ADMIN', 'INSTRUCTOR')],
    createSection
  )
  .get(getAllSections);

router
  .route('/:id')
  .get(getSectionById)
  .patch(
    [authenticatedUser, authorizePermissions('ADMIN', 'INSTRUCTOR')],
    updateSection
  )
  .delete(
    [authenticatedUser, authorizePermissions('ADMIN', 'INSTRUCTOR')],
    deleteSection
  );

module.exports = router;
