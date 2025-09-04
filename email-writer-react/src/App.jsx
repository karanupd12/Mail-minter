// Enhanced MUI Web App Look & Feel
import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  CssBaseline,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  ThemeProvider,
  Tooltip,
  Typography,
  FormControl,
  CircularProgress,
  createTheme,
  Divider
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  ContentCopy,
  Send,
  AutoAwesome
} from '@mui/icons-material';
import axios from 'axios';

function App() {
  const [emailContent, setEmailContent] = useState('');
  const [tone, setTone] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    setIsDarkMode(savedTheme !== 'light');
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: { main: '#6366f1' },
      background: {
        default: isDarkMode ? '#111827' : '#f9fafb',
        paper: isDarkMode ? '#1f2937' : '#ffffff'
      },
      text: {
        primary: isDarkMode ? '#f3f4f6' : '#1f2937'
      }
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'Inter, Roboto, sans-serif',
      h6: {
        fontWeight: 600,
        letterSpacing: '0.3px'
      }
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: isDarkMode
              ? '0 4px 12px rgba(0,0,0,0.4)'
              : '0 4px 20px rgba(0,0,0,0.05)',
            border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb'
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            textTransform: 'none',
            padding: '10px 18px'
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb',
            borderRadius: 8
          }
        }
      }
    }
  });

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/email/generate`, {
        emailContent,
        tone
      });
      setGeneratedReply(typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
    } catch (err) {
      setError('Unable to generate reply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        {/* Header */}
        <Box component="header" sx={{ px: 4, py: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Box display="flex" width="fit-content" alignItems="center" gap={2}>
                <AutoAwesome color="primary" />
                <Typography variant="h6">Email Reply Assistant</Typography>
              </Box>
            </Grid>
            <Grid item>
              <Tooltip title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
                <IconButton onClick={toggleTheme} size="small">
                  {isDarkMode ? <LightMode /> : <DarkMode />}
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>

        {/* Main Section */}
        <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, sm: 4, md: 10 }, py: 4 }}>
          <Grid container spacing={4} direction="column">
            {/* Email Input Panel */}
            <Grid item xs={12}>
              <Paper elevation={5} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
                <Typography variant="h6" gutterBottom>Original Email</Typography>
                <Divider sx={{ mb: 2 }} />
                <TextField
                  multiline
                  minRows={8}
                  placeholder="Paste email content here..."
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
                <FormControl fullWidth sx={{ mt: 3 }}>
                  <InputLabel id="tone-select-label">Response Tone</InputLabel>
                  <Select
                    labelId="tone-select-label"
                    value={tone}
                    label="Response Tone"
                    onChange={(e) => setTone(e.target.value)}
                  >
                    <MenuItem value="">Default</MenuItem>
                    <MenuItem value="formal">Formal</MenuItem>
                    <MenuItem value="casual">Casual</MenuItem>
                    <MenuItem value="friendly">Friendly</MenuItem>
                    <MenuItem value="professional">Professional</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3 }}
                  startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                  disabled={!emailContent.trim() || loading}
                  onClick={handleSubmit}
                >
                  {loading ? 'Generating...' : 'Generate Reply'}
                </Button>
              </Paper>
            </Grid>

            {/* Generated Reply Panel */}
            <Grid item xs={12}>
              <Paper elevation={5} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Generated Reply</Typography>
                  {generatedReply && (
                    <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                      <IconButton onClick={handleCopy}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
                {generatedReply ? (
                  <TextField
                    multiline
                    minRows={8}
                    fullWidth
                    value={generatedReply}
                    InputProps={{ readOnly: true }}
                  />
                ) : (
                  <Typography color="text.secondary">
                    Your generated response will appear here once created.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;