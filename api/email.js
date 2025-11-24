import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // For testing, we can use Gmail SMTP or a service like Ethereal Email
  // In production, configure with actual SMTP credentials from .env
  
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  };

  // If no SMTP credentials, use Ethereal Email for testing (creates a test account)
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    console.warn('⚠️ No SMTP credentials found. Using Ethereal Email for testing.');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  return nodemailer.createTransport(smtpConfig);
};

// Format date and time
const formatDateTime = () => {
  const now = new Date();
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  };
  return now.toLocaleString('en-US', options);
};

// Generate HTML email for Sell page submission
const generateSellEmailHTML = (formData) => {
  const preferredContactLabels = {
    email: 'Email',
    phone: 'Phone Call',
    text: 'Text Message'
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 0; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 25px 20px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 18px; font-weight: bold; color: #2563eb; margin-bottom: 15px; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
        .field { margin-bottom: 12px; }
        .field-label { font-weight: bold; color: #1f2937; margin-bottom: 5px; font-size: 14px; }
        .field-value { color: #4b5563; padding: 10px; background: white; border-left: 3px solid #2563eb; padding-left: 15px; border-radius: 4px; font-size: 14px; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 New Property Sale Inquiry</h1>
            <p>Pitt Metro Realty - Property Listing Request</p>
        </div>
        
        <div class="content">
            <div class="section">
                <div class="section-title">👤 Personal Information</div>
                
                <div class="field">
                    <div class="field-label">Full Name:</div>
                    <div class="field-value">${(formData.firstName || '').trim()} ${(formData.lastName || '').trim()}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Email Address:</div>
                    <div class="field-value">${formData.email || 'Not provided'}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Phone Number:</div>
                    <div class="field-value">${formData.phone || 'Not provided'}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Preferred Contact Method:</div>
                    <div class="field-value">${preferredContactLabels[formData.preferredContact] || formData.preferredContact || 'Not specified'}</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">📝 Property Details & Requirements</div>
                
                <div class="field">
                    <div class="field-label">Description:</div>
                    <div class="field-value" style="white-space: pre-wrap;">${(formData.description || 'No description provided').replace(/\n/g, '<br>')}</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">📅 Submission Information</div>
                
                <div class="field">
                    <div class="field-label">Submission Date & Time:</div>
                    <div class="field-value">${formatDateTime()}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Source:</div>
                    <div class="field-value">Sell Page - Property Listing Form</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>This email was automatically generated from the Pitt Metro Realty website.</strong></p>
            <p>Please respond to the customer at their preferred contact method listed above.</p>
        </div>
    </div>
</body>
</html>
  `;
};

// Generate HTML email for Buy page submission
const generateBuyEmailHTML = (formData) => {
  const budgetLabels = {
    'under-300k': 'Under $300K',
    '300k-500k': '$300K - $500K',
    '500k-750k': '$500K - $750K',
    '750k-1m': '$750K - $1M',
    '1m-1.5m': '$1M - $1.5M',
    'over-1.5m': 'Over $1.5M'
  };

  const timelineLabels = {
    'immediately': 'Immediately',
    '1-3-months': '1-3 months',
    '3-6-months': '3-6 months',
    '6-12-months': '6-12 months',
    'over-1-year': 'Over 1 year'
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 0; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 25px 20px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 18px; font-weight: bold; color: #2563eb; margin-bottom: 15px; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
        .field { margin-bottom: 12px; }
        .field-label { font-weight: bold; color: #1f2937; margin-bottom: 5px; font-size: 14px; }
        .field-value { color: #4b5563; padding: 10px; background: white; border-left: 3px solid #2563eb; padding-left: 15px; border-radius: 4px; font-size: 14px; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏡 New Property Purchase Inquiry</h1>
            <p>Pitt Metro Realty - Buyer Information Request</p>
        </div>
        
        <div class="content">
            <div class="section">
                <div class="section-title">👤 Personal Information</div>
                
                <div class="field">
                    <div class="field-label">Full Name:</div>
                    <div class="field-value">${(formData.firstName || '').trim()} ${(formData.lastName || '').trim()}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Email Address:</div>
                    <div class="field-value">${formData.email || 'Not provided'}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Phone Number:</div>
                    <div class="field-value">${formData.phone || 'Not provided'}</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">🏠 Property Preferences</div>
                
                <div class="field">
                    <div class="field-label">Budget Range:</div>
                    <div class="field-value">${budgetLabels[formData.budget] || formData.budget || 'Not specified'}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Timeline:</div>
                    <div class="field-value">${timelineLabels[formData.timeline] || formData.timeline || 'Not specified'}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Preferred Areas:</div>
                    <div class="field-value">${formData.preferredAreas || 'Not specified'}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">First-Time Home Buyer:</div>
                    <div class="field-value">${formData.firstTimeBuyer ? 'Yes' : 'No'}</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">📝 Additional Information</div>
                
                <div class="field">
                    <div class="field-label">Additional Requirements:</div>
                    <div class="field-value" style="white-space: pre-wrap;">${(formData.additionalInfo || 'No additional information provided').replace(/\n/g, '<br>')}</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">📅 Submission Information</div>
                
                <div class="field">
                    <div class="field-label">Submission Date & Time:</div>
                    <div class="field-value">${formatDateTime()}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">Source:</div>
                    <div class="field-value">Buy Page - Property Purchase Form</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>This email was automatically generated from the Pitt Metro Realty website.</strong></p>
            <p>Please contact the customer to discuss their property purchase needs.</p>
        </div>
    </div>
</body>
</html>
  `;
};

// Generate plain text version
const generatePlainText = (formData, type) => {
  if (type === 'sell') {
    return `
===========================================
NEW PROPERTY SALE INQUIRY
Pitt Metro Realty - Property Listing Request
===========================================

PERSONAL INFORMATION
--------------------
Full Name: ${(formData.firstName || '').trim()} ${(formData.lastName || '').trim()}
Email Address: ${formData.email || 'Not provided'}
Phone Number: ${formData.phone || 'Not provided'}
Preferred Contact Method: ${formData.preferredContact || 'Not specified'}

PROPERTY DETAILS & REQUIREMENTS
--------------------------------
Description:
${formData.description || 'No description provided'}

SUBMISSION INFORMATION
----------------------
Submission Date & Time: ${formatDateTime()}
Source: Sell Page - Property Listing Form

===========================================
This email was automatically generated from the Pitt Metro Realty website.
Please respond to the customer at their preferred contact method listed above.
===========================================
    `;
  } else {
    return `
===========================================
NEW PROPERTY PURCHASE INQUIRY
Pitt Metro Realty - Buyer Information Request
===========================================

PERSONAL INFORMATION
--------------------
Full Name: ${(formData.firstName || '').trim()} ${(formData.lastName || '').trim()}
Email Address: ${formData.email || 'Not provided'}
Phone Number: ${formData.phone || 'Not provided'}

PROPERTY PREFERENCES
--------------------
Budget Range: ${formData.budget || 'Not specified'}
Timeline: ${formData.timeline || 'Not specified'}
Preferred Areas: ${formData.preferredAreas || 'Not specified'}
First-Time Home Buyer: ${formData.firstTimeBuyer ? 'Yes' : 'No'}

ADDITIONAL INFORMATION
----------------------
Additional Requirements:
${formData.additionalInfo || 'No additional information provided'}

SUBMISSION INFORMATION
----------------------
Submission Date & Time: ${formatDateTime()}
Source: Buy Page - Property Purchase Form

===========================================
This email was automatically generated from the Pitt Metro Realty website.
Please contact the customer to discuss their property purchase needs.
===========================================
    `;
  }
};

// Send email for Sell page submission
export const sendSellInquiryEmail = async (req, res) => {
  try {
    // Check if request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is empty. Please send JSON data with firstName, lastName, email, phone, preferredContact, and description fields.',
        hint: 'Example: {"firstName":"John","lastName":"Doe","email":"john@example.com","phone":"123-456-7890","preferredContact":"email","description":"Test"}'
      });
    }

    const formData = req.body;

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, phone'
      });
    }

    const transporter = createTransporter();
    
    // Email configuration
    const recipientEmail = 'aggarwal_a@hotmail.com';
    const customerName = `${formData.firstName} ${formData.lastName}`;
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@pittmetrorealty.com',
      to: recipientEmail,
      replyTo: formData.email,
      subject: `New Property Sale Inquiry - ${customerName}`,
      html: generateSellEmailHTML(formData),
      text: generatePlainText(formData, 'sell')
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Sell inquiry email sent successfully:', info.messageId);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Error sending sell inquiry email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

// Send email for Buy page submission
export const sendBuyInquiryEmail = async (req, res) => {
  try {
    // Check if request body exists
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is empty. Please send JSON data with firstName, lastName, email, phone, and other buyer information.',
        hint: 'Example: {"firstName":"John","lastName":"Doe","email":"john@example.com","phone":"123-456-7890","budget":"300k-500k","timeline":"1-3-months","preferredAreas":"Pittsburgh","firstTimeBuyer":false,"additionalInfo":"Test"}'
      });
    }

    const formData = req.body;

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, phone'
      });
    }

    const transporter = createTransporter();
    
    // Email configuration
    const recipientEmail = 'aggarwal_a@hotmail.com';
    const customerName = `${formData.firstName} ${formData.lastName}`;
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@pittmetrorealty.com',
      to: recipientEmail,
      replyTo: formData.email,
      subject: `New Property Purchase Inquiry - ${customerName}`,
      html: generateBuyEmailHTML(formData),
      text: generatePlainText(formData, 'buy')
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Buy inquiry email sent successfully:', info.messageId);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('❌ Error sending buy inquiry email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
};

