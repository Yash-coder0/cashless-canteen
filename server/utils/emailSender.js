// server/utils/emailSender.js
const brevoApiKey = process.env.BREVO_API_KEY;
const senderEmail = "ypjagatap5427@gmail.com";
const senderName = "RIT Canteen";

const sendVerificationEmail = async (toEmail, toName, token) => {
  const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${token}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
      <h2 style="color: #333;">Welcome to RIT Canteen!</h2>
      <p style="color: #555; font-size: 16px;">Hi ${toName},</p>
      <p style="color: #555; font-size: 16px;">Thank you for registering. Please confirm your email address by clicking the button below to activate your account.</p>
      <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; margin: 20px 0; background-color: #f97316; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Verify Email</a>
      <p style="color: #999; font-size: 14px;">This link operates directly via the Canteen service and will expire in 1 hour.</p>
      <p style="color: #999; font-size: 14px;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail
    },
    to: [
      {
        email: toEmail,
        name: toName
      }
    ],
    subject: "Verify Your RIT Canteen Account",
    htmlContent
  };

  if (!brevoApiKey) {
    throw new Error("BREVO_API_KEY environment variable is not configured.");
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Brevo Email Error:", errorData);
      throw new Error("Failed to send verification email via Brevo.");
    }
    
    return true;
  } catch (error) {
    console.error("Email Sending Failed:", error);
    throw error;
  }
};

module.exports = { sendVerificationEmail };
