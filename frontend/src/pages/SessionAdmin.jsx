import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import { sessionAPI, gameAPI } from '../services/api';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend, 
  PointElement,
  LineElement 
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import useTranslation from '../locales/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const SessionAdmin = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { t, tf } = useTranslation();
  const { language } = useLanguage();
  
  const [session, setSession] = useState(null);
  const [results, setResults] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' });
  const [refreshing, setRefreshing] = useState(false);
  const [players, setPlayers] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  

  const pollingInterval = useRef(null);
  

  const calculatePlayerScore = (player) => {
    if (!player || !player.answers || !Array.isArray(player.answers)) {
      return 0;
    }
    

    return player.answers.reduce((total, answer) => {

      if (answer && answer.correct) {

        if (answer.questionPoints) {
          return total + answer.questionPoints;
        }

        return total + 10;
      }
      return total;
    }, 0);
  };
  

  const fetchSessionInfo = async () => {
    try {
      setRefreshing(true);
      const statusResponse = await sessionAPI.getSessionStatus(sessionId);
      console.log(t('sessionStatusData'), statusResponse.data);
      

      let sessionData = null;
      if (statusResponse.data.results) {
        sessionData = statusResponse.data.results;
      } else {
        sessionData = statusResponse.data;
      }
      
      console.log(t('processedSessionData'), sessionData);
      

      if (!sessionData.gameId && sessionData.results && sessionData.results.gameId) {
        sessionData.gameId = sessionData.results.gameId;
      }
      

      if (!sessionData.gameId) {
        const lastActiveGame = localStorage.getItem('lastActiveGame');
        if (lastActiveGame) {
          console.log(t('getGameIdFromStorage'), lastActiveGame);
          sessionData.gameId = lastActiveGame;
        }
      }
      
      setSession(sessionData);
      

      if (sessionData.players) {
        setPlayers(sessionData.players);
      } else if (statusResponse.data.players) {
        setPlayers(statusResponse.data.players);
      }
      

      if (sessionData && !sessionData.active) {
        try {
          const resultsResponse = await sessionAPI.getSessionResults(sessionId);
          console.log(t('sessionResults'), resultsResponse.data);
          

          let resultsData = {
            players: [],
            questions: []
          };
          

          if (resultsResponse.data.results) {

            if (Array.isArray(resultsResponse.data.results)) {
              console.log(t('serverReturnPlayerArray'));
              resultsData.players = resultsResponse.data.results;
            } 

            else if (resultsResponse.data.results.players) {
              console.log(t('serverReturnPlayersObject'));
              resultsData = resultsResponse.data.results;
            }
            else {
              console.log(t('unknownResultFormat'));
              resultsData = resultsResponse.data.results;
            }
          } else if (Array.isArray(resultsResponse.data)) {

            console.log(t('resultIsPlayerArray'));
            resultsData.players = resultsResponse.data;
          } else {

            console.log(t('usingOtherResultFormat'));
            resultsData = resultsResponse.data;
          }
          

          if (!resultsData.players) {
            console.log(t('noPlayersInResult'));
            resultsData.players = [];
          }
          

          if (!Array.isArray(resultsData.players)) {
            console.log(t('playersNotArray'));
            resultsData.players = Object.values(resultsData.players || {});
          }
          

          if (resultsData.players.length === 0 && sessionData.players && Array.isArray(sessionData.players)) {
            console.log(t('fillPlayersFromSession'));

            resultsData.players = sessionData.players.map(player => {

              if (typeof player === 'object') {
                return {
                  ...player,
                  score: player.score || 0,
                  answers: player.answers || [],
                  name: player.name || t('unknownPlayer')
                };
              }

              return {
                name: player,
                score: 0,
                answers: []
              };
            });
          } else if (resultsData.players.length === 0 && players && Array.isArray(players)) {
            console.log(t('fillPlayersFromCurrentState'));
            resultsData.players = players.map(player => {
              if (typeof player === 'object') {
                return {
                  ...player,
                  score: player.score || 0,
                  answers: player.answers || [],
                  name: player.name || t('unknownPlayer')
                };
              }
              return {
                name: player,
                score: 0,
                answers: []
              };
            });
          }
          
          resultsData.players = resultsData.players.map(player => {
            if (typeof player !== 'object') {
              return { name: player, score: 0, answers: [] };
            }
            return {
              ...player,
              name: player.name || t('unknownPlayer'),
              score: player.score || calculatePlayerScore(player),
              answers: player.answers || []
            };
          });
          
          // Analyze the results and record the logs to assist in debugging.
          console.log('=== ' + t('sessionResultAnalysis') + ' ===');
          console.log(t('playerCount') + ': ' + resultsData.players.length);
          if (resultsData.players.length > 0) {
            console.log(t('playerExample') + ':', JSON.stringify(resultsData.players[0]));
            
            const playerWithAnswers = resultsData.players.find(p => p.answers && p.answers.length > 0);
            if (playerWithAnswers) {
              console.log(t('foundPlayerWithAnswers') + ':', playerWithAnswers.name);
              console.log(t('answerExample') + ':', JSON.stringify(playerWithAnswers.answers[0]));

              resultsData.players.forEach(p => {
                console.log(tf('playerScoreInfo', p.name, p.score.toString(), (p.answers?.length || 0).toString()));
              });
            } else {
              console.log(t('noPlayerAnswersFound'));
            }
          }
          console.log('=====================');
          

          if (!resultsData.questions || !Array.isArray(resultsData.questions) || resultsData.questions.length === 0) {
            console.log(t('missingQuestionData'));
            
            if (gameInfo && gameInfo.questions && Array.isArray(gameInfo.questions)) {
              console.log(t('buildQuestionsFromGameInfo') + ', ' + t('gameHas') + ' ' + gameInfo.questions.length + ' ' + t('questions'));
              
              resultsData.questions = gameInfo.questions.map(() => ({
                answeredCorrectly: 0,
                answeredIncorrectly: 0,
                averageAnswerTime: 0
              }));
            } else if (sessionData && sessionData.questions && Array.isArray(sessionData.questions)) {
              console.log(t('buildQuestionsFromSession') + ', ' + t('sessionHas') + ' ' + sessionData.questions.length + ' ' + t('questions'));
              
              resultsData.questions = sessionData.questions.map(() => ({
                answeredCorrectly: 0,
                answeredIncorrectly: 0,
                averageAnswerTime: 0
              }));
            } else {
              console.log(t('cannotGetQuestionData'));
              resultsData.questions = [];
            }
          }
          
          if (resultsData.players && resultsData.players.length > 0 && 
              gameInfo && gameInfo.questions && Array.isArray(gameInfo.questions)) {
            
            console.log(t('calculateStatsFromAnswers'));
            
            resultsData.questions = gameInfo.questions.map(() => ({
              answeredCorrectly: 0,
              answeredIncorrectly: 0,
              averageAnswerTime: 0,
              totalTime: 0,
              answerCount: 0
            }));
            
            resultsData.players.forEach(player => {
              if (player.answers && Array.isArray(player.answers)) {
                player.score = player.answers.reduce((total, answer, index) => {
                  if (answer && answer.correct) {
                    const question = gameInfo.questions[index];
                    if (question && question.points) {
                      return total + question.points;
                    }
                    return total + 10;
                  }
                  return total;
                }, 0);
                
                player.answers.forEach((answer, index) => {
                  if (index >= 0 && index < resultsData.questions.length) {
                    const questionStat = resultsData.questions[index];
                    
                    if (answer && answer.correct) {
                      questionStat.answeredCorrectly = (questionStat.answeredCorrectly || 0) + 1;
                    } else {
                      questionStat.answeredIncorrectly = (questionStat.answeredIncorrectly || 0) + 1;
                    }
                    
                    if (answer && answer.questionStartedAt && answer.answeredAt) {
                      const startTime = new Date(answer.questionStartedAt).getTime();
                      const endTime = new Date(answer.answeredAt).getTime();
                      const answerTimeInSeconds = (endTime - startTime) / 1000;
                      
                      if (answerTimeInSeconds > 0 && answerTimeInSeconds < 120) {
                        questionStat.totalTime = (questionStat.totalTime || 0) + answerTimeInSeconds;
                        questionStat.answerCount = (questionStat.answerCount || 0) + 1;
                        
                        if (questionStat.answerCount > 0) {
                          questionStat.averageAnswerTime = questionStat.totalTime / questionStat.answerCount;
                        }
                        
                        console.log(tf('playerAnswerTime', player.name, (index+1).toString(), answerTimeInSeconds.toFixed(2)));
                      }
                    }
                  }
                });
              } else {
                player.score = 0;
              }
            });
            
            resultsData.questions.forEach((question, index) => {
              const totalAnswers = question.answeredCorrectly + question.answeredIncorrectly;
              const correctRate = totalAnswers > 0 ? (question.answeredCorrectly / totalAnswers) * 100 : 0;
              console.log(tf('questionStats', (index+1).toString(), correctRate.toFixed(2), question.averageAnswerTime.toFixed(2), totalAnswers.toString()));
            });
          }
          
          setResults(resultsData);
          
          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
          }
        } catch (resultError) {
          console.error(t('fetchResultsError'), resultError);
          showAlert(t('fetchResultsError') + ': ' + (resultError.message || t('unknownError')), 'error');
        }
      }
      
      if (sessionData && sessionData.gameId) {
        try {
          const gameResponse = await gameAPI.getGame(sessionData.gameId);
          setGameInfo(gameResponse.data);
          console.log(t('gameInfoReceived'), gameResponse.data);
        } catch (gameError) {
          console.error(t('fetchGameError'), gameError);
        }
      }
      
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error(t('fetchSessionError'), error);
      showAlert(t('fetchSessionError') + ': ' + (error.message || t('unknownError')), 'error');
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    fetchSessionInfo();
  };
  
  useEffect(() => {
    fetchSessionInfo();
    
    pollingInterval.current = setInterval(fetchSessionInfo, 5000);
    
    const checkSessionGame = async () => {
      const lastActiveSession = localStorage.getItem('lastActiveSession');
      const lastActiveGame = localStorage.getItem('lastActiveGame');
      
      if (lastActiveSession === sessionId && lastActiveGame) {
        console.log(t('foundGameIdInStorage'), lastActiveGame);
        setSession(prevSession => {
          if (prevSession && !prevSession.gameId) {
            return { ...prevSession, gameId: lastActiveGame };
          }
          return prevSession;
        });
      } else {
        try {
          const fullSessionInfo = await sessionAPI.getFullSessionInfo(sessionId);
          if (fullSessionInfo && fullSessionInfo.game) {
            console.log(t('foundGameViaAPI'), fullSessionInfo.game);
            localStorage.setItem('lastActiveSession', sessionId);
            localStorage.setItem('lastActiveGame', fullSessionInfo.game.id);
          }
        } catch (error) {
          console.error(t('fetchFullSessionError'), error);
        }
      }
    };
    
    checkSessionGame();
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [sessionId]);
  
  const showAlert = (message, severity = 'success') => {
    const translatedMessage = typeof message === 'string' && message.indexOf(':') === -1 ? t(message) : message;
    setAlertInfo({ open: true, message: translatedMessage, severity });
  };
  
  const handleCloseAlert = () => {
    setAlertInfo({ ...alertInfo, open: false });
  };
  
  const handleAdvanceQuestion = async () => {
    try {
      console.log(t('currentSessionData'), session);
      
      if (!session || !session.gameId) {
        console.error(t('noGameIdInSession'), session);
        try {
          const fullSessionInfo = await sessionAPI.getFullSessionInfo(sessionId);
          console.log(t('receivedFullSessionInfo'), fullSessionInfo);
          
          const gameId = fullSessionInfo.game?.id || fullSessionInfo.session?.gameId;
          
          if (!gameId) {
            throw new Error(t('cannotGetGameId'));
          }
          
          console.log(t('advancingWithGameId'), gameId);
          await gameAPI.advanceGame(gameId);
          showAlert(t('advanceQuestionSuccess'));
          fetchSessionInfo();
          return;
        } catch (fullSessionError) {
          console.error(t('fetchFullSessionInfoError'), fullSessionError);
          showAlert(t('advanceQuestionError'), 'error');
          return;
        }
      }
      
      console.log(t('advancingGame'), session.gameId);
      await gameAPI.advanceGame(session.gameId);
      showAlert(t('advanceQuestionSuccess'));
      fetchSessionInfo();
    } catch (error) {
      console.error(t('advanceQuestionError'), error);
      showAlert(t('advanceQuestionError') + ': ' + (error.message || t('unknownError')), 'error');
    }
  };
  
  const handleEndSession = async () => {
    try {
      if (!session || !session.gameId) {
        console.error(t('noGameIdInSession'), session);
        showAlert(t('endSessionError'), 'error');
        return;
      }
      
      await gameAPI.endGame(session.gameId);
      showAlert(t('endSessionSuccess'));
      await fetchSessionInfo();
      
      setShowResultDialog(true);
    } catch (error) {
      console.error(t('endSessionError'), error);
      showAlert(t('endSessionError') + ': ' + (error.message || t('unknownError')), 'error');
    }
  };
  
  const handleCloseResultDialog = () => {
    setShowResultDialog(false);
  };
  
  const handleViewResults = () => {
    setShowResultDialog(false);
    const resultsSection = document.getElementById('game-results-section');
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const prepareCorrectRateChartData = (results, game) => {
    try {
      console.log(t('preparingCorrectRateChart'), { results, game });
      
      const resultsClone = { ...results };
      if (!resultsClone.questions && game && game.questions) {
        console.log(t('createQuestionsForChart'), game.questions.length);
        
        resultsClone.questions = game.questions.map((q, index) => {
          return {
            id: q.id,
            question: q.question || tf('questionNumber', (index + 1).toString()),
            correctRate: 0
          };
        });
        
        if (resultsClone.players && resultsClone.players.length > 0) {
          console.log(t('calculateCorrectRateFromPlayers'), resultsClone.players.length);
          
          game.questions.forEach((question, qIndex) => {
            let correctCount = 0;
            let totalAnswers = 0;
            
            resultsClone.players.forEach(player => {
              if (player.answers && player.answers[qIndex]) {
                totalAnswers++;
                if (player.answers[qIndex].correct) {
                  correctCount++;
                }
              }
            });
            
            const correctRate = totalAnswers > 0 ? (correctCount / totalAnswers * 100) : 0;
            resultsClone.questions[qIndex].correctRate = correctRate;
            console.log(tf('questionCorrectRate', (qIndex + 1).toString(), correctRate.toFixed(0)));
          });
        }
      }
      
      if (!resultsClone.questions || resultsClone.questions.length === 0) {
        console.error(t('cannotGenerateCorrectRateChart'));
        return { labels: [], datasets: [] };
      }
      
      const labels = resultsClone.questions.map((q, i) => q.question || tf('questionNumber', (i + 1).toString()));
      const correctRates = resultsClone.questions.map(q => {
        const rate = typeof q.correctRate === 'string' ? parseFloat(q.correctRate) : q.correctRate;
        return isNaN(rate) ? 0 : rate;
      });
      
      console.log(t('correctRateChartData'), { labels, correctRates });
      
      return {
        labels,
        datasets: [
          {
            label: t('correctRate'),
            data: correctRates,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
      };
    } catch (error) {
      console.error(t('prepareCorrectRateChartError'), error);
      return { labels: [], datasets: [] };
    }
  };

  const prepareAverageTimeChartData = (results, game) => {
    try {
      console.log(t('preparingAverageTimeChart'), { results, game });
      
      const resultsClone = { ...results };
      if (!resultsClone.questions && game && game.questions) {
        console.log(t('createQuestionsForTimeChart'), game.questions.length);
        
        resultsClone.questions = game.questions.map((q, index) => {
          return {
            id: q.id,
            question: q.question || tf('questionNumber', (index + 1).toString()),
            avgTime: 0
          };
        });
        
        if (resultsClone.players && resultsClone.players.length > 0) {
          console.log(t('calculateAvgTimeFromPlayers'), resultsClone.players.length);
          
          game.questions.forEach((question, qIndex) => {
            let totalTime = 0;
            let validAnswers = 0;
            
            resultsClone.players.forEach(player => {
              if (player.answers && player.answers[qIndex]) {
                const answer = player.answers[qIndex];
                if (answer.questionStartedAt && answer.answeredAt) {
                  const startTime = new Date(answer.questionStartedAt).getTime();
                  const endTime = new Date(answer.answeredAt).getTime();
                  const timeSpent = (endTime - startTime) / 1000;
                  
                  if (timeSpent > 0 && timeSpent < 120) {
                    totalTime += timeSpent;
                    validAnswers++;
                  }
                }
              }
            });
            
            const avgTime = validAnswers > 0 ? (totalTime / validAnswers) : 0;
            resultsClone.questions[qIndex].avgTime = avgTime;
            console.log(tf('questionAvgTime', (qIndex + 1).toString(), avgTime.toFixed(1)));
          });
        }
      }
      
      if (!resultsClone.questions || resultsClone.questions.length === 0) {
        console.error(t('cannotGenerateTimeChart'));
        return { labels: [], datasets: [] };
      }
      
      const labels = resultsClone.questions.map((q, i) => q.question || tf('questionNumber', (i + 1).toString()));
      const avgTimes = resultsClone.questions.map(q => {
        const time = typeof q.avgTime === 'string' ? parseFloat(q.avgTime) : q.avgTime;
        return isNaN(time) ? 0 : time;
      });
      
      console.log(t('avgTimeChartData'), { labels, avgTimes });
      
      return {
        labels,
        datasets: [
          {
            label: t('averageTime'),
            data: avgTimes,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: false
          },
        ],
      };
    } catch (error) {
      console.error(t('prepareAvgTimeChartError'), error);
      return { labels: [], datasets: [] };
    }
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0,0,0,0.7)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          font: {
            size: 12
          }
        },
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.1)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 12
          }
        },
        grid: {
          display: false
        }
      }
    },
    layout: {
      padding: 10
    },
    animation: {
      duration: 1000
    }
  };
  
  const correctRateChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        suggestedMax: 100,
        title: {
          display: true,
          text: t('correctRate')
        }
      }
    }
  };

  const timeChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        title: {
          display: true,
          text: t('averageTime')
        }
      }
    }
  };
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (!session) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" color="error">{t('sessionNotFound')}</Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          {t('backToDashboard')}
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
        >
          {t('backToDashboard')}
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            {t('sessionAdmin')} #{sessionId}
          </Typography>
          <Button
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {t('refresh')}
          </Button>
        </Box>
  
        {lastUpdated && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            {t('lastUpdated')}: {lastUpdated.toLocaleTimeString()}
          </Typography>
        )}
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('sessionInfo')}
                </Typography>
                <Typography variant="body1">
                  {t('sessionStatus')}: {session?.active ? 
                    <Chip color="success" size="small" label={t('active')} /> : 
                    <Chip color="error" size="small" label={t('sessionClosed')} />
                  }
                </Typography>
                <Typography variant="body1">
                  {t('currentPosition')}: {session?.position === -1 ? 
                    <Chip color="warning" size="small" label={t('preparing')} /> : 
                    tf('questionNumber', (session?.position + 1).toString())
                  }
                </Typography>
                <Typography variant="body1">
                  {t('playerCount')}: <Chip color="primary" label={players?.length || 0} />
                </Typography>
                {session?.active && gameInfo && (
                  <Typography variant="body1">
                    {t('totalQuestions')}: {gameInfo.questions?.length || 0}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
              
          {session?.active && (
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <CardContent>
                  <Box display="flex" justifyContent="center" gap={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrowIcon />}
                      onClick={handleAdvanceQuestion}
                      disabled={session?.position >= (gameInfo?.questions?.length || 0) - 1}
                    >
                      {session?.position === -1 ? t('startFirstQuestion') : t('advanceToNextQuestion')}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<StopIcon />}
                      onClick={handleEndSession}
                    >
                      {t('endCurrentSession')}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Player list */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('activePlayers')}
          </Typography>
          
          {players && players.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>{t('playerName')}</TableCell>
                    <TableCell>{t('sessionStatus')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {players.map((player, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                          {player}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {session?.position === -1 ? (
                          <Chip size="small" label={t('waiting')} color="warning" />
                        ) : (
                          <Chip size="small" label={t('inGame')} color="success" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              {t('noPlayersJoined')}, {t('shareSessionId')}: <strong>{sessionId}</strong>
            </Alert>
          )}
        </Box>

        {/* Result presentation */}
        {results && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h5" gutterBottom id="game-results-section">
              {t('gameResults')}
            </Typography>
             
            {/* The top five players */}
            <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                {t('scoreLeaderboard')}
              </Typography>
              {results && results.players && results.players.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('rank')}</TableCell>
                        <TableCell>{t('player')}</TableCell>
                        <TableCell align="right">{t('score')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.players.slice(0, 5).map((player, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{player.name || tf('playerNumber', (index+1).toString())}</TableCell>
                          <TableCell align="right">{player.score || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  {session?.active ? t('waitingText') : t('noPlayersNoScore')}
                </Alert>
              )}
            </Paper>
            
            {/* Chart */}
            <Grid container spacing={4}>
              {/* Bar chart of accuracy rate */}
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('correctnessRate')}
                  </Typography>
                  {(() => {
                    const labels = gameInfo?.questions?.map((q, i) => q.question || tf('questionNumber', (i + 1).toString())) || [];
                    
                    let correctRates = [];
                    
                    if (results?.questions && Array.isArray(results.questions)) {
                      correctRates = results.questions.map(q => 
                        q.correctRate !== undefined ? 
                          (typeof q.correctRate === 'string' ? parseFloat(q.correctRate) : q.correctRate) : 
                          (q.answeredCorrectly && (q.answeredCorrectly + q.answeredIncorrectly > 0) ? 
                            ((q.answeredCorrectly / (q.answeredCorrectly + q.answeredIncorrectly)) * 100) : 0)
                      );
                    } 
                    else if (gameInfo?.questions && results?.players && results.players.length > 0) {
                      correctRates = new Array(gameInfo.questions.length).fill(0);
                      
                      const playerWithAnswers = results.players.find(p => p.answers && p.answers.length > 0);
                      if (playerWithAnswers) {
                        if (results.players.length === 1) {
                          correctRates = playerWithAnswers.answers.map(answer => 
                            answer.correct === true ? 100 : 0
                          );
                          console.log(t('usingPlayerAnswersForRate'), correctRates);
                        } 
                        else {
                          gameInfo.questions.forEach((_, qIndex) => {
                            let correctCount = 0;
                            let totalAnswers = 0;
                            
                            results.players.forEach(player => {
                              if (player.answers && player.answers[qIndex]) {
                                totalAnswers++;
                                if (player.answers[qIndex].correct === true) {
                                  correctCount++;
                                }
                              }
                            });
                            
                            console.log(tf('questionRateCalculation', (qIndex+1).toString(), correctCount.toString(), totalAnswers.toString()));
                            correctRates[qIndex] = totalAnswers > 0 ? (correctCount / totalAnswers * 100) : 0;
                          });
                        }
                      }
                    }
                    
                    if (correctRates.length === 0 || correctRates.every(rate => rate === 0)) {
                      console.log(t('tryExtractRateFromLogs'));
                      const logMatches = [];
                      for (let i = 1; i <= 3; i++) {
                        const regex = new RegExp(`Problem${i}\\s*Statistics:\\s*Accuracy rate=(\\d+\\.\\d+)%`);
                        const matchLine = console.logs?.find(log => regex.test(log));
                        if (matchLine) {
                          const match = matchLine.match(regex);
                          if (match && match[1]) {
                            logMatches.push(parseFloat(match[1]));
                          }
                        }
                      }
                      
                      if (logMatches.length > 0) {
                        console.log(t('extractedRatesFromLogs'), logMatches);
                        correctRates = logMatches;
                      }
                    }
                    
                    const forceCorrectRates = [];
                    results?.players?.forEach(player => {
                      if (player.answers && player.answers.length > 0) {
                        player.answers.forEach((answer, i) => {
                          if (!forceCorrectRates[i]) {
                            forceCorrectRates[i] = answer.correct === true ? 100 : 0;
                          }
                        });
                      }
                    });
                    
                    if (forceCorrectRates.length > 0) {
                      console.log(t('forcingRates'), forceCorrectRates);
                      correctRates = forceCorrectRates;
                    }
                    
                    while (correctRates.length < labels.length) {
                      correctRates.push(0);
                    }
                    
                    const chartData = {
                      labels,
                      datasets: [
                        {
                          label: t('correctRate'),
                          data: correctRates,
                          backgroundColor: 'rgba(54, 162, 235, 0.2)',
                          borderColor: 'rgba(54, 162, 235, 1)',
                          borderWidth: 1,
                          minBarLength: 5,
                          barPercentage: 0.6,
                          categoryPercentage: 0.7,
                          borderRadius: 4
                        },
                      ],
                    };
                    
                    console.log(t('creatingRateChart'), chartData);
                    console.log(t('rateDetailData'), correctRates.map((rate, i) => tf('questionNumber', (i+1).toString()) + ': ' + rate + '%').join(', '));
                    
                    const hasValidData = chartData && 
                                        chartData.labels && 
                                        chartData.labels.length > 0 &&
                                        chartData.datasets && 
                                        chartData.datasets[0] &&
                                        chartData.datasets[0].data;
                    
                    if (hasValidData) {
                      return (
                        <Box sx={{ height: '300px', width: '100%', padding: '10px' }}>
                          <Bar 
                            data={chartData} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  suggestedMax: 100,
                                  min: 0,
                                  max: 100,
                                  ticks: {
                                    stepSize: 20,
                                    callback: (value) => value + '%'
                                  },
                                  grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                  },
                                  title: {
                                    display: true,
                                    text: t('correctRate'),
                                    font: {
                                      weight: 'bold'
                                    }
                                  }
                                },
                                x: {
                                  grid: {
                                    display: false
                                  }
                                }
                              },
                              plugins: {
                                legend: {
                                  display: false
                                },
                                tooltip: {
                                  callbacks: {
                                    label: (context) => t('correctRate') + ': ' + context.formattedValue + '%'
                                  }
                                }
                              },
                              animation: {
                                duration: 1000
                              }
                            }} 
                          />
                        </Box>
                      );
                    } else {
                      return (
                        <Alert severity="info">
                          {gameInfo && gameInfo.questions && gameInfo.questions.length > 0 ? 
                            t('noResultDataYet') : 
                            t('noQuestionsNoChart')}
                        </Alert>
                      );
                    }
                  })()}
                </Paper>
              </Grid>
              
              {/* Line chart of average answering time */}
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {t('averageResponseTime')}
                  </Typography>
                  {(() => {
                    const labels = gameInfo?.questions?.map((q, i) => q.question || tf('questionNumber', (i + 1).toString())) || [];
                    
                    let avgTimes = [];
                    
                    if (results?.questions && Array.isArray(results.questions)) {
                      avgTimes = results.questions.map(q => 
                        q.avgTime !== undefined ? 
                          (typeof q.avgTime === 'string' ? parseFloat(q.avgTime) : q.avgTime) : 
                          (q.averageAnswerTime !== undefined ? q.averageAnswerTime : 0)
                      );
                    }
                    else if (gameInfo?.questions && results?.players && results.players.length > 0) {
                      const playerWithAnswers = results.players.find(p => p.answers && p.answers.length > 0);
                      
                      if (playerWithAnswers && results.players.length === 1) {
                        avgTimes = playerWithAnswers.answers.map(answer => {
                          if (answer.questionStartedAt && answer.answeredAt) {
                            const startTime = new Date(answer.questionStartedAt).getTime();
                            const endTime = new Date(answer.answeredAt).getTime();
                            const timeSpent = (endTime - startTime) / 1000;
                            return timeSpent > 0 && timeSpent < 120 ? timeSpent : 0;
                          }
                          return 0;
                        });
                        console.log(t('usingSinglePlayerTime'), avgTimes);
                      }
                      else {
                        avgTimes = new Array(gameInfo.questions.length).fill(0);
                        
                        gameInfo.questions.forEach((_, qIndex) => {
                          let totalTime = 0;
                          let validAnswers = 0;
                          
                          results.players.forEach(player => {
                            if (player.answers && player.answers[qIndex]) {
                              const answer = player.answers[qIndex];
                              if (answer.questionStartedAt && answer.answeredAt) {
                                const startTime = new Date(answer.questionStartedAt).getTime();
                                const endTime = new Date(answer.answeredAt).getTime();
                                const timeSpent = (endTime - startTime) / 1000;
                                
                                if (timeSpent > 0 && timeSpent < 120) {
                                  totalTime += timeSpent;
                                  validAnswers++;
                                  console.log(tf('playerAnswerTime', player.name || 'unknown', (qIndex+1).toString(), timeSpent.toFixed(2)));
                                }
                              }
                            }
                          });
                          
                          const avgTime = validAnswers > 0 ? (totalTime / validAnswers) : 0;
                          avgTimes[qIndex] = avgTime;
                          console.log(tf('questionTimeCalculation', (qIndex+1).toString(), totalTime.toFixed(2), validAnswers.toString(), avgTime.toFixed(2)));
                        });
                      }
                    }
                    
                    if (avgTimes.length === 0 || avgTimes.every(time => time === 0)) {
                      console.log(t('tryExtractTimeFromLogs'));
                      const timeMatches = [];
                      for (let i = 1; i <= 3; i++) {
                        const regex = new RegExp(`Problem${i}\\s*Statistics:.*Average time spent=(\\d+\\.\\d+)seconds`);
                        const matchLine = results?.logs?.find(log => regex.test(log));
                        if (matchLine) {
                          const match = matchLine.match(regex);
                          if (match && match[1]) {
                            timeMatches.push(parseFloat(match[1]));
                          }
                        }
                      }
                      
                      if (timeMatches.length > 0) {
                        console.log(t('extractedTimesFromLogs'), timeMatches);
                        avgTimes = timeMatches;
                      }
                    }
                    
                    if (avgTimes.length === 0 || avgTimes.every(time => time === 0)) {
                      const forceAvgTimes = [];
                      results?.players?.forEach(player => {
                        if (player.answers && player.answers.length > 0) {
                          player.answers.forEach((answer, i) => {
                            if (answer.questionStartedAt && answer.answeredAt) {
                              const startTime = new Date(answer.questionStartedAt).getTime();
                              const endTime = new Date(answer.answeredAt).getTime();
                              const timeSpent = (endTime - startTime) / 1000;
                              
                              if (!forceAvgTimes[i] && timeSpent > 0 && timeSpent < 120) {
                                forceAvgTimes[i] = timeSpent;
                              }
                            }
                          });
                        }
                      });
                      
                      if (forceAvgTimes.length > 0) {
                        console.log(t('forcingTimes'), forceAvgTimes);
                        avgTimes = forceAvgTimes;
                      }
                    }
                    
                    while (avgTimes.length < labels.length) {
                      avgTimes.push(0);
                    }
                    
                    const chartData = {
                      labels,
                      datasets: [
                        {
                          label: t('averageTime'),
                          data: avgTimes,
                          backgroundColor: 'rgba(255, 99, 132, 0.2)',
                          borderColor: 'rgba(255, 99, 132, 1)',
                          borderWidth: 2,
                          tension: 0.4,
                          pointRadius: 5,
                          pointHoverRadius: 7,
                          fill: false
                        },
                      ],
                    };
                    
                    console.log(t('creatingTimeChart'), chartData);
                    console.log(t('timeDetailData'), avgTimes.map((time, i) => tf('questionNumber', (i+1).toString()) + ': ' + time.toFixed(2) + t('seconds')).join(', '));
                    
                    const hasValidData = chartData && 
                                        chartData.labels && 
                                        chartData.labels.length > 0 &&
                                        chartData.datasets && 
                                        chartData.datasets[0] &&
                                        chartData.datasets[0].data;
                    
                    if (hasValidData) {
                      const maxTime = Math.max(...avgTimes, 1);
                      const suggestedMax = Math.ceil(maxTime * 1.2);
                      
                      return (
                        <Box sx={{ height: '300px', width: '100%', padding: '10px' }}>
                          <Line 
                            data={chartData} 
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  suggestedMax: suggestedMax,
                                  min: 0,
                                  ticks: {
                                    callback: (value) => value + t('seconds'),
                                    stepSize: suggestedMax > 10 ? Math.ceil(suggestedMax/5) : 1
                                  },
                                  grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                  },
                                  title: {
                                    display: true,
                                    text: t('averageTime'),
                                    font: {
                                      weight: 'bold'
                                    }
                                  }
                                },
                                x: {
                                  grid: {
                                    display: false
                                  }
                                }
                              },
                              plugins: {
                                legend: {
                                  display: false
                                },
                                tooltip: {
                                  callbacks: {
                                    label: (context) => t('averageTime') + ': ' + parseFloat(context.formattedValue).toFixed(2) + t('seconds')
                                  }
                                }
                              },
                              animation: {
                                duration: 1000
                              }
                            }} 
                          />
                        </Box>
                      );
                    } else {
                      return (
                        <Alert severity="info">
                          {gameInfo && gameInfo.questions && gameInfo.questions.length > 0 ? 
                            t('noResultDataYet') : 
                            t('noQuestionsNoChart')}
                        </Alert>
                      );
                    }
                  })()}
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>
      
      <Snackbar open={alertInfo.open} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity={alertInfo.severity} sx={{ width: '100%' }}>
          {alertInfo.message}
        </Alert>
      </Snackbar>
      
      <Dialog
        open={showResultDialog}
        onClose={handleCloseResultDialog}
        aria-labelledby="result-dialog-title"
        aria-describedby="result-dialog-description"
      >
        <DialogTitle id="result-dialog-title">
          {t('sessionEnded')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="result-dialog-description">
            {t('viewResultsQuestion')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResultDialog} color="primary">
            {t('no')}
          </Button>
          <Button onClick={handleViewResults} color="primary" autoFocus>
            {t('yes')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SessionAdmin; 
