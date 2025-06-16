import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFA500', // Golden Orange
      light: '#FFB733',
      dark: '#CC8400',
    },
    secondary: {
      main: '#FF8C00', // Dark Orange
      light: '#FFA333',
      dark: '#CC7000',
    },
    success: {
      main: '#FFD700', // Gold
      light: '#FFE033',
      dark: '#CCAC00',
    },
    warning: {
      main: '#FF4500', // Orange Red
      light: '#FF6933',
      dark: '#CC3700',
    },
    background: {
      default: '#000000', // Pure Black
      paper: '#1A1A1A', // Slightly lighter black
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.87)',
    },
  },
  typography: {
    fontFamily: '"Orbitron", "Inter", "Roboto", sans-serif', // Futuristic font
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
  },
  shape: {
    borderRadius: 0, // Sharp edges for futuristic look
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          borderRadius: 0,
          padding: '10px 30px',
          fontSize: '0.9375rem',
          fontWeight: 600,
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(255, 165, 0, 0.4)',
            '&::after': {
              opacity: 1,
            },
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,165,0,0.1), rgba(255,165,0,0.2))',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #FFA500, #FF8C00)',
          boxShadow: '0 2px 12px rgba(255, 165, 0, 0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          background: 'linear-gradient(135deg, rgba(26,26,26,0.95), rgba(0,0,0,0.95))',
          border: '1px solid rgba(255, 165, 0, 0.1)',
          boxShadow: '0 4px 30px rgba(255, 165, 0, 0.15)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            boxShadow: '0 8px 40px rgba(255, 165, 0, 0.25)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(26,26,26,0.95), rgba(0,0,0,0.95))',
          borderRadius: 0,
          border: '1px solid rgba(255, 165, 0, 0.1)',
          boxShadow: '0 4px 30px rgba(255, 165, 0, 0.15)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '2px solid #FFA500',
          boxShadow: '0 0 20px rgba(255, 165, 0, 0.3)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          height: 6,
          background: 'rgba(255, 165, 0, 0.1)',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #FFA500, #FF8C00)',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '1px solid transparent',
          '&:hover': {
            backgroundColor: 'rgba(255, 165, 0, 0.05)',
            borderColor: 'rgba(255, 165, 0, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            '& fieldset': {
              borderColor: 'rgba(255, 165, 0, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 165, 0, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FFA500',
            },
          },
        },
      },
    },
  },
});

export default theme; 