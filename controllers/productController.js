import { StatusCodes } from 'http-status-codes'
import Product from '../models/Product.js'
import { BadRequestError } from '../errors/errors.js'

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body)
    res.status(StatusCodes.CREATED).json({ product })
  } catch (error) {
    console.log(error)
    throw new BadRequestError('Product is not created')
  }
}

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({})
    res.status(StatusCodes.OK).json({ products })
  } catch (error) {
    throw new BadRequestError('Fetching products have failed')
  }
}

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    res.status(StatusCodes.OK).json({ product })
  } catch (error) {
    throw new BadRequestError(`Product with id${req.params} is not found`)
  }
}

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    })
    res.status(StatusCodes.OK).json({ product })
  } catch (error) {
    throw new BadRequestError(`Updating product has failed`)
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    res.status(StatusCodes.OK).json({ product })
  } catch (error) {
    throw new BadRequestError(
      `Removing product with id${req.params} has failed`,
    )
  }
}
