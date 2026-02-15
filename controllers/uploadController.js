import { StatusCodes } from 'http-status-codes'
import path from 'path'
import { fileURLToPath } from 'url'
import { BadRequestError } from '../errors/errors.js'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uniqueImageName = crypto.randomBytes(16).toString('hex')
export const uploadImages = async (req, res) => {
  if (!req.files || !req.files.image) {
    throw new BadRequestError('File not uploaded')
  }

  const uploadedImage = req.files.image

  if (!uploadedImage.mimetype.startsWith('image'))
    throw new BadRequestError('Image file not uploaded')

  const maxSize = 1024 * 1024

  if (uploadedImage.size > maxSize)
    throw new BadRequestError('Image file is too large')

  const uploadDir = path.join(__dirname, '../public/uploads')
  const imagePath = path.join(
    uploadDir,
    `${uniqueImageName}-${uploadedImage.name}`,
  )

  await uploadedImage.mv(imagePath)

  res.status(StatusCodes.CREATED).json({
    image: { src: `/uploads/${uploadedImage.name}` },
  })
}
