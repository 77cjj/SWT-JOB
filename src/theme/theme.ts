import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // indigo-500
      light: '#818cf8', // indigo-400
      dark: '#4f46e5', // indigo-600
    },
    secondary: {
      main: '#8b5cf6', // violet-500
      light: '#a78bfa', // violet-400
      dark: '#7c3aed', // violet-600
    },
    background: {
      default: '#0f172a', // slate-950
      paper: '#1e293b', // slate-800
    },
    text: {
      primary: '#f1f5f9', // slate-100
      secondary: '#cbd5e1', // slate-300
    },
    error: {
      main: '#ef4444', // red-500
      light: '#f87171', // red-400
    },
    success: {
      main: '#10b981', // emerald-500
      light: '#34d399', // emerald-400
    },
    warning: {
      main: '#f59e0b', // amber-500
      light: '#fbbf24', // amber-400
    },
    info: {
      main: '#3b82f6', // blue-500
      light: '#60a5fa', // blue-400
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

