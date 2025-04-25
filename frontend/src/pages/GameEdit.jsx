import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Card,
  CardContent,
  Grid,
  Snackbar,
  Alert,
  Divider,
  Paper,
  Breadcrumbs,
  Link,
  Tooltip,
  Fade,
  Zoom,
  Grow,
  Skeleton,
  useTheme,
  alpha,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import QuizIcon from '@mui/icons-material/Quiz';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import CircleIcon from '@mui/icons-material/Circle';
import { gameAPI } from '../services/api';
import useTranslation from '../locales/useTranslation';

const GameEdit = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t, tf } = useTranslation();
  
  const [game, setGame] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' });
  const [openNewQuestionDialog, setOpenNewQuestionDialog] = useState(false);
  
  const fetchGame = async () => {
    try {
      setLoading(true);
      const response = await gameAPI.getGame(gameId);
      const gameData = response.data;
      console.log(t('fetchingGameData'), gameData);
      
      if (!gameData.questions) {
        gameData.questions = [];
      }
      
      setGame(gameData);
      setQuestions(gameData.questions);
    } catch (error) {
      console.error(t('fetchGameError'), error);
      showAlert(t('fetchGameError'), 'error');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchGame();
  }, [gameId]);
  
  const showAlert = (message, severity = 'success') => {
    const translatedMessage = t(message);
    setAlertInfo({ open: true, message: translatedMessage, severity });
  };
  
  const handleCloseAlert = () => {
    setAlertInfo({ ...alertInfo, open: false });
  };
  
  const handleAddQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      question: t('newQuestion'),
      type: 'single',
      timeLimit: 30,
      points: 10,
      answers: [
        { id: '1', answer: t('answerPlaceholder', '1'), isCorrect: true },
        { id: '2', answer: t('answerPlaceholder', '2'), isCorrect: false },
      ],
      isNew: true
    };
    
    navigate(`/game/${gameId}/question/${newQuestion.id}`);
  };
  
  const handleDeleteQuestion = async (questionId) => {
    const confirmed = window.confirm(t('deleteQuestionConfirm'));
    if (!confirmed) return;
    
    try {
      const updatedQuestions = questions.filter(question => question.id !== questionId);
      setQuestions(updatedQuestions);
      
      await updateGameQuestions(updatedQuestions);
      
      showAlert(t('deleteQuestionSuccess'));
    } catch (error) {
      console.error(t('deleteQuestionError'), error);
      showAlert(t('deleteQuestionError'), 'error');
      fetchGame();
    }
  };
  
  const updateGameQuestions = async (updatedQuestions) => {
    try {
      console.log(t('updatingQuestions'), updatedQuestions);
      
      try {
        console.log(t('tryingSpecializedAPI'));
        const response = await gameAPI.updateGameQuestions(gameId, updatedQuestions);
        console.log(t('specializedAPIResponse'), response);
        
        if (response.data && response.data.success) {
          if (response.data.game) {
            console.log(t('updatingStateWithResponseData'));
            setGame(response.data.game);
            setQuestions(response.data.game.questions || []);
            showAlert(t('updateQuestionsSuccess'), 'success');
            return;
          }
        }
      } catch (directApiError) {
        console.error(t('specializedAPIFailed'), directApiError);
      }
      
      console.log(t('usingTraditionalMethod'));
      const response = await gameAPI.updateGame(gameId, {
        questions: updatedQuestions,
        name: game.name,
        thumbnail: game.thumbnail
      });
      console.log(t('traditionalMethodResponse'), response);
      
      await fetchGame();
    } catch (error) {
      console.error(t('updateQuestionsError'), error);
      showAlert(t('updateQuestionsError'), 'error');
      throw error;
    }
  };
  
  const handleRefresh = () => {
    showAlert(t('refreshingData'), 'info');
    fetchGame()
      .then(() => showAlert(t('refreshSuccess')))
      .catch(() => showAlert(t('refreshError'), 'error'));
  };

  const getQuestionTypeInfo = (type) => {
    switch(type) {
    case 'single':
      return { name: t('singleChoice'), color: theme.palette.primary.main };
    case 'multiple':
      return { name: t('multipleChoice'), color: theme.palette.secondary.main };
    case 'boolean':
      return { name: t('trueFalse'), color: theme.palette.success.main };
    default:
      return { name: t('unknown'), color: theme.palette.grey[500] };
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 2,
          background: 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.98))'
        }}
      >
        <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link 
            color="inherit" 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Typography color="text.primary">{t('dashboard')}</Typography>
          </Link>
          <Typography color="text.primary">
            {loading ? 'Loading...' : game?.name || t('gameEditor')}
          </Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" color="primary" gutterBottom>
              {loading ? (
                <Skeleton width={250} />
              ) : (
                game?.name || t('gameEditor')
              )}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {loading ? (
                <Skeleton width={350} />
              ) : (
                tf('questionsForGame', game?.name || '')
              )}
            </Typography>
          </Box>
          
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ArrowBackIcon />}
              sx={{ mr: 1 }}
              onClick={() => navigate('/dashboard')}
            >
              {t('backToDashboard')}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              {t('refreshGameData')}
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 4 }} />
        
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h5" color="text.primary" gutterBottom>
            {loading ? <Skeleton width={150} /> : t('addNewQuestion')}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddQuestion}
            disabled={loading}
            sx={{ 
              borderRadius: 2,
              boxShadow: 2,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              }
            }}
          >
            {t('addQuestion')}
          </Button>
        </Box>
        
        {loading ? (
          Array.from(new Array(3)).map((_, index) => (
            <Card key={index} sx={{ mb: 2, overflow: 'hidden' }}>
              <CardContent>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="30%" />
              </CardContent>
            </Card>
          ))
        ) : questions.length === 0 ? (
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
            <QuizIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {t('noQuestionsYet')}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {t('addFirstQuestion')}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleAddQuestion}
            >
              {t('addQuestion')}
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {questions.map((question, index) => {
              const typeInfo = getQuestionTypeInfo(question.type);
              const correctAnswerCount = question.answers?.filter(a => a.isCorrect).length || 0;
              
              return (
                <Grid item xs={12} sm={6} md={4} key={question.id}>
                  <Grow in={true} timeout={(index + 1) * 200}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        borderRadius: 2,
                        transition: 'all 0.3s',
                        boxShadow: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: alpha(typeInfo.color, 0.3),
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                          borderColor: alpha(typeInfo.color, 0.7),
                        }
                      }}
                    >
                      <Box 
                        sx={{ 
                          p: 2, 
                          backgroundColor: alpha(typeInfo.color, 0.08),
                          borderBottom: '1px solid',
                          borderColor: alpha(typeInfo.color, 0.2)
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Chip 
                            label={typeInfo.name}
                            size="small"
                            sx={{ 
                              bgcolor: alpha(typeInfo.color, 0.9),
                              color: 'white',
                              mb: 1
                            }}
                          />
                          <Box>
                            <Tooltip title={t('editQuestion')}>
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/game/${gameId}/question/${question.id}`)}
                                sx={{ mr: 0.5 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('deleteQuestion')}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteQuestion(question.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            mb: 1,
                            minHeight: '2.5rem'
                          }}
                        >
                          {question.question}
                        </Typography>
                      </Box>
                      
                      <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TimerIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 'small' }} />
                          <Typography variant="body2" color="text.secondary">
                            {t('timeLimit')}: {question.timeLimit} {t('seconds')}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EmojiObjectsIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 'small' }} />
                          <Typography variant="body2" color="text.secondary">
                            {t('points')}: {question.points}
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 1.5 }} />
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {tf('correctAnswerCount', correctAnswerCount)}
                        </Typography>
                        
                        <Box sx={{ mt: 1 }}>
                          {question.answers?.slice(0, 3).map((answer, idx) => (
                            <Box 
                              key={answer.id} 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                mb: 0.5 
                              }}
                            >
                              <CircleIcon 
                                sx={{ 
                                  mr: 1, 
                                  fontSize: '10px',
                                  color: answer.isCorrect ? 'success.main' : 'text.disabled'
                                }} 
                              />
                              <Typography 
                                variant="body2" 
                                color={answer.isCorrect ? 'text.primary' : 'text.secondary'}
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontWeight: answer.isCorrect ? 'medium' : 'normal'
                                }}
                              >
                                {answer.answer}
                              </Typography>
                            </Box>
                          ))}
                          
                          {question.answers?.length > 3 && (
                            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                              +{question.answers.length - 3} more...
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>
      
      <Snackbar 
        open={alertInfo.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alertInfo.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GameEdit; 
