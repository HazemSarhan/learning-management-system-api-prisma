const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const cloudinary = require('../configs/cloudinaryConfig');
const fs = require('fs');

const createCourse = async (req, res) => {
  const { title, description, price, categoryId } = req.body;
  const instructorId = req.user.userId;

  if (!title || price === undefined || !categoryId) {
    throw new CustomError.BadRequestError(
      'Please provide all required fields!'
    );
  }

  // convert price to a number (float)
  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice)) {
    throw new CustomError.BadRequestError('Price must be a valid number');
  }

  // automatically set is_paid to false if price is 0
  const is_paid = price > 0;

  // category exisiting check
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    throw new CustomError.NotFoundError(
      `No category found with this id ${categoryId}`
    );
  }

  let image = '/uploads/course.png'; // default value
  if (req.files && req.files.image) {
    const result = await cloudinary.uploader.upload(
      req.files.image.tempFilePath,
      {
        use_filename: true,
        folder: 'lms-images',
      }
    );
    fs.unlinkSync(req.files.image.tempFilePath);
    image = result.secure_url;
  }

  const newCourse = await prisma.course.create({
    data: {
      title,
      description,
      price: numericPrice,
      is_paid,
      image: image,
      categoryId,
      instructorId,
      average_rating: 0,
      number_of_reviews: 0,
    },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      is_paid: true,
      image: true,
      average_rating: true,
      number_of_reviews: true,
      created_at: true,
      updated_at: true,
      category: { select: { id: true, name: true } },
      instructor: { select: { id: true, name: true, email: true } },
    },
  });
  res
    .status(StatusCodes.CREATED)
    .json({ msg: 'course created successfully!', course: newCourse });
};

const getAllCourses = async (req, res) => {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      is_paid: true,
      image: true,
      average_rating: true,
      number_of_reviews: true,
      created_at: true,
      updated_at: true,
      category: { select: { id: true, name: true } },
      instructor: { select: { id: true, name: true, email: true } },
      sections: { select: { id: true, title: true } },
      orders: { select: { id: true, userId: true } },
    },
  });
  res.status(StatusCodes.OK).json({ courses });
};

const getCourseById = async (req, res) => {
  const { id: courseId } = req.params;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      is_paid: true,
      image: true,
      average_rating: true,
      number_of_reviews: true,
      created_at: true,
      updated_at: true,
      category: { select: { id: true, name: true } },
      instructor: { select: { id: true, name: true, email: true } },
      sections: { select: { id: true, title: true } },
      orders: { select: { id: true, userId: true } },
    },
  });
  if (!course) {
    throw new CustomError.NotFoundError(
      `No courses found with this id ${courseId}`
    );
  }
  res.status(StatusCodes.OK).json({ course });
};

const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, categoryId } = req.body;
  const instructorId = req.user.userId;

  // ensure the course exists and belongs to the authenticated instructor
  const course = await prisma.course.findUnique({
    where: { id },
    include: { instructor: true },
  });
  if (!course) {
    throw new CustomError.NotFoundError(`No course found with this id ${id}`);
  }
  if (course.instructorId !== instructorId) {
    throw new CustomError.UnauthorizedError(
      'You are not authorized to update this course'
    );
  }

  let numericPrice;
  if (price !== undefined) {
    numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      throw new CustomError.BadRequestError(
        'Price must be a valid positive number'
      );
    }
  }

  const is_paid =
    numericPrice !== undefined ? numericPrice > 0 : course.is_paid;

  if (categoryId) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      throw new CustomError.NotFoundError(
        `No category found with this id ${categoryId}`
      );
    }
  }

  let image = course.image;
  if (req.files && req.files.image) {
    const result = await cloudinary.uploader.upload(
      req.files.image.tempFilePath,
      {
        use_filename: true,
        folder: 'lms-images',
      }
    );
    fs.unlinkSync(req.files.image.tempFilePath);
    image = result.secure_url;
  }

  // Update the course
  const updatedCourse = await prisma.course.update({
    where: { id },
    data: {
      title: title || course.title,
      description: description || course.description,
      price: numericPrice !== undefined ? numericPrice : course.price,
      is_paid,
      image,
      categoryId: categoryId || course.categoryId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      is_paid: true,
      image: true,
      average_rating: true,
      number_of_reviews: true,
      created_at: true,
      updated_at: true,
      category: { select: { id: true, name: true } },
      instructor: { select: { id: true, name: true, email: true } },
    },
  });

  res
    .status(StatusCodes.OK)
    .json({ msg: 'Course updated successfully!', course: updatedCourse });
};

const deleteCourse = async (req, res) => {
  const { id } = req.params;
  const course = await prisma.course.delete({
    where: { id: id },
  });

  if (!course) {
    throw new CustomError.NotFoundError(`No courses found with this id ${id}`);
  }
  res
    .status(StatusCodes.OK)
    .json({ msg: 'course has been deleted successfully!' });
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};
