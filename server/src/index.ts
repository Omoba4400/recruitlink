import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import twilio from 'twilio';

// Load environment variables
dotenv.config();

// Debug logging
console.log('Environment variables check:');
console.log('TWILIO_ACCOUNT_SID exists:', !!process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN exists:', !!process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO_VERIFY_SERVICE_SID exists:', !!process.env.TWILIO_VERIFY_SERVICE_SID);

// Validate required environment variables
const requiredEnvVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

// Send verification code
app.post('/api/send-verification', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number is required' 
      });
    }

    // Validate phone number format (E.164 format)
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Must be in E.164 format (e.g., +1234567890)'
      });
    }

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });

    console.log('Verification sent:', {
      status: verification.status,
      to: phoneNumber,
      sid: verification.sid
    });

    res.json({ 
      success: true, 
      status: verification.status 
    });
  } catch (error: any) {
    console.error('Error sending verification:', error);
    
    // Handle specific Twilio errors
    if (error.code === 60200) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number'
      });
    } else if (error.code === 60203) {
      return res.status(400).json({
        success: false,
        error: 'Max send attempts reached. Please try again later.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to send verification code. Please try again later.'
    });
  }
});

// Verify code
app.post('/api/verify-code', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and verification code are required'
      });
    }

    // Validate phone number format
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Must be in E.164 format (e.g., +1234567890)'
      });
    }

    // Validate code format
    if (!code.match(/^\d{6}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code format. Must be 6 digits.'
      });
    }

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks
      .create({ to: phoneNumber, code });

    console.log('Verification check:', {
      status: verificationCheck.status,
      to: phoneNumber,
      valid: verificationCheck.status === 'approved'
    });

    res.json({
      success: true,
      valid: verificationCheck.status === 'approved'
    });
  } catch (error: any) {
    console.error('Error verifying code:', error);

    // Handle specific Twilio errors
    if (error.code === 60200) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number'
      });
    } else if (error.code === 60202) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to verify code. Please try again.'
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment check passed. Required variables are set.');
}); 