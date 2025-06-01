import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  IconButton,
  useTheme,
  Paper,
  Card,
  CardContent,
  useMediaQuery,
} from '@mui/material';
import {
  Instagram,
  Twitter,
  YouTube,
  PersonAdd,
  Group,
  EmojiEvents,
  BusinessCenter,
} from '@mui/icons-material';
import backgroundVideo from '../assets/856132-hd_1920_1080_30fps.mp4';

// Carousel messages for value proposition
const carouselMessages = [
  "Connect with top college teams.",
  "Get discovered by sponsors.",
  "Attend exclusive events.",
  "Showcase your talent."
];

const Landing = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % carouselMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Background Video */}
      <Box
        component="video"
        src={backgroundVideo}
        autoPlay
        muted
        loop
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1,
          filter: 'brightness(0.4)',
        }}
      />

      {/* Main Content */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          position: 'relative', 
          py: { xs: 4, sm: 8 },
          px: { xs: 2, sm: 3 }
        }}
      >
        {/* Logo + Tagline */}
        <Box textAlign="center" mb={{ xs: 4, sm: 8 }}>
          <Typography 
            variant="h1" 
            color="primary" 
            sx={{ 
              fontSize: { xs: '2.5rem', sm: '3.5rem' }, 
              fontWeight: 700 
            }}
          >
            Athlete Connect 
          </Typography>
          <Typography 
            variant="h4" 
            color="white" 
            sx={{ 
              mt: 2,
              fontSize: { xs: '1.5rem', sm: '2.125rem' }
            }}
          >
            Where Talent Meets Opportunity
          </Typography>
        </Box>

        {/* Call-to-Action Buttons */}
        <Box 
          textAlign="center" 
          mb={{ xs: 4, sm: 6 }}
          sx={{
            '& > button': {
              width: { xs: '100%', sm: 'auto' },
              mb: { xs: 2, sm: 0 },
              '&:first-of-type': {
                mr: { sm: 2 }
              }
            }
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{
              px: { xs: 4, sm: 6 },
              py: { xs: 2, sm: 1.5 },
              fontSize: { xs: '1.2rem', sm: '1.1rem' },
              '&:hover': { transform: 'scale(1.05)' },
              transition: 'transform 0.2s',
            }}
          >
            Sign Up
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/login')}
            sx={{
              px: { xs: 4, sm: 6 },
              py: { xs: 2, sm: 1.5 },
              fontSize: { xs: '1.2rem', sm: '1.1rem' },
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                transform: 'scale(1.05)',
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              transition: 'transform 0.2s',
            }}
          >
            Sign In
          </Button>
        </Box>

        {/* Value Proposition Carousel */}
        <Box 
          textAlign="center" 
          mb={{ xs: 6, sm: 8 }} 
          sx={{ height: { xs: '60px', sm: '50px' } }}
        >
          <Typography
            variant="h5"
            color="white"
            sx={{
              opacity: 0.9,
              transition: 'opacity 0.5s',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            {carouselMessages[currentMessageIndex]}
          </Typography>
        </Box>

        {/* How It Works Section */}
        <Box mb={{ xs: 6, sm: 8 }}>
          <Typography 
            variant="h3" 
            color="white" 
            textAlign="center" 
            mb={{ xs: 3, sm: 4 }}
            sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}
          >
            How It Works
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {[
              { icon: <PersonAdd fontSize="large" />, title: 'Create your profile', desc: 'Set up as Athlete, Coach, Team, or Sponsor' },
              { icon: <Group fontSize="large" />, title: 'Connect & Discover', desc: 'Network with the sports community' },
              { icon: <EmojiEvents fontSize="large" />, title: 'Attend & Grow', desc: 'Participate in events and opportunities' },
            ].map((step, index) => (
              <Box key={index} sx={{ width: { xs: '100%', md: '31%' } }}>
                <Paper
                  sx={{
                    p: { xs: 4, sm: 3 },
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  <Box 
                    color="primary.main" 
                    mb={2}
                    sx={{
                      '& > svg': {
                        fontSize: { xs: '2.5rem', sm: '2rem' }
                      }
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    color="white" 
                    gutterBottom
                    sx={{ fontSize: { xs: '1.25rem', sm: '1.125rem' } }}
                  >
                    {step.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'white', 
                      opacity: 0.8,
                      fontSize: { xs: '1rem', sm: '0.875rem' }
                    }}
                  >
                    {step.desc}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Role-Based Sign-Up Section */}
        <Box mb={{ xs: 6, sm: 8 }}>
          <Typography 
            variant="h3" 
            color="white" 
            textAlign="center" 
            mb={{ xs: 3, sm: 4 }}
            sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}
          >
            Join Our Community
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {[
              { icon: <PersonAdd />, title: 'Athletes', desc: 'Showcase your talent', action: 'Join Now' },
              { icon: <Group />, title: 'Coaches', desc: 'Find promising talent', action: 'Get Started' },
              { icon: <EmojiEvents />, title: 'Teams', desc: 'Build your roster', action: 'Create Page' },
              { icon: <BusinessCenter />, title: 'Sponsors', desc: 'Connect with athletes', action: 'Become a Partner' },
            ].map((role, index) => (
              <Box key={index} sx={{ width: { xs: '100%', sm: '45%', md: '22%' } }}>
                <Card
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  <CardContent 
                    sx={{ 
                      textAlign: 'center',
                      p: { xs: 4, sm: 3 }
                    }}
                  >
                    <Box 
                      color="primary.main" 
                      mb={2}
                      sx={{
                        '& > svg': {
                          fontSize: { xs: '2.5rem', sm: '2rem' }
                        }
                      }}
                    >
                      {role.icon}
                    </Box>
                    <Typography 
                      variant="h6" 
                      color="white" 
                      gutterBottom
                      sx={{ fontSize: { xs: '1.25rem', sm: '1.125rem' } }}
                    >
                      {role.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'white', 
                        opacity: 0.8,
                        mb: 2,
                        fontSize: { xs: '1rem', sm: '0.875rem' }
                      }} 
                      paragraph
                    >
                      {role.desc}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => navigate('/register')}
                      sx={{
                        width: '100%',
                        py: { xs: 1.5, sm: 1 },
                        fontSize: { xs: '1.1rem', sm: '0.875rem' },
                        '&:hover': { 
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          transform: 'scale(1.05)'
                        },
                        transition: 'transform 0.2s'
                      }}
                    >
                      {role.action}
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: { xs: 4, sm: 3 },
            textAlign: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', alignItems: 'center', mb: { xs: 3, sm: 2 } }}>
            <Box sx={{ width: { xs: '100%', sm: 'auto' }, textAlign: 'center' }}>
              <Typography variant="body2" color="white" sx={{ opacity: 0.7, fontSize: { xs: '1rem', sm: '0.875rem' }, py: { xs: 1, sm: 0 } }}>
                About Athlete Connect
              </Typography>
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'auto' }, textAlign: 'center' }}>
              <Typography variant="body2" color="white" sx={{ opacity: 0.7, fontSize: { xs: '1rem', sm: '0.875rem' }, py: { xs: 1, sm: 0 } }}>
                Terms & Privacy
              </Typography>
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'auto' }, textAlign: 'center' }}>
              <Typography variant="body2" color="white" sx={{ opacity: 0.7, fontSize: { xs: '1rem', sm: '0.875rem' }, py: { xs: 1, sm: 0 } }}>
                Contact Us
              </Typography>
            </Box>
          </Box>
          <Box>
            {[
              { icon: <Instagram />, label: 'Instagram' },
              { icon: <Twitter />, label: 'Twitter' },
              { icon: <YouTube />, label: 'YouTube' },
            ].map((social, index) => (
              <IconButton 
                key={index}
                color="primary" 
                size={isMobile ? "large" : "small"}
                sx={{
                  mx: 1,
                  p: { xs: 2, sm: 1 },
                  '& svg': {
                    fontSize: { xs: '1.75rem', sm: '1.25rem' }
                  }
                }}
              >
                {social.icon}
              </IconButton>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Landing; 