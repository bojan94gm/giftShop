import jwt from 'jsonwebtoken'

export const createJWT = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  })
  return token
}

export const validateUser = (token) => {
  const user = jwt.verify(token, process.env.JWT_SECRET)
  return user
}
