import { createTheme, type PaletteMode } from '@mui/material/styles';

const commonTypography = {
  fontFamily: [
    '"PingFang SC"',
    '"PingFang TC"',
    '"Hiragino Sans GB"',
    '"Microsoft YaHei"',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    'sans-serif',
  ].join(','),
  // “苹方粗一点”≈整体偏 medium 的观感
  fontWeightRegular: 500,
  fontWeightMedium: 600,
  fontWeightBold: 700,
  // 整体字号稍微收敛一点
  h1: { fontWeight: 600, fontSize: '2.25rem' },
  h2: { fontWeight: 600, fontSize: '1.75rem' },
  h3: { fontWeight: 600, fontSize: '1.375rem' },
  h4: { fontWeight: 600, fontSize: '1.125rem' },
  h5: { fontWeight: 600, fontSize: '1.05rem' },
  h6: { fontWeight: 600, fontSize: '1rem' },
} as const;

export function createAppTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
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
      background: isDark
        ? {
            // 更接近 docs dark：neutral 系列
            default: '#0a0a0a', // neutral-950
            paper: '#171717', // neutral-900
          }
        : {
            default: '#ffffff',
            paper: '#ffffff',
          },
      text: isDark
        ? {
            primary: '#f5f5f5', // neutral-100
            secondary: '#a3a3a3', // neutral-400
          }
        : {
            primary: '#111827', // gray-900
            secondary: '#4b5563', // gray-600
          },
      error: {
        main: '#ef4444',
        light: '#f87171',
      },
      success: {
        main: '#10b981',
        light: '#34d399',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
      },
      info: {
        main: '#3b82f6',
        light: '#60a5fa',
      },
      divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)',
    },
    typography: commonTypography,
    shape: {
      // 全站圆角统一收敛一些（之前偏大）
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 10,
            padding: '8px 18px',
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
          root: ({ theme }) => ({
            backgroundImage: 'none',
            // Card 本身也收敛圆角
            borderRadius: 10,
            border: `1px solid ${
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(17, 24, 39, 0.10)'
            }`,
          }),
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: 14,
            '&:last-child': {
              paddingBottom: 14,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
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
}

export const lightTheme = createAppTheme('light');
export const darkTheme = createAppTheme('dark');

