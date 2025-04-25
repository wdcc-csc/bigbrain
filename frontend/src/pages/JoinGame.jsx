import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import PersonIcon from '@mui/icons-material/Person';
import { playerAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../locales/translations';

const JoinGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  
  const [sessionId, setSessionId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' });
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sessionParam = searchParams.get('session');
    if (sessionParam) {
      setSessionId(sessionParam);
      
      try {
        const sessionsLanguageMap = JSON.parse(localStorage.getItem('sessionsLanguage') || '{}');
        const sessionLanguage = sessionsLanguageMap[sessionParam];
        
        if (sessionLanguage && sessionLanguage !== language) {
          console.log(`Detected session ${sessionParam} language setting ${sessionLanguage}, current language is ${language}, synchronizing`);
          setLanguage(sessionLanguage);
        }
      } catch (error) {
        console.error('Failed to read session language settings:', error);
      }
    }
    
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    }
  }, [location.search, language, setLanguage]);
  
  const showAlert = (message, severity = 'success') => {
    setAlertInfo({ open: true, message, severity });
  };
  
  const handleCloseAlert = () => {
    setAlertInfo({ ...alertInfo, open: false });
  };
  
  const handleJoinGame = async (e) => {
    e.preventDefault();
    
    if (!sessionId.trim()) {
      showAlert(t('enterSessionId', language), 'error');
      return;
    }
    
    if (!playerName.trim()) {
      showAlert(t('enterPlayerName', language), 'error');
      return;
    }
    
    try {
      setJoining(true);
      const response = await playerAPI.joinGame(sessionId, playerName);
      
      localStorage.setItem('playerId', response.data.playerId);
      localStorage.setItem('playerName', playerName);
      localStorage.setItem('sessionId', sessionId);
      
      navigate(`/play/${response.data.playerId}`);
    } catch (error) {
      console.error('Failed to join game:', error);
      let errorMessage = t('joinGameFailed', language);
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = t('sessionStartedOrNotExist', language);
      }
      
      showAlert(errorMessage, 'error');
    } finally {
      setJoining(false);
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <VideogameAssetIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            {t('joinGame', language)}
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            {t('joinGameDescription', language)}
          </Typography>
        </Box>
        
        {joining ? (
          <Box display="flex" flexDirection="column" alignItems="center" p={4}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6">{t('joiningGame', language)}</Typography>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleJoinGame}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label={t('sessionId', language)}
                  variant="outlined"
                  fullWidth
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  disabled={!!location.search.includes('session=')}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('playerName', language)}
                  variant="outlined"
                  fullWidth
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={loading || !sessionId.trim() || !playerName.trim()}
                >
                  {t('joinGame', language)}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      <Snackbar open={alertInfo.open} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity={alertInfo.severity} sx={{ width: '100%' }}>
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default JoinGame; 