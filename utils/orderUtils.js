import Cart from '../models/Cart.js'

export const getOrderInfo = async (userId, paymentMethod, customer) => {
  const productsFromCart = await Cart.findOne({
    userId: userId,
  }).populate('products.product')

  const products = productsFromCart.products.map((item) => {
    return {
      productId: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
    }
  })

  const total = products.reduce((acc, item) => {
    return acc + item.quantity * item.price
  }, 0)

  return {
    products,
    total,
    paymentMethod,
    customer,
    userId,
  }
}

export const reserveQuantityOps = (products) => {
  console.log(products)
  const reserveOps = products.map((item) => ({
    updateOne: {
      filter: {
        _id: item.productId,
        $expr: {
          $gte: [
            '$stock',
            { $add: ['$reservedQuantity', Number(item.quantity)] },
          ],
        },
      },
      update: {
        $inc: { reservedQuantity: Number(item.quantity) },
      },
    },
  }))
  return reserveOps
}

export const reservedQuantityRollBack = (products) => {
  const rollBackOps = products.map((item) => ({
    updateOne: {
      filter: {
        _id: item.productId,
      },
      update: {
        $inc: { reservedQuantity: -Number(item.quantity) },
      },
    },
  }))

  return rollBackOps
}

export const decreaseStockQuantity = (products) => {
  const decreaseOps = products.map((item) => ({
    updateOne: {
      filter: {
        _id: item.productId,
      },
      update: {
        $inc: {
          reservedQuantity: -Number(item.quantity),
          stock: -Number(item.quantity),
        },
      },
    },
  }))

  return decreaseOps
}
