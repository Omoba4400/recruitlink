import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Box,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  IconButton,
  useTheme,
  useMediaQuery,
  Grid,
  CircularProgress,
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { registerUser } from '../services/auth.service';
import { createUserProfile } from '../services/user.service';
import { setUser, setError } from '../store/slices/authSlice';
import { User, UserType, UserProfile } from '../types/user';
import { useSnackbar } from 'notistack';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  phoneNumber: string;
  userType: UserType;
  athleteInfo?: {
    sports: [{
      sport: string;
      position: string;
      level: string;
      experience: number;
      specialties: string[];
      achievements: string[];
    }];
    academicInfo: {
      currentSchool: string;
      graduationYear: string;
    };
    verificationStatus: 'pending' | 'verified' | 'rejected';
    media: string[];
    memberships: string[];
    interests: string[];
    activities: string[];
    awards: string[];
    achievements: string[];
    eligibility: {
      isEligible: boolean;
    };
    recruitingStatus: 'open' | 'closed' | 'committed';
  };
  collegeInfo?: {
    institutionName: string;
    division: string;
    conference: string;
    location: string;
    teams: {
      name: string;
      sport: string;
      roster: string[];
      achievements: string[];
      openPositions: string[];
    }[];
  };
  coachInfo?: {
    specialization: string[];
    experience: string;
    certifications: string[];
    canMessageAthletes: boolean;
    verificationStatus: 'pending' | 'verified' | 'rejected';
  };
  sponsorInfo?: {
    companyName: string;
    industry: string;
    canMessageAthletes: boolean;
    sponsorshipTypes: string[];
    activeOpportunities: {
      title: string;
      description: string;
      requirements?: string[];
    }[];
  };
  mediaInfo?: {
    companyName: string;
    coverageAreas: string[];
    mediaType: string[];
  };
}

const initialFormData: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  displayName: '',
  phoneNumber: '',
  userType: 'athlete',
  athleteInfo: {
    sports: [{
      sport: '',
      position: '',
      level: '',
      experience: 0,
      specialties: [],
      achievements: []
    }],
    academicInfo: {
      currentSchool: '',
      graduationYear: ''
    },
    verificationStatus: 'pending',
    media: [],
    memberships: [],
    interests: [],
    activities: [],
    awards: [],
    achievements: [],
    eligibility: {
      isEligible: true
    },
    recruitingStatus: 'open'
  }
};

const formatUserData = (firebaseUser: any): User => {
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || undefined,
    userType: 'athlete',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    bio: '',
    location: '',
    verified: false,
    blocked: false,
    emailVerified: firebaseUser.emailVerified,
    phoneNumber: '',
    phoneVerified: false,
    isAdmin: false,
    verificationStatus: 'none',
    verificationStep: 'email',
    privacySettings: {
      profileVisibility: 'public',
      allowMessagesFrom: 'everyone',
      showEmail: true,
      showLocation: true,
      showAcademicInfo: true,
      showAthleteStats: true
    },
    socialLinks: {
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: ''
    },
    followers: [],
    following: [],
    connections: []
  };
};

