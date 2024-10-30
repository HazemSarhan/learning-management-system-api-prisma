const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

const createCategory = async (req, res) => {
  const { name, description } = req.body;

  // cateogry validation
  if (!name) {
    throw new CustomError.BadRequestError('Category name is required!');
  }

  // category existing
  const isCategoryExist = await prisma.category.findFirst({
    where: {
      name,
    },
  });
  if (isCategoryExist) {
    throw new CustomError.BadRequestError(
      `Category with this name [${name}] is already exist!`
    );
  }

  // create a new category
  const category = await prisma.category.create({
    data: {
      name,
      description,
    },
  });

  res.status(StatusCodes.CREATED).json({ category });
};

const getAllCategories = async (req, res) => {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      created_at: true,
      updated_at: true,
      courses: {
        select: {
          id: true,
          title: true,
          price: true,
        },
      },
    },
  });
  res.status(StatusCodes.OK).json({ categories });
};

const getCategoryById = async (req, res) => {
  const { id: categoryId } = req.params;
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      created_at: true,
      updated_at: true,
      courses: {
        select: {
          id: true,
          title: true,
          price: true,
        },
      },
    },
  });
  res.status(StatusCodes.OK).json({ category });
};

const updateCategory = async (req, res) => {
  const { id: categoryId } = req.params;
  const { name, description } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (description) updateData.description = description;

  const category = await prisma.category.update({
    where: {
      id: categoryId,
    },
    data: updateData,
  });
  res.status(StatusCodes.OK).json({ category });
};

const deleteCategory = async (req, res) => {
  const { id: cateogryId } = req.params;
  const category = await prisma.category.delete({
    where: {
      id: cateogryId,
    },
  });
  res
    .status(StatusCodes.OK)
    .json({ msg: `category with id ${cateogryId} has been deleted ` });
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
