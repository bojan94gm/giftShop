import { BadRequestError } from '../errors/errors.js'
import Cart from '../models/Cart.js'

export const calculateTotalCartPrice = async (cart) => {
  const populatedCart = await Cart.findById(cart._id).populate(
    'products.product',
  )

  const total = populatedCart.products.reduce((acc, item) => {
    return acc + item.product.price * item.quantity
  }, 0)
  return total
}
