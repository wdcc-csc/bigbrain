import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Box,
  Snackbar,
  Alert,
  CardActionArea,
  Chip,
  Fade,
  Grow,
  Paper,
  Divider,
  Badge,
  useTheme,
  alpha
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import QuizIcon from '@mui/icons-material/Quiz';
import TimerIcon from '@mui/icons-material/Timer';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { gameAPI } from '../services/api';
import useTranslation from '../locales/useTranslation';


const DEFAULT_THUMBNAIL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN88B8AAsUB4ZtvXtIAAAAASUVORK5CYII=';

const Dashboard = () => {
  const [games, setGames] = useState([]);
  const [openNewGameDialog, setOpenNewGameDialog] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameThumbnail, setNewGameThumbnail] = useState('');
  const [openSessionDialog, setOpenSessionDialog] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionUrl, setSessionUrl] = useState('');
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState(null);
  
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, tf } = useTranslation();
  
  
  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await gameAPI.getAllGames();
      setGames(response.data.games);
    } catch (error) {
      console.error(t('fetchGamesError'), error);
      showAlert(t('fetchGamesError'), 'error');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchGames();
  }, []);
  
  
  const showAlert = (message, severity = 'success') => {
    
    const translatedMessage = t(message);
    setAlertInfo({ open: true, message: translatedMessage, severity });
  };
  
  
  const handleCloseAlert = () => {
    setAlertInfo({ ...alertInfo, open: false });
  };
  
  
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    
    if (!file.type.match('image.*')) {
      showAlert(t('pleaseUploadImage'), 'error');
      return;
    }

    
    if (file.size > 2 * 1024 * 1024) {
      showAlert(t('imageSize'), 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setNewGameThumbnail(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  
  const handleRemoveImage = () => {
    setNewGameThumbnail('');
  };
  
  
  const handleCreateGame = async () => {
    if (!newGameName.trim()) {
      showAlert(t('gameNameRequired'), 'error');
      return;
    }
    
    try {
      await gameAPI.createGame(newGameName, newGameThumbnail);
      showAlert(t('gameCreated'));
      setOpenNewGameDialog(false);
      setNewGameName('');
      setNewGameThumbnail('');
      
      fetchGames();
    } catch (error) {
      console.error(t('gameCreateError'), error);
      showAlert(t('gameCreateError'), 'error');
    }
  };
  
  
  const handleDeleteGame = async (gameId) => {
    try {
      await gameAPI.deleteGame(gameId);
      setGames(games.filter(game => game.id !== gameId));
      showAlert(t('gameDeleted'));
    } catch (error) {
      console.error(t('gameDeleteError'), error);
      showAlert(t('gameDeleteError'), 'error');
    }
  };
  
  
  const handleStartGame = async (gameId) => {
    try {
      console.log(t('startingGame'), gameId);
      
      
      const gameToStart = games.find(g => g.id === gameId);
      if (!gameToStart || !gameToStart.questions || gameToStart.questions.length === 0) {
        showAlert(t('noQuestionsWarning'), 'warning');
        return;
      }
      
      
      const response = await gameAPI.startGame(gameId);
      console.log(t('gameStartResponse'), response.data);
      
      
      const sessionId = response.data.data?.sessionId;
      
      if (!sessionId) {
        console.error(t('noValidSessionId'), response.data);
        showAlert(t('startGameSessionFailed'), 'error');
        return;
      }
      
      console.log(tf('gameSessionStartedLog', sessionId));
      
      
      setCurrentSessionId(sessionId);
      localStorage.setItem('lastActiveSession', sessionId);
      localStorage.setItem('lastActiveGame', gameId);
      
      
      const url = `${window.location.origin}/play?session=${sessionId}`;
      setSessionUrl(url);
      setOpenSessionDialog(true);
      
      
      fetchGames();
      setActiveGame(gameId);
      
      showAlert(tf('gameSessionStarted', sessionId), 'success');
      
      
      
      
    } catch (error) {
      console.error(t('startGameSessionError'), error);
      const errorMessage = error.response?.data?.error || error.message || t('unknownError');
      showAlert(errorMessage, 'error');
    }
  };
  
  
  const handleStopGame = async (gameId) => {
    try {
      await gameAPI.endGame(gameId);
      fetchGames();
      setActiveGame(null);
      showAlert(t('gameSessionStopped'));
      
      const confirmed = window.confirm(t('viewResults'));
      if (confirmed) {
        const game = games.find(g => g.id === gameId);
        if (game && game.active) {
          navigate(`/session/${game.active}`);
        }
      }
    } catch (error) {
      console.error(t('stopGameSessionError'), error);
      showAlert(t('stopGameSessionError'), 'error');
    }
  };
  
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(sessionUrl).then(() => {
      showAlert(t('linkCopied'));
    });
  };

  
  const getCardBackground = (index) => {
    const colors = [
      alpha(theme.palette.primary.main, 0.05),
      alpha(theme.palette.secondary.main, 0.05),
      alpha(theme.palette.success.main, 0.05),
      alpha(theme.palette.info.main, 0.05)
    ];
    return colors[index % colors.length];
  };
  
  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%)',
        py: 5
      }}
    >
      <Container maxWidth="lg">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: 2,
            background: 'linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.98))'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="primary">
                {t('myGamesTitle')}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {t('manageGamesSubtitle')}
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setOpenNewGameDialog(true)}
              sx={{ 
                borderRadius: 2,
                px: 3,
                py: 1.2,
                boxShadow: 3,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 5
                }
              }}
            >
              {t('createNewGame')}
            </Button>
          </Box>

          <Divider sx={{ mb: 4 }} />
          
          {loading ? (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">{t('loading')}</Typography>
            </Box>
          ) : games.length === 0 ? (
            <Paper 
              elevation={0}
              sx={{ 
                p: 5, 
                textAlign: 'center', 
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                background: alpha(theme.palette.background.default, 0.5)
              }}
            >
              <HelpOutlineIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('noGames')}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {t('createFirstGame')}
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => setOpenNewGameDialog(true)}
              >
                {t('createNewGame')}
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {games.map((game, index) => (
                <Grid item xs={12} sm={6} md={4} key={game.id}>
                  <Grow in={true} timeout={(index + 1) * 200}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'all 0.3s',
                        boxShadow: 2,
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: 5
                        },
                        background: getCardBackground(index)
                      }}
                    >
                      <CardActionArea onClick={() => navigate(`/game/${game.id}`)}>
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="160"
                            image={game.thumbnail || DEFAULT_THUMBNAIL}
                            alt={game.name}
                            sx={{ objectFit: 'cover' }}
                          />
                          {game.active && (
                            <Chip 
                              label={t('activeSession')} 
                              color="success" 
                              size="small"
                              sx={{ 
                                position: 'absolute', 
                                top: 10, 
                                right: 10,
                                fontWeight: 'bold'
                              }}
                            />
                          )}
                        </Box>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography 
                            gutterBottom 
                            variant="h5" 
                            component="div" 
                            sx={{ 
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {game.name}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 0.5 }}>
                            <QuizIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                            <Typography variant="body1" color="text.secondary">
                              {tf('questionCount', game.questions?.length || 0)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TimerIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                            <Typography variant="body1" color="text.secondary">
                              {tf('totalDuration', game.questions?.reduce((sum, q) => sum + (q.timeLimit || 0), 0) || 0, t('seconds'))}
                            </Typography>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                      
                      <Divider />
                      
                      <Box sx={{ p: 2, mt: 'auto', backgroundColor: 'background.paper' }}>
                        {game.active ? (
                          <Button
                            fullWidth
                            variant="contained"
                            color="error"
                            startIcon={<StopIcon />}
                            onClick={() => handleStopGame(game.id)}
                            sx={{ 
                              borderRadius: 2,
                              fontWeight: 'bold',
                              boxShadow: 2
                            }}
                          >
                            {t('stopSession')}
                          </Button>
                        ) : (
                          <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => handleStartGame(game.id)}
                            disabled={!game.questions || game.questions.length === 0}
                            sx={{ 
                              borderRadius: 2,
                              fontWeight: 'bold',
                              boxShadow: 2,
                              '&:not(:disabled)': {
                                background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)'
                              }
                            }}
                          >
                            {t('startSession')}
                          </Button>
                        )}
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteGame(game.id)}
                          sx={{ 
                            mt: 1,
                            borderRadius: 2
                          }}
                        >
                          {t('delete')}
                        </Button>
                      </Box>
                    </Card>
                  </Grow>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Container>
      
      {/* Dialog for creating a new game */}
      <Dialog 
        open={openNewGameDialog} 
        onClose={() => setOpenNewGameDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white', py: 2 }}>
          {t('createNewGame')}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, minWidth: 400 }}>
          <DialogContentText sx={{ mb: 2 }}>
            {t('enterGameDetails')}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label={t('gameName')}
            type="text"
            fullWidth
            variant="outlined"
            value={newGameName}
            onChange={(e) => setNewGameName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {/* Thumbnail upload section */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('uploadThumbnail')} ({t('optional')})
            </Typography>
            
            {newGameThumbnail ? (
              <Box sx={{ position: 'relative', width: '100%', mt: 2 }}>
                <img 
                  src={newGameThumbnail} 
                  alt={t('thumbnailPreview')} 
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px' }} 
                />
                <Button 
                  variant="contained" 
                  color="error" 
                  size="small" 
                  onClick={handleRemoveImage}
                  sx={{ position: 'absolute', top: 8, right: 8, minWidth: 0, borderRadius: 6 }}
                >
                  {t('remove')}
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
                fullWidth
                sx={{ 
                  mt: 1, 
                  p: 2, 
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: alpha(theme.palette.primary.main, 0.04)
                  }
                }}
              >
                {t('uploadImage')}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageUpload}
                />
              </Button>
            )}
            <Typography variant="caption" color="text.secondary">
              {t('supportedFormats')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenNewGameDialog(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleCreateGame} 
            variant="contained" 
            color="primary"
            sx={{ borderRadius: 2 }}
          >
            {t('create')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog showing the game session link */}
      <Dialog 
        open={openSessionDialog} 
        onClose={() => setOpenSessionDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: 'success.main', color: 'white', py: 2 }}>
          {t('sessionStarted')}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ 
            p: 2, 
            mb: 2, 
            backgroundColor: alpha(theme.palette.success.light, 0.2),
            borderRadius: 1
          }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {t('sessionId')}: <span style={{ fontFamily: 'monospace' }}>{currentSessionId}</span>
            </Typography>
          </Box>
          
          <TextField
            margin="dense"
            id="link"
            label={t('playerLink')}
            type="text"
            fullWidth
            variant="outlined"
            value={sessionUrl}
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace' }
            }}
          />
          <DialogContentText sx={{ mt: 3, mb: 1 }}>
            {t('playersWaiting')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenSessionDialog(false)}
            sx={{ borderRadius: 2 }}
          >
            {t('close')}
          </Button>
          <Button 
            onClick={handleCopyLink} 
            variant="outlined" 
            color="primary"
            sx={{ borderRadius: 2 }}
          >
            {t('copyLink')}
          </Button>
          <Button 
            onClick={() => {
              setOpenSessionDialog(false);
              navigate(`/session/${currentSessionId}`);
            }} 
            variant="contained" 
            color="success"
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(45deg, #2E7D32 30%, #43A047 90%)'
            }}
          >
            {t('manageSession')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for displaying alerts and messages */}
      <Snackbar 
        open={alertInfo.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        TransitionComponent={Fade}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alertInfo.severity} 
          variant="filled"
          sx={{ width: '100%', borderRadius: 2, boxShadow: 3 }}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default Dashboard; 