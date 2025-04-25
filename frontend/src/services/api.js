import axios from 'axios';
import { REACT_APP_BACKEND_URL } from '../config';

const API_URL = REACT_APP_BACKEND_URL;


const api = axios.create({
  baseURL: API_URL,
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {

    const requestUrl = error.config?.url || '';
    const isPlayerRequest = requestUrl.includes('/play/');
    const isQuestionRequest = requestUrl.includes('/question');
    
    console.log(`Handling API error response: ${error.config?.method} ${requestUrl}`, error.response?.status);
    

    if (error.response && 
        error.response.status === 400 && 
        error.response.data && // Ensure data exists
        (
          (typeof error.response.data.error === 'string' && 
           (error.response.data.error === 'Session has not started yet' || 
            error.response.data.error.includes('not started')))
          ||
          (error.response.data.message && 
           typeof error.response.data.message === 'string' && 
           error.response.data.message.includes('not started'))
        )) {
      
      console.log('Intercepted session not started status, converting to waiting response');
      

      return {
        ...error.response,
        status: 202, 
        statusText: 'Accepted',
        data: {
          waitingForStart: true,
          message: 'Game session has not started yet',
          originalError: error.response.data.error || error.response.data.message
        }
      };
    }
    

    if (error.response && 
        error.response.status === 400 && 
        error.response.data && 
        typeof error.response.data.error === 'string' && 
        error.response.data.error === 'Session ID is not an active session') {
      
      console.log('Intercepted session ended or non-existent status');
      

      return {
        ...error.response,
        status: 410, 
        statusText: 'Gone',
        data: {
          sessionEnded: true,
          message: 'Game session has ended or does not exist',
          originalError: error.response.data.error
        }
      };
    }
    

    if (isPlayerRequest) {

      if (error.response?.status === 400) {

        const errorMsg = error.response.data?.error || '';
        
        if (errorMsg.includes('Session') || errorMsg.includes('session')) {
          console.log('Intercepted session-related error:', errorMsg);
          

          if (errorMsg.includes('Invalid session ID') || 
              errorMsg.includes('not found') ||
              errorMsg.includes('does not exist')) {
            return {
              ...error.response,
              status: 404,
              statusText: 'Not Found',
              data: {
                sessionError: true,
                message: 'Game session does not exist or is invalid',
                originalError: errorMsg
              }
            };
          }
          

          if (errorMsg.includes('begun') || errorMsg.includes('already started')) {
            return {
              ...error.response,
              status: 403,
              statusText: 'Forbidden',
              data: {
                sessionStarted: true,
                message: 'Game has already started, cannot join',
                originalError: errorMsg
              }
            };
          }
        }
        

        if (errorMsg.includes('Player') || errorMsg.includes('player')) {
          console.log('Intercepted player-related error:', errorMsg);
          
          return {
            ...error.response,
            status: 400,
            data: {
              playerError: true,
              message: 'Player information is invalid',
              originalError: errorMsg
            }
          };
        }
      }
    }
    

    return Promise.reject(error);
  }
);


export const authAPI = {
  register: (email, password, name) => api.post('/admin/auth/register', { email, password, name })
    .then(response => {

      localStorage.setItem('email', email);
      return response;
    }),
  login: (email, password) => api.post('/admin/auth/login', { email, password })
    .then(response => {
   
      localStorage.setItem('email', email);
      return response;
    }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email'); 
    return Promise.resolve();
  },
};


export const gameAPI = {
  getAllGames: () => api.get('/admin/games')
    .catch(error => {
      console.error('Failed to get game list:', error);
      throw error;
    }),
  createGame: async (name, thumbnail = '') => {

    const response = await api.get('/admin/games');
    const existingGames = response.data.games || [];
    

    const newGame = {
      id: Math.floor(Math.random() * 1000000000),
      name,
      thumbnail, 
      owner: localStorage.getItem('email')
    };
    

    return api.put('/admin/games', {
      games: [...existingGames, newGame]
    });
  },
  getGame: async (gameId) => {

    const response = await api.get('/admin/games');
    const games = response.data.games || [];
    

    const game = games.find(g => String(g.id) === String(gameId));
    
    if (!game) {
      throw new Error(`Game ID ${gameId} does not exist`);
    }
    

    if (!game.questions) {
      game.questions = [];
    }
    

    return { data: game };
  },
  updateGame: async (gameId, data) => {
    try {
      console.log('Starting to update game, Game ID:', gameId);
      console.log('Data before update:', data);
      

      if (!gameId) {
        throw new Error('Game ID must be provided');
      }
      
      if (!data) {
        throw new Error('Update data must be provided');
      }
      

      const gamesResponse = await api.get('/admin/games');
      const games = gamesResponse.data.games || [];
      console.log('All games retrieved from backend:', games);
      

      const gameIndex = games.findIndex(g => String(g.id) === String(gameId));
      
      if (gameIndex === -1) {
        throw new Error(`Game ID ${gameId} does not exist`);
      }
      
      const gameToUpdate = games[gameIndex];
      console.log('Game to update:', gameToUpdate);
      console.log('Data to update:', data);
      

      let updatedGame = { ...gameToUpdate };
      

      if (data.name) updatedGame.name = data.name;
      if (data.thumbnail !== undefined) updatedGame.thumbnail = data.thumbnail;
      if (data.owner) updatedGame.owner = data.owner;
      

      updatedGame.id = String(gameId);
      

      if (data.questions) {

        if (!Array.isArray(data.questions)) {
          throw new Error('Questions must be in array format');
        }
        

        const questionsCopy = JSON.parse(JSON.stringify(data.questions));
        console.log('Updated question list:', questionsCopy);
        

        questionsCopy.forEach(q => {
          if (!q.id) q.id = Date.now().toString() + Math.floor(Math.random() * 1000);
          if (!q.answers) q.answers = [];
          if (!q.timeLimit) q.timeLimit = 30;
          if (!q.points) q.points = 10;

          q.id = String(q.id);

          if (Array.isArray(q.answers)) {
            q.answers.forEach(a => {
              if (a.id) a.id = String(a.id);
            });
          }
        });
        

        updatedGame.questions = questionsCopy;
      }
      
      console.log('Updated game object:', updatedGame);
      

      const updatedGames = [...games];
      updatedGames[gameIndex] = updatedGame;
      

      updatedGames.forEach(g => {
        g.id = String(g.id);
      });
      
      console.log('Game list sent to backend:', updatedGames);
      

      const updateResponse = await api.put('/admin/games', { games: updatedGames });
      console.log('Update game response:', updateResponse);
      

      await new Promise(resolve => setTimeout(resolve, 300));
      

      const verifyResponse = await api.get('/admin/games');
      const verifiedGames = verifyResponse.data.games || [];
      const verifiedGame = verifiedGames.find(g => String(g.id) === String(gameId));
      console.log('Verifying updated game:', verifiedGame);
      
      if (!verifiedGame) {
        throw new Error('Unable to verify game exists after update');
      }
      
      if (data.questions && (!verifiedGame.questions || verifiedGame.questions.length === 0)) {
        console.warn('Warning: Questions empty after verifying game, may not have saved successfully');
        

        console.log('Attempting to update game again...');
        

        const retryGamesResponse = await api.get('/admin/games');
        const retryGames = retryGamesResponse.data.games || [];
        
 
        const retryIndex = retryGames.findIndex(g => String(g.id) === String(gameId));
        
        if (retryIndex !== -1) {
          
          const retryGamesCopy = [...retryGames];
          retryGamesCopy[retryIndex] = {
            ...retryGamesCopy[retryIndex],
            questions: data.questions,
            id: String(gameId) 
          };
          

          await api.put('/admin/games', { games: retryGamesCopy });
          

          const finalVerifyResponse = await api.get('/admin/games');
          const finalVerifiedGames = finalVerifyResponse.data.games || [];
          const finalVerifiedGame = finalVerifiedGames.find(g => String(g.id) === String(gameId));
          
          if (finalVerifiedGame && finalVerifiedGame.questions && finalVerifiedGame.questions.length > 0) {
            console.log('Game successfully updated after retry, question count:', finalVerifiedGame.questions.length);
          } else {
            console.error('Questions still empty after game update retry');
          }
        }
      }
      
      return updateResponse;
    } catch (error) {
      console.error('Failed to update game:', error);
      throw error;
    }
  },
  deleteGame: async (gameId) => {

    const response = await api.get('/admin/games');
    const games = response.data.games || [];
    

    const updatedGames = games.filter(game => String(game.id) !== String(gameId));
    
   
    return api.put('/admin/games', { games: updatedGames });
  },
  startGame: (gameId) => api.post(`/admin/game/${gameId}/mutate`, { mutationType: 'START' }),
  endGame: (gameId) => api.post(`/admin/game/${gameId}/mutate`, { mutationType: 'END' }),
  getGameStatus: (gameId) => api.post(`/admin/game/${gameId}/mutate`, { mutationType: 'STATUS' }),
  advanceGame: (gameId) => api.post(`/admin/game/${gameId}/mutate`, { mutationType: 'ADVANCE' }),

  updateGameQuestions: async (gameId, questions) => {
    try {
      console.log('Directly updating game questions, Game ID:', gameId);
      console.log('Question list count:', questions.length);
      

      const formattedQuestions = questions.map(q => ({
        id: String(q.id || Date.now() + Math.floor(Math.random() * 1000)),
        question: q.question || 'Unnamed Question',
        type: q.type || 'single',
        timeLimit: q.timeLimit || 30,
        points: q.points || 10,
        answers: Array.isArray(q.answers) ? q.answers.map(a => ({
          id: String(a.id || Date.now() + Math.floor(Math.random() * 1000)),
          answer: a.answer || 'Unnamed Answer',
          isCorrect: !!a.isCorrect
        })) : []
      }));
      

      const response = await api.put(`/admin/game/${gameId}/questions`, {
        questions: formattedQuestions
      });
      
      console.log('Question update response:', response.data);
      

      if (response.data && response.data.success && response.data.game) {
        console.log('Questions directly updated successfully, saved question count:', response.data.game.questionCount);
        return response;
      }
      
      return response;
    } catch (error) {
      console.error('Failed to directly update game questions:', error);
      throw error;
    }
  },
};


export const sessionAPI = {
  getSessionStatus: (sessionId) => {
    console.log(`Getting session status for session [${sessionId}]`);
    return api.get(`/admin/session/${sessionId}/status`)
      .then(response => {
        if (response.data && response.data.results) {
          console.log(`Successfully got session status for [${sessionId}]:`, response.data.results);

          if (response.data.results.players && Array.isArray(response.data.results.players)) {
            console.log(`Number of players in session [${sessionId}]:`, response.data.results.players.length);
          }
        }
        return response;
      })
      .catch(error => {
        console.error(`Failed to get session status for [${sessionId}]:`, error);
        throw error;
      });
  },
  getSessionResults: (sessionId) => {
    console.log(`Getting results for session [${sessionId}]`);
    return api.get(`/admin/session/${sessionId}/results`)
      .then(response => {
        console.log(`Successfully got results for session [${sessionId}]:`, response.data);
        return response;
      })
      .catch(error => {
        console.error(`Failed to get results for session [${sessionId}]:`, error);
        throw error;
      });
  },

  getFullSessionInfo: async (sessionId) => {
    try {
      console.log(`Getting complete information for session [${sessionId}]`);
      

      const statusResponse = await api.get(`/admin/session/${sessionId}/status`);
      const sessionData = statusResponse.data.results || {};
      

      if (!sessionData) {
        throw new Error('Session does not exist');
      }
      

      let gameData = null;
      if (sessionData.gameId) {
        const gameResponse = await gameAPI.getGame(sessionData.gameId);
        gameData = gameResponse.data;
      }
      
     
      return {
        session: sessionData,
        game: gameData,
        playerCount: Array.isArray(sessionData.players) ? sessionData.players.length : 0,
        position: sessionData.position,
        active: sessionData.active,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Failed to get complete information for session [${sessionId}]:`, error);
      throw error;
    }
  }
};


export const playerAPI = {
  joinGame: (sessionId, name) => api.post(`/play/join/${sessionId}`, { name }),
  getQuestion: (playerId, passedSessionId) => {

    const sessionId = passedSessionId || localStorage.getItem('sessionId');
    

    if (!sessionId) {
      console.error('Error getting question: No session ID available');
      return Promise.reject({
        response: {
          status: 400,
          data: {
            error: 'No session ID provided, please rejoin the game',
            missingSessionId: true
          }
        }
      });
    }
    
    console.log(`Getting question for player [${playerId}] in session [${sessionId}]`);
    return api.get(`/play/${playerId}/question?session=${sessionId}`);
  },
  submitAnswer: async (playerId, answerIds, passedSessionId) => {

    const sessionId = passedSessionId || localStorage.getItem('sessionId');
    

    if (!sessionId) {
      console.error('Error submitting answer: No session ID available');
      return Promise.reject({
        response: {
          status: 400,
          data: {
            error: 'No session ID provided, please rejoin the game',
            missingSessionId: true
          }
        }
      });
    }
    
    try {
      console.log(`Submitting answer for player [${playerId}] in session [${sessionId}]:`, answerIds);
      

      if (!Array.isArray(answerIds)) {
        console.warn('Answer format incorrect, converting to array');
        answerIds = [answerIds].filter(Boolean);
      }
      
 
      const formattedAnswerIds = answerIds.map(id => {
        const numId = Number(id);

        if (!isNaN(numId)) {
          console.log(`Converting answer ID from ${id} (${typeof id}) to number: ${numId}`);
          return numId;
        }
        console.log(`Keeping original answer ID format: ${id} (${typeof id})`);
        return id;
      });
      
      console.log('Formatted answers:', formattedAnswerIds);
      console.log('Answer types:', formattedAnswerIds.map(id => typeof id));
      

      const checkSession = async () => {
        try {

          const statusCheck = await api.get(`/play/${playerId}/question?session=${sessionId}`);
          

          if (statusCheck.data && statusCheck.data.error === 'Session has finished') {
            console.warn('Session has ended, cannot submit answer');
            return {
              status: 410,
              data: {
                error: 'Session has ended, cannot submit answer',
                sessionFinished: true
              }
            };
          }
          
          return true; 
        } catch (error) {

          if (error.response && error.response.status === 410) {
            return error.response; 
          }
          return true; 
        }
      };
      

      const sessionStatus = await checkSession();
      if (sessionStatus !== true) {

        return sessionStatus;
      }
      

      const MAX_RETRIES = 2;
      let lastError = null;
      
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {

          if (attempt > 0) {
            console.log(`Retrying answer submission (${attempt}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          }
          

          const response = await api.put(`/play/${playerId}/answer?session=${sessionId}`, { 
            answerIds: formattedAnswerIds 
          });
          

          if (response.status === 200) {
            console.log('Answer submitted successfully:', response.data);
            

            try {
              const verifyResponse = await api.get(`/play/${playerId}/question?session=${sessionId}`);
              if (verifyResponse.data && verifyResponse.data.playerAnswers) {
                const savedAnswers = verifyResponse.data.playerAnswers;
                console.log('Answers saved on server:', savedAnswers);
                

                const isMatch = JSON.stringify(savedAnswers.sort()) === 
                                JSON.stringify(formattedAnswerIds.sort());
                
                if (!isMatch) {
                  console.warn('Warning: Answers saved on server do not match submitted answers');

                  if (attempt < MAX_RETRIES) {
                    continue;
                  }
                }
              }
            } catch (verifyError) {

              console.warn('Failed to verify answer save status:', verifyError);
            }
            

            return response;
          } else {
            console.warn(`Abnormal response status for answer submission: ${response.status}`);
            lastError = new Error(`Abnormal response status: ${response.status}`);

          }
        } catch (error) {
          console.error(`Answer submission attempt ${attempt+1}/${MAX_RETRIES+1} failed:`, error);
          lastError = error;
          

          if (error.response) {

            if (error.response.status === 410 || 
                (error.response.data && error.response.data.sessionFinished)) {
              return {
                ...error.response,
                status: 410,
                data: {
                  error: 'Session has ended, cannot submit answer',
                  sessionFinished: true,
                  originalError: error.response.data?.error
                }
              };
            }
            

            if (error.response.status === 409 || 
                (error.response.data && error.response.data.questionClosed)) {
              return {
                ...error.response,
                status: 409,
                data: {
                  error: 'Current question is closed, cannot submit answer',
                  questionClosed: true,
                  originalError: error.response.data?.error
                }
              };
            }
          }
          
          // If this is the last attempt, pass the error through
          if (attempt === MAX_RETRIES) {
            throw error;
          }

        }
      }
      

      throw lastError || new Error('Failed to submit answer, all retries failed');
    }catch (error) {
        console.error(`Failed to submit answer for player [${playerId}]:`, error);
        
  
        if (error.response) {
          if (error.response.status === 400) {
  
            const errorMsg = error.response.data?.error || '';
            
            if (errorMsg.includes('Session has finished') || 
                errorMsg.includes('ended') || 
                errorMsg.includes('not active')) {
              console.warn('Session has ended, cannot submit answer');
              return {
                ...error.response,
                status: 410,
                data: {
                  error: 'Session has ended, cannot submit answer',
                  sessionFinished: true,
                  originalError: errorMsg
                }
              };
            }
            
            if (errorMsg.includes('Question not currently open') || 
                errorMsg.includes('closed') || 
                errorMsg.includes('time')) {
              console.warn('Current question is closed, cannot submit answer');
              return {
                ...error.response,
                status: 409,
                data: {
                  error: 'Current question is closed, cannot submit answer',
                  questionClosed: true,
                  originalError: errorMsg
                }
              };
            }
          }
        }
        
  
        throw error;
      }
    },
    getResults: (playerId, passedSessionId) => {
  
      const sessionId = passedSessionId || localStorage.getItem('sessionId');
      
  
      if (!sessionId) {
        console.error('Error getting results: No session ID available');
        return Promise.reject({
          response: {
            status: 400,
            data: {
              error: 'No session ID provided, please rejoin the game',
              missingSessionId: true
            }
          }
        });
      }
      
      return api.get(`/play/${playerId}/results?session=${sessionId}`);
    },
  
    getSessionStatus: (sessionId) => {
      if (!sessionId) {
        return Promise.reject(new Error('Session ID cannot be empty'));
      }
      
      return api.get(`/admin/session/${sessionId}/status`)
        .then(response => {
          console.log('Successfully got session status:', response.data);
          return response;
        })
        .catch(error => {
  
          if (error.response && error.response.status === 404) {
            console.log('Session does not exist or has ended');
            return {
              status: 404,
              data: {
                active: false,
                message: 'Session does not exist or has ended'
              }
            };
          }
          
  
          if (error.response && error.response.data && error.response.data.error) {
            const errorMsg = error.response.data.error;
            
            // Check if indicates the session has ended
            if (errorMsg.includes('is not an active session') || 
                errorMsg.includes('has ended') ||
                errorMsg.includes('not active')) {
              console.log('Session has ended:', errorMsg);
              return {
                status: 200,
                data: {
                  active: false,
                  message: 'Session has ended',
                  error: errorMsg
                }
              };
            }
          }
          
  
          console.error('Failed to get session status:', error);
          throw error;
        });
    },
  };
  
  export default api; 