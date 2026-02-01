import { StatusCodes } from 'http-status-codes'
import { BadRequestError, UnauthenticatedError } from '../errors/errors.js'
import Order from '../models/Order.js'
import { getOrderInfo } from '../utils/orderUtils.js'

export const createOrder = async (req, res) => {
  const { customer, paymentMethod } = req.body

  if (!customer || !paymentMethod) {
    throw new BadRequestError('Custom info and payment method required')
  }

  try {
    const orderInfo = await getOrderInfo(
      req.user.userId,
      paymentMethod,
      customer,
    )
    const order = await Order.create(orderInfo)
    res.status(StatusCodes.CREATED).json({ order })
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    res.status(StatusCodes.CREATED).json({ order })
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const updateOrder = (req, res) => {}

export const deleteOrder = (req, res) => {}
