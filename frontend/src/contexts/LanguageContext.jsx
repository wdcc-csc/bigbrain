import { createContext, useState, useContext, useEffect } from 'react';
import { sessionAPI } from '../services/api';


const LanguageContext = createContext();


export const useLanguage = () => {
  return useContext(LanguageContext);
};


export const LanguageProvider = ({ children }) => {

  const [language, setLanguage] = useState('en');


  const toggleLanguage = () => {

    console.log('Language toggle is disabled, always using English');
  };


  const updateSessionLanguage = async (sessionId, newLanguage) => {
    try {
      console.log(`Fixed English language for session ${sessionId}`);
      

      const sessionsLanguageMap = JSON.parse(localStorage.getItem('sessionsLanguage') || '{}');
      sessionsLanguageMap[sessionId] = 'en';
      localStorage.setItem('sessionsLanguage', JSON.stringify(sessionsLanguageMap));
      
      return true;
    } catch (error) {
      console.error('Session language update failed:', error);
      return false;
    }
  };


  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);


  const value = {
    language: 'en',  
    setLanguage: () => {},
    toggleLanguage,
    updateSessionLanguage,
    isEnglish: true,  
    isChinese: false 
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext; 