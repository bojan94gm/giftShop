import { BadRequestError } from '../errors/errors.js'
import Product from '../models/Product.js'

export const validateAndCalculateCartData = async (cart) => {
  const ids = cart.products.map((item) => item.product)

  const products = await Product.find({ _id: { $in: ids } }).select(
    'name stock price reservedQuantity ',
  )

  if (products.length !== cart.products.length) {
    throw new Error('Cart is not valid')
  }

  let total = 0

  const productsMap = new Map()

  products.forEach((product) => {
    productsMap.set(product._id.toString(), product)
  })

  for (const cartItem of cart.products) {
    const product = productsMap.get(cartItem.product)

    const requestedQuantity = Number(cartItem.quantity)

    if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
      throw new BadRequestError(
        'Quantity is not valid value. Must be integer greater than 0',
      )
    }

    if (requestedQuantity > product.stock - product.reservedQuantity) {
      throw new Error(
        `Quantity of ${requestedQuantity} items of ${product.name} product is not available, current stock is: ${product.stock - product.reservedQuantity}`,
      )
    }

    total += product.price * requestedQuantity
  }

  cart.total = total
  return cart
}
