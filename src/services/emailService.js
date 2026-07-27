const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'NutriScan <noreply@resend.dev>',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};

const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="background: #38A169; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">NutriScan</h1>
      </div>
      <div style="background: #f7fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #2d3748; text-align: center;">Password Reset OTP</h2>
        <p style="color: #4a5568; font-size: 16px;">Use the following OTP to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="background: #38A169; color: white; padding: 15px 30px; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px;">${otp}</span>
        </div>
        <p style="color: #718096; font-size: 14px; text-align: center;">This OTP expires in 10 minutes.</p>
        <p style="color: #718096; font-size: 14px; text-align: center;">If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject: 'NutriScan - Password Reset OTP', html });
};

module.exports = { sendEmail, sendOTPEmail };
