const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check if all required environment variables are present
    const requiredVars = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`Email service not configured. Missing environment variables: ${missingVars.join(', ')}`);
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true' || parseInt(process.env.EMAIL_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        // Additional options for better reliability
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 20000, // 20 seconds
        rateLimit: 5 // max 5 messages per rateDelta
      });
      
      this.isConfigured = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error.message);
    }
  }

  async testConnection() {
    if (!this.isConfigured || !this.transporter) {
      return { 
        success: false, 
        error: 'Email service not configured. Check environment variables.' 
      };
    }

    try {
      await this.transporter.verify();
      return { 
        success: true, 
        message: 'Email connection verified successfully',
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Connection verification failed: ${error.message}` 
      };
    }
  }

  async sendTestEmail(toEmail) {
    if (!this.isConfigured || !this.transporter) {
      return { 
        success: false, 
        error: 'Email service not configured' 
      };
    }

    if (!this.isValidEmail(toEmail)) {
      return { 
        success: false, 
        error: 'Invalid email address provided' 
      };
    }

    try {
      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: toEmail,
        subject: '🧪 MedSpaSync Pro - Email Test Successful!',
        html: this.generateTestEmailHTML(toEmail),
        text: this.generateTestEmailText(toEmail)
      });

      return { 
        success: true, 
        messageId: result.messageId,
        message: 'Test email sent successfully',
        sentTo: toEmail
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to send test email: ${error.message}` 
      };
    }
  }

  async sendEmail({ to, subject, html, text, cc, bcc, attachments }) {
    if (!this.isConfigured || !this.transporter) {
      throw new Error('Email service not configured');
    }

    if (!to || !subject) {
      throw new Error('Missing required fields: to and subject are required');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
      cc,
      bcc,
      attachments
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully'
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendWelcomeEmail(userEmail, userName) {
    const subject = 'Welcome to MedSpaSync Pro! 🎉';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #28a745; text-align: center;">Welcome to MedSpaSync Pro!</h1>
        <p>Hi ${userName || 'there'},</p>
        <p>Thank you for joining MedSpaSync Pro! We're excited to help you streamline your medical spa operations.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>🚀 Getting Started:</h3>
          <ul>
            <li>Complete your profile setup</li>
            <li>Configure your spa settings</li>
            <li>Invite your team members</li>
            <li>Start managing appointments</li>
          </ul>
        </div>
        
        <p>If you have any questions, don't hesitate to reach out to our support team.</p>
        <p>Best regards,<br>The MedSpaSync Pro Team</p>
      </div>
    `;
    
    const text = `Welcome to MedSpaSync Pro! Thank you for joining us, ${userName || 'there'}. We're excited to help you streamline your medical spa operations.`;
    
    return await this.sendEmail({ to: userEmail, subject, html, text });
  }

  async sendPaymentNotification(userEmail, paymentDetails) {
    const { amount, status, invoiceId } = paymentDetails;
    const subject = `Payment ${status} - Invoice #${invoiceId}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: ${status === 'success' ? '#28a745' : '#dc3545'};">
          Payment ${status === 'success' ? 'Successful' : 'Failed'}
        </h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <p><strong>Invoice ID:</strong> #${invoiceId}</p>
          <p><strong>Amount:</strong> $${amount}</p>
          <p><strong>Status:</strong> ${status}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `;
    
    return await this.sendEmail({ to: userEmail, subject, html });
  }

  generateTestEmailHTML(toEmail) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">✅ Email Service Working!</h2>
        <p>Congratulations! Your MedSpaSync Pro email notifications are now ready.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">📊 Test Details:</h3>
          <ul>
            <li><strong>Service Host:</strong> ${process.env.EMAIL_HOST}</li>
            <li><strong>Sent to:</strong> ${toEmail}</li>
            <li><strong>From:</strong> ${process.env.EMAIL_FROM}</li>
            <li><strong>Time:</strong> ${new Date().toISOString()}</li>
          </ul>
        </div>
        
        <p><strong>🎯 What's Next?</strong></p>
        <ul>
          <li>✅ Welcome emails for new subscribers</li>
          <li>✅ Payment notifications</li>
          <li>✅ Subscription updates</li>
          <li>✅ Medical spa automation ready!</li>
        </ul>
      </div>
    `;
  }

  generateTestEmailText(toEmail) {
    return `Email Service Test - Your MedSpaSync Pro notifications are ready! Sent to: ${toEmail} at ${new Date().toISOString()}`;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Graceful shutdown
  async close() {
    if (this.transporter) {
      this.transporter.close();
      console.log('Email service connections closed');
    }
  }
}

module.exports = new EmailService();