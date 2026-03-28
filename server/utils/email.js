const nodemailer = require("nodemailer");

const sendVerificationEmail = async (user, token, verifyUrl) => {
  
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  requireTLS: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // MUST BE APP PASSWORD
  },
});

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Verify your RIT Canteen account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #f97316; text-align: center;">Welcome to RIT Canteen!</h2>
        <p>Hi <strong>${user.name}</strong> (ID: ${user.collegeId}),</p>
        <p>Thank you for signing up for RIT Canteen. Please verify your email address to activate your account and start ordering.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Verify My Email</a>
        </div>
        <p style="color: #666; font-size: 14px;">If you didn't create this account, please ignore this email.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">Best regards,<br>The RIT Canteen Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
