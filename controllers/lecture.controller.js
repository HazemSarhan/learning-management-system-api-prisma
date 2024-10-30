const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const cloudinary = require('../configs/cloudinaryConfig');
const fs = require('fs');

const createLecture = async (req, res) => {
  const { title, sectionId } = req.body;
  if (!title || !sectionId) {
    throw new CustomError.BadRequestError(
      'Please provide all required fields!'
    );
  }

  // section availablity check
  const sectionAvailablity = await prisma.section.findUnique({
    where: { id: sectionId },
  });
  if (!sectionAvailablity) {
    throw new CustomError.NotFoundError(
      `No section found with id ${sectionId}`
    );
  }

  // lecture content
  let content = [];
  let type = 'text';

  if (req.files && req.files.content) {
    const files = Array.isArray(req.files.content)
      ? req.files.content
      : [req.files.content];
    for (const file of files) {
      const fileFormat = file.mimetype;

      if (fileFormat.startsWith('image')) {
        type = 'image';
      } else if (fileFormat.startsWith('video')) {
        type = 'video';
      } else if (fileFormat === 'application/pdf') {
        type = 'pdf';
      }

      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        use_filename: true,
        folder: 'lms-content',
        resource_type: type === 'video' ? 'video' : 'auto',
      });
      fs.unlinkSync(file.tempFilePath);
      content.push(result.secure_url);
    }
  } else {
    content.push('/uploads/course-content.mp4'); // Default URL
  }

  const lecture = await prisma.lecture.create({
    data: {
      title: title,
      sectionId: sectionId,
      content: content,
      type: type,
    },
  });

  res.status(StatusCodes.CREATED).json({ lecture });
};

const getAllLectures = async (req, res) => {
  const lectures = await prisma.lecture.findMany({
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      section: { select: { id: true, title: true } },
      created_at: true,
      updated_at: true,
    },
  });
  res.status(StatusCodes.OK).json({ lectures });
};

const getLectureById = async (req, res) => {
  const { id: lectureId } = req.params;
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      section: { select: { id: true, title: true } },
      created_at: true,
      updated_at: true,
    },
  });
  if (!lecture) {
    throw new CustomError.NotFoundError(
      `no lectures found with id ${lectureId}`
    );
  }
  res.status(StatusCodes.OK).json({ lecture });
};

const updateLecture = async (req, res) => {
  const { id: lectureId } = req.params;
  const { title, sectionId } = req.body;

  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
  });
  if (!lecture) {
    throw new CustomError.NotFoundError(
      `No lecture found with this id ${lectureId}`
    );
  }

  if (sectionId) {
    const sectionExists = await prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!sectionExists) {
      throw new CustomError.NotFoundError(
        `No section found with this id ${sectionId}`
      );
    }
  }

  let content = lecture.content;
  let type = lecture.type;

  if (req.files && req.files.content) {
    content = [];
    const files = Array.isArray(req.files.content)
      ? req.files.content
      : [req.files.content];
    for (const file of files) {
      const fileFormat = file.mimetype;

      if (fileFormat.startsWith('image')) {
        type = 'image';
      } else if (fileFormat.startsWith('video')) {
        type = 'video';
      } else if (fileFormat === 'application/pdf') {
        type = 'pdf';
      }

      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        use_filename: true,
        folder: 'lms-content',
        resource_type: type === 'video' ? 'video' : 'auto',
      });
      fs.unlinkSync(file.tempFilePath);
      content.push(result.secure_url);
    }
  }

  const updateData = {};
  if (title) updateData.title = title;
  if (sectionId) updateData.sectionId = sectionId;
  updateData.content = content;
  updateData.type = type;

  const updatedLecture = await prisma.lecture.update({
    where: { id: lectureId },
    data: updateData,
    select: {
      id: true,
      title: true,
      sectionId: true,
      content: true,
      type: true,
    },
  });

  res
    .status(StatusCodes.OK)
    .json({ msg: 'Lecture updated successfully!', lecture: updatedLecture });
};

const deleteLecture = async (req, res) => {
  const { id: lectureId } = req.params;

  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
  });
  if (!lecture) {
    throw new CustomError.NotFoundError(
      `No lecture found with this id ${lectureId}`
    );
  }
  await prisma.lecture.delete({
    where: { id: lectureId },
  });

  res.status(StatusCodes.OK).json({ msg: 'Lecture deleted successfully!' });
};

module.exports = {
  createLecture,
  getAllLectures,
  getLectureById,
  updateLecture,
  deleteLecture,
};
