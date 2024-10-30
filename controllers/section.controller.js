const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

const createSection = async (req, res) => {
  const { title, description, courseId } = req.body;
  if (!title || !courseId) {
    throw new CustomError.BadRequestError('Please provide title and courseId');
  }

  // check for course availablity
  const courseAvailablity = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
  });
  if (!courseAvailablity) {
    throw new CustomError.NotFoundError(
      `No course found with this id ${courseId}`
    );
  }

  const section = await prisma.section.create({
    data: {
      title: title,
      description: description,
      courseId: courseId,
    },
  });

  res.status(StatusCodes.CREATED).json({ section });
};

const getAllSections = async (req, res) => {
  const sections = await prisma.section.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      course: { select: { id: true, title: true } },
      created_at: true,
      updated_at: true,
    },
  });
  res.status(StatusCodes.OK).json({ sections });
};

const getSectionById = async (req, res) => {
  const { id: sectionId } = req.params;
  const section = await prisma.section.findUnique({
    where: {
      id: sectionId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      course: { select: { id: true, title: true } },
      created_at: true,
      updated_at: true,
    },
  });
  if (!section) {
    throw new CustomError.NotFoundError(
      `No section found with this id ${sectionId}`
    );
  }
  res.status(StatusCodes.OK).json({ section });
};

const updateSection = async (req, res) => {
  const { id: sectionId } = req.params;
  const { title, description, courseId } = req.body;
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });
  if (!section) {
    throw new CustomError.NotFoundError(
      `No section found with this id ${sectionId}`
    );
  }

  if (courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new CustomError.NotFoundError(
        `No course found with this id ${courseId}`
      );
    }
  }

  const updateData = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (courseId) updateData.courseId = courseId;

  const updateSection = await prisma.section.update({
    where: { id: sectionId },
    data: updateData,
    select: {
      id: true,
      title: true,
      description: true,
      courseId: true,
    },
  });
  res.status(StatusCodes.OK).json({ updateSection });
};

const deleteSection = async (req, res) => {
  const { id: sectionId } = req.params;
  const deleteSection = await prisma.section.deleteMany({
    where: { id: sectionId },
  });
  if (!deleteSection) {
    throw new CustomError.NotFoundError(
      `No section found with this id ${sectionId}`
    );
  }
  res.status(StatusCodes.OK).json({ msg: `section has been deleted!` });
};

module.exports = {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
};
