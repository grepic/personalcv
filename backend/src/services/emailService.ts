import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';

    if (emailProvider === 'smtp') {
      // SMTP configuration (for services like SendGrid, Mailgun, etc.)
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else if (emailProvider === 'dev') {
      // Development mode - use ethereal.email for testing
      this.createTestAccount();
    }
  }

  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('📧 Email service initialized with test account');
      console.log('Preview URLs will be logged to console');
    } catch (error) {
      console.error('Failed to create test email account:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email transporter not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"NetworkHub" <noreply@networkhub.cz>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Log preview URL for ethereal.email
      if (process.env.EMAIL_PROVIDER === 'dev') {
        console.log('📧 Email sent: %s', info.messageId);
        console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Email templates
  async sendWelcomeEmail(to: string, displayName: string) {
    return this.sendEmail({
      to,
      subject: 'Welcome to NetworkHub!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">Welcome to NetworkHub, ${displayName}!</h1>
          <p>Thank you for joining our professional networking platform.</p>
          <p>Get started by:</p>
          <ul>
            <li>Completing your profile</li>
            <li>Connecting with professionals</li>
            <li>Exploring job opportunities</li>
          </ul>
          <p>Best regards,<br>The NetworkHub Team</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    return this.sendEmail({
      to,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">Password Reset Request</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The NetworkHub Team</p>
        </div>
      `,
    });
  }

  async sendConnectionRequestEmail(to: string, requesterName: string) {
    return this.sendEmail({
      to,
      subject: `${requesterName} wants to connect with you`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">New Connection Request</h1>
          <p><strong>${requesterName}</strong> wants to connect with you on NetworkHub.</p>
          <p style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/network" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Request
            </a>
          </p>
          <p>Best regards,<br>The NetworkHub Team</p>
        </div>
      `,
    });
  }

  async sendApplicationReceivedEmail(to: string, jobTitle: string, candidateName: string) {
    return this.sendEmail({
      to,
      subject: `New application for ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">New Job Application</h1>
          <p><strong>${candidateName}</strong> has applied for your job posting: <strong>${jobTitle}</strong></p>
          <p style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/company/jobs" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Application
            </a>
          </p>
          <p>Best regards,<br>The NetworkHub Team</p>
        </div>
      `,
    });
  }

  async sendApplicationStatusEmail(
    to: string,
    jobTitle: string,
    status: string
  ) {
    const statusMessages = {
      VIEWED: 'has been viewed by the employer',
      INTERVIEW: 'has been shortlisted for an interview',
      REJECTED: 'was not successful this time',
      HIRED: 'was successful! Congratulations!',
    };

    return this.sendEmail({
      to,
      subject: `Application update: ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">Application Status Update</h1>
          <p>Your application for <strong>${jobTitle}</strong> ${statusMessages[status as keyof typeof statusMessages] || 'has been updated'}.</p>
          ${
            status === 'HIRED'
              ? '<p style="color: #10B981; font-size: 18px; font-weight: bold;">🎉 Congratulations on your new role!</p>'
              : ''
          }
          <p style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/jobs" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Jobs
            </a>
          </p>
          <p>Best regards,<br>The NetworkHub Team</p>
        </div>
      `,
    });
  }

  async sendEmailVerification(to: string, verificationToken: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    return this.sendEmail({
      to,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3B82F6;">Verify Your Email</h1>
          <p>Please verify your email address to complete your registration:</p>
          <p style="margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>The NetworkHub Team</p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
