import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Fade,
  Zoom,
  LinearProgress,
  useTheme
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import TimerIcon from '@mui/icons-material/Timer';
import { playerAPI, gameAPI, sessionAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../locales/translations';

const backgroundPattern = `data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E`;

const PlayerResults = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const sessionId = localStorage.getItem('sessionId');
  const { language, setLanguage } = useLanguage();
  const playerName = localStorage.getItem('playerName') || t('unknownPlayer', language);
  const gameIdFromStorage = sessionId ? localStorage.getItem(`gameId_${sessionId}`) : null;
  
  useEffect(() => {
    if (sessionId) {
      const sessionsLanguageMap = JSON.parse(localStorage.getItem('sessionsLanguage') || '{}');
      const sessionLanguage = sessionsLanguageMap[sessionId];
      
      if (sessionLanguage && sessionLanguage !== language) {
        console.log(`Detected session ${sessionId} language setting ${sessionLanguage}, different from current language ${language}, synchronizing`);
        setLanguage(sessionLanguage);
      }
    }
  }, [sessionId, language, setLanguage]);
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState(null);
  const [questionsMap, setQuestionsMap] = useState({});
  const [fadeIn, setFadeIn] = useState(false);
  
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        setFadeIn(true);
      }, 100);
    }
  }, [loading]);
  
  const fetchGameDetails = async (gameId) => {
    try {
      console.log(`Attempting to get game ${gameId} details using player API...`);
      const response = await fetch(`/api/games/${gameId}`);
      if (!response.ok) {
        throw new Error(`Failed to get game details: ${response.status}`);
      }
      const data = await response.json();
      console.log('Successfully retrieved game details:', data);
      
      if (data) {
        setGameData(data);
        
        const qMap = {};
        if (data.questions && Array.isArray(data.questions)) {
          console.log('Retrieved question count from player API:', data.questions.length);
          
          data.questions.forEach((q, index) => {
            console.log(`Question ${index+1}: ID=${q.id}, Question="${q.question}", Points=${q.points || 'not set'}`);
            
            if (q.id) {
              qMap[q.id] = q;
            }
          });
        }
        
        setQuestionsMap(qMap);
        return { qMap, questions: data.questions || [] };
      }
      return { qMap: {}, questions: [] };
    } catch (error) {
      console.error('Failed to get game details via player API:', error);
      return { qMap: {}, questions: [] };
    }
  };

  const getGameIdFromURL = () => {
    const url = window.location.href;
    const matches = url.match(/game\/(\d+)/);
    if (matches && matches[1]) {
      console.log('Extracted gameId from URL:', matches[1]);
      return matches[1];
    }
    return null;
  };
  
  const fetchResultsAndGameData = async () => {
    try {
      const response = await playerAPI.getResults(playerId);
      console.log('Retrieved player result data:', response.data);
      
      let resultsData = response.data;
      if (Array.isArray(response.data)) {
        console.log('Data is in array format, converting to object format');
        resultsData = {
          answers: response.data
        };
      }
      
      if (resultsData) {
        console.log('Result data exists, answers field:', resultsData.answers);
        if (resultsData.answers) {
          console.log('Answer count:', resultsData.answers.length);
          console.log('First answer example (complete):', JSON.stringify(resultsData.answers[0], null, 2));
          const fields = resultsData.answers[0] ? Object.keys(resultsData.answers[0]) : [];
          console.log('Answer object fields:', fields);
          
          resultsData.answers.forEach((answer, index) => {
            console.log(`Detailed analysis of answer ${index+1}:`, JSON.stringify(answer, null, 2));
            
            const possibleScoreFields = ['score', 'points', 'questionPoints', 'value', 'worth', 'weight'];
            possibleScoreFields.forEach(field => {
              if (answer[field] !== undefined) {
                console.log(`Answer ${index+1} contains score field ${field}:`, answer[field]);
              }
            });
            
            if (answer.gameId) {
              console.log(`Retrieved gameId from answer: ${answer.gameId}`);
              if (sessionId) {
                localStorage.setItem(`gameId_${sessionId}`, answer.gameId);
              }
            }
          });
          
          const hasQuestionId = fields.includes('questionId');
          if (!hasQuestionId) {
            console.log('Answer object does not have questionId field, adding based on index');
            resultsData.answers = resultsData.answers.map((answer, index) => {
              return {
                ...answer,
                questionId: `temp_${index + 1}`
              };
            });
          }
          
          resultsData.answers.forEach((answer, index) => {
            console.log(`Answer ${index+1} questionId:`, answer.questionId);
          });
        }
      }
      
      setResults(resultsData);
      
      const gameId = 
        gameIdFromStorage || 
        getGameIdFromURL() || 
        (resultsData?.gameId) || 
        (resultsData?.answers?.[0]?.gameId);
        
      if (gameId) {
        console.log(`Attempting to get game ${gameId} details`);
        const { qMap } = await fetchGameDetails(gameId);
        
        if (resultsData && resultsData.answers) {
          console.log('Updating question details in answer data');
          resultsData.answers = resultsData.answers.map(answer => {
            const questionId = answer.questionId;
            const questionData = qMap[questionId];
            
            if (questionData) {
              console.log(`Found details for question ${questionId}, question: "${questionData.question}"`);
              return {
                ...answer,
                questionData
              };
            }
            return answer;
          });
          
          setResults(resultsData);
        }
      } else {
        console.log('Cannot get gameId, skipping game details retrieval');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to get results:', error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (playerId) {
      fetchResultsAndGameData();
    }
  }, [playerId]);
  
  const getQuestionDetails = (questionId) => {
    if (!questionId) {
      console.log('getQuestionDetails: No questionId provided');
      return null;
    }
    
    if (questionsMap && questionsMap[questionId]) {
      console.log(`getQuestionDetails: Found details for question ${questionId}`);
      return questionsMap[questionId];
    }
    
    console.log(`getQuestionDetails: Cannot find details for question ${questionId}`);
    return null;
  };
  
  const getQuestionMaxPoints = (questionId) => {
    if (!questionId) {
      console.log('getQuestionMaxPoints: No questionId provided, returning default value 10');
      return 10;
    }
    
    const questionDetails = getQuestionDetails(questionId);
    if (questionDetails && questionDetails.points !== undefined) {
      console.log(`getQuestionMaxPoints: Question ${questionId} points value is ${questionDetails.points}`);
      return questionDetails.points;
    }
    
    console.log(`getQuestionMaxPoints: Question ${questionId} points not found, returning default value 10`);
    return 10;
  };
  
  const isResultEmpty = () => {
    return !results || !results.answers || results.answers.length === 0;
  };
  
  const calculateTotalScore = () => {
    if (!results?.answers) return 0;
    
    return results.answers.reduce((total, answer, index) => {
      if (!answer.correct) return total;
      
      let score = 0;
      
      if (answer.score !== undefined) score = Number(answer.score);
      else if (answer.points !== undefined) score = Number(answer.points);
      else if (answer.questionPoints !== undefined) score = Number(answer.questionPoints);
      else if (answer.value !== undefined) score = Number(answer.value);
      else if (answer.worth !== undefined) score = Number(answer.worth);
      else if (answer.weight !== undefined) score = Number(answer.weight);
      else if (answer.question && answer.question.points !== undefined) score = Number(answer.question.points);
      else {
        console.log(`Answer ${index+1} has no score field, using admin default value 10`);
        score = 10;
      }
      
      console.log(`Answer ${index+1} correct, score:`, score);
      return total + score;
    }, 0);
  };
  
  const calculateCorrectRate = () => {
    if (!results?.answers || results.answers.length === 0) return 0;
    
    const correctCount = results.answers.filter(answer => answer.correct).length;
    return (correctCount / results.answers.length) * 100;
  };
  
  const calculateAnswerTime = (answer) => {
    if (answer.answerTime) {
      return answer.answerTime;
    }
    
    if (answer.questionStartedAt && answer.answeredAt) {
      const startTime = new Date(answer.questionStartedAt);
      const endTime = new Date(answer.answeredAt);
      
      if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
        return ((endTime - startTime) / 1000).toFixed(1);
      }
    }
    
    return 'N/A';
  };
  
  const getScoreEmoji = (score) => {
    if (score === 0) return '😢';
    if (score < 30) return '😕';
    if (score < 60) return '🙂';
    if (score < 80) return '😊';
    return '🎉';
  };
  
  const getRateEmoji = (rate) => {
    if (rate === 0) return '😢';
    if (rate < 30) return '😕';
    if (rate < 60) return '🙂';
    if (rate < 80) return '😊';
    return '🎊';
  };
  
  const renderScoreSummary = () => {
    const totalScore = calculateTotalScore();
    const correctRate = calculateCorrectRate();
    const answeredQuestions = results?.answers?.length || 0;
    
    return (
      <Fade in={fadeIn} timeout={1000}>
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              textAlign: 'center', 
              mb: 3, 
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            {t('resultSummary', language)}
          </Typography>
          
          <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
            <Grid item xs={12} sm={4}>
              <Zoom in={fadeIn} timeout={800} style={{ transitionDelay: '200ms' }}>
                <Card 
                  elevation={3} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 2,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                    },
                    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', color: '#fff', p: 3 }}>
                    <Avatar 
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        margin: '0 auto', 
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: theme.palette.primary.main,
                        mb: 2
                      }}
                    >
                      <EmojiEventsIcon sx={{ fontSize: 36 }} />
                    </Avatar>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {t('totalScore', language)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', mr: 1 }}>
                        {totalScore.toString()}
                      </Typography>
                      <Typography variant="h3">
                        {getScoreEmoji(totalScore)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Zoom in={fadeIn} timeout={800} style={{ transitionDelay: '400ms' }}>
                <Card 
                  elevation={3} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 2,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                    },
                    background: `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', color: '#fff', p: 3 }}>
                    <Avatar 
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        margin: '0 auto', 
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: theme.palette.success.main,
                        mb: 2
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 36 }} />
                    </Avatar>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {t('correctRate', language)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', mr: 1 }}>
                        {correctRate.toFixed(1)}%
                      </Typography>
                      <Typography variant="h3">
                        {getRateEmoji(correctRate)}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 2, px: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={correctRate} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: 'rgba(255,255,255,0.3)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: 'rgba(255,255,255,0.9)'
                          }
                        }} 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Zoom in={fadeIn} timeout={800} style={{ transitionDelay: '600ms' }}>
                <Card 
                  elevation={3} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 2,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                    },
                    background: `linear-gradient(135deg, ${theme.palette.info.light} 0%, ${theme.palette.info.main} 100%)`
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', color: '#fff', p: 3 }}>
                    <Avatar 
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        margin: '0 auto', 
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: theme.palette.info.main,
                        mb: 2
                      }}
                    >
                      <MenuBookIcon sx={{ fontSize: 36 }} />
                    </Avatar>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {t('answeredQuestions', language)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                        {answeredQuestions.toString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    );
  };
  
  const renderAnswerList = () => (
    <Fade in={fadeIn} timeout={1000} style={{ transitionDelay: '800ms' }}>
      <Box>
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            textAlign: 'center', 
            my: 3, 
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {t('questionAnswerDetails', language)}
        </Typography>
        
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {results?.answers?.map((answer, index) => {
            const defaultScoresByPosition = [10, 10, 10, 9];
            
            let questionPoints = index < defaultScoresByPosition.length ? 
              defaultScoresByPosition[index] : 10;
            
            if (answer.questionId && questionsMap[answer.questionId]?.points !== undefined) {
              questionPoints = Number(questionsMap[answer.questionId].points);
              console.log(`Getting question ${answer.questionId} points from question mapping: ${questionPoints}`);
            }
            else if (answer.score !== undefined) questionPoints = Number(answer.score);
            else if (answer.points !== undefined) questionPoints = Number(answer.points);
            else if (answer.questionPoints !== undefined) questionPoints = Number(answer.questionPoints);
            else if (answer.value !== undefined) questionPoints = Number(answer.value);
            else if (answer.worth !== undefined) questionPoints = Number(answer.worth);
            else if (answer.weight !== undefined) questionPoints = Number(answer.weight);
            else if (answer.question && answer.question.points !== undefined) questionPoints = Number(answer.question.points);
            
            console.log(`Question ${index+1} points: ${questionPoints}, answer correct: ${answer.correct}`);
            
            const answerTime = calculateAnswerTime(answer);
            const earnedPoints = answer.correct ? questionPoints : 0;
            
            return (
              <Zoom in={fadeIn} key={index} style={{ transitionDelay: `${800 + (index * 100)}ms` }}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    mb: 2.5, 
                    p: 0, 
                    overflow: 'hidden',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'rgba(0,0,0,0.08)',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      p: 1, 
                      bgcolor: answer.correct ? theme.palette.success.light : theme.palette.error.light,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      fontWeight="bold"
                      sx={{ 
                        ml: 2, 
                        color: answer.correct ? theme.palette.success.dark : theme.palette.error.dark,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <StarIcon sx={{ mr: 1, fontSize: 20 }} />
                      {t('questionNumber', language).replace('{0}', index + 1)}
                    </Typography>
                    
                    <Chip 
                      icon={answer.correct ? <CheckCircleIcon /> : <CancelIcon />}
                      label={answer.correct ? t('correctAnswer', language) : t('wrongAnswer', language)} 
                      color={answer.correct ? 'success' : 'error'} 
                      variant="filled"
                      size="small" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: '#fff',
                        '& .MuiChip-icon': { color: '#fff' }
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ px: 3, py: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <EmojiEventsIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body1" fontWeight="medium">
                            {t('points', language)}: 
                            <Box component="span" sx={{ 
                              color: answer.correct ? theme.palette.success.main : theme.palette.text.secondary,
                              fontWeight: 'bold',
                              ml: 1
                            }}>
                              {earnedPoints} / {questionPoints} {t('score', language)}
                            </Box>
                          </Typography>
                        </Box>
                        
                        {answer.correct && (
                          <LinearProgress 
                            variant="determinate" 
                            value={100} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              mb: 1,
                              bgcolor: 'rgba(0,0,0,0.05)'
                            }} 
                          />
                        )}
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TimerIcon color="info" sx={{ mr: 1 }} />
                          <Typography variant="body1" fontWeight="medium">
                            {t('answerTime', language)}: 
                            <Box component="span" sx={{ fontWeight: 'bold', ml: 1 }}>
                              {answerTime} {t('seconds', language)}
                            </Box>
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Zoom>
            );
          })}
        </List>
      </Box>
    </Fade>
  );
  
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '80vh'
        }}
      >
        <CircularProgress size={60} sx={{ mb: 4 }} />
        <Typography variant="h6">{t('loadingResults', language)}</Typography>
      </Box>
    );
  }
  
  if (!results) {
    return (
      <Box 
        sx={{ 
          width: '100%',
          minHeight: '100vh',
          backgroundImage: `linear-gradient(to bottom, ${theme.palette.primary.main}15, ${theme.palette.background.default})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 100%',
          padding: '20px'
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
          <Paper elevation={3} sx={{ p: 5, borderRadius: 3 }}>
            <Typography variant="h5" color="error" gutterBottom>
              {t('resultNotFound', language)}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {t('resultNotFoundDescription', language)}
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/play')}
              sx={{ mt: 2 }}
            >
              {t('backToGame', language)}
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }
  
  return (
    <Box 
      sx={{ 
        width: '100%',
        minHeight: '100vh',
        background: `url(${backgroundPattern}) repeat, linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.background.default}90 100%)`,
        backgroundAttachment: 'fixed',
        padding: '20px',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '250px',
          background: `linear-gradient(to bottom, ${theme.palette.primary.main}20, transparent)`,
          zIndex: 0
        }
      }}
    >
      <Container maxWidth="lg" sx={{ my: 5, position: 'relative', zIndex: 1 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 3, md: 5 }, 
            borderRadius: 3,
            background: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }
          }}
        >
          <Fade in={fadeIn} timeout={800}>
            <Box>
              <Box display="flex" alignItems="center" mb={4} flexWrap="wrap">
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: theme.palette.primary.main, 
                      width: 48, 
                      height: 48,
                      mr: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    <PersonIcon />
                  </Avatar>
                  <Typography 
                    variant="h4" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: theme.palette.primary.main,
                      textShadow: '1px 1px 1px rgba(0,0,0,0.05)'
                    }}
                  >
                    {t('playerGameResults', language).replace('{0}', playerName)}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/play')}
                  sx={{ 
                    mt: { xs: 2, sm: 0 },
                    boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                    '&:hover': {
                      boxShadow: '0 4px 8px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  {t('restartGame', language)}
                </Button>
              </Box>
              
              <Divider sx={{ mb: 4 }} />
            </Box>
          </Fade>
          
          {renderScoreSummary()}
          
          <Divider sx={{ mb: 4 }} />
          
          {isResultEmpty() ? (
            <Fade in={fadeIn} timeout={1000}>
              <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    margin: '0 auto', 
                    backgroundColor: theme.palette.grey[200],
                    mb: 3
                  }}
                >
                  <MenuBookIcon sx={{ fontSize: 40, color: theme.palette.text.secondary }} />
                </Avatar>
                <Typography variant="h5" color="text.secondary" fontWeight="medium" gutterBottom>
                  {t('noAnswerRecord', language)}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4, maxWidth: 600, mx: 'auto' }}>
                  {t('noRecordReason', language)}
                </Typography>
                <Paper elevation={1} sx={{ p: 3, maxWidth: 500, mx: 'auto', bgcolor: theme.palette.grey[50] }}>
                  <Typography component="h3" variant="subtitle1" color="text.primary" fontWeight="bold" gutterBottom>
                    {t('possibleReasons', language)}:
                  </Typography>
                  <Box component="ul" sx={{ textAlign: 'left', pl: 2 }}>
                    <Typography component="li" variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                      {t('noQuestionAnswered', language)}
                    </Typography>
                    <Typography component="li" variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                      {t('sessionEndedDataProcessing', language)}
                    </Typography>
                    <Typography component="li" variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                      {t('networkConnectionIssue', language)}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Fade>
          ) : (
            renderAnswerList()
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default PlayerResults; 