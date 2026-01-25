import { BadRequestError, UnauthenticatedError } from '../errors/errors.js'
import User from '../models/User.js'
import { StatusCodes } from 'http-status-codes'
import { hashPassword, validatePassword } from '../utils/passwordUtils.js'
import { createJWT } from '../utils/tokenUtils.js'
import { setCookie, clearCookie } from '../utils/cookieUtils.js'

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

    const token = createJWT({ userId: user._id, role: user.role })

    const day = 24 * 60 * 60 * 1000
    setCookie(res, token, day)

    res.status(StatusCodes.OK).json({ user, token })
    console.log('user logged in')
  } catch (error) {
    console.log(error)
    res.status(error.statusCode).json({ msg: error.message })
  }
}

export const register = async (req, res) => {
  try {
    req.body.password = await hashPassword(req.body.password)
    req.body.role = (await User.countDocuments()) === 0 ? 'admin' : 'user'
    const user = await User.create(req.body)
    res.status(StatusCodes.CREATED).json({ user: user })
  } catch (error) {
    console.log(error)
    throw new BadRequestError('Invalid credentials')
  }
}

export const logout = async (req, res) => {
  console.log({ msg: 'TOKEN BEFORE CLEAR:', token: req.cookies?.token })
  clearCookie(res)
  res.status(StatusCodes.OK).json({ msg: 'User is logged out' })
}
