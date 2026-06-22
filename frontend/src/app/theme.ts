import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#176b55', dark: '#102e26', light: '#d9ede5' },
    background: { default: '#f4f7f5', paper: '#ffffff' },
    text: { primary: '#17352d', secondary: '#72847e' },
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    h1: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Manrope", sans-serif', fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
});
