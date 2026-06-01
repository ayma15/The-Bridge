module.exports = {
  // SMTP Configuration
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'your-email@example.com',
      pass: process.env.SMTP_PASS || 'your-email-password',
    },
  },
  
  // Email defaults
  defaults: {
    from: `"${process.env.SMTP_FROM_NAME || 'The Bridge'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@example.com'}>`,
  },
  
  // Email templates configuration
  templates: {
    verification: {
      subject: 'Verify Your Email Address',
      template: 'verify-email',
      expiresIn: '24h', // Token expiration time
    },
    resetPassword: {
      subject: 'Reset Your Password',
      template: 'reset-password',
      expiresIn: '1h', // Token expiration time
    },
  },
  
  // Frontend URLs (for email links)
  urls: {
    verifyEmail: `${process.env.FRONTEND_URL}/auth/verify-email`,
    resetPassword: `${process.env.FRONTEND_URL}/auth/reset-password`,
  },
};
