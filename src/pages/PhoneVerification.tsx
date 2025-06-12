import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { RootState } from '../store';
import { auth } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { updatePhoneVerification } from '../store/slices/authSlice';
import { sendVerificationCode, verifyCode } from '../services/twilioService';

const formatPhoneNumber = (input: string): string => {
  // Remove all non-numeric characters
  const numbers = input.replace(/\D/g, '');
  
  // Format for US numbers
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  } else {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  }
};

const convertToE164 = (phoneNumber: string): string => {
  // Remove all non-numeric characters
  const numbers = phoneNumber.replace(/\D/g, '');
  
  // Ensure it's a US number (10 digits)
  if (numbers.length !== 10) {
    throw new Error('Please enter a valid 10-digit phone number');
  }
  
  // Add US country code
  return `+1${numbers}`;
};

const PhoneVerification: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);
    setPhoneNumber(formatted);
  };

  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 6 digits
    const input = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(input);
  };

  const handleSendVerificationCode = async () => {
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert to E.164 format
      const formattedNumber = convertToE164(phoneNumber);
      
      const result = await sendVerificationCode(formattedNumber);

      if (!result.success) {
        throw new Error(result.error || 'Failed to send verification code');
      }

      setCodeSent(true);
      enqueueSnackbar('Verification code sent!', { variant: 'success' });
    } catch (error: any) {
      console.error('Send verification error:', error);
      setError(error.message);
      enqueueSnackbar(error.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    if (!phoneNumber) {
      setError('Phone number is missing');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedNumber = convertToE164(phoneNumber);
      
      const result = await verifyCode(formattedNumber, verificationCode);

      if (!result.success) {
        throw new Error(result.error || 'Failed to verify code');
      }

      if (!result.valid) {
        throw new Error('Invalid verification code');
      }

      // Update user's phone verification status in Firestore
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          phoneNumber: formattedNumber,
          phoneVerified: true,
          updatedAt: new Date().toISOString()
        });
      }

      // Update Redux state
      dispatch(updatePhoneVerification(true));
      enqueueSnackbar('Phone number verified successfully!', { variant: 'success' });
      navigate('/home');
    } catch (error: any) {
      console.error('Verify code error:', error);
      setError(error.message);
      enqueueSnackbar(error.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Verify Your Phone Number
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!codeSent ? (
            <>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Please enter your phone number to receive a verification code
              </Typography>

              <TextField
                fullWidth
                label="Phone Number"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="(555) 555-5555"
                margin="normal"
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">+1</InputAdornment>,
                }}
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleSendVerificationCode}
                disabled={loading || phoneNumber.replace(/\D/g, '').length !== 10}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Verification Code'}
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Enter the verification code sent to {phoneNumber}
              </Typography>

              <TextField
                fullWidth
                label="Verification Code"
                value={verificationCode}
                onChange={handleVerificationCodeChange}
                margin="normal"
                required
                placeholder="123456"
                inputProps={{
                  maxLength: 6,
                  pattern: '[0-9]*',
                  inputMode: 'numeric'
                }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Verify Code'}
              </Button>

              <Button
                fullWidth
                variant="text"
                onClick={handleSendVerificationCode}
                disabled={loading}
                sx={{ mt: 1 }}
              >
                Resend Code
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default PhoneVerification; 