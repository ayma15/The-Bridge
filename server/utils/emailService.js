const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const ejs = require('ejs');
const { logInfo, logError } = require('./logger');

class EmailService {
  constructor() {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logInfo('Email service disabled - SMTP not configured');
      this.disabled = true;
      return;
    }

    this.disabled = false;
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        logError('SMTP connection error:', error);
        this.disabled = true;
      } else {
        logInfo('SMTP server is ready to take our messages');
      }
    });
  }

  async sendEmail(to, subject, templateName, data = {}) {
    try {
      if (this.disabled) {
        logInfo('Email service disabled - skipping email send');
        return { messageId: 'disabled' };
      }

      if (!to || !subject || !templateName) {
        throw new Error('Missing required parameters for sending email');
      }

      // Read the email template
      const templatePath = path.join(__dirname, `../templates/emails/${templateName}.ejs`);
      
      try {
        await fs.access(templatePath);
      } catch (error) {
        throw new Error(`Email template not found: ${templatePath}`);
      }
      
      const template = await fs.readFile(templatePath, 'utf8');
      
      // Render the template with the provided data
      const html = ejs.render(template, {
        ...data,
        appName: 'The Bridge',
        year: new Date().getFullYear(),
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      });

      // Prepare email options
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'The Bridge'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject: subject || 'Notification from The Bridge',
        html,
      };

      // Send the email with timeout
      const sendMailPromise = this.transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email sending timeout')), 10000)
      );

      const info = await Promise.race([sendMailPromise, timeoutPromise]);
      
      logInfo(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      const errorMsg = `Failed to send email to ${to}: ${error.message}`;
      logError(errorMsg, { error });
      throw new Error('Failed to send email. Please try again later.');
    }
  }

  async sendVerificationEmail(user, token) {
    try {
      if (this.disabled) {
        logInfo('Email service disabled - skipping verification email');
        return { messageId: 'disabled' };
      }

      if (!user || !user.email || !token) {
        throw new Error('Invalid user or token for verification email');
      }

      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
      const name = user.username || user.name || 'User';
      
      return await this.sendEmail(
        user.email,
        'Verify Your Email - The Bridge',
        'verify-email',
        {
          name,
          verificationUrl,
          user: {
            ...user,
            name: name
          }
        }
      );
    } catch (error) {
      logError('Error in sendVerificationEmail:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(user, token) {
    try {
      if (this.disabled) {
        logInfo('Email service disabled - skipping password reset email');
        return { messageId: 'disabled' };
      }

      if (!user || !user.email || !token) {
        throw new Error('Invalid user or token for password reset email');
      }

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      const name = user.username || user.name || 'User';
      
      return await this.sendEmail(
        user.email,
        'Reset Your Password - The Bridge',
        'reset-password',
        {
          name,
          resetUrl,
          user: {
            ...user,
            name: name
          }
        }
      );
    } catch (error) {
      logError('Error in sendPasswordResetEmail:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
