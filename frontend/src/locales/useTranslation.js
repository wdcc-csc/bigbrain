import { useLanguage } from '../contexts/LanguageContext';
import { t } from './translations';
import { useParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const translate = (key) => t(key, 'en');
  
  const formatTranslate = (key, ...args) => {
    let text = t(key, 'en');
    args.forEach((arg, index) => {
      text = text.replace(`{${index}}`, arg);
    });
    return text;
  };
  
  const toggleAndSyncLanguage = () => {
    console.log('Language toggling is disabled, always using English');
  };
  
  return {
    t: translate,
    tf: formatTranslate,
    language: 'en',
    toggleLanguage: () => {},
    toggleAndSyncLanguage,
    isEnglish: true,
    isChinese: false,
    setLanguage: () => {},
    updateSessionLanguage: () => Promise.resolve(true)
  };
};

export default useTranslation; 
