
import backendConfig from '../backend.config.json';


export const REACT_APP_BACKEND_URL = `http://localhost:${backendConfig.BACKEND_PORT}`;


export const APP_CONFIG = {
  APP_NAME: 'BigBrain Quiz',
  APP_VERSION: '1.0.0',
  DEFAULT_QUESTION_TIME: 30,
  DEFAULT_QUESTION_POINTS: 10,
  MAX_ANSWERS_PER_QUESTION: 6,
  MIN_ANSWERS_PER_QUESTION: 2
};

export default APP_CONFIG; 