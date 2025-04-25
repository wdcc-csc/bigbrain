import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../locales/translations';

const T = ({ children }) => {
  const { language } = useLanguage();
  
  if (typeof children === 'string') {
    return t(children, language);
  }
  
  return children;
};

export default T; 
