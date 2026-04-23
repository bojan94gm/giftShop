import assert from 'node:assert/strict'
import test, { afterEach, beforeEach, mock } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

import { login, logout, refresh } from '../controllers/authController.js'
import Token from '../models/Token.js'
import User from '../models/User.js'
import { hashPassword } from '../utils/passwordUtils.js'
import {
  ACCESS_TOKEN_COOKIE_NAME,
  createRefreshTokenJWT,
  REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../utils/tokenUtils.js'

const TEST_JWT_SECRET = 'test-secret-with-enough-entropy-for-auth-tests'
const TEST_PASSWORD = 'ValidPass1!'

const createResponse = () => {
  const response = {
    body: undefined,
    cookies: [],
    statusCode: undefined,
    cookie(name, value, options) {
      this.cookies.push({ name, value, options })
      return this
    },
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

const createVerifiedUser = async () => {
  const userId = new mongoose.Types.ObjectId()

  return {
    _id: userId,
    email: 'qa@example.com',
    isVerified: true,
    name: 'QA User',
    password: await hashPassword(TEST_PASSWORD),
    role: 'user',
  }
}

const createLoginRequest = (email = 'qa@example.com') => ({
  body: {
    email,
    password: TEST_PASSWORD,
  },
  headers: {
    'user-agent': 'node-test-agent',
  },
  ip: '127.0.0.1',
})

const createCookieRequest = (refreshTokenCookie) => ({
  signedCookies: {
    [REFRESH_TOKEN_COOKIE_NAME]: refreshTokenCookie,
  },
})

const assertAuthCookiesWereCleared = (response) => {
  const clearedCookieNames = response.cookies.map((cookie) => cookie.name)

  assert.deepEqual(clearedCookieNames.sort(), [
    ACCESS_TOKEN_COOKIE_NAME,
    REFRESH_TOKEN_COOKIE_NAME,
  ])

  response.cookies.forEach((cookie) => {
    assert.equal(cookie.value, '')
    assert.equal(cookie.options.httpOnly, true)
    assert.equal(cookie.options.maxAge, 0)
    assert.equal(cookie.options.path, '/')
    assert.equal(cookie.options.sameSite, 'lax')
    assert.equal(cookie.options.secure, false)
    assert.ok(cookie.options.expires <= new Date())
    assert.equal(cookie.options.signed, undefined)
  })
}

beforeEach(() => {
  process.env.JWT_SECRET = TEST_JWT_SECRET
  process.env.JWT_LIFETIME = '1h'
  process.env.NODE_ENV = 'test'
})

afterEach(async () => {
  mock.timers.reset()
  mock.restoreAll()

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
})

test('login returns 200 and sets access and refresh cookies after Token upsert', async () => {
  const user = await createVerifiedUser()
  let upsertFilter
  let upsertUpdate
  let upsertOptions

  mock.method(User, 'findOne', async () => user)
  mock.method(Token, 'deleteMany', async () => ({ deletedCount: 0 }))
  mock.method(Token, 'findOneAndUpdate', async (filter, update, options) => {
    upsertFilter = filter
    upsertUpdate = update
    upsertOptions = options

    return {
      ...update.$set,
      _id: new mongoose.Types.ObjectId(),
    }
  })
  mock.method(Token, 'create', async () => {
    throw new Error('Token.create must not be used for login upsert')
  })

  const response = createResponse()

  await login(createLoginRequest(), response)

  const accessCookie = response.cookies.find(
    (cookie) => cookie.name === ACCESS_TOKEN_COOKIE_NAME,
  )
  const refreshCookie = response.cookies.find(
    (cookie) => cookie.name === REFRESH_TOKEN_COOKIE_NAME,
  )

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.msg, 'User logged in')
  assert.ok(accessCookie)
  assert.ok(refreshCookie)
  assert.equal(upsertFilter.user, user._id)
  assert.equal(upsertUpdate.$set.user, user._id)
  assert.equal(upsertOptions.upsert, true)
  assert.equal(upsertOptions.runValidators, true)
  assert.equal(upsertOptions.setDefaultsOnInsert, true)

  const refreshPayload = jwt.verify(refreshCookie.value, TEST_JWT_SECRET)
  assert.equal(refreshPayload.userId, String(user._id))
  assert.equal(refreshPayload.refreshToken, upsertUpdate.$set.refreshToken)
})

test('second login for same user uses upsert and does not create duplicate token documents', async () => {
  const user = await createVerifiedUser()
  const upsertFilters = []

  mock.method(User, 'findOne', async () => user)
  mock.method(Token, 'deleteMany', async () => ({ deletedCount: 0 }))
  const upsertMock = mock.method(
    Token,
    'findOneAndUpdate',
    async (filter, update) => {
      upsertFilters.push(filter)

      return {
        ...update.$set,
        _id: new mongoose.Types.ObjectId(),
      }
    },
  )
  const createMock = mock.method(Token, 'create', async () => {
    throw new Error('Token.create must not be used for login upsert')
  })

  await login(createLoginRequest(), createResponse())
  await login(createLoginRequest(), createResponse())

  assert.equal(upsertMock.mock.callCount(), 2)
  assert.equal(createMock.mock.callCount(), 0)
  assert.deepEqual(
    upsertFilters.map((filter) => String(filter.user)),
    [String(user._id), String(user._id)],
  )
})

test('login prunes expired user tokens using the current clock and Token has TTL index', async () => {
  const now = new Date('2026-01-01T00:00:00.000Z')
  mock.timers.enable({ apis: ['Date'], now })

  const user = await createVerifiedUser()
  let pruneFilter
  let expiresAt

  mock.method(User, 'findOne', async () => user)
  mock.method(Token, 'deleteMany', async (filter) => {
    pruneFilter = filter
    return { deletedCount: 1 }
  })
  mock.method(Token, 'findOneAndUpdate', async (filter, update) => {
    expiresAt = update.$set.expiresAt

    return {
      ...update.$set,
      _id: new mongoose.Types.ObjectId(),
    }
  })

  await login(createLoginRequest(), createResponse())

  assert.equal(String(pruneFilter.user), String(user._id))
  assert.equal(pruneFilter.expiresAt.$lte.toISOString(), now.toISOString())
  assert.equal(
    expiresAt.toISOString(),
    new Date(now.getTime() + REFRESH_TOKEN_COOKIE_MAX_AGE_MS).toISOString(),
  )

  const hasTtlIndex = Token.schema.indexes().some(([fields, options]) => {
    return fields.expiresAt === 1 && options.expireAfterSeconds === 0
  })

  assert.equal(hasTtlIndex, true)
})

test('manual auth flow contract: login, refresh, logout, then refresh is rejected', async () => {
  const user = await createVerifiedUser()
  let persistedRefreshToken
  let tokenDeleted = false

  mock.method(User, 'findOne', async () => user)
  mock.method(User, 'findById', async () => user)
  mock.method(Token, 'deleteMany', async () => ({ deletedCount: 0 }))
  mock.method(Token, 'findOneAndUpdate', async (filter, update) => {
    persistedRefreshToken = update.$set.refreshToken

    return {
      ...update.$set,
      _id: new mongoose.Types.ObjectId(),
    }
  })
  mock.method(Token, 'findOne', async () => {
    if (tokenDeleted) return null

    return {
      refreshToken: persistedRefreshToken,
      user: user._id,
    }
  })
  mock.method(Token, 'findOneAndDelete', async () => {
    tokenDeleted = true
    return { deletedCount: 1 }
  })

  const loginResponse = createResponse()

  await login(createLoginRequest(), loginResponse)

  const refreshCookie = loginResponse.cookies.find(
    (cookie) => cookie.name === REFRESH_TOKEN_COOKIE_NAME,
  )
  const refreshRequest = createCookieRequest(refreshCookie.value)
  const refreshResponse = createResponse()

  await refresh(refreshRequest, refreshResponse)

  assert.equal(refreshResponse.statusCode, 200)
  assert.equal(refreshResponse.body.msg, 'Token refreshed')

  const logoutResponse = createResponse()

  await logout(refreshRequest, logoutResponse)

  assert.equal(logoutResponse.statusCode, 200)
  assert.deepEqual(logoutResponse.body, { success: true })
  assertAuthCookiesWereCleared(logoutResponse)

  await assert.rejects(
    () => refresh(refreshRequest, createResponse()),
    (error) => error.statusCode === 401,
  )
})

test('logout without session is idempotent and clears both cookies without values', async () => {
  const deleteMock = mock.method(Token, 'findOneAndDelete', async () => {
    throw new Error('Token deletion must not run without a refresh token')
  })
  const response = createResponse()

  await logout({ signedCookies: {} }, response)

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.body, { success: true })
  assert.equal(deleteMock.mock.callCount(), 0)
  assertAuthCookiesWereCleared(response)
})

test('logout with session deletes persisted refresh token and expires both cookies', async () => {
  const user = await createVerifiedUser()
  const persistedRefreshToken = 'persisted-refresh-token'
  const refreshTokenCookie = createRefreshTokenJWT({
    user,
    refreshToken: persistedRefreshToken,
  })
  let deleteFilter

  const deleteMock = mock.method(Token, 'findOneAndDelete', async (filter) => {
    deleteFilter = filter
    return {
      refreshToken: persistedRefreshToken,
      user: user._id,
    }
  })

  const response = createResponse()

  await logout(createCookieRequest(refreshTokenCookie), response)

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.body, { success: true })
  assert.equal(deleteMock.mock.callCount(), 1)
  assert.equal(String(deleteFilter.user), String(user._id))
  assert.equal(deleteFilter.refreshToken, persistedRefreshToken)
  assertAuthCookiesWereCleared(response)
})

