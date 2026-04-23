import assert from 'node:assert/strict'
import test, { afterEach, mock } from 'node:test'
import mongoose from 'mongoose'

import {
  getAllOrders,
  getOrder,
  resetOrderStatus,
  updateOrder,
} from '../../controllers/orderController.js'
import { authorizationMiddleware } from '../../middlewares/authorizationMiddleware.js'
import Order from '../../models/Order.js'
import Product from '../../models/Product.js'
import orderRouter from '../../routes/orderRoutes.js'

const createResponse = () => {
  const response = {
    body: undefined,
    statusCode: undefined,
    json(payload) {
      this.body = payload
      return this
    },
    status(statusCode) {
      this.statusCode = statusCode
      return this
    },
  }

  return response
}

const createSession = () => ({
  abortTransaction: mock.fn(async () => {}),
  commitTransaction: mock.fn(async () => {}),
  endSession: mock.fn(async () => {}),
  startTransaction: mock.fn(async () => {}),
})

const getRouteMethodStack = (path, method) => {
  const layer = orderRouter.stack.find((item) => {
    return item.route?.path === path && item.route.methods[method]
  })

  if (!layer) return []

  return layer.route.stack.filter((item) => item.method === method)
}

const assertRouteUsesAdminAuthorization = (path, method) => {
  const methodStack = getRouteMethodStack(path, method)

  assert.ok(
    methodStack.some((item) => item.handle === authorizationMiddleware),
    `${method.toUpperCase()} ${path} must use authorizationMiddleware`,
  )
}

const assertUserIsForbiddenByAdminMiddleware = () => {
  let capturedError

  try {
    authorizationMiddleware({ user: { role: 'user' } }, {}, (error) => {
      capturedError = error
    })
  } catch (error) {
    capturedError = error
  }

  assert.equal(capturedError.statusCode, 403)
}

const assertAdminPassesAdminMiddleware = () => {
  let nextCalled = false

  authorizationMiddleware({ user: { role: 'admin' } }, {}, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, true)
}

afterEach(() => {
  mock.restoreAll()
})

test('regression B-004: user GET /orders -> 403', () => {
  assertRouteUsesAdminAuthorization('/', 'get')
  assertUserIsForbiddenByAdminMiddleware()
})

test('regression B-004: admin GET /orders -> 200', async () => {
  const adminOrder = { _id: new mongoose.Types.ObjectId() }

  assertRouteUsesAdminAuthorization('/', 'get')
  assertAdminPassesAdminMiddleware()
  mock.method(Order, 'find', async () => [adminOrder])

  const response = createResponse()

  await getAllOrders({ user: { role: 'admin' } }, response)

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.body.orders, [adminOrder])
})

test('regression B-004: user GET /orders/:id tudje -> 403 or 404', async () => {
  const ownerId = new mongoose.Types.ObjectId()
  const otherUserId = new mongoose.Types.ObjectId()
  const orderId = new mongoose.Types.ObjectId()

  mock.method(Order, 'findById', async () => ({
    _id: orderId,
    userId: ownerId,
  }))

  await assert.rejects(
    () =>
      getOrder(
        {
          params: { id: orderId.toString() },
          user: { role: 'user', userId: otherUserId.toString() },
        },
        createResponse(),
      ),
    (error) => error.statusCode === 403 || error.statusCode === 404,
  )
})

test('regression B-005: GET /orders/:id vlastito -> 200 (ne 201)', async () => {
  const userId = new mongoose.Types.ObjectId()
  const orderId = new mongoose.Types.ObjectId()
  const order = {
    _id: orderId,
    userId,
  }

  mock.method(Order, 'findById', async () => order)

  const response = createResponse()

  await getOrder(
    {
      params: { id: orderId.toString() },
      user: { role: 'user', userId: userId.toString() },
    },
    response,
  )

  assert.equal(response.statusCode, 200)
  assert.notEqual(response.statusCode, 201)
  assert.deepEqual(response.body.order, order)
})

test('admin PUT /orders/:id -> 200', async () => {
  const orderId = new mongoose.Types.ObjectId()
  const session = createSession()
  const updatedOrder = {
    _id: orderId,
    products: [{ productId: new mongoose.Types.ObjectId(), quantity: 1 }],
    status: 'confirmed',
  }

  assertRouteUsesAdminAuthorization('/:id', 'put')
  assertAdminPassesAdminMiddleware()
  mock.method(mongoose, 'startSession', async () => session)
  mock.method(Order, 'findOneAndUpdate', async () => updatedOrder)
  mock.method(Product, 'bulkWrite', async () => ({ matchedCount: 1 }))

  const response = createResponse()

  await updateOrder(
    {
      body: { status: 'confirmed' },
      params: { id: orderId.toString() },
      user: { role: 'admin' },
    },
    response,
  )

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.updatedOrder, updatedOrder)
})

test('user PUT /orders/:id -> 403', () => {
  assertRouteUsesAdminAuthorization('/:id', 'put')
  assertUserIsForbiddenByAdminMiddleware()
})

test('admin PATCH /orders/:id/reset -> 200', async () => {
  const orderId = new mongoose.Types.ObjectId()
  const session = createSession()
  const order = {
    _id: orderId,
    products: [],
    status: 'pending',
  }

  assertRouteUsesAdminAuthorization('/:id/reset', 'patch')
  assertAdminPassesAdminMiddleware()
  mock.method(mongoose, 'startSession', async () => session)
  mock.method(Order, 'findByIdAndUpdate', async () => order)

  const response = createResponse()

  await resetOrderStatus(
    {
      params: { id: orderId.toString() },
      user: { role: 'admin' },
    },
    response,
  )

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.body.order, order)
})

test('user PATCH /orders/:id/reset -> 403', () => {
  assertRouteUsesAdminAuthorization('/:id/reset', 'patch')
  assertUserIsForbiddenByAdminMiddleware()
})
