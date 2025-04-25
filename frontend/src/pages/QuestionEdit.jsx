import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  MenuItem,
  Select,
  InputLabel,
  Checkbox,
  IconButton,
  Paper,
  Grid,
  Divider,
  Snackbar,
  Alert,
  InputAdornment,
  Card,
  CardContent
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { gameAPI } from '../services/api';
import useTranslation from '../locales/useTranslation';

const QuestionEdit = () => {
  const { gameId, questionId } = useParams();
  const navigate = useNavigate();
  const { t, tf } = useTranslation();
  
  const [game, setGame] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'success' });
  
  const fetchGameAndQuestion = async () => {
    try {
      setLoading(true);
      const response = await gameAPI.getGame(gameId);
      setGame(response.data);
      
      const foundQuestion = response.data.questions?.find(q => q.id === questionId);
      if (foundQuestion) {
        setQuestion(foundQuestion);
      } else {
        const newQuestion = {
          id: questionId,
          question: t('newQuestion'),
          type: 'single',
          timeLimit: 30,
          points: 10,
          answers: [
            { id: Date.now().toString(), answer: tf('answerPlaceholder', '1'), isCorrect: true },
            { id: (Date.now() + 1).toString(), answer: tf('answerPlaceholder', '2'), isCorrect: false },
          ],
          isNew: true
        };
        setQuestion(newQuestion);
      }
    } catch (error) {
      console.error(t('fetchGameError'), error);
      showAlert(t('fetchGameError'), 'error');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchGameAndQuestion();
  }, [gameId, questionId]);
  
  const showAlert = (message, severity = 'success') => {
    const translatedMessage = t(message);
    setAlertInfo({ open: true, message: translatedMessage, severity });
  };
  
  const handleCloseAlert = () => {
    setAlertInfo({ ...alertInfo, open: false });
  };
  
  const handleQuestionChange = (field, value) => {
    if (field === 'type' && value === 'boolean') {
      const updatedAnswers = [
        { id: Date.now().toString(), answer: t('true'), isCorrect: true },
        { id: (Date.now() + 1).toString(), answer: t('false'), isCorrect: false },
      ];
      setQuestion({
        ...question,
        [field]: value,
        answers: updatedAnswers
      });
    } else {
      setQuestion({
        ...question,
        [field]: value
      });
    }
  };
  
  const handleAnswerChange = (index, field, value) => {
    const updatedAnswers = [...question.answers];
    updatedAnswers[index] = {
      ...updatedAnswers[index],
      [field]: value
    };
    setQuestion({
      ...question,
      answers: updatedAnswers
    });
  };
  
  const handleAddAnswer = () => {
    if (question.type === 'boolean') {
      showAlert(t('trueFalseFixedAnswers'), 'warning');
      return;
    }
    
    if (question.answers.length >= 6) {
      showAlert(t('maxAnswersWarning'), 'warning');
      return;
    }
    
    const newAnswer = {
      id: Date.now().toString(),
      answer: tf('answerPlaceholder', (question.answers.length + 1).toString()),
      isCorrect: false
    };
    
    setQuestion({
      ...question,
      answers: [...question.answers, newAnswer]
    });
  };
  
  const handleDeleteAnswer = (index) => {
    if (question.type === 'boolean') {
      showAlert(t('trueFalseFixedAnswers'), 'warning');
      return;
    }
    
    if (question.answers.length <= 2) {
      showAlert(t('minAnswersWarning'), 'warning');
      return;
    }
    
    const updatedAnswers = [...question.answers];
    updatedAnswers.splice(index, 1);
    
    if (question.type === 'single' && !updatedAnswers.some(a => a.isCorrect)) {
      updatedAnswers[0].isCorrect = true;
    }
    
    setQuestion({
      ...question,
      answers: updatedAnswers
    });
  };
  
  const handleSingleAnswerSelect = (answerId) => {
    const updatedAnswers = question.answers.map(answer => ({
      ...answer,
      isCorrect: answer.id === answerId
    }));
    
    setQuestion({
      ...question,
      answers: updatedAnswers
    });
  };
  
  const handleSaveQuestion = async () => {
    if (!question.question) {
      showAlert(t('questionRequired'), 'error');
      return;
    }
    
    if (question.answers.length < 2) {
      showAlert(t('minAnswersWarning'), 'error');
      return;
    }
    
    if (question.type === 'single' && !question.answers.some(a => a.isCorrect)) {
      showAlert(t('singleCorrectRequired'), 'error');
      return;
    }
    
    if (question.type === 'multiple' && !question.answers.some(a => a.isCorrect)) {
      showAlert(t('multipleCorrectRequired'), 'error');
      return;
    }
    
    if (question.timeLimit <= 0 || question.points <= 0) {
      showAlert(t('invalidTimeOrPoints'), 'error');
      return;
    }
    
    try {
      const response = await gameAPI.getGame(gameId);
      
      if (!response.data.questions) {
        response.data.questions = [];
      }
      
      const updatedGame = JSON.parse(JSON.stringify(response.data));
      
      const questionToSave = JSON.parse(JSON.stringify(question));
      delete questionToSave.isNew;
      
      if (question.isNew) {
        updatedGame.questions.push(questionToSave);
      } else {
        const index = updatedGame.questions.findIndex(q => q.id === questionId);
        
        if (index !== -1) {
          updatedGame.questions[index] = questionToSave;
        } else {
          updatedGame.questions.push(questionToSave);
        }
      }
      
      try {
        console.log(t('tryingQuestionSaveAPI'));
        const saveResponse = await gameAPI.updateGameQuestions(gameId, updatedGame.questions);
        console.log(t('questionSaveResponse'), saveResponse);
        
        if (saveResponse.status === 200) {
          if (question.isNew) {
            setQuestion({ ...question, isNew: false });
          }
          
          setGame(updatedGame);
          showAlert(t('saveSuccess'), 'success');
          
          setTimeout(() => {
            navigate(`/game/${gameId}`);
          }, 800);
        }
      } catch (apiError) {
        console.error(t('specializedAPISaveError'), apiError);
        
        updatedGame.name = updatedGame.name || 'Unnamed Game';
        updatedGame.thumbnail = updatedGame.thumbnail || '';
        
        console.log(t('fallbackToTraditionalUpdate'));
        console.log(t('updatedGameData'), updatedGame);
        
        const saveResponse = await gameAPI.updateGame(gameId, updatedGame);
        console.log(t('traditionalSaveResponse'), saveResponse);
        
        if (saveResponse && saveResponse.data) {
          const refreshResponse = await gameAPI.getGame(gameId);
          const savedQuestions = refreshResponse.data.questions || [];
          
          const questionExists = savedQuestions.some(q => q.id === questionId);
          
          if (questionExists) {
            setGame(refreshResponse.data);
            
            if (question.isNew) {
              setQuestion({ ...question, isNew: false });
            }
            
            showAlert(t('saveSuccess'), 'success');
            
            setTimeout(() => {
              navigate(`/game/${gameId}`);
            }, 800);
          }
        }
      }
      
      try {
        await gameAPI.forceUpdateQuestion(gameId, questionToSave);
        showAlert(t('saveSuccess'), 'success');
        
        setGame(updatedGame);
        
        setTimeout(() => {
          navigate(`/game/${gameId}`);
        }, 800);
      } catch (finalError) {
        console.error(t('allMethodsFailed'), finalError);
        showAlert(t('saveError'), 'error');
      }
    } catch (error) {
      console.error(t('saveError'), error);
      showAlert(t('saveError'), 'error');
    }
  };
  
  if (loading || !question) {
    return (
      <Container sx={{ py: 4, minHeight: '100vh' }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography variant="h5" color="text.secondary">
            {t('loading')}
          </Typography>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            color="primary"
            onClick={() => navigate(`/game/${gameId}`)}
            sx={{ mb: 2 }}
          >
            {t('backToGame')}
          </Button>
          
          <Typography variant="h4" component="h1" gutterBottom>
            {question.isNew ? t('createQuestion') : t('editQuestion')}
          </Typography>
          <Divider sx={{ mb: 3 }} />
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label={t('questionText')}
              fullWidth
              multiline
              rows={2}
              value={question.question}
              onChange={(e) => handleQuestionChange('question', e.target.value)}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="question-type-label">{t('questionType')}</InputLabel>
              <Select
                labelId="question-type-label"
                value={question.type}
                onChange={(e) => handleQuestionChange('type', e.target.value)}
                label={t('questionType')}
              >
                <MenuItem value="single">{t('singleChoice')}</MenuItem>
                <MenuItem value="multiple">{t('multipleChoice')}</MenuItem>
                <MenuItem value="boolean">{t('trueFalse')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('mediaUrl')}
              fullWidth
              value={question.media || ''}
              onChange={(e) => handleQuestionChange('media', e.target.value)}
              variant="outlined"
              placeholder="https://www.youtube.com/watch?v=..."
              helperText={t('optionalMediaUrl')}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('timeLimit')}
              fullWidth
              type="number"
              value={question.timeLimit}
              onChange={(e) => handleQuestionChange('timeLimit', parseInt(e.target.value) || 0)}
              InputProps={{
                endAdornment: <InputAdornment position="end">{t('seconds')}</InputAdornment>,
              }}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('points')}
              fullWidth
              type="number"
              value={question.points}
              onChange={(e) => handleQuestionChange('points', parseInt(e.target.value) || 0)}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              {t('answers')}
            </Typography>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {question.type === 'single' ? t('singleChoiceHint') : 
                    question.type === 'multiple' ? t('multipleChoiceHint') : 
                      t('trueFalseHint')}
                </Typography>
              </CardContent>
            </Card>
            
            <Box sx={{ mb: 2 }}>
              {question.answers.map((answer, index) => (
                <Grid container spacing={2} key={answer.id} sx={{ mb: 2 }}>
                  <Grid item xs={8}>
                    <TextField
                      label={`${t('answer')} ${index + 1}`}
                      fullWidth
                      value={answer.answer}
                      onChange={(e) => handleAnswerChange(index, 'answer', e.target.value)}
                      disabled={question.type === 'boolean'}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteAnswer(index)}
                      disabled={question.answers.length <= 2 || question.type === 'boolean'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                  <Grid item xs={2}>
                    {question.type === 'single' ? (
                      <Radio
                        checked={answer.isCorrect}
                        onChange={() => handleSingleAnswerSelect(answer.id)}
                        color="success"
                      />
                    ) : (
                      <Checkbox
                        checked={answer.isCorrect}
                        onChange={(e) => handleAnswerChange(index, 'isCorrect', e.target.checked)}
                        color="success"
                      />
                    )}
                  </Grid>
                </Grid>
              ))}
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddAnswer}
              disabled={question.type === 'boolean' || question.answers.length >= 6}
              sx={{ mb: 4 }}
            >
              {t('addAnswer')}
            </Button>
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ mb: 3 }} />
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSaveQuestion}
              >
                {t('saveQuestion')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alertInfo.severity}>
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default QuestionEdit; 