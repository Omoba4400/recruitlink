import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: true,
  toggleDarkMode: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : true;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#FFA500' : '#FF8C00', // Golden Orange
        light: darkMode ? '#FFB733' : '#FFA500',
        dark: darkMode ? '#CC8400' : '#CC7000',
      },
      secondary: {
        main: darkMode ? '#FF8C00' : '#E67E00',
        light: darkMode ? '#FFA333' : '#FF8C00',
        dark: darkMode ? '#CC7000' : '#B35F00',
      },
      success: {
        main: darkMode ? '#FFD700' : '#E6B800',
        light: darkMode ? '#FFE033' : '#FFD700',
        dark: darkMode ? '#CCAC00' : '#B38F00',
      },
      warning: {
        main: darkMode ? '#FF4500' : '#E63900',
        light: darkMode ? '#FF6933' : '#FF4500',
        dark: darkMode ? '#CC3700' : '#B32D00',
      },
      background: {
        default: darkMode ? '#000000' : '#FFFFFF',
        paper: darkMode ? '#1A1A1A' : '#000000',
      },
      text: {
        primary: darkMode ? '#FFFFFF' : '#FFFFFF',
        secondary: darkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(255, 255, 255, 0.87)',
      },
    },
    typography: {
      fontFamily: '"Rajdhani", "Inter", "Roboto", sans-serif',
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
      borderRadius: 0,
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
            color: darkMode ? '#FFFFFF' : '#FFFFFF',
            backgroundColor: darkMode ? '#1A1A1A' : '#000000',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: darkMode 
                ? '0 4px 20px rgba(255, 165, 0, 0.4)'
                : '0 4px 20px rgba(255, 140, 0, 0.3)',
              backgroundColor: darkMode ? '#2A2A2A' : '#1A1A1A',
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
              background: darkMode 
                ? 'linear-gradient(45deg, rgba(255,165,0,0.1), rgba(255,165,0,0.2))'
                : 'linear-gradient(45deg, rgba(255,140,0,0.1), rgba(255,140,0,0.15))',
              opacity: 0,
              transition: 'opacity 0.3s ease',
            },
          },
          contained: {
            background: darkMode 
              ? 'linear-gradient(45deg, #FFA500, #FF8C00)'
              : 'linear-gradient(45deg, #FF8C00, #E67E00)',
            color: '#FFFFFF',
            boxShadow: darkMode 
              ? '0 2px 12px rgba(255, 165, 0, 0.3)'
              : '0 2px 8px rgba(255, 140, 0, 0.25)',
            '&:hover': {
              background: darkMode 
                ? 'linear-gradient(45deg, #FFB733, #FFA500)'
                : 'linear-gradient(45deg, #FFA500, #FF8C00)',
            },
          },
          outlined: {
            borderColor: darkMode ? '#FFA500' : '#FF8C00',
            color: darkMode ? '#FFA500' : '#FF8C00',
            '&:hover': {
              borderColor: darkMode ? '#FFB733' : '#FFA500',
              backgroundColor: darkMode 
                ? 'rgba(255, 165, 0, 0.08)'
                : 'rgba(255, 140, 0, 0.08)',
            },
          },
          text: {
            color: darkMode ? '#FFA500' : '#FF8C00',
            '&:hover': {
              backgroundColor: darkMode 
                ? 'rgba(255, 165, 0, 0.08)'
                : 'rgba(255, 140, 0, 0.08)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            background: darkMode ? '#1A1A1A' : '#000000',
            border: darkMode 
              ? '1px solid rgba(255, 165, 0, 0.1)'
              : '1px solid rgba(255, 140, 0, 0.15)',
            boxShadow: darkMode 
              ? '0 4px 30px rgba(255, 165, 0, 0.15)'
              : '0 4px 20px rgba(255, 140, 0, 0.1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            background: darkMode ? '#1A1A1A' : '#000000',
            borderRadius: 0,
            border: darkMode 
              ? '1px solid rgba(255, 165, 0, 0.1)'
              : '1px solid rgba(255, 140, 0, 0.15)',
            boxShadow: darkMode 
              ? '0 4px 30px rgba(255, 165, 0, 0.15)'
              : '0 4px 20px rgba(255, 140, 0, 0.1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 0,
              '& fieldset': {
                borderColor: darkMode 
                  ? 'rgba(255, 165, 0, 0.2)'
                  : 'rgba(255, 140, 0, 0.5)',
              },
              '&:hover fieldset': {
                borderColor: darkMode 
                  ? 'rgba(255, 165, 0, 0.4)'
                  : 'rgba(255, 140, 0, 0.7)',
              },
              '&.Mui-focused fieldset': {
                borderColor: darkMode ? '#FFA500' : '#FF8C00',
              },
            },
            '& .MuiInputLabel-root': {
              color: darkMode 
                ? 'rgba(255, 255, 255, 0.7)'
                : 'rgba(0, 0, 0, 0.7)',
              '&.Mui-focused': {
                color: darkMode ? '#FFA500' : '#FF8C00',
              },
            },
            '& .MuiInputBase-input': {
              color: darkMode ? '#FFFFFF' : '#000000',
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            '&.MuiOutlinedInput-root': {
              color: darkMode ? '#FFFFFF' : '#FFFFFF',
              backgroundColor: darkMode ? '#1A1A1A' : '#000000',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: darkMode ? 'rgba(255, 165, 0, 0.2)' : 'rgba(255, 140, 0, 0.5)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: darkMode ? 'rgba(255, 165, 0, 0.4)' : 'rgba(255, 140, 0, 0.7)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: darkMode ? '#FFA500' : '#FF8C00',
              },
            },
          },
          icon: {
            color: darkMode ? '#FFA500' : '#FF8C00',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: darkMode ? '#1A1A1A' : '#000000',
            borderColor: darkMode ? 'rgba(255, 165, 0, 0.2)' : 'rgba(255, 140, 0, 0.3)',
            boxShadow: darkMode 
              ? '0 4px 20px rgba(0, 0, 0, 0.5)'
              : '0 4px 20px rgba(0, 0, 0, 0.15)',
          },
          list: {
            padding: '8px 0',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: darkMode ? '#FFFFFF' : '#FFFFFF',
            backgroundColor: darkMode ? '#1A1A1A' : '#000000',
            '&:hover': {
              backgroundColor: darkMode 
                ? 'rgba(255, 165, 0, 0.08)'
                : 'rgba(255, 140, 0, 0.08)',
            },
            '&.Mui-selected': {
              backgroundColor: darkMode 
                ? 'rgba(255, 165, 0, 0.16)'
                : 'rgba(255, 140, 0, 0.16)',
              color: darkMode ? '#FFA500' : '#FF8C00',
              '&:hover': {
                backgroundColor: darkMode 
                  ? 'rgba(255, 165, 0, 0.24)'
                  : 'rgba(255, 140, 0, 0.24)',
              },
            },
          },
        },
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            '& .MuiFormLabel-root': {
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.7)',
              '&.Mui-focused': {
                color: darkMode ? '#FFA500' : '#FF8C00',
              },
            },
            '& .MuiFormHelperText-root': {
              color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.6)',
            },
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            backgroundColor: darkMode ? '#1A1A1A' : '#000000',
            color: darkMode ? '#FFFFFF' : '#FFFFFF',
          },
          option: {
            '&[data-focus="true"]': {
              backgroundColor: darkMode 
                ? 'rgba(255, 165, 0, 0.08)'
                : 'rgba(255, 140, 0, 0.08)',
            },
            '&[aria-selected="true"]': {
              backgroundColor: darkMode 
                ? 'rgba(255, 165, 0, 0.16)'
                : 'rgba(255, 140, 0, 0.16)',
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            color: darkMode ? '#FFFFFF' : '#FFFFFF',
            backgroundColor: darkMode ? '#1A1A1A' : '#000000',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: darkMode ? 'rgba(255, 165, 0, 0.2)' : 'rgba(255, 140, 0, 0.5)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: darkMode ? 'rgba(255, 165, 0, 0.4)' : 'rgba(255, 140, 0, 0.7)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: darkMode ? '#FFA500' : '#FF8C00',
            },
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: darkMode ? 'rgba(255, 165, 0, 0.5)' : 'rgba(255, 140, 0, 0.6)',
            '&.Mui-checked': {
              color: darkMode ? '#FFA500' : '#FF8C00',
            },
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            color: darkMode ? 'rgba(255, 165, 0, 0.5)' : 'rgba(255, 140, 0, 0.6)',
            '&.Mui-checked': {
              color: darkMode ? '#FFA500' : '#FF8C00',
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase': {
              '&.Mui-checked': {
                color: darkMode ? '#FFA500' : '#FF8C00',
                '& + .MuiSwitch-track': {
                  backgroundColor: darkMode ? '#FFA500' : '#FF8C00',
                  opacity: 0.5,
                },
              },
            },
            '& .MuiSwitch-track': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
            },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            '&:hover': {
              backgroundColor: darkMode 
                ? 'rgba(255, 165, 0, 0.08)'
                : 'rgba(255, 140, 0, 0.08)',
            },
          },
        },
      },
    },
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 