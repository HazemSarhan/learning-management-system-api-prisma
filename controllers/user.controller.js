const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const cloudinary = require('../configs/cloudinaryConfig');
const fs = require('fs');
const {
  createTokenUser,
  checkPermission,
  attachCookiesToResponse,
} = require('../utils');
const bcrypt = require('bcryptjs');

const getAllUsers = async (req, res) => {
  const users = await prisma.user.findMany();
  res.status(StatusCodes.OK).json({ users });
};

const getUserById = async (req, res) => {
  const { id: userId } = req.params;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      profile_picture: true,
      created_at: true,
      updated_at: true,
    },
  });
  if (!user) {
    throw new CustomError.BadRequestError(
      `No users found with this id ${userId}`
    );
  }
  res.status(StatusCodes.OK).json({ user });
};

const updateUser = async (req, res) => {
  const { userId } = req.user;
  const { name, email, bio } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  // update and upload image to cloud
  let profile_picture = user.profile_picture; // default value
  if (req.files && req.files.profile_picture) {
    const result = await cloudinary.uploader.upload(
      req.files.profile_picture.tempFilePath,
      {
        use_filename: true,
        folder: 'lms-images',
      }
    );
    fs.unlinkSync(req.files.profile_picture.tempFilePath);
    profile_picture = result.secure_url;
  }

  if (!name && !email && !bio && !profile_picture) {
    throw new CustomError.BadRequestError(
      'Please provide any changes to the data.'
    );
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (bio) updateData.bio = bio;
  if (profile_picture) updateData.profile_picture = profile_picture;

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      profile_picture: true,
      created_at: true,
      updated_at: true,
    },
  });
  const tokenUser = createTokenUser(updatedUser);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ updatedUser });
};

const updateUserPassword = async (req, res) => {
  const { userId } = req.user;
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError(
      'Please provide both [old & new] passwords'
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordCorrect) {
    throw new CustomError.BadRequestError('Old password is not correct');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const userUpdatePassword = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      profile_picture: true,
      created_at: true,
      updated_at: true,
    },
  });
  res.status(StatusCodes.OK).json({ msg: 'Password has been changed!' });
};

const changeUserRole = async (req, res) => {
  const { id: userId } = req.params;
  const { newRole } = req.body;

  if (req.user.role !== 'ADMIN') {
    throw new CustomError.UnauthorizedError(
      'Not authorized to change user roles'
    );
  }

  const updateUserRole = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role: newRole,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      updated_at: true,
    },
  });
  res.status(StatusCodes.OK).json({ updateUserRole });
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserPassword,
  changeUserRole,
};