test(
  'integration: login persists one Token document for the user when TEST_MONGO_URI is set',
  { skip: !process.env.TEST_MONGO_URI },
  async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI)
    await mongoose.connection.dropDatabase()

    const user = await User.create({
      email: 'mongo-login@example.com',
      isVerified: true,
      name: 'Mongo Login',
      password: await hashPassword(TEST_PASSWORD),
      role: 'user',
    })

    const firstResponse = createResponse()
    const secondResponse = createResponse()

    await login(createLoginRequest(user.email), firstResponse)
    await login(createLoginRequest(user.email), secondResponse)

    const tokenDocuments = await Token.find({ user: user._id }).lean()

    assert.equal(firstResponse.statusCode, 200)
    assert.equal(secondResponse.statusCode, 200)
    assert.equal(tokenDocuments.length, 1)
    assert.equal(String(tokenDocuments[0].user), String(user._id))
  },
)

test(
  'integration: logout deletes Token document when TEST_MONGO_URI is set',
  { skip: !process.env.TEST_MONGO_URI },
  async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI)
    await mongoose.connection.dropDatabase()

    const user = await User.create({
      email: 'mongo-logout@example.com',
      isVerified: true,
      name: 'Mongo Logout',
      password: await hashPassword(TEST_PASSWORD),
      role: 'user',
    })
    const persistedRefreshToken = 'mongo-refresh-token'

    await Token.create({
      user: user._id,
      refreshToken: persistedRefreshToken,
      ip: '127.0.0.1',
      userAgent: 'node-test-agent',
    })

    const response = createResponse()
    const refreshTokenCookie = createRefreshTokenJWT({
      user,
      refreshToken: persistedRefreshToken,
    })

    await logout(createCookieRequest(refreshTokenCookie), response)

    const tokenCount = await Token.countDocuments({ user: user._id })

    assert.equal(response.statusCode, 200)
    assert.equal(tokenCount, 0)
    assertAuthCookiesWereCleared(response)
  },
)
