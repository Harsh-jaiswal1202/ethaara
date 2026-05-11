const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  let transporter;

  // If SMTP config is provided in .env, use it. Otherwise, use Ethereal for testing.
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_PORT == 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Development fallback: Ethereal Email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const mailOptions = {
    from: `"Team Task Manager" <${process.env.EMAIL_FROM || 'noreply@taskmanager.com'}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);

  if (!process.env.EMAIL_HOST) {
    console.log('----------------------------------------------------');
    console.log('📧 Email Sent (Ethereal Preview URL):');
    console.log(nodemailer.getTestMessageUrl(info));
    console.log('----------------------------------------------------');
  }

  return info;
};

module.exports = sendEmail;
