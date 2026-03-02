import nodemailerConfig from './nodemailerConfig.js'
import nodemailer from 'nodemailer'

export const sendEmail = async ({ to, subject, html }) => {
  let transporter = nodemailer.createTransport(nodemailerConfig)

  transporter.sendMail({
    from: 'Bojan <bojan@example.com>',
    to,
    subject,
    html,
  })
}
