const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { attachCookiesToResponse, createTokenUser } = require('../utils');
const cloudinary = require('../configs/cloudinaryConfig');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
  const { name, email, password, bio } = req.body;
  if (!name || !email || !password) {
    throw new CustomError.BadRequestError(
      'Please provide all required fields!'
    );
  }

  // check if the email already registered
  const isEmailExist = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (isEmailExist) {
    throw new CustomError.BadRequestError('Email is already registered!');
  }

  // set the first registered user as admin
  const isFirstAccount = await prisma.user.count();
  const role = isFirstAccount === 0 ? 'ADMIN' : 'STUDENT';

  // hashing password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // uploading image to the cloud
  let profile_picture = '/uploads/default.jpeg'; // default value
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

  const user = await prisma.user.create({
    data: {
      name: name,
      email: email,
      password: hashedPassword,
      bio: bio,
      role: role,
      profile_picture: profile_picture,
    },
  });

  // generate a token for user
  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.CREATED).json({ tokenUser });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError.BadRequestError(
      'Please provide all required fields!'
    );
  }

  // check if the email is exist
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!user) {
    throw new CustomError.UnauthenticatedError('Invalid credentials');
  }

  // comparing passwords
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid credentials');
  }

  // generate a token
  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now() + 1 * 1000),
  });
  res
    .status(StatusCodes.OK)
    .json({ msg: `User has been logged out successfully!` });
};

module.exports = {
  register,
  login,
  logout,
};
