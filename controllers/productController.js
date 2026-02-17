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
  const queryObject = {}

  const { search, featured, tags, sort, minPrice, maxPrice } = req.query

  if (search) {
    queryObject.name = { $regex: search, $options: 'i' }
  }

  if (featured) {
    queryObject.featured = featured.toString()
  }

  if (tags) {
    const tagsList = tags.split(',')
    queryObject.tags = { $all: tagsList }
  }

  if (minPrice) {
    queryObject.price = { $gte: Number(minPrice) }
  }

  if (maxPrice) {
    queryObject.price = { $lte: Number(maxPrice) }
  }

  if (minPrice && maxPrice) {
    queryObject.price = {
      $gte: Number(minPrice),
      $lte: Number(maxPrice),
    }
  }

  const sortOptions = {
    newest: '-createdAt',
    oldest: 'createdAt',
    'a-z': 'name',
    'z-a': '-name',
  }

  const sortKey = sortOptions[sort] || sortOptions.newest

  try {
    const products = await Product.find(queryObject).sort(sortKey)
    res.status(StatusCodes.OK).json({ products, numOfHits: products.length })
  } catch (error) {
    throw new BadRequestError('Fetching products have failed')
  }
}

export const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product)
    throw new BadRequestError(`Product with id${req.params.id} is not found`)
  res.status(StatusCodes.OK).json({ product })
}

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    })
    res.status(StatusCodes.OK).json({ product })
  } catch (error) {
    console.log(error)
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
