const express = require('express');
const {
  authenticatedUser,
  authorizePermissions,
} = require('../middleware/authentication');
const {
  createLecture,
  getAllLectures,
  getLectureById,
  updateLecture,
  deleteLecture,
} = require('../controllers/lecture.controller');
const router = express.Router();

router
  .route('/')
  .post([
    authenticatedUser,
    authorizePermissions('ADMIN', 'INSTRUCTOR'),
    createLecture,
  ])
  .get(getAllLectures);

router
  .route('/:id')
  .get(getLectureById)
  .patch(
    [authenticatedUser, authorizePermissions('ADMIN', 'INSTRUCTOR')],
    updateLecture
  )
  .delete(
    [authenticatedUser, authorizePermissions('ADMIN', 'INSTRUCTOR')],
    deleteLecture
  );

module.exports = router;
