const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

const createReview = async (req, res) => {
  const { courseId } = req.body;
  const { rating, comment } = req.body;
  const userId = req.user.userId; // Assuming req.user has userId from authentication

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new CustomError.BadRequestError('Rating must be between 1 and 5');
  }

  // Check if course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });
  if (!course) {
    throw new CustomError.NotFoundError(`No course found with id ${courseId}`);
  }

  // Check if the user has already left a review for this course
  const existingReview = await prisma.review.findFirst({
    where: {
      courseId,
      userId,
    },
  });

  if (existingReview) {
    throw new CustomError.BadRequestError(
      'You have already submitted a review for this course'
    );
  }

  // Create the review
  const review = await prisma.review.create({
    data: {
      rating,
      comment,
      courseId,
      userId,
    },
  });

  // Update the average rating and number of reviews
  const updatedCourse = await prisma.course.update({
    where: { id: courseId },
    data: {
      number_of_reviews: {
        increment: 1,
      },
      average_rating: {
        set: await calculateAverageRating(courseId),
      },
    },
  });

  res.status(StatusCodes.CREATED).json({ review, course: updatedCourse });
};

const updateReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.userId; // Assuming req.user contains the authenticated user's ID

  // Validate rating
  if (rating && (rating < 1 || rating > 5)) {
    throw new CustomError.BadRequestError('Rating must be between 1 and 5');
  }

  // Check if the review exists and belongs to the user
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });
  if (!review) {
    throw new CustomError.NotFoundError(`No review found with id ${reviewId}`);
  }
  if (review.userId !== userId) {
    throw new CustomError.UnauthorizedError(
      'You are not authorized to update this review'
    );
  }

  // Update the review
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: rating !== undefined ? rating : review.rating,
      comment: comment !== undefined ? comment : review.comment,
    },
  });

  // Update the course's average rating and number of reviews
  await prisma.course.update({
    where: { id: review.courseId },
    data: {
      average_rating: {
        set: await calculateAverageRating(review.courseId),
      },
    },
  });

  res
    .status(StatusCodes.OK)
    .json({ msg: 'Review updated successfully!', review: updatedReview });
};

const deleteReview = async (req, res) => {
  const { id } = req.params; // Use `id` to match the route parameter
  console.log('Review ID:', id); // Log to verify the parameter

  if (!id) {
    throw new CustomError.BadRequestError('Review ID is required');
  }

  // Check if review exists
  const review = await prisma.review.findUnique({
    where: { id },
  });
  if (!review) {
    throw new CustomError.NotFoundError(`No review found with id ${id}`);
  }

  // Delete the review
  await prisma.review.delete({
    where: { id },
  });

  // Update the course ratings
  const updatedCourse = await prisma.course.update({
    where: { id: review.courseId },
    data: {
      number_of_reviews: {
        decrement: 1,
      },
      average_rating: {
        set: await calculateAverageRating(review.courseId),
      },
    },
  });

  res
    .status(StatusCodes.OK)
    .json({ msg: 'Review deleted successfully!', course: updatedCourse });
};

const calculateAverageRating = async (courseId) => {
  const { _avg } = await prisma.review.aggregate({
    where: { courseId },
    _avg: {
      rating: true,
    },
  });
  return _avg.rating || 0;
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
};
