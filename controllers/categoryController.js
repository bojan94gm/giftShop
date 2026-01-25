import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError } from '../errors/errors.js'
import Category from '../models/Category.js'

export const createCategory = async (req, res) => {
  req.body.slug = req.body.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')

  try {
    const newCategory = await Category.create(req.body)
    res
      .status(StatusCodes.CREATED)
      .json({ msg: 'Category created', newCategory })
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({})
    res.status(StatusCodes.OK).json({ categories })
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    res.status(StatusCodes.OK).json({ category })
  } catch (error) {
    console.log(error)
    throw new NotFoundError('Category is not found')
  }
}

export const updateCategory = async (req, res) => {
  req.body.slug = req.body.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')

  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    })
    res.status(StatusCodes.OK).json({ category })
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    res.status(StatusCodes.OK).json({ msg: 'Category is deleted', category })
  } catch (error) {
    console.log(error)
    throw error
  }
}