const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (userType: UserType) => {
    setFormData((prev) => ({
      ...prev,
      userType,
      athleteInfo: userType === 'athlete' ? {
        sports: [{
          sport: '',
          position: '',
          level: '',
          experience: 0,
          specialties: [],
          achievements: []
        }],
        academicInfo: {
          currentSchool: '',
          graduationYear: ''
        },
        verificationStatus: 'pending',
        media: [],
        memberships: [],
        interests: [],
        activities: [],
        awards: [],
        achievements: [],
        eligibility: {
          isEligible: true
        },
        recruitingStatus: 'open'
      } : undefined,
      collegeInfo: userType === 'college' ? {
        institutionName: '',
        division: '',
        conference: '',
        location: '',
        teams: [{
          name: '',
          sport: '',
          roster: [],
          achievements: [],
          openPositions: []
        }]
      } : undefined,
      coachInfo: userType === 'coach' ? {
        specialization: [],
        experience: '',
        certifications: [],
        canMessageAthletes: false,
        verificationStatus: 'pending'
      } : undefined,
      sponsorInfo: userType === 'sponsor' ? {
        companyName: '',
        industry: '',
        canMessageAthletes: false,
        sponsorshipTypes: [],
        activeOpportunities: []
      } : undefined,
      mediaInfo: userType === 'media' ? {
        companyName: '',
        coverageAreas: [],
        mediaType: []
      } : undefined
    }));
  };

  type InfoType = 'athleteInfo' | 'collegeInfo' | 'coachInfo' | 'sponsorInfo' | 'mediaInfo';

  const updateTypeSpecificField = (
    type: InfoType,
    field: string,
    value: any
  ) => {
    setFormData((prev: FormData) => {
      const newFormData = { ...prev };
      if (type === 'athleteInfo') {
        if (!newFormData.athleteInfo) {
          newFormData.athleteInfo = {
            sports: [{
              sport: '',
              position: '',
              level: '',
              experience: 0,
              specialties: [],
              achievements: []
            }],
            academicInfo: {
              currentSchool: '',
              graduationYear: ''
            },
            verificationStatus: 'pending',
            media: [],
            memberships: [],
            interests: [],
            activities: [],
            awards: [],
            achievements: [],
            eligibility: {
              isEligible: true
            },
            recruitingStatus: 'open'
          };
        }

        if (field === 'sports') {
          newFormData.athleteInfo = {
            ...newFormData.athleteInfo,
            sports: [value[0]]
          };
        } else if (field === 'academicInfo') {
          newFormData.athleteInfo = {
            ...newFormData.athleteInfo,
            academicInfo: value
          };
        }
      } else if (newFormData[type]) {
        (newFormData[type] as any)[field] = value;
      }
      return newFormData;
    });
  };

  const getTypeSpecificFields = () => {
    switch (formData.userType) {
      case 'athlete':
        return (
          <>
            <TextField
              required
              fullWidth
              name="sport"
              label="Sport"
              value={formData.athleteInfo?.sports[0]?.sport || ''}
              onChange={(e) => {
                const currentSport = formData.athleteInfo?.sports[0] || {
                  sport: '',
                  position: '',
                  level: '',
                  experience: 0,
                  specialties: [],
                  achievements: []
                };
                updateTypeSpecificField('athleteInfo', 'sports', [{
                  ...currentSport,
                  sport: e.target.value
                }]);
              }}
              {...inputProps}
            />
            <TextField
              required
              fullWidth
              name="position"
              label="Position"
              value={formData.athleteInfo?.sports[0]?.position || ''}
              onChange={(e) => {
                const currentSport = formData.athleteInfo?.sports[0] || {
                  sport: '',
                  position: '',
                  level: '',
                  experience: 0,
                  specialties: [],
                  achievements: []
                };
                updateTypeSpecificField('athleteInfo', 'sports', [{
                  ...currentSport,
                  position: e.target.value
                }]);
              }}
              {...inputProps}
            />
            <TextField
              fullWidth
              name="currentSchool"
              label="Current School"
              value={formData.athleteInfo?.academicInfo.currentSchool || ''}
              onChange={(e) => updateTypeSpecificField('athleteInfo', 'academicInfo', {
                ...formData.athleteInfo?.academicInfo,
                currentSchool: e.target.value
              })}
              {...inputProps}
            />
            <TextField
              fullWidth
              name="graduationYear"
              label="Graduation Year"
              value={formData.athleteInfo?.academicInfo.graduationYear || ''}
              onChange={(e) => updateTypeSpecificField('athleteInfo', 'academicInfo', {
                ...formData.athleteInfo?.academicInfo,
                graduationYear: e.target.value
              })}
              {...inputProps}
            />
          </>
        );
      case 'college':
        return (
          <>
            <TextField
              required
              fullWidth
              name="institutionName"
              label="Institution Name"
              value={formData.collegeInfo?.institutionName || ''}
              onChange={(e) => updateTypeSpecificField('collegeInfo', 'institutionName', e.target.value)}
              {...inputProps}
            />
            <TextField
              fullWidth
              name="division"
              label="Division"
              value={formData.collegeInfo?.division || ''}
              onChange={(e) => updateTypeSpecificField('collegeInfo', 'division', e.target.value)}
              {...inputProps}
            />
          </>
        );
      case 'coach':
        return (
          <>
            <TextField
              required
              fullWidth
              name="specialization"
              label="Specialization"
              value={formData.coachInfo?.specialization.join(', ') || ''}
              onChange={(e) => updateTypeSpecificField('coachInfo', 'specialization', e.target.value.split(',').map(s => s.trim()))}
              helperText="Separate multiple specializations with commas"
              {...inputProps}
            />
            <TextField
              fullWidth
              name="experience"
              label="Years of Experience"
              value={formData.coachInfo?.experience || ''}
              onChange={(e) => updateTypeSpecificField('coachInfo', 'experience', e.target.value)}
              {...inputProps}
            />
          </>
        );
      case 'sponsor':
        return (
          <>
            <TextField
              required
              fullWidth
              name="companyName"
              label="Company Name"
              value={formData.sponsorInfo?.companyName || ''}
              onChange={(e) => updateTypeSpecificField('sponsorInfo', 'companyName', e.target.value)}
              {...inputProps}
            />
            <TextField
              required
              fullWidth
              name="industry"
              label="Industry"
              value={formData.sponsorInfo?.industry || ''}
              onChange={(e) => updateTypeSpecificField('sponsorInfo', 'industry', e.target.value)}
              {...inputProps}
            />
          </>
        );
      case 'media':
        return (
          <>
            <TextField
              required
              fullWidth
              name="companyName"
              label="Media Company Name"
              value={formData.mediaInfo?.companyName || ''}
              onChange={(e) => updateTypeSpecificField('mediaInfo', 'companyName', e.target.value)}
              {...inputProps}
            />
            <TextField
              fullWidth
              name="coverageAreas"
              label="Coverage Areas"
              value={formData.mediaInfo?.coverageAreas.join(', ') || ''}
              onChange={(e) => updateTypeSpecificField('mediaInfo', 'coverageAreas', e.target.value.split(',').map(s => s.trim()))}
              helperText="Separate multiple areas with commas"
              {...inputProps}
            />
          </>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setLocalError(null);

    try {
      // Validation checks...
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (!formData.email || !formData.password || !formData.displayName) {
        throw new Error('Please fill in all required fields');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Register user
      const { user, userData } = await registerUser(
        formData.email,
        formData.password,
        formData.displayName,
        formData.userType
      );

      // Create user profile with additional info
      await createUserProfile(user.uid, {
        email: formData.email,
        displayName: formData.displayName,
        userType: formData.userType,
        athleteInfo: formData.athleteInfo,
        collegeInfo: formData.userType === 'college' ? {
          name: formData.collegeInfo?.institutionName || '',
          location: formData.collegeInfo?.location || '',
          conference: formData.collegeInfo?.conference || '',
          sports: [],
          division: formData.collegeInfo?.division || '',
          teams: formData.collegeInfo?.teams || []
        } : undefined,
        coachInfo: formData.userType === 'coach' ? {
          specialization: formData.coachInfo?.specialization || [],
          experience: formData.coachInfo?.experience || '',
          certifications: [],
          canMessageAthletes: false,
          verificationStatus: 'pending'
        } : undefined,
        sponsorInfo: formData.userType === 'sponsor' ? {
          companyName: formData.sponsorInfo?.companyName || '',
          industry: formData.sponsorInfo?.industry || '',
          canMessageAthletes: false,
          sponsorshipTypes: [],
          activeOpportunities: []
        } : undefined,
        mediaInfo: formData.userType === 'media' ? {
          companyName: formData.mediaInfo?.companyName || '',
          coverageAreas: formData.mediaInfo?.coverageAreas || [],
          mediaType: []
        } : undefined
      });

      dispatch(setUser(userData));
      enqueueSnackbar('Please verify your email.', { variant: 'success' });
      setVerificationSent(true);
      navigate('/verify-email');
    } catch (error: any) {
      let errorMessage = error.message;
      
      // Handle Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please use a different email address or sign in instead.';
      }
      
      setLocalError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      dispatch(setError(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const inputProps = {
    sx: {
      mb: { xs: 3, sm: 2 },
      '& .MuiInputBase-root': {
        height: { xs: '56px', sm: '48px' }
      },
      '& .MuiInputLabel-root': {
        fontSize: { xs: '1rem', sm: '0.875rem' }
      },
      '& .MuiInputBase-input': {
        fontSize: { xs: '1.1rem', sm: '1rem' }
      }
    }
  };

  if (verificationSent) {
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
          <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              A verification link has been sent to your email address.
            </Alert>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Please check your email and click the verification link to complete your registration.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
              fullWidth
            >
              Go to Login
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container 
      component="main" 
      maxWidth="xs"
      sx={{
        px: { xs: 2, sm: 0 }
      }}
    >
      <Box
        sx={{
          marginTop: { xs: 4, sm: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute',
            top: { xs: -20, sm: -40 },
            left: { xs: 16, sm: 0 },
            color: 'primary.main',
            padding: { xs: '12px', sm: '8px' },
            '& svg': {
              fontSize: { xs: '2rem', sm: '1.5rem' }
            }
          }}
        >
          <HomeIcon />
        </IconButton>

        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            borderRadius: { xs: 2, sm: 1 }
          }}
        >
          <Typography 
            component="h1" 
            variant="h5" 
            align="center"
            sx={{ 
              mb: 3,
              fontSize: { xs: '1.5rem', sm: '1.25rem' }
            }}
          >
            Create Account
          </Typography>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                mb: 3,
                fontSize: { xs: '1rem', sm: '0.875rem' }
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleTextChange}
              error={!!error && error.includes('email')}
              {...inputProps}
            />
            <TextField
              required
              fullWidth
              id="displayName"
              label="Full Name"
              name="displayName"
              autoComplete="name"
              value={formData.displayName}
              onChange={handleTextChange}
              {...inputProps}
            />
            <TextField
              required
              fullWidth
              id="phoneNumber"
              label="Phone Number"
              name="phoneNumber"
              autoComplete="tel"
              value={formData.phoneNumber}
              onChange={handleTextChange}
              placeholder="+1234567890"
              helperText="Enter phone number with country code (e.g., +1234567890)"
              {...inputProps}
            />
            <FormControl 
              fullWidth 
              sx={{ mb: { xs: 3, sm: 2 } }}
            >
              <InputLabel id="user-type-label">I am a...</InputLabel>
              <Select
                labelId="user-type-label"
                id="userType"
                name="userType"
                value={formData.userType}
                label="I am a..."
                onChange={(e) => handleSelectChange(e.target.value as UserType)}
              >
                <MenuItem value="athlete">College Athlete</MenuItem>
                <MenuItem value="college">College/University</MenuItem>
                <MenuItem value="team">Team</MenuItem>
                <MenuItem value="fan">Fan/Follower</MenuItem>
                <MenuItem value="coach">Coach</MenuItem>
                <MenuItem value="sponsor">Sponsor</MenuItem>
                <MenuItem value="media">Media</MenuItem>
              </Select>
            </FormControl>

            {/* Type-specific fields */}
            {getTypeSpecificFields()}

            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleTextChange}
              error={!!error && error.includes('password')}
              {...inputProps}
            />
            <TextField
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleTextChange}
              error={!!error && error.includes('password')}
              {...inputProps}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2,
                mb: 2,
                py: { xs: 2, sm: 1.5 },
                fontSize: { xs: '1.1rem', sm: '1rem' }
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link 
                component={RouterLink} 
                to="/login"
                sx={{
                  fontSize: { xs: '1rem', sm: '0.875rem' }
                }}
              >
                Already have an account? Sign in
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 