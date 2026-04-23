import { BadRequestError, UnauthenticatedError } from '../errors/errors.js'
import User from '../models/User.js'
import { StatusCodes } from 'http-status-codes'
import { hashPassword, validatePassword } from '../utils/passwordUtils.js'
import { clearAuthCookies } from '../utils/cookieUtils.js'
import crypto from 'crypto'
import { sendVerificationEmail } from '../utils/sendVerificationEmail.js'
import Token from '../models/Token.js'
import {
  attachCookiesToResponse,
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiresAt,
  REFRESH_TOKEN_COOKIE_NAME,
  validateUser,
} from '../utils/tokenUtils.js'

export const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
      throw new BadRequestError('Email is not found')
    }

    const isValidLogin = await validatePassword(
      req.body.password,
      user.password,
    )
    if (!isValidLogin) {
      throw new UnauthenticatedError('Invalid email or password')
    }

    if (!user.isVerified) {
      throw new UnauthenticatedError('Please verify your email')
    }

    const accessToken = createAccessToken(user)
    const refreshToken = createRefreshToken()
    const ip = req.ip
    const userAgent = req.headers['user-agent'] || 'unknown'
    const expiresAt = getRefreshTokenExpiresAt()

    await Token.deleteMany({
      user: user._id,
      expiresAt: { $lte: new Date() },
    })

    await Token.findOneAndUpdate(
      { user: user._id },
      {
        $set: {
          user: user._id,
          refreshToken,
          ip,
          userAgent,
          isValid: true,
          expiresAt,
        },
      },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true,
      },
    )

    attachCookiesToResponse({ res, user, accessToken, refreshToken })

    res.status(StatusCodes.OK).json({ msg: 'User logged in' })
  } catch (error) {
    console.log(error)
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
    res.status(statusCode).json({ msg: error.message })
  }
}

export const register = async (req, res) => {
  try {
    req.body.password = await hashPassword(req.body.password)
    req.body.role = (await User.countDocuments()) === 0 ? 'admin' : 'user'
    const verificationToken = crypto.randomBytes(40).toString('hex')
    req.body.verificationToken = verificationToken
    const user = await User.create(req.body)

    const origin = 'http://localhost:3000'

    await sendVerificationEmail({
      name: user.name,
      email: user.email,
      verificationToken: user.verificationToken,
      origin,
    })

    res.status(StatusCodes.CREATED).json({
      msg: 'Account created, please verify email to proceed',
    })
  } catch (error) {
    console.log(error)
    throw new BadRequestError('Invalid credentials')
  }
}

export const refresh = async (req, res) => {
  const token = req.signedCookies.refreshToken

  if (!token) throw new UnauthenticatedError('Refresh token required')

  const payload = validateUser(token)

  const existingToken = await Token.findOne({
    user: payload.userId,
    refreshToken: payload.refreshToken,
    isValid: true,
    expiresAt: { $gt: new Date() },
  })

  if (!existingToken) throw new UnauthenticatedError('Invalid refresh token')

  const user = await User.findById(payload.userId)

  if (!user) throw new UnauthenticatedError('Invalid refresh token')

  const accessToken = createAccessToken(user)

  attachCookiesToResponse({
    res,
    user,
    accessToken,
    refreshToken: existingToken.refreshToken,
  })

  res.status(StatusCodes.OK).json({ msg: 'Token refreshed' })
}

export const logout = async (req, res) => {
  const token = req.signedCookies?.[REFRESH_TOKEN_COOKIE_NAME]

  if (token) {
    try {
      const payload = validateUser(token)

      await Token.findOneAndDelete({
        user: payload.userId,
        refreshToken: payload.refreshToken,
      })
    } catch (error) {
      console.log(error.message)
    }
  }

  clearAuthCookies(res)
  res.status(StatusCodes.OK).json({ success: true })
}

export const verifyEmail = async (req, res) => {
  const { token, email } = req.body
  const user = await User.findOne({ email })

  if (!user) throw new UnauthenticatedError('Verification failed')
  if (user.verificationToken !== token)
    throw new UnauthenticatedError('Verification failed')

  user.isVerified = true
  user.verificationToken = ''
  user.verified = Date.now()

  await user.save()

  res.status(StatusCodes.OK).json({ msg: 'Email verified' })
}
