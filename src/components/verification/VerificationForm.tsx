import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { CloudUpload, Send } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { uploadToCloudinary } from '../../config/cloudinary';
import Header from '../layout/Header';

const VerificationForm: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<{ [key: string]: File | null }>({
    studentId: null,
    athleteId: null,
    otherDocuments: null,
  });
  const [documentUrls, setDocumentUrls] = useState<{ [key: string]: string }>({});
  const [additionalInfo, setAdditionalInfo] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // If already verified or pending, redirect to profile
    if (user.verificationStatus === 'approved' || user.verificationStatus === 'pending') {
      navigate('/profile');
      return;
    }
  }, [user, navigate]);

  const steps = [
    'Upload Documents',
    'Additional Information',
    'Review & Submit',
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (event.target.files && event.target.files[0]) {
      setDocuments(prev => ({
        ...prev,
        [type]: event.target.files![0]
      }));
    }
  };

  const handleUploadDocuments = async () => {
    setLoading(true);
    setError(null);

    // Check if at least one document is uploaded
    if (!documents.studentId && !documents.athleteId && !documents.otherDocuments) {
      setError('Please upload at least one verification document');
      setLoading(false);
      return;
    }

    const urls: { [key: string]: string } = {};

    try {
      for (const [key, file] of Object.entries(documents)) {
        if (file) {
          const url = await uploadToCloudinary(file, 'image');
          if (url && typeof url === 'string') {
            urls[key] = url;
          }
        }
      }

      if (Object.keys(urls).length === 0) {
        throw new Error('No documents were successfully uploaded');
      }

      setDocumentUrls(urls);
      setActiveStep(prev => prev + 1);
    } catch (error) {
      console.error('Error uploading documents:', error);
      setError('Failed to upload documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate that we have at least one document URL
    if (Object.keys(documentUrls).length === 0) {
      setError('Please upload at least one document before submitting');
      setActiveStep(0); // Go back to upload step
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create verification document with sanitized data
      const verificationData = {
        userId: user.uid,
        status: 'pending',
        documents: documentUrls,
        info: additionalInfo.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userDetails: {
          displayName: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
          userType: user.userType || 'athlete',
          location: user.location || '',
          bio: user.bio || ''
        }
      };

      // Add to verifications collection
      await addDoc(collection(db, 'verifications'), verificationData);

      // Update user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        verificationStatus: 'pending',
        updatedAt: new Date().toISOString()
      });

      enqueueSnackbar('Verification request submitted successfully! Please wait for admin approval.', { 
        variant: 'success',
        autoHideDuration: 6000
      });
      navigate('/profile');
    } catch (error) {
      console.error('Error submitting verification:', error);
      setError('Failed to submit verification request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderUploadStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Upload Required Documents</Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Please upload at least one of the following documents to verify your identity:
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Student ID</Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Upload a clear photo of your student ID
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
              >
                {documents.studentId ? documents.studentId.name : 'Upload Student ID'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'studentId')}
                />
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Athlete ID/License</Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Upload your athlete ID or sports license
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
              >
                {documents.athleteId ? documents.athleteId.name : 'Upload Athlete ID'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'athleteId')}
                />
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Additional Documents</Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Upload any other relevant verification documents
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
              >
                {documents.otherDocuments ? documents.otherDocuments.name : 'Upload Other Documents'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'otherDocuments')}
                />
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          onClick={handleUploadDocuments}
          disabled={loading || (!documents.studentId && !documents.athleteId && !documents.otherDocuments)}
        >
          {loading ? <CircularProgress size={24} /> : 'Next'}
        </Button>
      </Box>
    </Box>
  );

  const renderInfoStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Additional Information</Typography>
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Additional Information"
        placeholder="Please provide any additional information that may help verify your identity and role..."
        value={additionalInfo}
        onChange={(e) => setAdditionalInfo(e.target.value)}
        sx={{ mb: 3 }}
      />
      <Box display="flex" justifyContent="space-between">
        <Button onClick={() => setActiveStep(prev => prev - 1)}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => setActiveStep(prev => prev + 1)}
        >
          Next
        </Button>
      </Box>
    </Box>
  );

  const renderReviewStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Review Your Submission</Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Uploaded Documents:</Typography>
        <Box sx={{ pl: 2 }}>
          {Object.entries(documents).map(([key, file]) => (
            file && (
              <Typography key={key} color="textSecondary">
                ✓ {key}: {file.name}
              </Typography>
            )
          ))}
        </Box>
        {additionalInfo && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Additional Information:</Typography>
            <Typography color="textSecondary">{additionalInfo}</Typography>
          </>
        )}
      </Paper>
      <Box display="flex" justifyContent="space-between">
        <Button onClick={() => setActiveStep(prev => prev - 1)}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Send />}
        >
          Submit Verification Request
        </Button>
      </Box>
    </Box>
  );

  if (!user) {
    return null;
  }

  return (
    <Box>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            Profile Verification
          </Typography>
          <Typography variant="body1" color="textSecondary" align="center" paragraph>
            Complete the verification process to get a verified badge on your profile
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && renderUploadStep()}
          {activeStep === 1 && renderInfoStep()}
          {activeStep === 2 && renderReviewStep()}
        </Paper>
      </Container>
    </Box>
  );
};

export default VerificationForm; 