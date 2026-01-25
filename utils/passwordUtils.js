import bcrypt from 'bcryptjs'
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)
  return hashedPassword
}

export const validatePassword = async (password, hashedPassword) => {
  const isValid = await bcrypt.compare(password, hashedPassword)
  return isValid
}
