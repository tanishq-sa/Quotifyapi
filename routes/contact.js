const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const database = require('../database-adapter');

// Create transporter for sending emails
const createTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    
    if (!user || !pass) {
        throw new Error('EMAIL_USER and EMAIL_PASS environment variables are required');
    }
    
    const host = process.env.EMAIL_HOST || 'smtp.titan.email';
    const port = parseInt(process.env.EMAIL_PORT, 10) || 465;
    const secure = process.env.EMAIL_SECURE ? (process.env.EMAIL_SECURE === 'true') : (port === 465);
    
    const config = {
        host,
        port,
        secure,
        auth: {
            user,
            pass
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

// Helper function to escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Contact form submission
router.post('/submit', async (req, res) => {
    try {
        const { firstName, lastName, email, subject, message } = req.body;
        
        // Validate required fields
        if (!firstName || !lastName || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'All fields are required'
            });
        }
        
        // Validate input lengths to prevent mega-payloads
        if (firstName.length > 50 || lastName.length > 50 || email.length > 100 || subject.length > 150 || message.length > 5000) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Input exceeds maximum allowed length'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Please provide a valid email address'
            });
        }

        // Check rate limit: 1 submission per day per email/IP
        const isRateLimited = await database.checkContactRateLimit(email, req.ip);
        if (isRateLimited) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                message: 'You have already sent a message in the last 24 hours. Please try again tomorrow.'
            });
        }
        
        // Sanitize inputs for HTML template to prevent XSS
        const safeFirstName = escapeHtml(firstName);
        const safeLastName = escapeHtml(lastName);
        const safeEmail = escapeHtml(email);
        const safeSubject = escapeHtml(subject);
        const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
        
        // Create email content
        const emailContent = {
            from: `"${safeFirstName} ${safeLastName}" <${process.env.EMAIL_USER}>`,
            replyTo: `"${safeFirstName} ${safeLastName}" <${safeEmail}>`,
            to: 'support@dazzelr.tech',
            subject: `Contact Form: ${safeSubject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                        New Contact Form Submission
                    </h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">Contact Details</h3>
                        <p><strong>Name:</strong> ${safeFirstName} ${safeLastName}</p>
                        <p><strong>Email:</strong> ${safeEmail}</p>
                        <p><strong>Subject:</strong> ${safeSubject}</p>
                    </div>
                    
                    <div style="background: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
                        <h3 style="color: #333; margin-top: 0;">Message</h3>
                        <p style="line-height: 1.6; color: #555;">${safeMessage}</p>
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
        
        // Send email via transporter
        const transporter = createTransporter();
        await transporter.sendMail(emailContent);
        
        // Record the submission in the database to enforce the rate limit
        await database.createContactSubmission(email, req.ip);
        
        console.log('=== CONTACT FORM EMAIL SENT ===');
        console.log('Name:', `${firstName} ${lastName}`);
        console.log('Email:', email);
        console.log('Subject:', subject);
        console.log('Timestamp:', new Date().toISOString());
        console.log('=================================');
        
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
            error: 'Internal server error',
            message: errorMessage
        });
    }
});

module.exports = router;
