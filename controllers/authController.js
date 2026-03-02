import { BadRequestError, UnauthenticatedError } from '../errors/errors.js'
import User from '../models/User.js'
import { StatusCodes } from 'http-status-codes'
import { hashPassword, validatePassword } from '../utils/passwordUtils.js'
import { createJWT } from '../utils/tokenUtils.js'
import { setCookie, clearCookie } from '../utils/cookieUtils.js'
import crypto from 'crypto'
import { sendVerificationEmail } from '../utils/sendVerificationEmail.js'

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

    const token = createJWT({ userId: user._id, role: user.role })

    const day = 24 * 60 * 60 * 1000
    setCookie(res, token, day)

    res.status(StatusCodes.OK).json({ user, token })
  } catch (error) {
    console.log(error)
    res.status(error.statusCode).json({ msg: error.message })
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

export const logout = async (req, res) => {
  clearCookie(res)
  res.status(StatusCodes.OK).json({ msg: 'User is logged out' })
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
