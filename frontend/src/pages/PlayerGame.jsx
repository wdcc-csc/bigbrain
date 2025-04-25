import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Alert
} from '@mui/material';
import { playerAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useLanguage } from '../contexts/LanguageContext';

const PlayerGame = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  
  const urlParams = new URLSearchParams(window.location.search);
  const urlSessionId = urlParams.get('session');
  
  const sessionId = urlSessionId || localStorage.getItem('sessionId');
  const playerName = localStorage.getItem('playerName');
  
  useEffect(() => {
    if (urlSessionId) {
      localStorage.setItem('sessionId', urlSessionId);
      console.log(`Retrieved and saved session ID from URL: ${urlSessionId}`);
    }
  }, [urlSessionId]);
  
  useEffect(() => {
    if (sessionId) {
      const sessionsLanguageMap = JSON.parse(localStorage.getItem('sessionsLanguage') || '{}');
      const sessionLanguage = sessionsLanguageMap[sessionId];
      
      if (sessionLanguage && sessionLanguage !== language) {
        console.log(`Detected session ${sessionId} language setting ${sessionLanguage}, which differs from current language ${language}, synchronizing`);
        setLanguage(sessionLanguage);
      }
    }
  }, [sessionId, language, setLanguage]);
  
  const [gameState, setGameState] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [longWaitMessage, setLongWaitMessage] = useState(false);
  const [answerSubmitStatus, setAnswerSubmitStatus] = useState({ 
    submitting: false, 
    submitted: false, 
    success: false, 
    error: null 
  });
  
  const pollingInterval = useRef(null);
  const countdownInterval = useRef(null);
  const waitingTimer = useRef(null);
  
  useEffect(() => {
    if (question && question.id) {
      const questionId = question.id;
      const savedAnswers = localStorage.getItem(`selectedAnswers_${sessionId}_${questionId}`);
      if (savedAnswers) {
        try {
          const parsedAnswers = JSON.parse(savedAnswers);
          console.log(`Restored answers for question ${questionId} from local storage:`, parsedAnswers);
          setSelectedAnswers(parsedAnswers);
        } catch (error) {
          console.error('Failed to parse saved answers:', error);
        }
      }
    }
  }, [question, sessionId]);
  
  const fetchCurrentQuestion = async () => {
    if (!playerId || !sessionId) {
      console.error('Missing player ID or session ID');
      setGameState('error');
      setLoading(false);
      return;
    }
    
    try {
      console.log(`Attempting to get question for player [${playerId}] in session [${sessionId}]`);
      const response = await playerAPI.getQuestion(playerId, sessionId);
      
      if (response.data.sessionEnded || response.data.error === 'Session ID is not an active session') {
        console.log('Game session has ended, redirecting to results page');
        setGameState('ended');
        setGameOver(true);
        clearIntervals();
        navigate(`/results/${playerId}`);
        setLoading(false);
        return;
      }
      
      if (response.data.waitingForStart) {
        console.log('Game session has not started yet, showing waiting screen');
        setGameState('waiting');
        setIsWaiting(true);
        setLoading(false);
        return;
      }
      
      setIsWaiting(false);
      
      if (response.data.question === null) {
        setGameState(response.data);
        setLoading(false);
        return;
      }
      
      if (response.data.question !== null) {
        const previousQuestionId = question?.id;
        const currentQuestionId = response.data.question.id;
        const isNewQuestion = previousQuestionId !== currentQuestionId;
        
        setQuestion(response.data.question);
        setGameState(response.data);
        
        console.log(`Question status update: ID=${currentQuestionId}, isNewQuestion=${isNewQuestion}, answerAvailable=${response.data.answerAvailable}`);
        
        if (response.data.answerAvailable) {
          setShowResults(true);
          
          if (response.data.playerAnswers !== null && Array.isArray(response.data.playerAnswers)) {
            const formattedAnswers = response.data.playerAnswers.map(id => String(id));
            console.log('Server-saved answers:', formattedAnswers);
            setSelectedAnswers(formattedAnswers);
            
            setAnswerSubmitStatus({
              submitting: false,
              submitted: true,
              success: true,
              error: null
            });
            
            localStorage.setItem(`selectedAnswers_${sessionId}_${currentQuestionId}`, JSON.stringify(formattedAnswers));
            localStorage.setItem(`answerSubmitted_${sessionId}_${currentQuestionId}`, 'true');
          }
        } else {
          setShowResults(false);
          
          if (isNewQuestion) {
            console.log('Detected new question, attempting to restore saved answers');
            
            const savedAnswers = localStorage.getItem(`selectedAnswers_${sessionId}_${currentQuestionId}`);
            const wasSubmitted = localStorage.getItem(`answerSubmitted_${sessionId}_${currentQuestionId}`);
            
            if (savedAnswers) {
              try {
                const parsedAnswers = JSON.parse(savedAnswers);
                console.log(`Restored answers for question ${currentQuestionId} from local storage:`, parsedAnswers);
                setSelectedAnswers(parsedAnswers);
                
                if (wasSubmitted === 'true') {
                  console.log('Answer was already submitted, updating state');
                  setAnswerSubmitStatus({
                    submitting: false,
                    submitted: true,
                    success: true,
                    error: null
                  });
                } else {
                  console.log('Answer not yet submitted');
                  setAnswerSubmitStatus({
                    submitting: false,
                    submitted: false,
                    success: false,
                    error: null
                  });
                }
              } catch (error) {
                console.error('Failed to restore saved answers:', error);
                setSelectedAnswers([]);
              }
            } else {
              console.log('No saved answers found, resetting selection state');
              setSelectedAnswers([]);
              setAnswerSubmitStatus({
                submitting: false,
                submitted: false,
                success: false,
                error: null
              });
            }
          }
        }
        
        if (isNewQuestion || timeLeft <= 0 || !countdownInterval.current) {
          const timeLimit = response.data.question.timeLimit || 30;
          const startTime = new Date(response.data.isoTimeLastQuestionStarted);
          const currentTime = new Date();
          const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
          const remainingSeconds = Math.max(0, timeLimit - elapsedSeconds);
          
          const safeTimeLeft = isNaN(remainingSeconds) ? timeLimit : remainingSeconds;
          setTimeLeft(safeTimeLeft);
          
          if (safeTimeLeft > 0 && !response.data.answerAvailable && !countdownInterval.current) {
            startCountdown(safeTimeLeft);
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch question:', error);
      setLoading(false);
      setGameState('error');
    }
  };
  
  useEffect(() => {
    if (!playerId || !sessionId) {
      console.log('Missing player ID or session ID, redirecting to join page');
      navigate('/play');
      return;
    }
    
    const checkSessionStatus = async () => {
      try {
        const response = await playerAPI.getSessionStatus(sessionId);
        if (response.data && !response.data.active) {
          console.log('Game session has ended, redirecting to results page');
          setGameState('ended');
          setGameOver(true);
          navigate(`/results/${playerId}`);
          return true;
        }
        return false;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('Session does not exist, possibly ended');
          setGameState('ended');
          setGameOver(true);
          navigate(`/results/${playerId}`);
          return true;
        }
        return false;
      }
    };
    
    checkSessionStatus().then(sessionEnded => {
      if (!sessionEnded) {
        fetchCurrentQuestion();
        
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
        
        const interval = isWaiting ? 5000 : 8000;
        pollingInterval.current = setInterval(() => {
          checkSessionStatus().then(ended => {
            if (!ended) {
              if (!answerSubmitStatus.submitting) {
                fetchCurrentQuestion();
              }
            }
          });
        }, interval);
      }
    });
    
    return () => {
      clearIntervals();
    };
  }, [playerId, sessionId, isWaiting, navigate]);
  
  useEffect(() => {
    if (isWaiting) {
      waitingTimer.current = setTimeout(() => {
        setLongWaitMessage(true);
      }, 30000);
    } else {
      if (waitingTimer.current) {
        clearTimeout(waitingTimer.current);
        waitingTimer.current = null;
      }
      setLongWaitMessage(false);
    }
    
    return () => {
      if (waitingTimer.current) {
        clearTimeout(waitingTimer.current);
        waitingTimer.current = null;
      }
    };
  }, [isWaiting]);
  
  const clearIntervals = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    
    if (waitingTimer.current) {
      clearTimeout(waitingTimer.current);
      waitingTimer.current = null;
    }
  };
  
  const startCountdown = (seconds) => {
    if (countdownInterval.current) {
      console.log('Countdown already running, not starting a new one');
      return;
    }
    
    const safeSeconds = isNaN(seconds) ? 30 : seconds;
    console.log(`Starting countdown from ${safeSeconds} seconds`);
    
    countdownInterval.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        const safeTime = isNaN(prevTime) ? safeSeconds : prevTime;
        
        if (safeTime <= 1) {
          console.log('Countdown reached zero, clearing interval');
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
          return 0;
        }
        return safeTime - 1;
      });
    }, 1000);
  };
  
  const handleSingleAnswerSelect = (answerId) => {
    let formattedAnswerId = answerId;
    if (!isNaN(Number(answerId))) {
      formattedAnswerId = Number(answerId);
    }
    
    console.log(`Selected single choice answer: ${formattedAnswerId} (type: ${typeof formattedAnswerId})`);
    setSelectedAnswers([formattedAnswerId]);
    
    if (question && question.id) {
      localStorage.setItem(`selectedAnswers_${sessionId}_${question.id}`, JSON.stringify([formattedAnswerId]));
    }

    submitAnswer([formattedAnswerId]);
  };
  
  const handleMultipleAnswerSelect = (answerId, checked) => {
    let formattedAnswerId = answerId;
    if (!isNaN(Number(answerId))) {
      formattedAnswerId = Number(answerId);
    }
    
    console.log(`Selected multiple choice answer: ${formattedAnswerId} (type: ${typeof formattedAnswerId}), checked: ${checked}`);
    
    let newSelectedAnswers;
    
    if (checked) {
      newSelectedAnswers = [...selectedAnswers.filter(id => id !== formattedAnswerId && Number(id) !== Number(formattedAnswerId)), formattedAnswerId];
    } else {
      newSelectedAnswers = selectedAnswers.filter(id => id !== formattedAnswerId && Number(id) !== Number(formattedAnswerId));
    }
    
    newSelectedAnswers = newSelectedAnswers.map(id => {
      return !isNaN(Number(id)) ? Number(id) : id;
    });
    
    console.log('Updated selected answers:', newSelectedAnswers);
    console.log('Answer types:', newSelectedAnswers.map(id => typeof id));
    setSelectedAnswers(newSelectedAnswers);
    
    if (question && question.id) {
      localStorage.setItem(`selectedAnswers_${sessionId}_${question.id}`, JSON.stringify(newSelectedAnswers));
    }

    submitAnswer(newSelectedAnswers);
  };
  
  const submitAnswer = async (answers) => {
    if (answerSubmitStatus.submitting) {
      console.log('Already submitting answer, ignoring this submission');
      return;
    }
    
    setAnswerSubmitStatus({ 
      submitting: true, 
      submitted: false, 
      success: false, 
      error: null 
    });
    
    try {
      console.log(`Submitting player [${playerId}]'s answer in session [${sessionId}]:`, answers);
      const response = await playerAPI.submitAnswer(playerId, answers, sessionId);
      
      if (response && response.status >= 200 && response.status < 300) {
        console.log('Answer submitted successfully:', response.data);
        
        if (response.data && response.data.sessionEnded) {
          console.log('Game session has ended, redirecting to results page');
          setGameOver(true);
          clearIntervals();
          navigate(`/results/${playerId}`);
          return;
        }
        
        setAnswerSubmitStatus({ 
          submitting: false, 
          submitted: true, 
          success: true, 
          error: null 
        });
        
        if (question && question.id) {
          localStorage.setItem(`answerSubmitted_${sessionId}_${question.id}`, 'true');
        }
        
        toast.success('Answer submitted successfully');
        
        return;
      } else {
        console.warn('Abnormal answer submission response:', response);
        
        setAnswerSubmitStatus({ 
          submitting: false, 
          submitted: true, 
          success: false, 
          error: 'Abnormal submission response' 
        });
        
        if (response.data && response.data.sessionEnded) {
          console.log('Game session has ended, redirecting to results page');
          setGameOver(true);
          clearIntervals();
          navigate(`/results/${playerId}`);
        } else if (response.data && response.data.sessionFinished) {
          toast.error('Game has ended, cannot submit answer');
          setGameOver(true);
          clearIntervals();
          navigate(`/results/${playerId}`);
        } else if (response.data && response.data.questionClosed) {
          toast.warning('Time is up, cannot submit answer');
          setTimeLeft(0);
        } else {
          toast.error('Problem occurred while submitting answer, please try again later');
        }
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      
      setAnswerSubmitStatus({ 
        submitting: false, 
        submitted: true, 
        success: false, 
        error: error.message || 'Unknown error' 
      });
      
      if (error.response) {
        if (error.response.status === 410 || 
            (error.response.data && (error.response.data.sessionFinished || error.response.data.sessionEnded))) {
          console.log('Session has ended, cannot submit answer');
          toast.error('Game has ended, cannot submit answer');
          setGameOver(true);
          clearIntervals();
          navigate(`/results/${playerId}`);
          return;
        }
        
        if (error.response.status === 409 || (error.response.data && error.response.data.questionClosed)) {
          console.log('Current question is closed, cannot submit answer');
          toast.warning('Time is up, cannot submit answer');
          setTimeLeft(0);
          
          setTimeout(() => {
            // 这里不应该立即重新获取问题状态
            // fetchCurrentQuestion();
          }, 1000);
          
          return;
        }
        
        if (error.response.status === 400) {
          const errorMsg = error.response.data?.error || 'Failed to submit answer';
          
          let userMessage = 'Failed to submit answer';
          
          if (errorMsg.includes('Session') || errorMsg.includes('session')) {
            userMessage = 'Session state abnormal, please try again later';
          } else if (errorMsg.includes('Question') || errorMsg.includes('question')) {
            userMessage = 'Question state abnormal, may be closed';
          } else if (errorMsg.includes('Answer') || errorMsg.includes('answer')) {
            userMessage = 'Answer format invalid';
          }
          
          toast.error(userMessage);
        } else {
          toast.error('Problem occurred while submitting answer, please try again later');
        }
      } else {
        toast.error('Network error, unable to submit answer');
      }
    }
  };
  
  const renderWaitingScreen = () => (
    <Box display="flex" flexDirection="column" alignItems="center" p={4}>
      <Typography variant="h5" gutterBottom>
        Welcome {playerName}
      </Typography>
      <CircularProgress size={60} sx={{ my: 4 }} />
      <Typography variant="h6" align="center" gutterBottom>
        Game starting soon...
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary">
        Please wait for the admin to start the game and proceed to the first question.
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mt: 2 }}>
        The page will update automatically when the game starts, no need to refresh the browser.
      </Typography>
      
      {longWaitMessage && (
        <Box sx={{ mt: 4, p: 2, bgcolor: 'warning.light', borderRadius: 2, width: '100%', maxWidth: 500 }}>
          <Typography variant="body1" align="center" sx={{ fontWeight: 'bold' }}>
            Long Wait Time
          </Typography>
          <Typography variant="body2" align="center">
            If you've been waiting for a long time, the admin may not have started the game yet. Please contact the admin to confirm the game status.
          </Typography>
        </Box>
      )}
    </Box>
  );
  
  const renderGameOverScreen = () => (
    <Box display="flex" flexDirection="column" alignItems="center" p={4}>
      <Typography variant="h4" gutterBottom color="primary">
        Game Over
      </Typography>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Thank you {playerName} for participating!
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
        The admin has ended the game session. You can now view your results.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={() => navigate(`/results/${playerId}`)}
      >
        View Results
      </Button>
    </Box>
  );
  
  const renderQuestion = () => {
    if (!question) return null;
    
    return (
      <Box>
        {!showResults && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress 
              variant="determinate" 
              value={(timeLeft / question.timeLimit) * 100} 
              color={timeLeft < 5 ? "error" : "primary"}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="h6" align="center" sx={{ mt: 1 }}>
              {language === 'zh' 
                ? `剩余时间: ${isNaN(timeLeft) ? question.timeLimit : timeLeft} 秒` 
                : `Time left: ${isNaN(timeLeft) ? question.timeLimit : timeLeft} seconds`}
            </Typography>
          </Box>
        )}
        
        <Typography variant="h4" gutterBottom>
          {question.question}
        </Typography>
        
        {question.imageUrl && (
          <Box sx={{ my: 3, display: 'flex', justifyContent: 'center' }}>
            <img 
              src={question.imageUrl} 
              alt="Question image" 
              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
            />
          </Box>
        )}
        
        {question.videoUrl && (
          <Box sx={{ my: 3, display: 'flex', justifyContent: 'center' }}>
            <iframe
              width="560"
              height="315"
              src={question.videoUrl}
              title="Question video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </Box>
        )}
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ position: 'relative' }}>
          <Typography variant="h6" gutterBottom>
            Please select an answer:
          </Typography>
          
          {answerSubmitStatus.submitting && (
            <Box sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)', 
              zIndex: 1 
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress size={40} />
                <Typography variant="subtitle1" sx={{ mt: 2 }}>Submitting answer...</Typography>
              </Box>
            </Box>
          )}
          
          {question.type === 'single' || question.type === 'boolean' ? (
            <FormControl component="fieldset" fullWidth>
              <RadioGroup value={selectedAnswers[0] || ''}>
                <Grid container spacing={2}>
                  {question.answers.map((answer) => {
                    const isSelected = selectedAnswers.some(id => 
                      id === answer.id || 
                      (typeof id === 'number' && id === Number(answer.id)) ||
                      (typeof id === 'string' && String(id) === answer.id)
                    );
                    
                    return (
                      <Grid item xs={12} md={6} key={answer.id}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            borderColor: showResults && answer.isCorrect ? 'success.main' : 
                              (answerSubmitStatus.success && isSelected) ? 'primary.main' : 'inherit',
                            bgcolor: showResults && answer.isCorrect ? 'success.light' : 
                              (answerSubmitStatus.success && isSelected) ? 'primary.light' : 'inherit',
                          }}
                        >
                          <CardContent>
                            <FormControlLabel
                              value={answer.id}
                              control={<Radio checked={isSelected} />}
                              label={answer.answer}
                              disabled={showResults || answerSubmitStatus.submitting}
                              onChange={() => handleSingleAnswerSelect(answer.id)}
                            />
                            {showResults && answer.isCorrect && (
                              <Alert severity="success" sx={{ mt: 1 }}>Correct Answer</Alert>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </RadioGroup>
            </FormControl>
          ) : (
            <FormControl component="fieldset" fullWidth>
              <FormGroup>
                <Grid container spacing={2}>
                  {question.answers.map((answer) => {
                    const isSelected = selectedAnswers.some(id => 
                      id === answer.id || 
                      (typeof id === 'number' && id === Number(answer.id)) ||
                      (typeof id === 'string' && String(id) === answer.id)
                    );
                    
                    return (
                      <Grid item xs={12} md={6} key={answer.id}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            borderColor: showResults && answer.isCorrect ? 'success.main' : 
                              (answerSubmitStatus.success && isSelected) ? 'primary.main' : 'inherit',
                            bgcolor: showResults && answer.isCorrect ? 'success.light' : 
                              (answerSubmitStatus.success && isSelected) ? 'primary.light' : 'inherit',
                          }}
                        >
                          <CardContent>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => handleMultipleAnswerSelect(answer.id, e.target.checked)}
                                  disabled={showResults || answerSubmitStatus.submitting}
                                />
                              }
                              label={answer.answer}
                            />
                            {showResults && answer.isCorrect && (
                              <Alert severity="success" sx={{ mt: 1 }}>Correct Answer</Alert>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </FormGroup>
            </FormControl>
          )}
          
          {answerSubmitStatus.submitted && !showResults && (
            <Box sx={{ mt: 2 }}>
              {answerSubmitStatus.success ? (
                <Alert severity="success">Answer submitted successfully</Alert>
              ) : (
                <Alert severity="error">
                  Failed to submit answer: {answerSubmitStatus.error}
                  <Button 
                    size="small" 
                    variant="outlined" 
                    sx={{ ml: 2 }}
                    onClick={() => submitAnswer(selectedAnswers)}
                  >
                    Retry
                  </Button>
                </Alert>
              )}
            </Box>
          )}
        </Box>
        
        {showResults && (
          <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom color="primary">
              Waiting for the next question...
            </Typography>
          </Box>
        )}
      </Box>
    );
  };
  
  const fetchGameState = useCallback(async () => {
    try {
      setLoading(true);
      const response = await playerAPI.getQuestion(playerId, sessionId);
      console.log('Game state response:', response);

      if (response && response.data && response.data.waitingForStart) {
        console.log('Game session not yet started, showing waiting screen');
        setGameState('waiting');
        setLoading(false);
        return;
      }

      if (response && response.data && response.data.sessionEnded) {
        console.log('Game session has ended, redirecting to results page');
        setGameState('ended');
        setLoading(false);
        navigate(`/play/${playerId}/results`);
        return;
      }

      if (response.data.question) {
        setQuestion(response.data.question);
        setGameState(response.data);
        setSelectedAnswers([]);
        setShowResults(false);
        setTimeLeft(response.data.question.timeLimit || 30);
        setLoading(false);
      } else if (response.data.stage === 'ANSWER_REVEAL') {
        setGameState('answer');
      } else if (response.data.stage === 'END') {
        setGameState('ended');
        navigate(`/play/${playerId}/results`);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch question:', error);
      
      if (error.response && error.response.status === 404) {
        toast.error('Game session not found, it may have ended or does not exist');
        setGameState('error');
      } else {
        toast.error('Error getting question, please refresh the page and try again');
        setGameState('error');
      }
      setLoading(false);
    }
  }, [playerId, sessionId, navigate]);
  
  const renderGameContent = () => {
    switch (gameState) {
    case 'waiting':
      return renderWaitingScreen();
    case 'question':
      return renderQuestion();
    case 'ended':
      return renderGameOverScreen();
    case 'error':
      return (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <ErrorOutlineIcon sx={{ fontSize: 60, color: 'error.main' }} />
          <Typography variant="h4" sx={{ mt: 2 }}>
              Error
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
              Unable to load game content, please check if the session ID is correct
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/play')}
            >
                Rejoin
            </Button>
            <Button 
              variant="outlined"
              onClick={() => {
                fetchCurrentQuestion();
              }}
            >
                Retry
            </Button>
          </Box>
        </Box>
      );
    default:
      if (isWaiting) {
        return renderWaitingScreen();
      }
      if (gameOver) {
        return renderGameOverScreen();
      }
      if (question) {
        return renderQuestion();
      }
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
  };
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (gameOver) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          {renderGameOverScreen()}
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {renderGameContent()}
      </Paper>
    </Container>
  );
};

export default PlayerGame; 