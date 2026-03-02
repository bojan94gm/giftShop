import { sendEmail } from './sendEmail.js'

export const sendVerificationEmail = async ({
  name,
  email,
  verificationToken,
  origin,
}) => {
  const verifyLink = `${origin}/user/verify-email?token=${verificationToken}&email=${email}`

  const message = `Please click on following link to verify your email: <a href="${verifyLink}">Verify link<a/>`

  await sendEmail({
    to: email,
    subject: 'Email Confirmation',
    html: `<div><h4>Hello, ${name}</h4> 
   <p>${message}</p></div>`,
  })
}
