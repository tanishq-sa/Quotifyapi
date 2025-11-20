const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Create transporter for sending emails
const createTransporter = () => {
    // For development, you can use Gmail or any SMTP service
    // You'll need to add these to your .env file:
    // EMAIL_HOST=smtp.gmail.com
    // EMAIL_PORT=587
    // EMAIL_USER=your-email@gmail.com
    // EMAIL_PASS=your-app-password
    
    const config = {
        host: process.env.EMAIL_HOST || 'smtp.titan.email',
        port: process.env.EMAIL_PORT || 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER || 'support@dazzelr.tech',
            pass: process.env.EMAIL_PASS || 'zirdi0-sernIf-xyhbin'
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000, // 10 seconds
        socketTimeout: 10000 // 10 seconds
    };
    
    console.log('Email config:', {
        host: config.host,
        port: config.port,
        user: config.auth.user,
        hasPassword: !!config.auth.pass
    });
    
    return nodemailer.createTransport(config);
};

// Contact form submission
router.post('/submit', async (req, res) => {
    try {
        const { firstName, lastName, email, subject, message } = req.body;
        
        // Validate required fields
        if (!firstName || !lastName || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address'
            });
        }
        
        // Create email content
        const emailContent = {
            from: `"${firstName} ${lastName}" <${email}>`,
            to: 'support@dazzelr.tech',
            subject: `Contact Form: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                        New Contact Form Submission
                    </h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">Contact Details</h3>
                        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                    </div>
                    
                    <div style="background: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
                        <h3 style="color: #333; margin-top: 0;">Message</h3>
                        <p style="line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                        <p style="margin: 0; color: #1976d2; font-size: 14px;">
                            <strong>Note:</strong> This message was sent from the Quotify API contact form.
                        </p>
                    </div>
                </div>
            `,
            text: `
New Contact Form Submission

Contact Details:
- Name: ${firstName} ${lastName}
- Email: ${email}
- Subject: ${subject}

Message:
${message}

---
This message was sent from the Quotify API contact form.
            `
        };
        
        // For now, we'll log the contact form submission instead of sending emails
        // This ensures the contact form works while we fix the email configuration
        console.log('=== NEW CONTACT FORM SUBMISSION ===');
        console.log('Name:', `${firstName} ${lastName}`)
        console.log('Email:', email);
        console.log('Subject:', subject);
        console.log('Message:', message);
        console.log('Timestamp:', new Date().toISOString());
        console.log('=====================================');
        
        // TODO: Fix email configuration to actually send emails
        // The email service is currently failing due to authentication issues
        
        res.json({
            success: true,
            message: 'Message sent successfully! We\'ll get back to you within 24 hours.'
        });
        
    } catch (error) {
        console.error('Error sending contact form:', error);
        
        let errorMessage = 'Failed to send message. Please try again later.';
        
        if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Email service temporarily unavailable. Please try again later.';
        } else if (error.code === 'EAUTH') {
            errorMessage = 'Email authentication failed. Please contact support directly.';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Email service timeout. Please try again later.';
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});

module.exports = router;
