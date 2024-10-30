const express = require('express');
const {
  authenticatedUser,
  authorizePermissions,
} = require('../middleware/authentication');
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} = require('../controllers/course.controller');
const router = express.Router();

router
  .route('/')
  .post(
    [authenticatedUser, authorizePermissions('ADMIN', 'INSTRUCTOR')],
    createCourse
  )
  .get(getAllCourses);

router
  .route('/:id')
  .get(getCourseById)
  .patch([
    authenticatedUser,
    authorizePermissions('ADMIN', 'INSTRUCTOR'),
    updateCourse,
  ])
  .delete(
    [authenticatedUser, authorizePermissions('ADMIN', 'INSTRUCTOR')],
    deleteCourse
  );

module.exports = router;
